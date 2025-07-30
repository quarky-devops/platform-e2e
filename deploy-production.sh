#!/bin/bash
# QuarkfinAI Production Deployment Script
# This script deploys the platform to AWS with proper configuration

set -e

echo "🚀 QuarkfinAI Production Deployment"
echo "===================================="
echo ""

# Check if we're in the right directory
if [ ! -f "frontend/package.json" ]; then
    echo "❌ Error: Run this script from the platform-e2e root directory"
    exit 1
fi

# Step 1: Check for required environment variables
echo "🔍 Step 1: Validating Environment Configuration"
echo "------------------------------------------------"

REQUIRED_VARS=(
    "NEXT_PUBLIC_COGNITO_USER_POOL_ID"
    "NEXT_PUBLIC_COGNITO_CLIENT_ID"
)

MISSING_VARS=()
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var:-}" ] && [ -z "$(grep "^$var=" frontend/.env | cut -d'=' -f2)" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo "❌ Missing required environment variables:"
    for var in "${MISSING_VARS[@]}"; do
        echo "   • $var"
    done
    echo ""
    echo "🔧 How to fix:"
    echo "1. Deploy AWS CDK stack first: cd infrastructure && npm run deploy"
    echo "2. Get Cognito values from CDK outputs"
    echo "3. Update frontend/.env with actual values"
    echo "4. Or set as environment variables in your deployment system"
    exit 1
fi

echo "✅ Environment configuration valid"
echo ""

# Step 2: Install dependencies and build frontend
echo "🏗️ Step 2: Building Frontend Application"
echo "----------------------------------------"

cd frontend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm ci --production=false
fi

# Run type check
echo "🔍 Running TypeScript type check..."
npm run type-check

if [ $? -ne 0 ]; then
    echo "❌ TypeScript type check failed!"
    exit 1
fi

# Build the application
echo "🏗️ Building Next.js application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed!"
    exit 1
fi

echo "✅ Frontend build successful"
echo ""

# Step 3: Build backend
echo "🔧 Step 3: Building Backend Application"
echo "--------------------------------------"

cd ../go_backend

# Build Go backend
echo "🔨 Building Go backend..."
go mod tidy
go build -o quarkfin-api .

if [ $? -ne 0 ]; then
    echo "❌ Backend build failed!"
    exit 1
fi

echo "✅ Backend build successful"
echo ""

# Step 4: Prepare deployment
echo "📦 Step 4: Preparing Deployment Package"
echo "---------------------------------------"

cd ..

# Create deployment directory
rm -rf deployment
mkdir -p deployment

# Copy frontend build
cp -r frontend/.next deployment/
cp -r frontend/public deployment/
cp frontend/package.json deployment/

# Copy backend binary
cp go_backend/quarkfin-api deployment/

# Copy infrastructure
cp -r infrastructure deployment/

echo "✅ Deployment package ready"
echo ""

# Step 5: Deploy to AWS
echo "🌟 Step 5: Deploying to AWS"
echo "---------------------------"

cd infrastructure

# Deploy CDK stack
echo "🚀 Deploying CDK infrastructure..."
npm run deploy

if [ $? -ne 0 ]; then
    echo "❌ CDK deployment failed!"
    exit 1
fi

echo ""
echo "🎉 DEPLOYMENT SUCCESSFUL!"
echo "========================"
echo ""
echo "✅ Frontend: Built and ready for CloudFront"
echo "✅ Backend: Built and ready for EC2"
echo "✅ Infrastructure: Deployed to AWS"
echo ""
echo "🌍 Platform URL: https://app.quarkfin.ai"
echo "📊 Status Check: Use AWS Console to verify all services"
echo ""
echo "🔧 Next Steps:"
echo "1. Verify all services are running in AWS Console"
echo "2. Test the platform end-to-end"
echo "3. Monitor CloudWatch logs for any issues"
echo "4. Set up automated deployment pipeline"
