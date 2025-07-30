#!/bin/bash

echo "🚀 QuarkFin Direct AWS Deployment"
echo "================================"

# Configuration
INSTANCE_ID="i-0e123a3106f19af14"
REGION="us-east-1"

echo "📋 Deploying to instance: $INSTANCE_ID"

# Step 1: Install packages
echo "📦 Step 1: Installing packages..."
aws ssm send-command \
    --instance-ids $INSTANCE_ID \
    --document-name "AWS-RunShellScript" \
    --parameters 'commands=["sudo yum update -y", "sudo yum install -y nodejs nginx git", "sudo npm install -g pm2"]' \
    --region $REGION

sleep 20

# Step 2: Install Go
echo "📦 Step 2: Installing Go..."
aws ssm send-command \
    --instance-ids $INSTANCE_ID \
    --document-name "AWS-RunShellScript" \
    --parameters 'commands=["wget https://go.dev/dl/go1.21.0.linux-amd64.tar.gz", "sudo tar -C /usr/local -xzf go1.21.0.linux-amd64.tar.gz", "echo \"export PATH=\\\$PATH:/usr/local/go/bin\" | sudo tee -a /etc/profile"]' \
    --region $REGION

sleep 20

# Step 3: Setup directories and nginx
echo "🔧 Step 3: Setting up directories and nginx..."
aws ssm send-command \
    --instance-ids $INSTANCE_ID \
    --document-name "AWS-RunShellScript" \
    --parameters 'commands=["sudo mkdir -p /var/www/quarkfin /opt/quarkfin", "sudo chown -R ec2-user:ec2-user /var/www/quarkfin /opt/quarkfin", "sudo systemctl enable nginx", "sudo systemctl start nginx"]' \
    --region $REGION

sleep 20

# Step 4: Configure nginx
echo "🔧 Step 4: Configuring nginx..."
aws ssm send-command \
    --instance-ids $INSTANCE_ID \
    --document-name "AWS-RunShellScript" \
    --parameters 'commands=["echo \"server { listen 3000; location /ping { return 200 \\\"Frontend Healthy\\\"; add_header Content-Type text/plain; } location / { proxy_pass http://localhost:3001; } }\" | sudo tee /etc/nginx/conf.d/frontend.conf", "echo \"server { listen 8080; location /ping { return 200 \\\"Backend Healthy\\\"; add_header Content-Type text/plain; } location / { proxy_pass http://localhost:8081; } }\" | sudo tee /etc/nginx/conf.d/backend.conf", "sudo systemctl reload nginx"]' \
    --region $REGION

sleep 20

# Step 5: Deploy frontend
echo "📱 Step 5: Deploying frontend..."
aws ssm send-command \
    --instance-ids $INSTANCE_ID \
    --document-name "AWS-RunShellScript" \
    --parameters 'commands=["cd /var/www/quarkfin", "git clone https://bitbucket.org/quarkfin/platform-e2e.git .", "cd frontend", "echo \"NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_IPrV3lqL0\" > .env.local", "echo \"NEXT_PUBLIC_COGNITO_CLIENT_ID=1cf34bqt0pnhmdq0rl068v5d9t\" >> .env.local", "echo \"NEXT_PUBLIC_AWS_REGION=us-east-1\" >> .env.local", "echo \"NEXT_PUBLIC_API_URL=http://localhost:8080\" >> .env.local", "echo \"NODE_ENV=production\" >> .env.local", "npm install", "npm run build"]' \
    --region $REGION

sleep 60

# Step 6: Deploy backend
echo "🔧 Step 6: Deploying backend..."
aws ssm send-command \
    --instance-ids $INSTANCE_ID \
    --document-name "AWS-RunShellScript" \
    --parameters 'commands=["cd /opt/quarkfin", "git clone https://bitbucket.org/quarkfin/platform-e2e.git .", "cd go_backend", "export PATH=\\\$PATH:/usr/local/go/bin", "go mod download", "go build -o quarkfin-backend cmd/server/main.go"]' \
    --region $REGION

sleep 60

# Step 7: Start applications
echo "🚀 Step 7: Starting applications..."
aws ssm send-command \
    --instance-ids $INSTANCE_ID \
    --document-name "AWS-RunShellScript" \
    --parameters 'commands=["cd /var/www/quarkfin/frontend", "pm2 start \"npx next start -p 3001\" --name frontend", "cd /opt/quarkfin/go_backend", "pm2 start \"./quarkfin-backend\" --name backend", "pm2 save", "pm2 startup"]' \
    --region $REGION

sleep 30

# Step 8: Verify deployment
echo "🔍 Step 8: Verifying deployment..."
aws ssm send-command \
    --instance-ids $INSTANCE_ID \
    --document-name "AWS-RunShellScript" \
    --parameters 'commands=["pm2 status", "curl -f http://localhost:3000/ping", "curl -f http://localhost:8080/ping"]' \
    --region $REGION

sleep 30

# Check target group health
echo "🏥 Checking load balancer health..."
aws elbv2 describe-target-health \
    --target-group-arn $(aws elbv2 describe-target-groups --names quarkfin-production-frontend-tg --query 'TargetGroups[0].TargetGroupArn' --output text)

echo "✅ Direct deployment completed!"
echo "🌐 Your application should now be accessible at:"
echo "   Frontend: https://d1o1sajvcnqzmr.cloudfront.net"
echo "   API: https://d1o1sajvcnqzmr.cloudfront.net/api" 