#!/bin/bash

echo "🧪 Testing local build with dummy Cognito values..."

cd /Users/bidya/Documents/quarkfin/platform-e2e/frontend

# Set dummy environment variables
export NEXT_PUBLIC_COGNITO_USER_POOL_ID=dummy-pool-id
export NEXT_PUBLIC_COGNITO_CLIENT_ID=dummy-client-id
export NEXT_PUBLIC_AWS_REGION=us-east-1

echo "✅ Environment variables set:"
echo "   NEXT_PUBLIC_COGNITO_USER_POOL_ID: $NEXT_PUBLIC_COGNITO_USER_POOL_ID"
echo "   NEXT_PUBLIC_COGNITO_CLIENT_ID: $NEXT_PUBLIC_COGNITO_CLIENT_ID"

echo "🏗️ Running npm run build..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Frontend build successful!"
    
    echo "🏗️ Testing Go backend build..."
    cd ../go_backend
    go build -o quarkfin-backend .
    
    if [ $? -eq 0 ]; then
        echo "✅ Backend build successful!"
        echo "🎉 Both builds completed successfully!"
    else
        echo "❌ Backend build failed"
        exit 1
    fi
else
    echo "❌ Frontend build failed"
    exit 1
fi
