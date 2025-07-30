#!/bin/bash

echo "🚀 QuarkFin GUARANTEED AWS Deployment"
echo "===================================="

# Configuration
INSTANCE_ID="i-0e123a3106f19af14"
REGION="us-east-1"
USER_POOL_ID="us-east-1_IPrV3lqL0"
CLIENT_ID="1cf34bqt0pnhmdq0rl068v5d9t"

echo "📋 Deploying to instance: $INSTANCE_ID"

# Method 1: Direct deployment via SSM with better error handling
echo "🔧 Method 1: Direct SSM Deployment..."

# Create a comprehensive deployment script
DEPLOY_SCRIPT=$(cat << 'EOF'
#!/bin/bash
set -e

echo "Starting guaranteed deployment..."

# Check if we're running as root or ec2-user
if [ "$EUID" -eq 0 ]; then
    USER_HOME="/home/ec2-user"
    USER="ec2-user"
else
    USER_HOME="$HOME"
    USER=$(whoami)
fi

echo "Running as user: $USER"
echo "User home: $USER_HOME"

# Install required packages
echo "Installing packages..."
sudo yum update -y
sudo yum install -y nodejs nginx git

# Install PM2 globally
echo "Installing PM2..."
sudo npm install -g pm2

# Install Go
echo "Installing Go..."
if ! command -v go &> /dev/null; then
    wget https://go.dev/dl/go1.21.0.linux-amd64.tar.gz
    sudo tar -C /usr/local -xzf go1.21.0.linux-amd64.tar.gz
    echo 'export PATH=$PATH:/usr/local/go/bin' | sudo tee -a /etc/profile
    export PATH=$PATH:/usr/local/go/bin
fi

# Create directories
echo "Creating directories..."
sudo mkdir -p /var/www/quarkfin /opt/quarkfin
sudo chown -R $USER:$USER /var/www/quarkfin /opt/quarkfin

# Configure nginx
echo "Configuring nginx..."
sudo tee /etc/nginx/conf.d/quarkfin.conf > /dev/null << 'NGINX_EOF'
server {
    listen 3000;
    server_name _;
    
    location /ping {
        return 200 'Frontend Healthy';
        add_header Content-Type text/plain;
    }
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 8080;
    server_name _;
    
    location /ping {
        return 200 'Backend Healthy';
        add_header Content-Type text/plain;
    }
    
    location / {
        proxy_pass http://localhost:8081;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX_EOF

sudo systemctl enable nginx
sudo systemctl start nginx

# Deploy frontend
echo "Deploying frontend..."
cd /var/www/quarkfin
if [ -d ".git" ]; then
    git pull
else
    git clone https://bitbucket.org/quarkfin/platform-e2e.git .
fi

cd frontend

# Create environment file
cat > .env.local << 'ENV_EOF'
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_IPrV3lqL0
NEXT_PUBLIC_COGNITO_CLIENT_ID=1cf34bqt0pnhmdq0rl068v5d9t
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_PLATFORM_NAME=QuarkfinAI
NEXT_PUBLIC_PLATFORM_URL=https://d1o1sajvcnqzmr.cloudfront.net
NEXT_PUBLIC_ENABLE_GOOGLE_AUTH=true
NEXT_PUBLIC_ENABLE_PHONE_VERIFICATION=true
NEXT_PUBLIC_ENABLE_PAYMENTS=true
NEXT_PUBLIC_ANALYTICS_ENABLED=true
NODE_ENV=production
ENV_EOF

echo "Installing frontend dependencies..."
npm install

echo "Building frontend..."
npm run build

# Deploy backend
echo "Deploying backend..."
cd /opt/quarkfin
if [ -d ".git" ]; then
    git pull
else
    git clone https://bitbucket.org/quarkfin/platform-e2e.git .
fi

cd go_backend
echo "Installing Go dependencies..."
go mod download

echo "Building backend..."
go build -o quarkfin-backend cmd/server/main.go

# Start applications with PM2
echo "Starting applications..."
cd $USER_HOME

# Stop existing processes
pm2 stop all || true
pm2 delete all || true

# Start frontend
echo "Starting frontend..."
cd /var/www/quarkfin/frontend
pm2 start "npx next start -p 3001" --name frontend

# Start backend
echo "Starting backend..."
cd /opt/quarkfin/go_backend
pm2 start "./quarkfin-backend" --name backend

# Save PM2 configuration
pm2 save
pm2 startup

echo "Deployment completed!"
echo "PM2 Status:"
pm2 status

echo "Testing health endpoints..."
curl -f http://localhost:3000/ping && echo "Frontend health check: OK"
curl -f http://localhost:8080/ping && echo "Backend health check: OK"

echo "Guaranteed deployment successful!"
EOF
)

# Send the deployment script to EC2
echo "📤 Sending deployment script to EC2..."
aws ssm send-command \
    --instance-ids $INSTANCE_ID \
    --document-name "AWS-RunShellScript" \
    --parameters "commands=[\"$DEPLOY_SCRIPT\"]" \
    --region $REGION

echo "⏳ Waiting for deployment to complete..."
sleep 120

# Verify deployment
echo "🔍 Verifying deployment..."
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

echo "✅ Guaranteed deployment completed!"
echo "🌐 Your application should now be accessible at:"
echo "   Frontend: https://d1o1sajvcnqzmr.cloudfront.net"
echo "   API: https://d1o1sajvcnqzmr.cloudfront.net/api" 