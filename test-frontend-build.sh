#!/bin/bash

# QuarkfinAI Frontend Build & Deploy Script
# Run this after CDK deployment to deploy frontend

set -e

echo "🚀 QuarkfinAI Frontend Deployment"
echo "================================="

# Navigate to frontend directory
cd /Users/bidya/Documents/quarkfin/platform-e2e/frontend

# Check if we have Node modules
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Type check first
echo "🔍 Running TypeScript type check..."
npm run type-check

# Build the application
echo "🏗️ Building Next.js application..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Frontend build successful!"
    echo ""
    echo "Next steps:"
    echo "1. Update .env with actual AWS Cognito values from CDK deployment"
    echo "2. Deploy to AWS CloudFront"
    echo "3. Update backend API endpoints"
else
    echo "❌ Frontend build failed!"
    exit 1
fi
