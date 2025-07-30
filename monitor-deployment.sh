#!/bin/bash

echo "🔍 QuarkFin AWS Deployment Monitor"
echo "================================="

# Configuration
INSTANCE_ID="i-0e123a3106f19af14"
FRONTEND_URL="https://d1o1sajvcnqzmr.cloudfront.net"
API_URL="https://d1o1sajvcnqzmr.cloudfront.net/api"

echo "📊 Monitoring deployment status..."
echo ""

# Check CloudFormation stacks
echo "🏗️ Infrastructure Status:"
echo "------------------------"
stacks=("QuarkfinVpcStack" "QuarkfinSecurityStack" "QuarkfinAuthStack" "QuarkfinDatabaseStack" "QuarkfinAppStack" "QuarkfinCdnStack")

for stack in "${stacks[@]}"; do
    status=$(aws cloudformation describe-stacks --stack-name $stack --query 'Stacks[0].StackStatus' --output text 2>/dev/null)
    if [ $? -eq 0 ]; then
        if [ "$status" = "CREATE_COMPLETE" ] || [ "$status" = "UPDATE_COMPLETE" ]; then
            echo "✅ $stack: $status"
        else
            echo "⚠️  $stack: $status"
        fi
    else
        echo "❌ $stack: NOT FOUND"
    fi
done

echo ""
echo "🏥 Load Balancer Health:"
echo "----------------------"

# Check frontend target group
FRONTEND_TG_ARN=$(aws elbv2 describe-target-groups --names quarkfin-production-frontend-tg --query 'TargetGroups[0].TargetGroupArn' --output text 2>/dev/null)
if [ $? -eq 0 ]; then
    FRONTEND_HEALTH=$(aws elbv2 describe-target-health --target-group-arn $FRONTEND_TG_ARN --query 'TargetHealthDescriptions[0].TargetHealth.State' --output text)
    echo "Frontend Target Group: $FRONTEND_HEALTH"
else
    echo "Frontend Target Group: ❌ NOT FOUND"
fi

# Check backend target group
BACKEND_TG_ARN=$(aws elbv2 describe-target-groups --names quarkfin-production-backend-tg --query 'TargetGroups[0].TargetGroupArn' --output text 2>/dev/null)
if [ $? -eq 0 ]; then
    BACKEND_HEALTH=$(aws elbv2 describe-target-health --target-group-arn $BACKEND_TG_ARN --query 'TargetHealthDescriptions[0].TargetHealth.State' --output text)
    echo "Backend Target Group: $BACKEND_HEALTH"
else
    echo "Backend Target Group: ❌ NOT FOUND"
fi

echo ""
echo "🌐 Application URLs:"
echo "------------------"
echo "Frontend: $FRONTEND_URL"
echo "API: $API_URL"

echo ""
echo "🔍 Testing endpoints:"
echo "-------------------"

# Test frontend
echo -n "Frontend: "
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $FRONTEND_URL)
if [ "$FRONTEND_STATUS" = "200" ]; then
    echo "✅ $FRONTEND_STATUS"
elif [ "$FRONTEND_STATUS" = "502" ]; then
    echo "❌ $FRONTEND_STATUS (Bad Gateway - Application not running)"
else
    echo "⚠️  $FRONTEND_STATUS"
fi

# Test API
echo -n "API: "
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $API_URL)
if [ "$API_STATUS" = "200" ]; then
    echo "✅ $API_STATUS"
elif [ "$API_STATUS" = "502" ]; then
    echo "❌ $API_STATUS (Bad Gateway - Application not running)"
else
    echo "⚠️  $API_STATUS"
fi

echo ""
echo "📋 Next Steps:"
echo "-------------"
if [ "$FRONTEND_STATUS" = "200" ] && [ "$API_STATUS" = "200" ]; then
    echo "🎉 Deployment successful! Your application is running."
    echo "🌐 Visit: $FRONTEND_URL"
else
    echo "⚠️  Application not fully deployed yet."
    echo "⏳ The Bitbucket pipeline is still running..."
    echo "🔄 Check again in a few minutes."
fi

echo ""
echo "📊 EC2 Instance Status:"
echo "---------------------"
INSTANCE_STATUS=$(aws ec2 describe-instances --instance-ids $INSTANCE_ID --query 'Reservations[0].Instances[0].State.Name' --output text 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "Instance $INSTANCE_ID: $INSTANCE_STATUS"
else
    echo "Instance $INSTANCE_ID: ❌ NOT FOUND"
fi 