#!/bin/bash

# Diagnose 503 Error - Check EC2 Application Status

echo "🔍 Diagnosing 503 Error on QuarkfinAI Platform"
echo "=============================================="

# Get EC2 instance details
echo "📊 Getting EC2 instance information..."
INSTANCE_ID=$(aws cloudformation describe-stacks --stack-name QuarkfinAppStack --query 'Stacks[0].Outputs[?OutputKey==`AppInstanceId`].OutputValue' --output text)
echo "Instance ID: $INSTANCE_ID"

# Check instance status
echo ""
echo "🖥️ EC2 Instance Status:"
aws ec2 describe-instances --instance-ids $INSTANCE_ID --query 'Reservations[0].Instances[0].State.Name' --output text

# Check instance health
echo ""
echo "💓 Instance Health Checks:"
aws ec2 describe-instance-status --instance-ids $INSTANCE_ID --query 'InstanceStatuses[0].InstanceStatus.Status' --output text

# Check what's running on the instance
echo ""
echo "🔍 Checking what's running on EC2..."
aws ssm send-command \
  --instance-ids $INSTANCE_ID \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=["ps aux | grep -E \"(nginx|node|quarkfin)\"", "netstat -tlnp | grep -E \"(3000|8080|80)\"", "ls -la /var/www/quarkfin/", "ls -la /opt/quarkfin/"]' \
  --output text

echo ""
echo "🎯 Load Balancer Target Health:"
ALB_ARN=$(aws cloudformation describe-stacks --stack-name QuarkfinAppStack --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerArn`].OutputValue' --output text 2>/dev/null || echo "Not found")
if [ "$ALB_ARN" != "Not found" ]; then
    # Get target groups
    TARGET_GROUPS=$(aws elbv2 describe-target-groups --load-balancer-arn $ALB_ARN --query 'TargetGroups[].TargetGroupArn' --output text)
    for TG in $TARGET_GROUPS; do
        echo "Target Group: $TG"
        aws elbv2 describe-target-health --target-group-arn $TG
    done
else
    echo "Load balancer ARN not found"
fi

echo ""
echo "🔧 DIAGNOSIS COMPLETE"
echo "===================="
echo ""
echo "🎯 Most likely issues:"
echo "1. Frontend/Backend applications not started on EC2"
echo "2. Nginx not configured properly"
echo "3. Applications crashed after deployment"
echo "4. Target groups not registered with healthy targets"
echo ""
echo "💡 Next step: Deploy application code to EC2 instance"
