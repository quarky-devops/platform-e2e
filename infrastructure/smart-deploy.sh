#!/bin/bash

# QuarkfinAI Smart Deployment - Only deploy what's needed
# Don't destroy working stacks!

set -e

echo "🎯 Smart Deployment - Preserving Working Stacks"
echo "==============================================="

cd /Users/bidya/Documents/quarkfin/platform-e2e/infrastructure

# Silence Node.js warning
export JSII_SILENCE_WARNING_UNTESTED_NODE_VERSION=1

echo "📦 Building..."
npm run build

echo "🔍 Checking stack status..."

# Check which stacks exist and are healthy
if aws cloudformation describe-stacks --stack-name QuarkfinVpcStack >/dev/null 2>&1; then
    echo "✅ VpcStack exists - skipping"
else
    echo "🚀 Deploying VpcStack..."
    npx cdk deploy QuarkfinVpcStack --require-approval never
fi

if aws cloudformation describe-stacks --stack-name QuarkfinSecurityStack >/dev/null 2>&1; then
    echo "✅ SecurityStack exists - skipping"
else
    echo "🚀 Deploying SecurityStack..."
    npx cdk deploy QuarkfinSecurityStack --require-approval never
fi

if aws cloudformation describe-stacks --stack-name QuarkfinAuthStack >/dev/null 2>&1; then
    echo "✅ AuthStack exists - skipping"
else
    echo "🚀 Deploying AuthStack..."
    npx cdk deploy QuarkfinAuthStack --require-approval never
fi

if aws cloudformation describe-stacks --stack-name QuarkfinDatabaseStack >/dev/null 2>&1; then
    echo "✅ DatabaseStack exists - skipping"
else
    echo "🚀 Deploying DatabaseStack..."
    npx cdk deploy QuarkfinDatabaseStack --require-approval never
fi

echo "🚀 Deploying remaining stacks..."
npx cdk deploy QuarkfinAppStack --require-approval never
npx cdk deploy QuarkfinCdnStack --require-approval never

echo "✅ Smart deployment completed!"
echo "📋 Getting outputs..."
npx cdk list

echo "🎉 QuarkfinAI is live on AWS!"
