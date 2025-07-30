#!/bin/bash

echo "🔧 Quick Build Test - Testing both frontend and backend"

# Test Go backend first
echo "🏗️ Testing Go backend build..."
cd /Users/bidya/Documents/quarkfin/platform-e2e/go_backend
go build -o quarkfin-backend .

if [ $? -eq 0 ]; then
    echo "✅ Backend build successful!"
    
    echo "🏗️ Testing frontend build..."
    cd ../frontend
    
    # Set the real Cognito values
    export NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_IPrV3lqL0
    export NEXT_PUBLIC_COGNITO_CLIENT_ID=1cf34bqt0pnhmdq0rl068v5d9t
    export NEXT_PUBLIC_AWS_REGION=us-east-1
    
    npm run build
    
    if [ $? -eq 0 ]; then
        echo "✅ Frontend build successful!"
        echo "🎉 Both builds completed successfully!"
        echo ""
        echo "🚀 Ready for production deployment!"
    else
        echo "❌ Frontend build failed"
        exit 1
    fi
else
    echo "❌ Backend build failed"
    exit 1
fi
