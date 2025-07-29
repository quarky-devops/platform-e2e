#!/bin/bash

# Quick Fix & Continue Deployment
set -e

echo "🔧 Fixing AuthStack and continuing deployment..."

cd /Users/bidya/Documents/quarkfin/platform-e2e/infrastructure
export JSII_SILENCE_WARNING_UNTESTED_NODE_VERSION=1

echo "🗑️  Cleaning up failed AuthStack..."
npx cdk destroy QuarkfinAuthStack --force

echo "📦 Rebuilding with fixed config..."
npm run build

echo "🚀 Continuing deployment from AuthStack..."

npx cdk deploy QuarkfinAuthStack --require-approval never
npx cdk deploy QuarkfinDatabaseStack --require-approval never  
npx cdk deploy QuarkfinAppStack --require-approval never
npx cdk deploy QuarkfinCdnStack --require-approval never

echo "✅ Deployment completed!"

# Get final URLs
CDN_DOMAIN=$(aws cloudformation describe-stacks --stack-name QuarkfinCdnStack --query 'Stacks[0].Outputs[?OutputKey==`DistributionDomainName`].OutputValue' --output text 2>/dev/null || echo "CDN stack not ready")
ALB_DOMAIN=$(aws cloudformation describe-stacks --stack-name QuarkfinAppStack --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue' --output text 2>/dev/null || echo "ALB stack not ready")

echo ""
echo "🎉 QuarkfinAI is LIVE!"
echo "====================="
echo "Frontend: https://$CDN_DOMAIN"
echo "API: https://$CDN_DOMAIN/api"
echo "ALB: http://$ALB_DOMAIN"
echo ""
echo "🎯 Point app.quarkfin.ai to: $CDN_DOMAIN"
