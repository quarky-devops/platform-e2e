#!/bin/bash
# Update .env with the environment variables from your CDK deployment

cd /Users/bidya/Documents/quarkfin/platform-e2e/frontend

echo "🔧 Updating .env with deployment values..."

# Create/update .env with the values from your environment
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

echo "✅ Updated .env file with:"
echo "   • AWS Region: ${AWS_DEFAULT_REGION:-us-east-1}"
echo "   • User Pool ID: ${USER_POOL_ID}"
echo "   • Client ID: ${CLIENT_ID}"
echo ""
echo "🚀 Now running build..."
npm run build
