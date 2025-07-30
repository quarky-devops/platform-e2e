#!/bin/bash

echo "🚀 QuarkfinAI EC2 Deployment Script"
echo "==================================="

# Configuration
INSTANCE_ID="i-0e123a3106f19af14"
REGION="us-east-1"
PROJECT_DIR="/var/www/quarkfin"

echo "📋 Deploying to instance: $INSTANCE_ID"

# Create deployment script for EC2
cat > /tmp/ec2-deploy.sh << 'EOF'
#!/bin/bash

echo "🔧 Starting QuarkfinAI deployment on EC2..."

# Update system
echo "📦 Updating system packages..."
yum update -y

# Install Node.js 18
echo "📦 Installing Node.js 18..."
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs

# Install Go 1.21
echo "📦 Installing Go 1.21..."
wget https://go.dev/dl/go1.21.0.linux-amd64.tar.gz
tar -C /usr/local -xzf go1.21.0.linux-amd64.tar.gz
echo "export PATH=\$PATH:/usr/local/go/bin" >> /etc/profile
echo "export PATH=\$PATH:/usr/local/go/bin" >> /home/ec2-user/.bashrc
source /etc/profile

# Install nginx
echo "📦 Installing nginx..."
yum install -y nginx

# Install PM2
echo "📦 Installing PM2..."
npm install -g pm2

# Install git
echo "📦 Installing git..."
yum install -y git

# Install AWS CLI v2
echo "📦 Installing AWS CLI v2..."
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
./aws/install

# Create application directories
echo "📁 Creating application directories..."
mkdir -p /var/www/quarkfin
mkdir -p /opt/quarkfin
chown ec2-user:ec2-user /var/www/quarkfin /opt/quarkfin

# Configure nginx
echo "🔧 Configuring nginx..."
cat > /etc/nginx/conf.d/quarkfin.conf << 'NGINX_EOF'
server {
    listen 3000;
    server_name _;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    
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
    
    location /ping {
        return 200 'Frontend Healthy';
        add_header Content-Type text/plain;
    }
}

server {
    listen 8080;
    server_name _;
    
    location / {
        proxy_pass http://localhost:8081;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /ping {
        return 200 'Backend Healthy';
        add_header Content-Type text/plain;
    }
}
NGINX_EOF

# Start nginx
echo "🚀 Starting nginx..."
systemctl enable nginx
systemctl start nginx

# Clone and deploy frontend
echo "📱 Deploying frontend..."
cd /var/www/quarkfin
git clone https://bitbucket.org/quarkfin/platform-e2e.git .
cd frontend
npm install
npm run build

# Create frontend startup script
cat > /home/ec2-user/start-frontend.sh << 'FRONTEND_EOF'
#!/bin/bash
cd /var/www/quarkfin/frontend
export PORT=3001
export NODE_ENV=production
npx next start -p 3001
FRONTEND_EOF

chmod +x /home/ec2-user/start-frontend.sh
chown ec2-user:ec2-user /home/ec2-user/start-frontend.sh

# Deploy backend
echo "🔧 Deploying backend..."
cd /opt/quarkfin
git clone https://bitbucket.org/quarkfin/platform-e2e.git .
cd go_backend
go mod download
go build -o quarkfin-backend cmd/server/main.go

# Create backend startup script
cat > /home/ec2-user/start-backend.sh << 'BACKEND_EOF'
#!/bin/bash
cd /opt/quarkfin/go_backend
export PORT=8081
./quarkfin-backend
BACKEND_EOF

chmod +x /home/ec2-user/start-backend.sh
chown ec2-user:ec2-user /home/ec2-user/start-backend.sh

# Start applications with PM2
echo "🚀 Starting applications with PM2..."
cd /home/ec2-user

# Start frontend
pm2 start start-frontend.sh --name "quarkfin-frontend"

# Start backend
pm2 start start-backend.sh --name "quarkfin-backend"

# Save PM2 configuration
pm2 save
pm2 startup

echo "✅ Deployment complete!"
echo "📊 Application status:"
pm2 status

echo "🔍 Health check endpoints:"
echo "Frontend: http://localhost:3000/ping"
echo "Backend: http://localhost:8080/ping"
EOF

# Copy deployment script to EC2
echo "📤 Copying deployment script to EC2..."
aws ssm send-command \
    --instance-ids $INSTANCE_ID \
    --document-name "AWS-RunShellScript" \
    --parameters 'commands=["cat > /home/ec2-user/deploy.sh << '\''EOF'\''", "'$(cat /tmp/ec2-deploy.sh)'", "EOF", "chmod +x /home/ec2-user/deploy.sh", "/home/ec2-user/deploy.sh"]' \
    --region $REGION

echo "⏳ Waiting for deployment to complete..."
sleep 30

# Check deployment status
echo "🔍 Checking deployment status..."
aws ssm send-command \
    --instance-ids $INSTANCE_ID \
    --document-name "AWS-RunShellScript" \
    --parameters 'commands=["pm2 status", "curl -f http://localhost:3000/ping", "curl -f http://localhost:8080/ping"]' \
    --region $REGION

echo "✅ Deployment script completed!"
echo "🌐 Your application should now be accessible at:"
echo "   Frontend: https://d1o1sajvcnqzmr.cloudfront.net"
echo "   API: https://d1o1sajvcnqzmr.cloudfront.net/api" 