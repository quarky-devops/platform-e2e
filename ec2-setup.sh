#!/bin/bash
echo "🔧 Setting up QuarkfinAI on EC2..."

# Go to the application directory
cd /opt/quarkfin
sudo chown -R ec2-user:ec2-user /opt/quarkfin

# Clone the repository (since the code was built in pipeline but not deployed)
git clone https://bitbucket.org/quarkfin/platform-e2e.git .
cd platform-e2e

# Set environment variables
export PATH=$PATH:/usr/local/go/bin
export NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_IPrV3lqL0
export NEXT_PUBLIC_COGNITO_CLIENT_ID=1cf34bqt0pnhmdq0rl068v5d9t
export NEXT_PUBLIC_AWS_REGION=us-east-1
export NODE_ENV=production

# Build and start frontend
echo "🏗️ Building frontend..."
cd frontend
npm install
npm run build
pm2 start npm --name "quarkfin-frontend" -- start -- -p 3001

# Build and start backend
echo "🏗️ Building backend..."
cd ../go_backend
go build -o quarkfin-backend .
pm2 start ./quarkfin-backend --name "quarkfin-backend"

# Check services
echo "✅ Services started!"
pm2 status

# Test locally
echo "🧪 Testing services..."
sleep 5
curl -s localhost:3001 | head -n 5
curl -s localhost:8081/health || curl -s localhost:8080/health

echo "🎉 Deployment complete!"
