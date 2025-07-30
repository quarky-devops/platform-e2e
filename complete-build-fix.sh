#!/bin/bash
# Complete build fix with proper error handling

echo "🔧 QuarkfinAI Build Fix"
echo "======================"

# Check if we're in the right directory
if [ ! -f "frontend/package.json" ]; then
    echo "❌ Error: Run this script from platform-e2e directory"
    exit 1
fi

cd frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ npm install failed!"
        exit 1
    fi
fi

# Get the AWS values from the environment or from CloudFormation
echo "🔍 Getting AWS Cognito values..."

if [ -z "$USER_POOL_ID" ]; then
    echo "📡 Fetching User Pool ID from CloudFormation..."
    export USER_POOL_ID=$(aws cloudformation describe-stacks --stack-name QuarkfinAuthStack --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' --output text 2>/dev/null)
fi

if [ -z "$CLIENT_ID" ]; then
    echo "📡 Fetching Client ID from CloudFormation..."
    export CLIENT_ID=$(aws cloudformation describe-stacks --stack-name QuarkfinAuthStack --query 'Stacks[0].Outputs[?OutputKey==`UserPoolClientId`].OutputValue' --output text 2>/dev/null)
fi

if [ -z "$USER_POOL_ID" ] || [ -z "$CLIENT_ID" ]; then
    echo "❌ Could not get AWS Cognito values!"
    echo ""
    echo "Please ensure:"
    echo "1. AWS CLI is configured: aws configure"
    echo "2. CDK Auth stack is deployed: cdk deploy QuarkfinAuthStack"
    echo "3. Or set environment variables manually:"
    echo "   export USER_POOL_ID=us-east-1_xxxxxxxxx"
    echo "   export CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx"
    exit 1
fi

# Update .env file with the correct values
echo "✏️ Creating .env file..."
cat > .env << EOF
# QuarkfinAI Production Environment (AUTO-GENERATED)
NEXT_PUBLIC_AWS_REGION=${AWS_DEFAULT_REGION:-us-east-1}
NEXT_PUBLIC_COGNITO_USER_POOL_ID=${USER_POOL_ID}
NEXT_PUBLIC_COGNITO_CLIENT_ID=${CLIENT_ID}
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_PLATFORM_URL=https://app.quarkfin.ai
NEXT_PUBLIC_PLATFORM_NAME=QuarkfinAI
NEXT_PUBLIC_ENABLE_GOOGLE_AUTH=true
NEXT_PUBLIC_ENABLE_PHONE_VERIFICATION=true
NEXT_PUBLIC_ENABLE_PAYMENTS=true
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
EOF

echo "✅ Environment configured:"
echo "   • AWS Region: ${AWS_DEFAULT_REGION:-us-east-1}"
echo "   • User Pool ID: ${USER_POOL_ID}"
echo "   • Client ID: ${CLIENT_ID:0:10}..."
echo ""

# Run the build
echo "🚀 Running Next.js build..."
npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 BUILD SUCCESSFUL!"
    echo "==================="
    echo ""
    echo "✅ Frontend is ready for deployment"
    echo "🌍 Platform will be available at: https://app.quarkfin.ai"
    echo ""
else
    echo ""
    echo "❌ BUILD FAILED!"
    echo "==============="
    echo ""
    echo "Please check the error messages above and fix any issues."
fi
