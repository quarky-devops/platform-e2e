#!/bin/bash

# Update environment variables after AWS deployment
echo "🔄 Updating Cognito environment variables..."

# Get Cognito values from CloudFormation stacks
USER_POOL_ID=$(aws cloudformation describe-stacks --stack-name QuarkfinAuthStack --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' --output text)
CLIENT_ID=$(aws cloudformation describe-stacks --stack-name QuarkfinAuthStack --query 'Stacks[0].Outputs[?OutputKey==`UserPoolClientId`].OutputValue' --output text)

if [ -z "$USER_POOL_ID" ] || [ -z "$CLIENT_ID" ]; then
    echo "❌ Failed to get Cognito values from CloudFormation"
    echo "Make sure QuarkfinAuthStack is deployed successfully"
    exit 1
fi

echo "✅ Found Cognito values:"
echo "   User Pool ID: $USER_POOL_ID"
echo "   Client ID: $CLIENT_ID"

# Update .env.production
cd frontend
sed -i "s/NEXT_PUBLIC_COGNITO_USER_POOL_ID=.*/NEXT_PUBLIC_COGNITO_USER_POOL_ID=$USER_POOL_ID/" .env.production
sed -i "s/NEXT_PUBLIC_COGNITO_CLIENT_ID=.*/NEXT_PUBLIC_COGNITO_CLIENT_ID=$CLIENT_ID/" .env.production

echo "✅ Updated .env.production with real Cognito values"
echo "🏗️ Rebuilding frontend with correct environment..."

npm run build

echo "✅ Frontend rebuild completed!"
