#!/bin/bash

echo "🚀 Final Production Build Fix - Making all scripts executable and committing"

# Make scripts executable
chmod +x test-local-build.sh
chmod +x update-cognito-env.sh
chmod +x get-cognito-values.sh
chmod +x aws-migration-push.sh

echo "✅ Made all scripts executable"

# Test the local build first
echo "🧪 Testing local build..."
./test-local-build.sh

if [ $? -eq 0 ]; then
    echo "✅ Local build test passed!"
    
    # Commit all changes
    echo "📝 Committing production build fixes..."
    git add .
    git commit -m "🚀 PRODUCTION READY: Fixed Cognito env vars & Go installation

✅ Added Go installation to Bitbucket pipeline
✅ Added dummy Cognito values for build process
✅ Updated config.ts to be more lenient during build
✅ Created env update scripts for post-deployment
✅ Ready for AWS deployment"
    
    echo "🎉 All fixes committed and ready for deployment!"
    echo ""
    echo "📋 Next steps:"
    echo "1. git push origin main"
    echo "2. Monitor Bitbucket pipeline deployment"
    echo "3. After AWS deployment, run ./update-cognito-env.sh to update real values"
    
else
    echo "❌ Local build test failed - please check the errors above"
    exit 1
fi
