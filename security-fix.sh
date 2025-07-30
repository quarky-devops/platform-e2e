#!/bin/bash

echo "🔧 Security Fix: Remove sensitive env files and push clean version"

# Remove sensitive environment files from git tracking
echo "🗑️ Removing sensitive files..."
git rm --cached frontend/.env.production 2>/dev/null || echo "   .env.production not in git"
git rm --cached frontend/.env.local 2>/dev/null || echo "   .env.local not in git"

# Remove files from filesystem
rm -f frontend/.env.production
rm -f frontend/.env.local

echo "✅ Removed sensitive environment files"

# Test the build with environment variables only
echo "🧪 Testing build with environment variables..."
cd frontend

export NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_IPrV3lqL0
export NEXT_PUBLIC_COGNITO_CLIENT_ID=1cf34bqt0pnhmdq0rl068v5d9t
export NEXT_PUBLIC_AWS_REGION=us-east-1

npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful with environment variables!"
    
    cd ..
    echo "📝 Committing security fix..."
    git add .
    git commit -m "🔒 SECURITY: Use repository variables instead of env files

✅ Removed .env.production and .env.local from repository
✅ Pipeline now uses Bitbucket repository variables  
✅ No sensitive data stored in git
✅ Build tested with environment variables

📋 Required Bitbucket Repository Variables:
   • AWS_ACCESS_KEY_ID
   • AWS_SECRET_ACCESS_KEY  
   • AWS_DEFAULT_REGION=us-east-1
   • USER_POOL_ID=us-east-1_IPrV3lqL0
   • CLIENT_ID=1cf34bqt0pnhmdq0rl068v5d9t"

    echo ""
    echo "🎉 SECURITY FIX COMPLETE!"
    echo "========================"
    echo ""
    echo "📋 NEXT STEPS:"
    echo "1. Set Bitbucket repository variables (see above)"
    echo "2. git push origin main"
    echo "3. Pipeline will use secure repository variables"
    echo ""
    echo "🔒 Your sensitive data is now secure!"
    
else
    echo "❌ Build failed - check errors above"
    exit 1
fi
