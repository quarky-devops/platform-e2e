#!/bin/bash

echo "📊 QuarkfinAI Deployment Status Checker"
echo "========================================"

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &>/dev/null; then
    echo "❌ AWS CLI not configured"
    echo "Run: aws configure"
    exit 1
fi

echo "✅ AWS CLI configured"

# Check CloudFormation stacks
stacks=(
    "QuarkfinVpcStack"
    "QuarkfinSecurityStack" 
    "QuarkfinAuthStack"
    "QuarkfinDatabaseStack"
    "QuarkfinAppStack"
    "QuarkfinCdnStack"
)

echo ""
echo "🏗️ CloudFormation Stack Status:"
echo "------------------------------"

all_complete=true

for stack in "${stacks[@]}"; do
    status=$(aws cloudformation describe-stacks --stack-name $stack --query 'Stacks[0].StackStatus' --output text 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        if [ "$status" = "CREATE_COMPLETE" ] || [ "$status" = "UPDATE_COMPLETE" ]; then
            echo "✅ $stack: $status"
        else
            echo "⚠️  $stack: $status"
            all_complete=false
        fi
    else
        echo "❌ $stack: NOT FOUND"
        all_complete=false
    fi
done

if [ "$all_complete" = true ]; then
    echo ""
    echo "🎉 All stacks deployed successfully!"
    echo ""
    echo "🔗 Getting deployment URLs..."
    
    # Get important URLs
    CDN_DOMAIN=$(aws cloudformation describe-stacks --stack-name QuarkfinCdnStack --query 'Stacks[0].Outputs[?OutputKey==`DistributionDomainName`].OutputValue' --output text 2>/dev/null)
    ALB_DNS=$(aws cloudformation describe-stacks --stack-name QuarkfinAppStack --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue' --output text 2>/dev/null)
    USER_POOL_ID=$(aws cloudformation describe-stacks --stack-name QuarkfinAuthStack --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' --output text 2>/dev/null)
    CLIENT_ID=$(aws cloudformation describe-stacks --stack-name QuarkfinAuthStack --query 'Stacks[0].Outputs[?OutputKey==`UserPoolClientId`].OutputValue' --output text 2>/dev/null)
    
    echo "📋 Deployment Information:"
    echo "------------------------"
    echo "🌐 Frontend URL: https://$CDN_DOMAIN"
    echo "🔗 API URL: https://$CDN_DOMAIN/api"
    echo "⚖️  Load Balancer: http://$ALB_DNS"
    echo "🆔 User Pool ID: $USER_POOL_ID"
    echo "🆔 Client ID: $CLIENT_ID"
    echo ""
    echo "📝 Next Steps:"
    echo "1. Point app.quarkfin.ai CNAME to: $CDN_DOMAIN"
    echo "2. Run ./update-cognito-env.sh to update environment variables"
    echo "3. Test the platform at https://$CDN_DOMAIN"
    
else
    echo ""
    echo "⚠️  Some stacks are not ready. Check the errors above."
fi
