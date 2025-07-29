# Deployment Guide

This document provides comprehensive instructions for deploying the QuarkFin Platform E2E Backend.

## Prerequisites

- Go 1.24.4 or higher
- Supabase account and project
- Docker (optional, for containerized deployment)
- Git

## Environment Setup

### 1. Clone Repository
```bash
git clone <repository-url>
cd platform-e2e/go_backend
```

### 2. Install Dependencies
```bash
make deps
# or
go mod download
go mod tidy
```

### 3. Environment Variables
Create a `.env` file in the root directory:
```bash
# Database Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key

# Server Configuration (optional)
PORT=8080
GIN_MODE=release
```

### 4. Database Setup
Execute the following SQL in your Supabase database:

```sql
-- Create assessments table
CREATE TABLE assessments (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    website TEXT NOT NULL,
    country_code TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    results TEXT,
    risk_score INTEGER,
    risk_category TEXT
);

-- Create indexes for better performance
CREATE INDEX idx_assessments_website ON assessments(website);
CREATE INDEX idx_assessments_status ON assessments(status);
CREATE INDEX idx_assessments_created_at ON assessments(created_at);
CREATE INDEX idx_assessments_country_code ON assessments(country_code);
CREATE INDEX idx_assessments_risk_category ON assessments(risk_category);

-- Create RLS policies (optional, for row-level security)
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;

-- Example policy (adjust based on your needs)
CREATE POLICY "Enable read access for all users" ON assessments
FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON assessments
FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON assessments
FOR UPDATE USING (true);
```

## Deployment Options

### Option 1: Local Development

```bash
# Run with hot reload (if you have air installed)
air

# Or run directly
make run
# or
go run cmd/server/main.go
```

Server will be available at `http://localhost:8080`

### Option 2: Production Build

```bash
# Build for production
make prod-build

# Run the binary
./server
```

### Option 3: Docker Deployment

Create a `Dockerfile`:
```dockerfile
FROM golang:1.24.4-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o server cmd/server/main.go

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/

COPY --from=builder /app/server .

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ping || exit 1

EXPOSE 8080
CMD ["./server"]
```

Build and run:
```bash
# Build Docker image
make docker-build

# Run container
make docker-run
```

### Option 4: Docker Compose

Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  backend:
    build: .
    ports:
      - "8080:8080"
    environment:
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_KEY=${SUPABASE_SERVICE_KEY}
      - GIN_MODE=release
    env_file:
      - .env
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:8080/ping"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

Run:
```bash
docker-compose up -d
```

### Option 5: Cloud Deployment

#### Render.com
1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Configure:
   - **Build Command**: `go build -o server cmd/server/main.go`
   - **Start Command**: `./server`
   - **Environment**: Go
4. Add environment variables in Render dashboard

#### Railway
1. Connect your GitHub repository to Railway
2. Configure environment variables
3. Railway will auto-detect Go and deploy

#### Google Cloud Run
```bash
# Build and push to Container Registry
gcloud builds submit --tag gcr.io/PROJECT_ID/quarkfin-backend

# Deploy to Cloud Run
gcloud run deploy quarkfin-backend \
  --image gcr.io/PROJECT_ID/quarkfin-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

#### AWS ECS/Fargate
1. Build and push Docker image to ECR
2. Create ECS task definition
3. Create ECS service
4. Configure load balancer

## Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `SUPABASE_URL` | Supabase project URL | - | Yes |
| `SUPABASE_SERVICE_KEY` | Supabase service key | - | Yes |
| `PORT` | Server port | 8080 | No |
| `GIN_MODE` | Gin mode (debug/release) | debug | No |

### Performance Tuning

For production environments, consider:

1. **Connection Pooling**: Configure database connection pooling
2. **Rate Limiting**: Implement rate limiting middleware
3. **Caching**: Add Redis caching for frequently accessed data
4. **Load Balancing**: Use a load balancer for multiple instances
5. **Monitoring**: Add metrics and monitoring

## Monitoring and Logging

### Health Checks
```bash
# Check server health
curl http://localhost:8080/ping

# Or use make target
make health
```

### Log Levels
The application uses structured logging. In production, set `GIN_MODE=release` to reduce log verbosity.

### Metrics (Future Enhancement)
Consider adding Prometheus metrics:
```go
// Add to your imports
import "github.com/prometheus/client_golang/prometheus/promhttp"

// Add to your router
router.GET("/metrics", gin.WrapH(promhttp.Handler()))
```

## Security Considerations

### SSL/TLS
- Use HTTPS in production
- Configure proper SSL certificates
- Consider using a reverse proxy (nginx, Cloudflare)

### API Security
- Implement rate limiting
- Add authentication/authorization if needed
- Validate all input data
- Use CORS properly

### Database Security
- Use strong passwords
- Enable SSL connections
- Implement row-level security
- Regular backups

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   ```
   Error: Failed to create database client
   ```
   - Check SUPABASE_URL and SUPABASE_SERVICE_KEY
   - Verify network connectivity
   - Check Supabase project status

2. **Port Already in Use**
   ```
   Error: bind: address already in use
   ```
   - Change PORT environment variable
   - Kill existing processes using the port

3. **SSL Certificate Issues**
   ```
   Error: x509: certificate signed by unknown authority
   ```
   - Check system time
   - Update CA certificates
   - Use `InsecureSkipVerify` for testing only

### Debugging

Enable debug mode:
```bash
export GIN_MODE=debug
```

Run with verbose logging:
```bash
go run -v cmd/server/main.go
```

## Backup and Recovery

### Database Backup
Use Supabase's built-in backup features or:
```bash
# Export data
pg_dump -h db.your-project.supabase.co -U postgres -d postgres > backup.sql
```

### Application Backup
- Store environment variables securely
- Version control your code
- Document configuration changes

## Performance Optimization

### Database Optimization
- Use indexes on frequently queried columns
- Implement connection pooling
- Consider read replicas for scaling

### Application Optimization
- Use goroutines for concurrent processing
- Implement caching for repeated operations
- Profile the application for bottlenecks

### Infrastructure Optimization
- Use CDN for static assets
- Implement horizontal scaling
- Use appropriate instance sizes

## Scaling

### Horizontal Scaling
- Deploy multiple instances
- Use load balancer
- Implement sticky sessions if needed

### Vertical Scaling
- Increase CPU/memory resources
- Optimize database configuration
- Use faster storage

## Maintenance

### Updates
```bash
# Update dependencies
go get -u ./...
go mod tidy

# Build and test
make build
make test
```

### Monitoring
- Monitor CPU, memory, disk usage
- Track API response times
- Monitor database performance
- Set up alerts for errors

## Support

For issues and questions:
1. Check the logs first
2. Review this documentation
3. Check the GitHub issues
4. Contact the development team

## Rollback Procedures

If deployment fails:
1. Revert to previous version
2. Check database migrations
3. Verify environment variables
4. Monitor application logs

## Load Testing

Test the application before production:
```bash
# Install wrk
# macOS: brew install wrk
# Ubuntu: apt install wrk

# Run load test
make load-test
```

## Conclusion

This deployment guide covers the essential steps for deploying the QuarkFin Platform E2E Backend. Choose the deployment option that best fits your infrastructure and requirements. Always test thoroughly in a staging environment before deploying to production.
