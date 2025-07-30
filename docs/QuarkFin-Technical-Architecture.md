# QuarkFin Platform - Technical Architecture Document

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [System Overview](#system-overview)
3. [AWS Infrastructure Architecture](#aws-infrastructure-architecture)
4. [Application Architecture](#application-architecture)
5. [Deployment Pipeline](#deployment-pipeline)
6. [Security Architecture](#security-architecture)
7. [Monitoring & Observability](#monitoring--observability)
8. [Development Workflow](#development-workflow)
9. [Troubleshooting Guide](#troubleshooting-guide)
10. [Future Enhancements](#future-enhancements)

---

## Executive Summary

QuarkFin is a modern fintech platform built on AWS cloud infrastructure, designed for scalability, security, and high availability. The platform leverages a microservices architecture with a Next.js frontend, Go backend, and comprehensive AWS services for authentication, database management, and content delivery.

**Key Technologies:**
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Go 1.21, Gin Framework
- **Infrastructure**: AWS CDK (TypeScript)
- **Database**: Amazon RDS PostgreSQL
- **Authentication**: AWS Cognito
- **Deployment**: Bitbucket Pipelines + AWS Systems Manager

---

## System Overview

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CloudFront    │    │   Application   │    │   Amazon RDS    │
│     (CDN)       │◄──►│   Load Balancer │◄──►│   PostgreSQL    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       │
┌─────────────────┐    ┌─────────────────┐               │
│   AWS Cognito   │    │   EC2 Instance  │               │
│  (Authentication)│    │  (Frontend +    │               │
└─────────────────┘    │   Backend)      │               │
                       └─────────────────┘               │
                                │                        │
                                ▼                        │
                       ┌─────────────────┐               │
                       │   Nginx Proxy   │               │
                       │  (Port 3000/8080)│               │
                       └─────────────────┘               │
                                │                        │
                                ▼                        │
                       ┌─────────────────┐               │
                       │  PM2 Process    │               │
                       │   Manager       │               │
                       └─────────────────┘               │
                                │                        │
                                ▼                        │
                       ┌─────────────────┐               │
                       │ Next.js Frontend│               │
                       │  (Port 3001)    │               │
                       └─────────────────┘               │
                                │                        │
                                ▼                        │
                       ┌─────────────────┐               │
                       │  Go Backend     │               │
                       │  (Port 8081)    │               │
                       └─────────────────┘               │
```

### Technology Stack

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| **Frontend** | Next.js | 14.2.30 | React framework with SSR |
| **Frontend** | TypeScript | Latest | Type-safe JavaScript |
| **Frontend** | Tailwind CSS | Latest | Utility-first CSS framework |
| **Frontend** | Lucide React | Latest | Icon library |
| **Backend** | Go | 1.21.0 | High-performance server language |
| **Backend** | Gin Framework | Latest | HTTP web framework |
| **Backend** | GoQuery | Latest | HTML parsing library |
| **Database** | PostgreSQL | 15.x | Primary database |
| **Infrastructure** | AWS CDK | 2.100.0 | Infrastructure as Code |
| **Infrastructure** | TypeScript | Latest | CDK language |
| **Authentication** | AWS Cognito | Latest | User authentication |
| **Deployment** | Bitbucket Pipelines | Latest | CI/CD pipeline |
| **Process Management** | PM2 | Latest | Node.js process manager |
| **Reverse Proxy** | Nginx | Latest | Load balancing & SSL termination |

---

## AWS Infrastructure Architecture

### CDK Stack Structure

The infrastructure is organized into 6 CDK stacks:

1. **QuarkfinVpcStack** - Network infrastructure
2. **QuarkfinSecurityStack** - Security groups and IAM roles
3. **QuarkfinAuthStack** - Cognito User Pool and Client
4. **QuarkfinDatabaseStack** - RDS PostgreSQL instance
5. **QuarkfinAppStack** - EC2 instance and Application Load Balancer
6. **QuarkfinCdnStack** - CloudFront distribution

### Network Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        AWS VPC                                  │
│  ┌─────────────────┐                    ┌─────────────────┐    │
│  │   Public Subnet │                    │  Private Subnet │    │
│  │   (us-east-1a)  │                    │   (us-east-1a)  │    │
│  │                 │                    │                 │    │
│  │ ┌─────────────┐ │                    │ ┌─────────────┐ │    │
│  │ │Application  │ │                    │ │   EC2       │ │    │
│  │ │Load Balancer│ │◄──────────────────►│ │  Instance   │ │    │
│  │ │             │ │                    │ │             │ │    │
│  │ └─────────────┘ │                    │ └─────────────┘ │    │
│  └─────────────────┘                    └─────────────────┘    │
│                                                                 │
│  ┌─────────────────┐                    ┌─────────────────┐    │
│  │   Public Subnet │                    │  Private Subnet │    │
│  │   (us-east-1b)  │                    │   (us-east-1b)  │    │
│  │                 │                    │                 │    │
│  │ ┌─────────────┐ │                    │ ┌─────────────┐ │    │
│  │ │   RDS       │ │                    │ │   RDS       │ │    │
│  │ │ PostgreSQL  │ │                    │ │ PostgreSQL  │ │    │
│  │ │   (Multi-AZ)│ │                    │ │   (Multi-AZ)│ │    │
│  │ └─────────────┘ │                    │ └─────────────┘ │    │
│  └─────────────────┘                    └─────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### Security Groups

| Security Group | Inbound Rules | Outbound Rules | Purpose |
|----------------|---------------|----------------|---------|
| **ALB Security Group** | HTTP (80), HTTPS (443) | All traffic | Load balancer access |
| **App Security Group** | HTTP (3000, 8080) from ALB | All traffic | Application server access |
| **Database Security Group** | PostgreSQL (5432) from App SG | All traffic | Database access |

### IAM Roles & Permissions

#### EC2 Instance Role
- **CloudWatchAgentServerPolicy** - CloudWatch monitoring
- **AmazonSSMManagedInstanceCore** - Systems Manager access
- **Custom S3 Policy** - Deployment package access
- **Database Secret Access** - RDS credentials

#### Bitbucket Pipeline Role
- **CDK Deployment Permissions** - Infrastructure deployment
- **S3 Access** - Deployment package upload
- **SSM Access** - EC2 command execution

---

## Application Architecture

### Frontend Architecture (Next.js 14)

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Application                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐  │
│  │   Pages Router  │  │   App Router    │  │   API Routes│  │
│  │                 │  │                 │  │             │  │
│  │ • /login        │  │ • /platform     │  │ • /api/auth │  │
│  │ • /register     │  │ • /dashboard    │  │ • /api/data │  │
│  │ • /forgot-pwd   │  │ • /analytics    │  │ • /api/user │  │
│  └─────────────────┘  └─────────────────┘  └─────────────┘  │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐  │
│  │   Components    │  │   Hooks         │  │   Context   │  │
│  │                 │  │                 │  │             │  │
│  │ • AuthProvider  │  │ • useAuth       │  │ • AuthContext│  │
│  │ • Sidebar       │  │ • useUser       │  │ • UserContext│  │
│  │ • Header        │  │ • useApi        │  │ • ThemeContext│ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Backend Architecture (Go)

```
┌─────────────────────────────────────────────────────────────┐
│                     Go Backend                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐  │
│  │   HTTP Server   │  │   Middleware    │  │   Handlers  │  │
│  │   (Gin)         │  │                 │  │             │  │
│  │                 │  │ • CORS          │  │ • Auth      │  │
│  │ • Port 8081     │  │ • Auth          │  │ • User      │  │
│  │ • TLS Support   │  │ • Logging       │  │ • Data      │  │
│  └─────────────────┘  └─────────────────┘  └─────────────┘  │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐  │
│  │   Services      │  │   Models        │  │   Database  │  │
│  │                 │  │                 │  │             │  │
│  │ • AuthService   │  │ • User          │  │ • PostgreSQL│  │
│  │ • UserService   │  │ • Profile       │  │ • GORM      │  │
│  │ • DataService   │  │ • Analytics     │  │ • Migrations│  │
│  └─────────────────┘  └─────────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Database Schema

```sql
-- Users table (managed by Cognito + custom fields)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cognito_user_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone_number VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User profiles
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    avatar_url TEXT,
    bio TEXT,
    preferences JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Analytics data
CREATE TABLE analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Deployment Pipeline

### Bitbucket Pipeline Flow

```yaml
# bitbucket-pipelines.yml
pipelines:
  branches:
    main:
      - step:
          name: "Deploy QuarkfinAI to AWS"
          deployment: production
          script:
            # 1. Install dependencies
            - apt-get update && apt-get install -y wget unzip jq
            - wget https://go.dev/dl/go1.21.3.linux-amd64.tar.gz
            - npm install -g aws-cdk@2.100.0
            
            # 2. Deploy infrastructure
            - cd infrastructure
            - npm install
            - npm run build
            - cdk deploy QuarkfinVpcStack --require-approval never
            - cdk deploy QuarkfinSecurityStack --require-approval never
            - cdk deploy QuarkfinAuthStack --require-approval never
            - cdk deploy QuarkfinDatabaseStack --require-approval never
            - cdk deploy QuarkfinAppStack --require-approval never
            - cdk deploy QuarkfinCdnStack --require-approval never
            
            # 3. Build applications
            - cd ../frontend
            - npm install
            - npm run build
            - cd ../go_backend
            - go build -o quarkfin-backend .
            
            # 4. Create deployment package
            - cd ..
            - mkdir deployment-package
            - cp -r frontend/.next deployment-package/
            - cp -r frontend/public deployment-package/
            - cp frontend/package.json deployment-package/
            - cp go_backend/quarkfin-backend deployment-package/
            
            # 5. Deploy to EC2
            - export DEPLOY_BUCKET="quarkfin-deploy-$(date +%s)"
            - aws s3 mb s3://$DEPLOY_BUCKET --region $AWS_DEFAULT_REGION
            - tar -czf deployment.tar.gz -C deployment-package .
            - aws s3 cp deployment.tar.gz s3://$DEPLOY_BUCKET/
            
            # 6. Execute deployment script on EC2
            - aws ssm send-command --instance-ids $INSTANCE_ID --document-name "AWS-RunShellScript" --parameters 'commands=[...]'
```

### Deployment Process

1. **Infrastructure Deployment**
   - CDK deploys all AWS resources
   - Creates/updates CloudFormation stacks
   - Configures networking, security, and compute

2. **Application Build**
   - Frontend: Next.js build with production optimizations
   - Backend: Go binary compilation
   - Environment variables configuration

3. **Package Creation**
   - Bundles frontend build artifacts
   - Includes backend binary
   - Creates deployment script

4. **EC2 Deployment**
   - Uploads package to S3
   - Downloads and extracts on EC2
   - Installs dependencies
   - Starts applications with PM2

### Environment Variables

#### Frontend (.env.local)
```bash
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_IPrV3lqL0
NEXT_PUBLIC_COGNITO_CLIENT_ID=1cf34bqt0pnhmdq0rl068v5d9t
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_API_URL=https://d1o1sajvcnqzmr.cloudfront.net/api
NODE_ENV=production
```

#### Backend (Environment)
```bash
DATABASE_URL=postgresql://quarkfin_admin:password@host:5432/quarkfin_production
COGNITO_USER_POOL_ID=us-east-1_IPrV3lqL0
AWS_REGION=us-east-1
NODE_ENV=production
```

---

## Security Architecture

### Authentication Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   User      │    │   Frontend  │    │   Cognito   │    │   Backend   │
│             │    │             │    │             │    │             │
│ 1. Login    │───►│ 2. Auth     │───►│ 3. Validate │───►│ 4. Verify   │
│             │    │   Request   │    │   Credentials│    │   Token     │
│             │    │             │    │             │    │             │
│ 6. Access   │◄───│ 5. JWT      │◄───│ 4. JWT      │◄───│ 5. User     │
│   App       │    │   Token     │    │   Token     │    │   Data      │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### Security Measures

1. **Network Security**
   - VPC with private subnets
   - Security groups with minimal access
   - No direct internet access to EC2

2. **Application Security**
   - JWT token validation
   - CORS configuration
   - Input validation and sanitization

3. **Data Security**
   - RDS encryption at rest
   - Secrets Manager for credentials
   - HTTPS/TLS encryption

4. **Access Control**
   - IAM roles with least privilege
   - Cognito user pools
   - Multi-factor authentication support

---

## Monitoring & Observability

### CloudWatch Monitoring

```typescript
// CloudWatch Metrics
const metrics = {
  // Application metrics
  'ApplicationRequests': 'Count of HTTP requests',
  'ApplicationErrors': 'Count of 4xx/5xx errors',
  'ApplicationLatency': 'Response time in milliseconds',
  
  // Infrastructure metrics
  'CPUUtilization': 'EC2 CPU usage percentage',
  'MemoryUtilization': 'EC2 memory usage percentage',
  'DatabaseConnections': 'RDS connection count',
  'LoadBalancerRequests': 'ALB request count'
};
```

### Logging Strategy

1. **Application Logs**
   - Frontend: Console logs + error tracking
   - Backend: Structured logging with levels
   - PM2: Process management logs

2. **Infrastructure Logs**
   - CloudWatch Logs for all services
   - ALB access logs
   - RDS slow query logs

3. **Security Logs**
   - CloudTrail for API calls
   - Cognito authentication logs
   - VPC Flow Logs

### Health Checks

```bash
# Frontend health check
curl -f http://localhost:3000/health
# Expected: "Frontend Healthy"

# Backend health check
curl -f http://localhost:8080/ping
# Expected: "Backend Healthy"

# Database health check
pg_isready -h $DB_HOST -p 5432
```

---

## Development Workflow

### Local Development Setup

1. **Prerequisites**
   ```bash
   # Install Node.js 18+
   # Install Go 1.21+
   # Install AWS CLI
   # Install Docker (optional)
   ```

2. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   cp .env.local.example .env.local
   # Configure Cognito credentials
   npm run dev
   ```

3. **Backend Setup**
   ```bash
   cd go_backend
   go mod download
   go run cmd/server/main.go
   ```

4. **Database Setup**
   ```bash
   # Use local PostgreSQL or connect to RDS
   # Run migrations
   go run cmd/migrate/main.go
   ```

### Code Quality

1. **Frontend**
   - ESLint for code linting
   - Prettier for code formatting
   - TypeScript for type safety

2. **Backend**
   - Go fmt for formatting
   - Go vet for static analysis
   - Go test for unit testing

3. **Infrastructure**
   - CDK synth for validation
   - TypeScript compilation
   - CloudFormation template validation

---

## Troubleshooting Guide

### Common Issues

#### 1. 502 Bad Gateway
**Symptoms**: CloudFront returns 502 errors
**Causes**: 
- Applications not running on EC2
- Health checks failing
- Nginx configuration issues

**Solutions**:
```bash
# Check application status
pm2 status

# Check nginx status
sudo systemctl status nginx

# Check application logs
pm2 logs frontend
pm2 logs backend

# Verify health endpoints
curl -f http://localhost:3000/health
curl -f http://localhost:8080/ping
```

#### 2. S3 Access Denied
**Symptoms**: Deployment fails with 403 errors
**Causes**: EC2 instance lacks S3 permissions

**Solutions**:
```bash
# Verify IAM role permissions
aws iam get-role --role-name QuarkfinAppStack-InstanceRole

# Check attached policies
aws iam list-attached-role-policies --role-name QuarkfinAppStack-InstanceRole

# Add S3 permissions if missing
aws iam attach-role-policy --role-name QuarkfinAppStack-InstanceRole --policy-arn arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess
```

#### 3. Database Connection Issues
**Symptoms**: Backend can't connect to RDS
**Causes**: 
- Security group rules
- Network connectivity
- Credentials issues

**Solutions**:
```bash
# Check security group rules
aws ec2 describe-security-groups --group-ids sg-xxxxxxxxx

# Test database connectivity
telnet $DB_HOST 5432

# Verify credentials
aws secretsmanager get-secret-value --secret-id quarkfin-database-secret
```

#### 4. Node.js Installation Issues
**Symptoms**: PM2 or npm not found
**Causes**: Incompatible Node.js version for Amazon Linux 2

**Solutions**:
```bash
# Use Amazon Linux 2 extras
sudo amazon-linux-extras enable nodejs16
sudo yum clean metadata
sudo yum install -y nodejs

# Or use NodeSource repository
curl -fsSL https://rpm.nodesource.com/setup_16.x | sudo bash -
sudo yum install -y nodejs
```

### Debugging Commands

```bash
# Check EC2 instance status
aws ec2 describe-instances --instance-ids i-xxxxxxxxx

# Check load balancer health
aws elbv2 describe-target-health --target-group-arn arn:aws:elasticloadbalancing:...

# Check CloudFormation stack status
aws cloudformation describe-stacks --stack-name QuarkfinAppStack

# Check SSM command status
aws ssm get-command-invocation --command-id xxxxxxxx --instance-id i-xxxxxxxxx

# Check application logs on EC2
aws ssm send-command --instance-ids i-xxxxxxxxx --document-name "AWS-RunShellScript" --parameters 'commands=["pm2 logs"]'
```

---

## Future Enhancements

### Planned Improvements

1. **Scalability**
   - Auto Scaling Groups for EC2
   - Application Load Balancer with multiple targets
   - Database read replicas

2. **High Availability**
   - Multi-AZ deployment
   - RDS Multi-AZ configuration
   - CloudFront with multiple origins

3. **Monitoring & Alerting**
   - CloudWatch Alarms
   - SNS notifications
   - Custom dashboards

4. **Security Enhancements**
   - WAF integration
   - Certificate Manager for SSL
   - VPC endpoints for AWS services

5. **Development Experience**
   - Local development with Docker
   - Automated testing pipeline
   - Code quality gates

### Architecture Evolution

```
Current Architecture:
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ CloudFront  │    │     ALB     │    │   Single    │
│             │◄──►│             │◄──►│   EC2       │
└─────────────┘    └─────────────┘    └─────────────┘

Future Architecture:
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ CloudFront  │    │     ALB     │    │ Auto Scaling│
│   + WAF     │◄──►│   + Health  │◄──►│   Group     │
└─────────────┘    └─────────────┘    └─────────────┘
                           │
                           ▼
                   ┌─────────────┐
                   │   ECS/Fargate│
                   │   Containers│
                   └─────────────┘
```

---

## Conclusion

The QuarkFin platform is built on a solid foundation of AWS services and modern development practices. The architecture provides:

- **Scalability**: Cloud-native design with auto-scaling capabilities
- **Security**: Multi-layered security with IAM, VPC, and encryption
- **Reliability**: High availability with load balancing and health checks
- **Maintainability**: Infrastructure as Code with CDK and automated deployments

This document serves as a comprehensive guide for understanding, maintaining, and extending the QuarkFin platform architecture.

---

**Document Version**: 1.0  
**Last Updated**: July 30, 2025  
**Maintained By**: QuarkFin Development Team 