#!/bin/bash

# Business Risk Prevention API Test Script
# This script tests all the Business Risk Prevention API endpoints

BASE_URL="http://localhost:8080"
BRP_BASE="/api/business-risk-prevention"

echo "🧪 Testing Business Risk Prevention API"
echo "======================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print test results
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

# Function to test endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local expected_status=$4
    local description=$5
    
    echo -e "\n${YELLOW}Testing: $description${NC}"
    echo "Request: $method $endpoint"
    
    if [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X $method \
            "$BASE_URL$endpoint")
    fi
    
    # Extract status code (last line)
    status_code=$(echo "$response" | tail -n1)
    # Extract body (all but last line)
    body=$(echo "$response" | sed '$d')
    
    echo "Response Status: $status_code"
    echo "Response Body: $body"
    
    if [ "$status_code" = "$expected_status" ]; then
        print_result 0 "$description"
        return 0
    else
        print_result 1 "$description (Expected: $expected_status, Got: $status_code)"
        return 1
    fi
}

# Start tests
echo -e "${YELLOW}Starting Business Risk Prevention API Tests...${NC}\n"

# Test 1: Health Check
test_endpoint "GET" "/ping" "" "200" "Health Check"

# Test 2: API Root
test_endpoint "GET" "/" "" "200" "API Root"

# Test 3: Create Business Risk Assessment
create_data='{
  "business_name": "Test Corporation",
  "domain": "testcorp.com",
  "industry": "Technology",
  "geography": "US",
  "assessment_type": "Comprehensive"
}'
test_endpoint "POST" "$BRP_BASE/assessments" "$create_data" "201" "Create Business Risk Assessment"

# Test 4: List Business Risk Assessments
test_endpoint "GET" "$BRP_BASE/assessments" "" "200" "List Business Risk Assessments"

# Test 5: Get Business Risk Assessment by ID
test_endpoint "GET" "$BRP_BASE/assessments/1" "" "200" "Get Business Risk Assessment by ID"

# Test 6: Update Business Risk Assessment
update_data='{
  "business_name": "Updated Test Corporation",
  "domain": "updated-testcorp.com",
  "industry": "Finance",
  "geography": "UK",
  "assessment_type": "Quick Scan"
}'
test_endpoint "PUT" "$BRP_BASE/assessments/1" "$update_data" "200" "Update Business Risk Assessment"

# Test 7: Get Business Risk Insights
test_endpoint "GET" "$BRP_BASE/insights" "" "200" "Get Business Risk Insights"

# Test 8: Export Assessments CSV
test_endpoint "GET" "$BRP_BASE/export/csv" "" "200" "Export Assessments CSV"

# Test 9: Export Assessment PDF
test_endpoint "GET" "$BRP_BASE/assessments/1/export/pdf" "" "200" "Export Assessment PDF"

# Test 10: Re-run Assessment
test_endpoint "POST" "$BRP_BASE/assessments/1/rerun" "" "200" "Re-run Assessment"

# Test 11: Bulk Delete Assessments
bulk_delete_data='{
  "ids": ["2", "3"]
}'
test_endpoint "DELETE" "$BRP_BASE/assessments/bulk" "$bulk_delete_data" "204" "Bulk Delete Assessments"

# Test 12: Delete Single Assessment
test_endpoint "DELETE" "$BRP_BASE/assessments/1" "" "204" "Delete Single Assessment"

# Test 13: Get Non-existent Assessment (should return 404)
test_endpoint "GET" "$BRP_BASE/assessments/999" "" "404" "Get Non-existent Assessment"

echo -e "\n${YELLOW}=================================${NC}"
echo -e "${GREEN}Business Risk Prevention API Tests Complete!${NC}"
echo -e "${YELLOW}=================================${NC}"

echo -e "\n${YELLOW}Additional Manual Tests:${NC}"
echo "1. Test with invalid JSON data"
echo "2. Test with missing required fields"
echo "3. Test with very large payloads"
echo "4. Test concurrent requests"
echo "5. Test rate limiting (if implemented)"

echo -e "\n${YELLOW}Frontend Integration Tests:${NC}"
echo "1. Test Flutter service integration"
echo "2. Test React component integration"
echo "3. Test UI workflows"
echo "4. Test error handling in UI"

echo -e "\n${YELLOW}Next Steps:${NC}"
echo "1. Run the backend server: go run cmd/main.go"
echo "2. Execute this test script: ./test_business_risk_prevention.sh"
echo "3. Test the Flutter frontend integration"
echo "4. Test the React frontend integration"
echo "5. Add database persistence (currently using mock data)"
