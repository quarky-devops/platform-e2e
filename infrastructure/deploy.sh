#!/bin/bash

# QuarkfinAI CDK Deployment Script
# Fix circular dependency and deploy to AWS

set -e  # Exit on any error

echo "🚀 QuarkfinAI Production Deployment Starting..."

# Navigate to infrastructure directory
cd /Users/bidya/Documents/quarkfin/platform-e2e/infrastructure

echo "📦 Installing CDK dependencies..."
npm install

echo "🏗️  Building TypeScript..."
npm run build

echo "🔐 CDK Bootstrap (first time only)..."
npx cdk bootstrap

echo "🚀 Deploying infrastructure stacks in order..."

# Deploy in dependency order to avoid circular references
echo "1️⃣ Deploying VPC Stack..."
npx cdk deploy QuarkfinVpcStack --require-approval never

echo "2️⃣ Deploying Security Stack..."
npx cdk deploy QuarkfinSecurityStack --require-approval never

echo "3️⃣ Deploying Auth Stack..."
npx cdk deploy QuarkfinAuthStack --require-approval never

echo "4️⃣ Deploying Database Stack..."
npx cdk deploy QuarkfinDatabaseStack --require-approval never

echo "5️⃣ Deploying App Stack..."
npx cdk deploy QuarkfinAppStack --require-approval never

echo "6️⃣ Deploying CDN Stack..."
npx cdk deploy QuarkfinCdnStack --require-approval never

echo "✅ All stacks deployed successfully!"

echo "📋 Getting deployment outputs..."
npx cdk ls

echo "🎉 QuarkfinAI is now live on AWS!"
echo "Next steps:"
echo "1. Configure your domain (app.quarkfin.ai) to point to CloudFront"
echo "2. Deploy your application code to EC2 instance"
echo "3. Set up monitoring and alerts"
