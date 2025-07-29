#!/bin/bash

# QuarkFin Platform E2E Backend - Integration Test Script
# This script tests the complete backend system

set -e

echo "=== QuarkFin Platform E2E Backend Integration Tests ==="
echo "Testing backend services and API endpoints..."
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="http://localhost:8080"
TEST_DOMAIN="example.com"
TEST_COUNTRY="US"

# Helper functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Test 1: Health Check
test_health_check() {
    log_info "Testing health check endpoint..."
    
    response=$(curl -s "$BASE_URL/ping")
    if [[ $response == *"pong from go backend"* ]]; then
        log_info "✅ Health check passed"
        return 0
    else
        log_error "❌ Health check failed"
        return 1
    fi
}

# Test 2: Create Assessment
test_create_assessment() {
    log_info "Testing assessment creation..."
    
    response=$(curl -s -X POST "$BASE_URL/api/v1/assessments" \
        -H "Content-Type: application/json" \
        -d "{\"website\":\"$TEST_DOMAIN\",\"country_code\":\"$TEST_COUNTRY\"}")
    
    if [[ $response == *"\"id\":"* ]]; then
        assessment_id=$(echo $response | grep -o '"id":[0-9]*' | cut -d':' -f2)
        log_info "✅ Assessment created with ID: $assessment_id"
        echo $assessment_id > /tmp/assessment_id.txt
        return 0
    else
        log_error "❌ Assessment creation failed"
        echo "Response: $response"
        return 1
    fi
}

# Test 3: Get Assessment
test_get_assessment() {
    log_info "Testing assessment retrieval..."
    
    if [[ ! -f /tmp/assessment_id.txt ]]; then
        log_error "❌ No assessment ID found"
        return 1
    fi
    
    assessment_id=$(cat /tmp/assessment_id.txt)
    
    # Wait for assessment to process
    log_info "Waiting for assessment to complete..."
    max_attempts=30
    attempt=0
    
    while [[ $attempt -lt $max_attempts ]]; do
        response=$(curl -s "$BASE_URL/api/v1/assessments/$assessment_id")
        
        if [[ $response == *"\"status\":\"completed\""* ]]; then
            log_info "✅ Assessment completed successfully"
            echo $response > /tmp/assessment_result.json
            return 0
        elif [[ $response == *"\"status\":\"failed\""* ]]; then
            log_error "❌ Assessment failed"
            echo "Response: $response"
            return 1
        elif [[ $response == *"\"status\":\"processing\""* ]]; then
            log_info "Assessment still processing... (attempt $((attempt + 1))/$max_attempts)"
        else
            log_info "Assessment pending... (attempt $((attempt + 1))/$max_attempts)"
        fi
        
        sleep 2
        ((attempt++))
    done
    
    log_error "❌ Assessment timed out"
    return 1
}

# Test 4: List Assessments
test_list_assessments() {
    log_info "Testing assessments listing..."
    
    response=$(curl -s "$BASE_URL/api/v1/assessments")
    
    if [[ $response == *"\"id\":"* ]]; then
        count=$(echo $response | grep -o '"id":' | wc -l)
        log_info "✅ Listed $count assessments"
        return 0
    else
        log_error "❌ Failed to list assessments"
        return 1
    fi
}

# Test 5: Validate Assessment Results
test_validate_results() {
    log_info "Testing assessment result validation..."
    
    if [[ ! -f /tmp/assessment_result.json ]]; then
        log_error "❌ No assessment results found"
        return 1
    fi
    
    result=$(cat /tmp/assessment_result.json)
    
    # Check required fields
    checks=(
        "risk_score"
        "risk_category"
        "results"
        "summary"
        "recommendations"
    )
    
    for check in "${checks[@]}"; do
        if [[ $result == *"\"$check\":"* ]]; then
            log_info "✅ Found required field: $check"
        else
            log_error "❌ Missing required field: $check"
            return 1
        fi
    done
    
    # Extract and validate risk score
    risk_score=$(echo $result | grep -o '"risk_score":[0-9]*' | cut -d':' -f2)
    if [[ $risk_score -ge 0 && $risk_score -le 100 ]]; then
        log_info "✅ Risk score is valid: $risk_score"
    else
        log_error "❌ Invalid risk score: $risk_score"
        return 1
    fi
    
    # Check risk category
    if [[ $result == *"\"risk_category\":\"low_risk\""* ]] || 
       [[ $result == *"\"risk_category\":\"med_risk\""* ]] || 
       [[ $result == *"\"risk_category\":\"high_risk\""* ]]; then
        log_info "✅ Risk category is valid"
    else
        log_error "❌ Invalid risk category"
        return 1
    fi
    
    return 0
}

# Test 6: Performance Test
test_performance() {
    log_info "Testing API performance..."
    
    start_time=$(date +%s.%N)
    
    # Health check performance
    for i in {1..5}; do
        curl -s "$BASE_URL/ping" > /dev/null
    done
    
    end_time=$(date +%s.%N)
    duration=$(echo "$end_time - $start_time" | bc)
    
    log_info "✅ 5 health checks completed in ${duration}s"
    
    # Check if average response time is acceptable (< 100ms per request)
    avg_time=$(echo "scale=3; $duration / 5" | bc)
    if (( $(echo "$avg_time < 0.1" | bc -l) )); then
        log_info "✅ Average response time: ${avg_time}s (Good)"
    else
        log_warn "⚠️ Average response time: ${avg_time}s (Slow)"
    fi
    
    return 0
}

# Test 7: Error Handling
test_error_handling() {
    log_info "Testing error handling..."
    
    # Test invalid endpoint
    response=$(curl -s -w "%{http_code}" "$BASE_URL/invalid/endpoint")
    if [[ $response == *"404"* ]]; then
        log_info "✅ 404 error handling works"
    else
        log_error "❌ 404 error handling failed"
        return 1
    fi
    
    # Test invalid JSON
    response=$(curl -s -X POST "$BASE_URL/api/v1/assessments" \
        -H "Content-Type: application/json" \
        -d "{invalid json}")
    if [[ $response == *"error"* ]]; then
        log_info "✅ Invalid JSON handling works"
    else
        log_error "❌ Invalid JSON handling failed"
        return 1
    fi
    
    # Test missing required fields
    response=$(curl -s -X POST "$BASE_URL/api/v1/assessments" \
        -H "Content-Type: application/json" \
        -d "{}")
    if [[ $response == *"error"* ]]; then
        log_info "✅ Missing field validation works"
    else
        log_error "❌ Missing field validation failed"
        return 1
    fi
    
    return 0
}

# Test 8: Multiple Domains
test_multiple_domains() {
    log_info "Testing multiple domain assessments..."
    
    domains=("google.com" "github.com" "stackoverflow.com")
    
    for domain in "${domains[@]}"; do
        log_info "Testing domain: $domain"
        
        response=$(curl -s -X POST "$BASE_URL/api/v1/assessments" \
            -H "Content-Type: application/json" \
            -d "{\"website\":\"$domain\",\"country_code\":\"$TEST_COUNTRY\"}")
        
        if [[ $response == *"\"id\":"* ]]; then
            log_info "✅ Assessment created for $domain"
        else
            log_error "❌ Assessment creation failed for $domain"
            return 1
        fi
    done
    
    return 0
}

# Test 9: Country Validation
test_country_validation() {
    log_info "Testing country validation..."
    
    # Test supported country
    response=$(curl -s -X POST "$BASE_URL/api/v1/assessments" \
        -H "Content-Type: application/json" \
        -d "{\"website\":\"$TEST_DOMAIN\",\"country_code\":\"US\"}")
    
    if [[ $response == *"\"id\":"* ]]; then
        log_info "✅ Supported country (US) works"
    else
        log_error "❌ Supported country (US) failed"
        return 1
    fi
    
    # Test unsupported country
    response=$(curl -s -X POST "$BASE_URL/api/v1/assessments" \
        -H "Content-Type: application/json" \
        -d "{\"website\":\"$TEST_DOMAIN\",\"country_code\":\"XX\"}")
    
    if [[ $response == *"\"id\":"* ]]; then
        log_info "✅ Unsupported country (XX) handled gracefully"
    else
        log_error "❌ Unsupported country (XX) handling failed"
        return 1
    fi
    
    return 0
}

# Test 10: Database Integration
test_database_integration() {
    log_info "Testing database integration..."
    
    # Create assessment to test database
    response=$(curl -s -X POST "$BASE_URL/api/v1/assessments" \
        -H "Content-Type: application/json" \
        -d "{\"website\":\"db-test.com\",\"country_code\":\"$TEST_COUNTRY\"}")
    
    if [[ $response == *"\"id\":"* ]]; then
        assessment_id=$(echo $response | grep -o '"id":[0-9]*' | cut -d':' -f2)
        log_info "✅ Database write successful (ID: $assessment_id)"
        
        # Test database read
        response=$(curl -s "$BASE_URL/api/v1/assessments/$assessment_id")
        if [[ $response == *"\"id\":$assessment_id"* ]]; then
            log_info "✅ Database read successful"
        else
            log_error "❌ Database read failed"
            return 1
        fi
    else
        log_error "❌ Database write failed"
        return 1
    fi
    
    return 0
}

# Main test execution
main() {
    log_info "Starting integration tests..."
    echo
    
    # Check if server is running
    if ! curl -s "$BASE_URL/ping" > /dev/null; then
        log_error "❌ Server is not running at $BASE_URL"
        log_info "Please start the server with: make run"
        exit 1
    fi
    
    # Run all tests
    tests=(
        "test_health_check"
        "test_create_assessment"
        "test_get_assessment"
        "test_list_assessments"
        "test_validate_results"
        "test_performance"
        "test_error_handling"
        "test_multiple_domains"
        "test_country_validation"
        "test_database_integration"
    )
    
    passed=0
    failed=0
    
    for test in "${tests[@]}"; do
        echo
        if $test; then
            ((passed++))
        else
            ((failed++))
        fi
    done
    
    # Cleanup
    rm -f /tmp/assessment_id.txt /tmp/assessment_result.json
    
    # Results summary
    echo
    echo "=== Test Results ==="
    log_info "Passed: $passed"
    if [[ $failed -gt 0 ]]; then
        log_error "Failed: $failed"
        exit 1
    else
        log_info "All tests passed! ✅"
        exit 0
    fi
}

# Run tests
main "$@"
