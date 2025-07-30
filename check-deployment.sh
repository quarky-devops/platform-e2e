#!/bin/bash
# Check CDK deployment status and get values

echo "🔍 Checking CDK Deployment Status"
echo "=================================="

echo "📋 Listing CloudFormation stacks..."
aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE --query 'StackSummaries[?contains(StackName, `Quarkfin`)].{Name:StackName,Status:StackStatus}' --output table

echo ""
echo "🔐 Attempting to get Cognito values..."

USER_POOL_ID=$(aws cloudformation describe-stacks --stack-name QuarkfinAuthStack --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' --output text 2>/dev/null)
CLIENT_ID=$(aws cloudformation describe-stacks --stack-name QuarkfinAuthStack --query 'Stacks[0].Outputs[?OutputKey==`UserPoolClientId`].OutputValue' --output text 2>/dev/null)

if [ "$USER_POOL_ID" != "None" ] && [ -n "$USER_POOL_ID" ]; then
    echo "✅ User Pool ID: $USER_POOL_ID"
else
    echo "❌ Could not get User Pool ID"
fi

if [ "$CLIENT_ID" != "None" ] && [ -n "$CLIENT_ID" ]; then
    echo "✅ Client ID: ${CLIENT_ID:0:10}..."
else
    echo "❌ Could not get Client ID"
fi

echo ""
echo "💡 If values are missing, you can:"
echo "1. Check AWS Console > Cognito User Pools manually"
echo "2. Or run: cdk deploy QuarkfinAuthStack --require-approval never"
