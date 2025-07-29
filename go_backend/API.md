# API Documentation - QuarkFin Platform E2E Backend

This document provides comprehensive API documentation for the QuarkFin Platform E2E Backend.

## Base URL

```
Production: https://api.quarkfin.com
Development: http://localhost:8080
```

## Authentication

Currently, the API does not require authentication, but this can be added in the future.

## Common Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

## Rate Limiting

- **Development**: No rate limiting
- **Production**: 100 requests per minute per IP

## Endpoints

### 1. Health Check

Check if the API is running and healthy.

**Endpoint:** `GET /ping`

**Response:**
```json
{
  "message": "pong from go backend",
  "status": "healthy"
}
```

**Example:**
```bash
curl -X GET http://localhost:8080/ping
```

### 2. API Information

Get API version and available endpoints.

**Endpoint:** `GET /`

**Response:**
```json
{
  "message": "QuarkFin Platform E2E Backend API",
  "version": "1.0.0",
  "endpoints": {
    "health": "/ping",
    "create_assessment": "/api/v1/assessments",
    "list_assessments": "/api/v1/assessments",
    "get_assessment": "/api/v1/assessments/:id"
  }
}
```

### 3. Create Assessment

Create a new website risk assessment.

**Endpoint:** `POST /api/v1/assessments`

**Request Body:**
```json
{
  "website": "example.com",
  "country_code": "US"
}
```

**Parameters:**
- `website` (string, required): Domain name to assess (without protocol)
- `country_code` (string, required): ISO 3166-1 alpha-2 country code

**Response:**
```json
{
  "id": 123,
  "created_at": "2025-01-15T10:30:00Z",
  "website": "example.com",
  "country_code": "US",
  "status": "pending"
}
```

**Status Codes:**
- `201 Created`: Assessment created successfully
- `400 Bad Request`: Invalid request body
- `500 Internal Server Error`: Server error

**Example:**
```bash
curl -X POST http://localhost:8080/api/v1/assessments \
  -H "Content-Type: application/json" \
  -d '{
    "website": "example.com",
    "country_code": "US"
  }'
```

### 4. Get Assessment

Retrieve a specific assessment by ID.

**Endpoint:** `GET /api/v1/assessments/{id}`

**Path Parameters:**
- `id` (integer, required): Assessment ID

**Response:**
```json
{
  "id": 123,
  "created_at": "2025-01-15T10:30:00Z",
  "website": "example.com",
  "country_code": "US",
  "status": "completed",
  "risk_score": 25,
  "risk_category": "low_risk",
  "results": {
    "domain_name": "example.com",
    "merchant_business": {
      "country_code": "US",
      "country_supported": true
    },
    "mcc_details": {
      "mcc_code": "7399",
      "mcc_category": "Business Services",
      "mcc_restricted": false
    },
    "https_check": {
      "has_https": true,
      "protocol": "HTTPS",
      "status": "Accessible",
      "page_title": "Example Domain"
    },
    "ssl_sha_256_fingerprint": {
      "domain": "example.com",
      "sha256_fingerprint": "abc123...",
      "has_sha256": true
    },
    "privacy_and_terms": {
      "is_accessible": true,
      "ssl_valid": true,
      "terms_of_service_present": true,
      "privacy_policy_present": true,
      "legal_name": "Example Corp"
    },
    "social_presence": {
      "social_presence": {
        "linkedin": {
          "presence": true,
          "url": "https://linkedin.com/company/example"
        }
      }
    },
    "whois": {
      "domain_name": "example.com",
      "registrar": "Example Registrar",
      "creation_date": "2020-01-01T00:00:00Z",
      "expiration_date": "2026-01-01T00:00:00Z",
      "name_servers": ["ns1.example.com", "ns2.example.com"]
    },
    "urlvoid": {
      "website_address": "example.com",
      "last_analysis": "2025-01-15 10:30:00",
      "detections_counts": {
        "detected": 0,
        "checks": 20
      },
      "ip_address": "93.184.216.34",
      "server_location": "United States",
      "city": "Norwell",
      "region": "Massachusetts"
    },
    "ipvoid": {
      "ip_address": "93.184.216.34",
      "country_code": "US",
      "country_name": "United States",
      "isp": "Edgecast",
      "detections_count": {
        "detected": 0,
        "checks": 25
      }
    },
    "page_size": {
      "page_size_kb": 5,
      "page_size_bytes": 5120,
      "load_time": "250ms"
    },
    "traffic_volume": {
      "global_rank": "N/A",
      "country_rank": "N/A",
      "monthly_visits": "N/A",
      "bounce_rate": "N/A"
    },
    "popup_and_ads": {
      "has_popups": false,
      "has_ads": false
    },
    "is_risky_geopolitical": {
      "is_risky": false
    },
    "risk_score": 25,
    "risk_category": "low_risk",
    "risk_breakdown": {
      "privacy_policy": 0,
      "terms_of_service": 0,
      "https": 0,
      "ssl_fingerprint": 0,
      "linkedin_presence": 0,
      "domain_age": 0,
      "urlvoid_detections": 0,
      "ipvoid_detections": 0,
      "page_size": 0,
      "popups": 0,
      "ads": 0,
      "risky_geography": 0
    },
    "created_at": "2025-01-15T10:30:00Z"
  },
  "summary": {
    "domain_name": "example.com",
    "risk_score": 25,
    "risk_category": "low_risk",
    "country_supported": true,
    "mcc_restricted": false,
    "https_supported": true,
    "ssl_valid": true,
    "privacy_compliant": true,
    "social_presence": true,
    "geopolitical_risk": false,
    "created_at": "2025-01-15T10:30:00Z"
  },
  "recommendations": [
    "Website appears to meet basic security and compliance requirements"
  ]
}
```

**Status Codes:**
- `200 OK`: Assessment retrieved successfully
- `404 Not Found`: Assessment not found
- `500 Internal Server Error`: Server error

**Example:**
```bash
curl -X GET http://localhost:8080/api/v1/assessments/123
```

### 5. List Assessments

Retrieve a list of all assessments.

**Endpoint:** `GET /api/v1/assessments`

**Query Parameters:**
- `limit` (integer, optional): Number of results to return (default: 25, max: 100)
- `offset` (integer, optional): Number of results to skip (default: 0)
- `status` (string, optional): Filter by status (`pending`, `processing`, `completed`, `failed`)
- `country_code` (string, optional): Filter by country code
- `risk_category` (string, optional): Filter by risk category (`low_risk`, `med_risk`, `high_risk`)

**Response:**
```json
[
  {
    "id": 123,
    "created_at": "2025-01-15T10:30:00Z",
    "website": "example.com",
    "country_code": "US",
    "status": "completed",
    "risk_score": 25,
    "risk_category": "low_risk"
  },
  {
    "id": 124,
    "created_at": "2025-01-15T11:00:00Z",
    "website": "test.com",
    "country_code": "DE",
    "status": "pending",
    "risk_score": null,
    "risk_category": null
  }
]
```

**Status Codes:**
- `200 OK`: Assessments retrieved successfully
- `500 Internal Server Error`: Server error

**Example:**
```bash
# Get all assessments
curl -X GET http://localhost:8080/api/v1/assessments

# Get completed assessments only
curl -X GET http://localhost:8080/api/v1/assessments?status=completed

# Get assessments with pagination
curl -X GET http://localhost:8080/api/v1/assessments?limit=10&offset=20
```

## Assessment Status Flow

Assessments go through the following status transitions:

1. **pending** → Initial state when assessment is created
2. **processing** → Assessment is being executed
3. **completed** → Assessment finished successfully
4. **failed** → Assessment failed due to an error

## Risk Categories

Risk assessments are categorized into three levels:

- **low_risk** (0-44 points): Auto-approve candidate
- **med_risk** (45-80 points): Manual review required
- **high_risk** (81-100 points): Reject candidate

## Risk Scoring Components

The risk score is calculated based on the following components:

| Component | Points | Description |
|-----------|--------|-------------|
| Privacy Policy Missing | 5 | No privacy policy found |
| Terms of Service Missing | 5 | No terms of service found |
| Website Inaccessible | 5 | Website cannot be accessed |
| No HTTPS Support | 12 | Website doesn't support HTTPS |
| Invalid SSL Certificate | 12 | SSL certificate is invalid |
| No LinkedIn Presence | 6 | No LinkedIn company page |
| Missing Domain Age | 8 | Domain age information unavailable |
| URLVoid Detections | 6 | Security threats detected |
| IPVoid Detections | 6 | IP reputation issues |
| Small Page Size | 9 | Page size less than 100KB |
| Traffic Volume Missing | 4 | No traffic data available |
| Has Popups | 7 | Website has popups |
| Has Ads | 4 | Website has advertisements |
| Geopolitical Risk | 10 | Located in risky country |

## Country Support

The following countries are supported for onboarding:

- **BE** - Belgium
- **DE** - Germany
- **ES** - Spain
- **FR** - France
- **GB** - United Kingdom
- **NL** - Netherlands
- **IT** - Italy
- **US** - United States

## Risky Countries

The following countries are considered geopolitically risky:

- **CU** - Cuba
- **IR** - Iran
- **KP** - North Korea
- **SY** - Syria
- **RU** - Russia
- **BY** - Belarus
- **MM** - Myanmar
- **VE** - Venezuela
- **YE** - Yemen
- **ZW** - Zimbabwe
- **SD** - Sudan
- **SS** - South Sudan
- **LY** - Libya
- **SO** - Somalia
- **CF** - Central African Republic
- **CD** - Democratic Republic of the Congo
- **UA** - Ukraine

## MCC Categories

Merchant Category Codes (MCC) are classified to determine business type restrictions. Some MCC codes require manual review.

### Sample Restricted MCC Codes:
- **6012** - Financial Services
- **7995** - Gambling
- **6051** - Cryptocurrency
- **7011** - Hotels/Lodging
- **8011** - Healthcare

## Error Codes

| Code | Description |
|------|-------------|
| INVALID_REQUEST | Request body is invalid |
| WEBSITE_REQUIRED | Website parameter is required |
| COUNTRY_CODE_REQUIRED | Country code parameter is required |
| INVALID_COUNTRY_CODE | Country code must be 2 characters |
| ASSESSMENT_NOT_FOUND | Assessment with given ID not found |
| ASSESSMENT_FAILED | Assessment processing failed |
| DATABASE_ERROR | Database operation failed |
| INTERNAL_ERROR | Internal server error |

## Rate Limiting

API requests are rate limited to prevent abuse:

- **Development**: No limits
- **Production**: 100 requests per minute per IP

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Request limit per time window
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Time when rate limit resets

## Webhooks (Future Enhancement)

Future versions may support webhooks for real-time assessment updates:

```json
{
  "event": "assessment.completed",
  "data": {
    "assessment_id": 123,
    "website": "example.com",
    "status": "completed",
    "risk_score": 25,
    "risk_category": "low_risk"
  },
  "timestamp": "2025-01-15T10:30:00Z"
}
```

## SDKs and Libraries

### JavaScript/Node.js
```javascript
const QuarkfinAPI = require('quarkfin-api');

const client = new QuarkfinAPI({
  baseURL: 'http://localhost:8080',
  timeout: 30000
});

// Create assessment
const assessment = await client.createAssessment({
  website: 'example.com',
  country_code: 'US'
});

// Get assessment
const result = await client.getAssessment(assessment.id);
```

### Python
```python
import requests

def create_assessment(website, country_code):
    response = requests.post(
        'http://localhost:8080/api/v1/assessments',
        json={
            'website': website,
            'country_code': country_code
        }
    )
    return response.json()

def get_assessment(assessment_id):
    response = requests.get(
        f'http://localhost:8080/api/v1/assessments/{assessment_id}'
    )
    return response.json()
```

### cURL Examples

```bash
# Create assessment
curl -X POST http://localhost:8080/api/v1/assessments \
  -H "Content-Type: application/json" \
  -d '{"website": "example.com", "country_code": "US"}'

# Get assessment
curl -X GET http://localhost:8080/api/v1/assessments/123

# List assessments
curl -X GET http://localhost:8080/api/v1/assessments

# Health check
curl -X GET http://localhost:8080/ping
```

## Performance Considerations

- **Assessment Duration**: Typically 30-60 seconds
- **Concurrent Assessments**: Up to 10 concurrent assessments
- **Database Connections**: Connection pooling enabled
- **Memory Usage**: ~50MB per assessment
- **Network Timeouts**: 30 seconds for external requests

## Security

- **Input Validation**: All inputs are validated and sanitized
- **SQL Injection Prevention**: Parameterized queries used
- **CORS**: Configurable CORS settings
- **TLS**: HTTPS recommended for production
- **Rate Limiting**: Prevents abuse and DoS attacks

## Monitoring and Logging

- **Structured Logging**: JSON format for easy parsing
- **Metrics**: Response times, success rates, error rates
- **Health Checks**: Built-in health check endpoint
- **Alerting**: Can be integrated with monitoring systems

## Support

For API support and questions:
- **Documentation**: This document
- **GitHub Issues**: Report bugs and feature requests
- **Email**: api-support@quarkfin.com (if available)

## Changelog

### Version 1.0.0 (2025-01-15)
- Initial API release
- Basic assessment creation and retrieval
- Risk scoring and categorization
- Country and MCC validation
- Comprehensive security and compliance checks
