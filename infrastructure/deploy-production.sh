#!/bin/bash

# QuarkfinAI Production Deployment Script
# Handles the circular dependency fix and deploys everything

set -e

echo "🚀 QuarkfinAI Production Deployment"
echo "===================================="

# Check if we're in the right directory
if [ ! -f "cdk.json" ]; then
    echo "❌ Error: Please run this script from the infrastructure directory"
    echo "cd /Users/bidya/Documents/quarkfin/platform-e2e/infrastructure"
    exit 1
fi

# Silence Node.js version warning for CDK
export JSII_SILENCE_WARNING_UNTESTED_NODE_VERSION=1

echo "📦 Installing dependencies..."
npm install

echo "🏗️  Building TypeScript..."
npm run build

echo "🔍 Checking AWS credentials..."
aws sts get-caller-identity

echo "📋 CDK Bootstrap (one-time setup)..."
npx cdk bootstrap

echo "🚀 Deploying all stacks in correct order..."

# Deploy with proper dependency order to avoid circular references
npx cdk deploy \
    QuarkfinVpcStack \
    QuarkfinSecurityStack \
    QuarkfinAuthStack \
    QuarkfinDatabaseStack \
    QuarkfinAppStack \
    QuarkfinCdnStack \
    --require-approval never \
    --verbose

echo ""
echo "✅ DEPLOYMENT COMPLETE!"
echo "======================="

echo ""
echo "📊 Getting deployment outputs..."
npx cdk list

echo ""
echo "🎉 QuarkfinAI is now live on AWS!"
echo ""
echo "📋 Next Steps:"
echo "1. Get CloudFront domain: aws cloudformation describe-stacks --stack-name QuarkfinCdnStack --query 'Stacks[0].Outputs'"
echo "2. Point app.quarkfin.ai CNAME to CloudFront domain"
echo "3. Deploy application code to EC2 instance"
echo "4. Run database migrations"
echo "5. Configure monitoring"
echo ""
echo "💡 Your platform is ready for customers by Monday! 🚀"
