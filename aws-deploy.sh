#!/bin/bash

echo "🚀 QuarkFin AWS Production Deployment"
echo "====================================="

# Configuration
INSTANCE_ID="i-0e123a3106f19af14"
REGION="us-east-1"
USER_POOL_ID="us-east-1_IPrV3lqL0"
CLIENT_ID="1cf34bqt0pnhmdq0rl068v5d9t"

echo "📋 Deploying to instance: $INSTANCE_ID"

# Step 1: Create environment file on EC2
echo "🔧 Step 1: Creating environment configuration..."
aws ssm send-command \
    --instance-ids $INSTANCE_ID \
    --document-name "AWS-RunShellScript" \
    --parameters 'commands=[
      "cd /var/www/quarkfin/frontend",
      "cat > .env.local << '\''EOF'\''",
      "NEXT_PUBLIC_COGNITO_USER_POOL_ID='$USER_POOL_ID'",
      "NEXT_PUBLIC_COGNITO_CLIENT_ID='$CLIENT_ID'",
      "NEXT_PUBLIC_AWS_REGION='$REGION'",
      "NEXT_PUBLIC_API_URL=http://localhost:8080",
      "NEXT_PUBLIC_PLATFORM_NAME=QuarkfinAI",
      "NEXT_PUBLIC_PLATFORM_URL=https://d1o1sajvcnqzmr.cloudfront.net",
      "NEXT_PUBLIC_ENABLE_GOOGLE_AUTH=true",
      "NEXT_PUBLIC_ENABLE_PHONE_VERIFICATION=true",
      "NEXT_PUBLIC_ENABLE_PAYMENTS=true",
      "NEXT_PUBLIC_ANALYTICS_ENABLED=true",
      "NODE_ENV=production",
      "EOF'\''",
      "echo \"Environment file created\""
    ]' \
    --region $REGION

sleep 10

# Step 2: Build and start frontend
echo "📱 Step 2: Building and starting frontend..."
aws ssm send-command \
    --instance-ids $INSTANCE_ID \
    --document-name "AWS-RunShellScript" \
    --parameters 'commands=[
      "cd /var/www/quarkfin/frontend",
      "npm install",
      "npm run build",
      "pm2 stop frontend || true",
      "pm2 delete frontend || true",
      "pm2 start \"npx next start -p 3001\" --name frontend",
      "pm2 save"
    ]' \
    --region $REGION

sleep 30

# Step 3: Build and start backend
echo "🔧 Step 3: Building and starting backend..."
aws ssm send-command \
    --instance-ids $INSTANCE_ID \
    --document-name "AWS-RunShellScript" \
    --parameters 'commands=[
      "cd /opt/quarkfin/go_backend",
      "go mod download",
      "go build -o quarkfin-backend cmd/server/main.go",
      "pm2 stop backend || true",
      "pm2 delete backend || true",
      "pm2 start \"./quarkfin-backend\" --name backend",
      "pm2 save"
    ]' \
    --region $REGION

sleep 30

# Step 4: Verify deployment
echo "🔍 Step 4: Verifying deployment..."
aws ssm send-command \
    --instance-ids $INSTANCE_ID \
    --document-name "AWS-RunShellScript" \
    --parameters 'commands=[
      "pm2 status",
      "echo \"Testing health endpoints...\"",
      "curl -f http://localhost:3000/ping || echo \"Frontend health check failed\"",
      "curl -f http://localhost:8080/ping || echo \"Backend health check failed\"",
      "echo \"Deployment verification complete\""
    ]' \
    --region $REGION

sleep 20

# Step 5: Check target group health
echo "🏥 Step 5: Checking load balancer health..."
aws elbv2 describe-target-health \
    --target-group-arn $(aws elbv2 describe-target-groups --names quarkfin-production-frontend-tg --query 'TargetGroups[0].TargetGroupArn' --output text)

echo "✅ AWS deployment completed!"
echo "🌐 Your application should now be accessible at:"
echo "   Frontend: https://d1o1sajvcnqzmr.cloudfront.net"
echo "   API: https://d1o1sajvcnqzmr.cloudfront.net/api" 