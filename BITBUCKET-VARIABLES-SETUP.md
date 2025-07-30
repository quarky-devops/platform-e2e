# 🔒 Bitbucket Repository Variables Setup

## Required Repository Variables

Go to: **Bitbucket → Your Repository → Repository Settings → Pipelines → Repository variables**

### 🔐 AWS Credentials
```
AWS_ACCESS_KEY_ID = your-aws-access-key-id
AWS_SECRET_ACCESS_KEY = your-aws-secret-access-key  
AWS_DEFAULT_REGION = us-east-1
```

### 🆔 Cognito Configuration (Your Values)
```
USER_POOL_ID = us-east-1_IPrV3lqL0
CLIENT_ID = 1cf34bqt0pnhmdq0rl068v5d9t
```

## 📋 Steps to Fix

1. **Run the security fix:**
   ```bash
   chmod +x security-fix.sh && ./security-fix.sh
   ```

2. **Set Bitbucket repository variables** (see above values)

3. **Push the secure version:**
   ```bash
   git push origin main
   ```

## ✅ What This Fixes

- ❌ **Before**: Pipeline tried to read `.env.production` file (doesn't exist in repo)
- ✅ **After**: Pipeline uses secure Bitbucket repository variables
- 🔒 **Security**: No sensitive data stored in git repository
- 🚀 **Deployment**: Uses environment variables from Bitbucket

## 🎯 Result

The pipeline will:
1. ✅ Get Cognito values from repository variables
2. ✅ Export them as environment variables
3. ✅ Build frontend successfully with these variables
4. ✅ Deploy to AWS production

**This is the correct, secure way to handle sensitive environment variables!** 🔒
