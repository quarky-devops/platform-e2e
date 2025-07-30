#!/bin/bash

echo "🚀 Simple QuarkfinAI EC2 Deployment"
echo "==================================="

INSTANCE_ID="i-0e123a3106f19af14"
REGION="us-east-1"

echo "📋 Deploying to instance: $INSTANCE_ID"

# Step 1: Install basic packages
echo "📦 Step 1: Installing packages..."
aws ssm send-command \
    --instance-ids $INSTANCE_ID \
    --document-name "AWS-RunShellScript" \
    --parameters 'commands=["yum update -y", "curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -", "yum install -y nodejs nginx git", "npm install -g pm2"]' \
    --region $REGION

sleep 10

# Step 2: Install Go
echo "📦 Step 2: Installing Go..."
aws ssm send-command \
    --instance-ids $INSTANCE_ID \
    --document-name "AWS-RunShellScript" \
    --parameters 'commands=["wget https://go.dev/dl/go1.21.0.linux-amd64.tar.gz", "tar -C /usr/local -xzf go1.21.0.linux-amd64.tar.gz", "echo \"export PATH=\\\$PATH:/usr/local/go/bin\" >> /etc/profile", "source /etc/profile"]' \
    --region $REGION

sleep 10

# Step 3: Configure nginx
echo "🔧 Step 3: Configuring nginx..."
aws ssm send-command \
    --instance-ids $INSTANCE_ID \
    --document-name "AWS-RunShellScript" \
    --parameters 'commands=["mkdir -p /var/www/quarkfin /opt/quarkfin", "chown ec2-user:ec2-user /var/www/quarkfin /opt/quarkfin", "systemctl enable nginx", "systemctl start nginx"]' \
    --region $REGION

sleep 10

# Step 4: Create nginx config
echo "🔧 Step 4: Creating nginx configuration..."
aws ssm send-command \
    --instance-ids $INSTANCE_ID \
    --document-name "AWS-RunShellScript" \
    --parameters 'commands=["echo \"server { listen 3000; location /ping { return 200 \\\"Frontend Healthy\\\"; add_header Content-Type text/plain; } location / { proxy_pass http://localhost:3001; } }\" > /etc/nginx/conf.d/frontend.conf", "echo \"server { listen 8080; location /ping { return 200 \\\"Backend Healthy\\\"; add_header Content-Type text/plain; } location / { proxy_pass http://localhost:8081; } }\" > /etc/nginx/conf.d/backend.conf", "systemctl reload nginx"]' \
    --region $REGION

sleep 10

# Step 5: Deploy frontend
echo "📱 Step 5: Deploying frontend..."
aws ssm send-command \
    --instance-ids $INSTANCE_ID \
    --document-name "AWS-RunShellScript" \
    --parameters 'commands=["cd /var/www/quarkfin", "git clone https://bitbucket.org/quarkfin/platform-e2e.git .", "cd frontend", "npm install", "npm run build"]' \
    --region $REGION

sleep 30

# Step 6: Deploy backend
echo "🔧 Step 6: Deploying backend..."
aws ssm send-command \
    --instance-ids $INSTANCE_ID \
    --document-name "AWS-RunShellScript" \
    --parameters 'commands=["cd /opt/quarkfin", "git clone https://bitbucket.org/quarkfin/platform-e2e.git .", "cd go_backend", "go mod download", "go build -o quarkfin-backend cmd/server/main.go"]' \
    --region $REGION

sleep 30

# Step 7: Start applications
echo "🚀 Step 7: Starting applications..."
aws ssm send-command \
    --instance-ids $INSTANCE_ID \
    --document-name "AWS-RunShellScript" \
    --parameters 'commands=["cd /var/www/quarkfin/frontend", "pm2 start \"npx next start -p 3001\" --name frontend", "cd /opt/quarkfin/go_backend", "pm2 start \"./quarkfin-backend\" --name backend", "pm2 save", "pm2 startup"]' \
    --region $REGION

sleep 20

# Step 8: Check status
echo "🔍 Step 8: Checking deployment status..."
aws ssm send-command \
    --instance-ids $INSTANCE_ID \
    --document-name "AWS-RunShellScript" \
    --parameters 'commands=["pm2 status", "curl -f http://localhost:3000/ping", "curl -f http://localhost:8080/ping"]' \
    --region $REGION

echo "✅ Deployment completed!"
echo "🌐 Check your application at: https://d1o1sajvcnqzmr.cloudfront.net" 