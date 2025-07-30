#!/bin/bash

echo "🔍 Testing QuarkfinAI Frontend Build..."
echo "====================================="

cd /Users/bidya/Documents/quarkfin/platform-e2e/frontend

# Run type check only
echo "📋 Running TypeScript type check..."
npx tsc --noEmit

if [ $? -eq 0 ]; then
    echo "✅ TypeScript type check passed!"
else
    echo "❌ TypeScript type check failed!"
    exit 1
fi

echo ""
echo "🏗️ Running Next.js build..."
npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Build completed successfully!"
    echo "✅ Frontend is ready for deployment"
else
    echo ""
    echo "❌ Build failed!"
    exit 1
fi
