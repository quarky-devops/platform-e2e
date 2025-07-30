#!/bin/bash
# Quick build fix with environment variables

cd /Users/bidya/Documents/quarkfin/platform-e2e/frontend

# Set the environment variables that were already exported in your deployment
export NEXT_PUBLIC_AWS_REGION=${AWS_DEFAULT_REGION:-us-east-1}
export NEXT_PUBLIC_COGNITO_USER_POOL_ID=${USER_POOL_ID}
export NEXT_PUBLIC_COGNITO_CLIENT_ID=${CLIENT_ID}

echo "🔍 Environment Variables:"
echo "NEXT_PUBLIC_AWS_REGION: $NEXT_PUBLIC_AWS_REGION"
echo "NEXT_PUBLIC_COGNITO_USER_POOL_ID: $NEXT_PUBLIC_COGNITO_USER_POOL_ID"
echo "NEXT_PUBLIC_COGNITO_CLIENT_ID: $NEXT_PUBLIC_COGNITO_CLIENT_ID"
echo ""

# Run the build
echo "🚀 Running build with environment variables..."
npm run build
