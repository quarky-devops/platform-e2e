#!/bin/bash

# QuarkfinAI Clean Deployment Script
# Handles cleanup and fresh deployment

set -e

echo "🧹 Cleaning up failed deployment..."

# Navigate to infrastructure directory
cd /Users/bidya/Documents/quarkfin/platform-e2e/infrastructure

# Silence Node.js warning
export JSII_SILENCE_WARNING_UNTESTED_NODE_VERSION=1

echo "🗑️  Destroying failed stacks..."
npx cdk destroy QuarkfinDatabaseStack --force || echo "Stack already deleted"
npx cdk destroy QuarkfinAuthStack --force || echo "Stack already deleted"

echo "📦 Rebuilding..."
npm run build

echo "🚀 Fresh deployment with unique domain..."

# Deploy stacks in order
echo "1️⃣ VPC Stack..."
npx cdk deploy QuarkfinVpcStack --require-approval never

echo "2️⃣ Security Stack..."
npx cdk deploy QuarkfinSecurityStack --require-approval never

echo "3️⃣ Auth Stack (with unique domain)..."
npx cdk deploy QuarkfinAuthStack --require-approval never

echo "4️⃣ Database Stack..."
npx cdk deploy QuarkfinDatabaseStack --require-approval never

echo "5️⃣ App Stack..."
npx cdk deploy QuarkfinAppStack --require-approval never

echo "6️⃣ CDN Stack..."
npx cdk deploy QuarkfinCdnStack --require-approval never

echo "✅ Clean deployment completed!"

echo "📋 Getting outputs..."
npx cdk list

echo "🎉 QuarkfinAI is live on AWS!"
