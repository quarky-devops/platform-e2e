#!/bin/bash
# Auto-fetch AWS Cognito credentials

echo "🔍 Fetching AWS Cognito Credentials"
echo "===================================="

# Method 1: CloudFormation Stack Outputs
echo "📡 Method 1: Checking CloudFormation stacks..."
USER_POOL_ID=$(aws cloudformation describe-stacks \
  --stack-name QuarkfinAuthStack \
  --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' \
  --output text 2>/dev/null)

CLIENT_ID=$(aws cloudformation describe-stacks \
  --stack-name QuarkfinAuthStack \
  --query 'Stacks[0].Outputs[?OutputKey==`UserPoolClientId`].OutputValue' \
  --output text 2>/dev/null)

if [ "$USER_POOL_ID" != "None" ] && [ -n "$USER_POOL_ID" ] && [ "$USER_POOL_ID" != "" ]; then
    echo "✅ Found User Pool ID: $USER_POOL_ID"
    echo "✅ Found Client ID: ${CLIENT_ID:0:10}..."
    
    echo ""
    echo "🎯 Your Cognito Credentials:"
    echo "=================================="
    echo "NEXT_PUBLIC_COGNITO_USER_POOL_ID=$USER_POOL_ID"
    echo "NEXT_PUBLIC_COGNITO_CLIENT_ID=$CLIENT_ID"
    echo ""
    echo "📋 Copy these to:"
    echo "1. Bitbucket Repository Settings > Repository Variables"
    echo "2. Or frontend/.env file"
    exit 0
fi

echo "❌ CloudFormation method failed. Trying direct Cognito API..."

# Method 2: Direct Cognito API
echo "📡 Method 2: Checking Cognito User Pools..."
USER_POOLS=$(aws cognito-idp list-user-pools --max-items 20 --output json 2>/dev/null)

if [ $? -eq 0 ]; then
    # Look for QuarkfinAI related pools
    POOL_ID=$(echo "$USER_POOLS" | jq -r '.UserPools[] | select(.Name | contains("Quarkfin") or contains("quarkfin")) | .Id' | head -1)
    
    if [ -n "$POOL_ID" ] && [ "$POOL_ID" != "null" ]; then
        echo "✅ Found User Pool: $POOL_ID"
        
        # Get client ID
        CLIENTS=$(aws cognito-idp list-user-pool-clients --user-pool-id "$POOL_ID" --output json 2>/dev/null)
        CLIENT_ID=$(echo "$CLIENTS" | jq -r '.UserPoolClients[0].ClientId' 2>/dev/null)
        
        if [ -n "$CLIENT_ID" ] && [ "$CLIENT_ID" != "null" ]; then
            echo "✅ Found Client ID: ${CLIENT_ID:0:10}..."
            
            echo ""
            echo "🎯 Your Cognito Credentials:"
            echo "=================================="
            echo "NEXT_PUBLIC_COGNITO_USER_POOL_ID=$POOL_ID"
            echo "NEXT_PUBLIC_COGNITO_CLIENT_ID=$CLIENT_ID"
            exit 0
        fi
    fi
fi

echo "❌ Could not automatically fetch credentials."
echo ""
echo "🔧 Manual Steps:"
echo "1. Go to AWS Console → Cognito → User Pools"
echo "2. Find your QuarkfinAI User Pool"
echo "3. Copy the User Pool ID (us-east-1_xxxxxxxxx)"
echo "4. Go to App Integration → App clients"
echo "5. Copy the Client ID"
echo ""
echo "🚨 Alternative: Redeploy CDK Auth Stack:"
echo "cd infrastructure"
echo "cdk deploy QuarkfinAuthStack --require-approval never"
