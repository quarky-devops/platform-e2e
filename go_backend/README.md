# QuarkFin Platform E2E Backend

Production-ready website risk assessment system built with Go.

## 🚀 Live Demo

**Production URL:** https://quarkfin-platform-backend.onrender.com

## 🔧 API Endpoints

### Core Assessment API
- **Health Check:** `GET /ping`
- **Create Assessment:** `POST /api/v1/assessments`
- **Get Assessment:** `GET /api/v1/assessments/{id}`
- **List Assessments:** `GET /api/v1/assessments`

### Business Risk Prevention API
- **Create Business Risk Assessment:** `POST /api/business-risk-prevention/assessments`
- **List Business Risk Assessments:** `GET /api/business-risk-prevention/assessments`
- **Get Business Risk Assessment:** `GET /api/business-risk-prevention/assessments/{id}`
- **Update Business Risk Assessment:** `PUT /api/business-risk-prevention/assessments/{id}`
- **Delete Business Risk Assessment:** `DELETE /api/business-risk-prevention/assessments/{id}`
- **Bulk Delete Assessments:** `DELETE /api/business-risk-prevention/assessments/bulk`
- **Re-run Assessment:** `POST /api/business-risk-prevention/assessments/{id}/rerun`
- **Get Risk Insights:** `GET /api/business-risk-prevention/insights`
- **Export Assessments CSV:** `GET /api/business-risk-prevention/export/csv`
- **Export Assessment PDF:** `GET /api/business-risk-prevention/assessments/{id}/export/pdf`

## 📖 Documentation

- [API Documentation](API.md)
- [Business Risk Prevention API](BUSINESS_RISK_PREVENTION_API.md)
- [Deployment Guide](DEPLOYMENT.md)
- [Implementation Summary](IMPLEMENTATION_SUMMARY.md)

## 🏃‍♂️ Quick Start

### Local Development
```bash
# Clone repository
git clone https://bitbucket.org/quarkfin/platform-e2e-backend.git
cd platform-e2e-backend

# Install dependencies
make deps

# Set environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Run the server
make run
```

### Docker Deployment
```bash
# Build and run
docker build -t quarkfin-backend .
docker run -p 8080:8080 --env-file .env quarkfin-backend
```

## 🌐 Environment Variables

Required for deployment:

```bash
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
PORT=8080
GIN_MODE=release
```

## 🧪 Testing

```bash
# Run tests
make test

# Run integration tests
./test_integration.sh

# Test Business Risk Prevention API
./test_business_risk_prevention.sh

# Load test
make load-test
```

## 📊 Example Usage

### Core Assessment API
```bash
# Create assessment
curl -X POST https://quarkfin-platform-backend.onrender.com/api/v1/assessments \
  -H "Content-Type: application/json" \
  -d '{"website": "example.com", "country_code": "US"}'

# Get results
curl https://quarkfin-platform-backend.onrender.com/api/v1/assessments/123
```

### Business Risk Prevention API
```bash
# Create business risk assessment
curl -X POST https://quarkfin-platform-backend.onrender.com/api/business-risk-prevention/assessments \
  -H "Content-Type: application/json" \
  -d '{
    "business_name": "TechCorp Solutions",
    "domain": "techcorp.com",
    "industry": "Technology",
    "geography": "US",
    "assessment_type": "Comprehensive"
  }'

# Get business risk insights
curl https://quarkfin-platform-backend.onrender.com/api/business-risk-prevention/insights
```

## 🔒 Security Features

- Input validation and sanitization
- SQL injection prevention
- TLS certificate validation
- Rate limiting support
- Environment-based configuration

## 📈 Performance

- **Processing Time:** 30-60 seconds per assessment
- **Concurrent Assessments:** Up to 10 simultaneous
- **API Response Time:** < 100ms
- **Memory Usage:** ~50MB per assessment

## 🛠️ Built With

- **Go 1.24.4** - Programming language
- **Gin** - HTTP web framework
- **Supabase** - Database and authentication
- **Docker** - Containerization
- **Render** - Deployment platform

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client Apps   │───▶│   Go Backend    │───▶│   Supabase DB   │
│  (Frontend/API) │    │   (REST API)    │    │   (PostgreSQL)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │ Risk Assessment │
                       │    Engine       │
                       │  (14 Scrapers)  │
                       └─────────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │Business Risk Engine │
                    │   • Cybersecurity   │
                    │   • Financial       │
                    │   • Operational     │
                    │   • Compliance      │
                    │   • Reputational    │
                    └─────────────────────┘
```

## 🌍 Supported Countries

- 🇧🇪 Belgium (BE)
- 🇩🇪 Germany (DE) 
- 🇪🇸 Spain (ES)
- 🇫🇷 France (FR)
- 🇬🇧 United Kingdom (GB)
- 🇳🇱 Netherlands (NL)
- 🇮🇹 Italy (IT)
- 🇺🇸 United States (US)

## 📋 Risk Assessment Components

### Core Website Risk Assessment

| Component | Max Points | Description |
|-----------|------------|-------------|
| Privacy Policy | 5 | Missing privacy policy |
| Terms of Service | 5 | Missing terms of service |
| HTTPS Support | 12 | No SSL/TLS encryption |
| SSL Certificate | 12 | Invalid certificate |
| LinkedIn Presence | 6 | No corporate social media |
| Domain Age | 8 | New or unknown domain |
| Security Threats | 6 | URLVoid detections |
| IP Reputation | 6 | IPVoid detections |
| Page Size | 9 | Very small page size |
| Popups | 7 | Intrusive popups |
| Advertisements | 4 | Ad presence |
| Geopolitical Risk | 10 | Risky country location |

**Total: 100 points**
- **0-44:** Low Risk (Auto-approve)
- **45-80:** Medium Risk (Manual review)
- **81-100:** High Risk (Reject)

### Business Risk Prevention Assessment

| Risk Factor | Description | Weight |
|-------------|-------------|--------|
| **Cybersecurity** | Security vulnerabilities, data protection, threat analysis | 25% |
| **Financial** | Financial stability, credit risk, payment security | 20% |
| **Operational** | Business operations, supply chain, service continuity | 20% |
| **Compliance** | Regulatory compliance, legal issues, certifications | 20% |
| **Reputational** | Brand reputation, public perception, media coverage | 15% |

**Business Risk Levels:**
- **0-40:** Low Risk (Monitor)
- **41-70:** Medium Risk (Review)
- **71-100:** High Risk (Investigate)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📧 Email: support@quarkfin.com
- 📖 Documentation: [API.md](API.md)
- 🏢 Business Risk Prevention: [BUSINESS_RISK_PREVENTION_API.md](BUSINESS_RISK_PREVENTION_API.md)
- 🐛 Issues: [Bitbucket Issues](https://bitbucket.org/quarkfin/platform-e2e-backend/issues)

## 🙏 Acknowledgments

- Built with Go and modern cloud technologies
- Deployed on Render platform
- Database powered by Supabase
- Comprehensive security and compliance checking

---

**Made with ❤️ by the QuarkFin Team**
