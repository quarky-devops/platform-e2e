# Business Risk Prevention API

This document describes the Business Risk Prevention API endpoints for the QuarkFin Platform E2E Backend.

## Overview

The Business Risk Prevention API provides comprehensive business risk assessment and monitoring capabilities. It allows users to:

- Create and manage business risk assessments
- Track risk scores and levels
- Export assessment data
- Generate insights and analytics
- Monitor business partners and vendors

## Base URL

All Business Risk Prevention endpoints are prefixed with `/api/business-risk-prevention`

## Endpoints

### Assessments

#### Create Assessment
```
POST /api/business-risk-prevention/assessments
```

**Request Body:**
```json
{
  "business_name": "TechCorp Solutions",
  "domain": "techcorp.com",
  "industry": "Technology",
  "geography": "US",
  "assessment_type": "Comprehensive"
}
```

**Response:**
```json
{
  "id": "1",
  "business_name": "TechCorp Solutions",
  "domain": "techcorp.com",
  "risk_score": 0.0,
  "risk_level": "Pending",
  "status": "In Progress",
  "date_created": "2024-01-15T10:30:00Z",
  "last_updated": "2024-01-15T10:30:00Z",
  "industry": "Technology",
  "geography": "US",
  "assessment_type": "Comprehensive",
  "findings": {
    "critical_issues": 0,
    "warnings": 0,
    "recommendations": 0
  },
  "risk_factors": {
    "cybersecurity": 0.0,
    "financial": 0.0,
    "operational": 0.0,
    "compliance": 0.0,
    "reputational": 0.0
  }
}
```

#### List Assessments
```
GET /api/business-risk-prevention/assessments
```

**Response:**
```json
[
  {
    "id": "1",
    "business_name": "TechCorp Solutions",
    "domain": "techcorp.com",
    "risk_score": 85.0,
    "risk_level": "High",
    "status": "Completed",
    "date_created": "2024-01-15T10:30:00Z",
    "last_updated": "2024-01-16T14:20:00Z",
    "industry": "Technology",
    "geography": "US",
    "assessment_type": "Comprehensive",
    "findings": {
      "critical_issues": 3,
      "warnings": 7,
      "recommendations": 12
    },
    "risk_factors": {
      "cybersecurity": 85.0,
      "financial": 72.0,
      "operational": 68.0,
      "compliance": 91.0,
      "reputational": 45.0
    }
  }
]
```

#### Get Assessment
```
GET /api/business-risk-prevention/assessments/{id}
```

**Response:** Same as Create Assessment response

#### Update Assessment
```
PUT /api/business-risk-prevention/assessments/{id}
```

**Request Body:** Same as Create Assessment request

#### Delete Assessment
```
DELETE /api/business-risk-prevention/assessments/{id}
```

**Response:** 204 No Content

#### Bulk Delete Assessments
```
DELETE /api/business-risk-prevention/assessments/bulk
```

**Request Body:**
```json
{
  "ids": ["1", "2", "3"]
}
```

**Response:** 204 No Content

#### Re-run Assessment
```
POST /api/business-risk-prevention/assessments/{id}/rerun
```

**Response:** Updated assessment object with status "In Progress"

### Insights

#### Get Insights
```
GET /api/business-risk-prevention/insights
```

**Response:**
```json
{
  "total_assessments": 156,
  "high_risk_businesses": 23,
  "average_risk_score": 52.3,
  "risk_trends": [
    {
      "month": "Jan",
      "score": 48.0
    },
    {
      "month": "Feb",
      "score": 52.0
    }
  ],
  "top_risk_categories": [
    {
      "category": "Cybersecurity",
      "count": 45,
      "percentage": 28.8
    },
    {
      "category": "Financial",
      "count": 38,
      "percentage": 24.4
    }
  ]
}
```

### Export

#### Export Assessments CSV
```
GET /api/business-risk-prevention/export/csv
```

**Response:** CSV file with all assessments

#### Export Assessment PDF
```
GET /api/business-risk-prevention/assessments/{id}/export/pdf
```

**Response:** PDF file with assessment details

## Risk Levels

- **Low**: Risk score 0-40
- **Medium**: Risk score 41-70
- **High**: Risk score 71-100

## Risk Factors

The system evaluates the following risk factors:

- **Cybersecurity**: Security vulnerabilities, data protection
- **Financial**: Financial stability, credit risk
- **Operational**: Business operations, supply chain
- **Compliance**: Regulatory compliance, legal issues
- **Reputational**: Brand reputation, public perception

## Status Values

- **In Progress**: Assessment is currently running
- **Completed**: Assessment has finished successfully
- **Failed**: Assessment encountered an error
- **Pending**: Assessment is queued for processing

## Assessment Types

- **Comprehensive**: Full risk assessment across all categories
- **Quick Scan**: Basic risk assessment with limited scope
- **Focused**: Assessment focused on specific risk areas

## Error Handling

All endpoints return appropriate HTTP status codes:

- **200 OK**: Request successful
- **201 Created**: Resource created successfully
- **204 No Content**: Resource deleted successfully
- **400 Bad Request**: Invalid request parameters
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server error

Error responses include a JSON object with an error message:

```json
{
  "error": "Assessment not found"
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse. Current limits:

- **100 requests per minute** for assessment creation
- **1000 requests per minute** for read operations
- **50 requests per minute** for export operations

## Authentication

All endpoints require authentication via JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Development

For local development, mock data is used to simulate the assessment process. In production, the system will integrate with actual risk assessment services and databases.

## Support

For API support and questions, please contact the development team or refer to the main project documentation.
