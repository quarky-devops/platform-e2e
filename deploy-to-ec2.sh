#!/bin/bash

echo "🚀 Deploying QuarkfinAI to EC2 Instance"
echo "======================================"

INSTANCE_ID="i-0e123a3106f19af14"

# Create deployment package
echo "📦 Creating deployment package..."
tar -czf deployment.tar.gz \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='*.log' \
  --exclude='.git' \
  frontend/ go_backend/

# Copy to S3 for easy transfer
aws s3 cp deployment.tar.gz s3://quarkfin-deployment-bucket-temp/

echo "📋 Deployment commands for EC2:"
echo "================================"
echo "1. Connect to instance:"
echo "   aws ssm start-session --target $INSTANCE_ID"
echo ""
echo "2. Run these commands on the instance:"
echo "   sudo su - ec2-user"
echo "   cd /opt/quarkfin"
echo "   aws s3 cp s3://quarkfin-deployment-bucket-temp/deployment.tar.gz ."
echo "   tar -xzf deployment.tar.gz"
echo ""
echo "3. Build and start frontend:"
echo "   cd frontend"
echo "   npm install"
echo "   npm run build"
echo "   pm2 start npm --name frontend -- start -- -p 3001"
echo ""
echo "4. Build and start backend:"
echo "   cd ../go_backend"
echo "   export PATH=\$PATH:/usr/local/go/bin"
echo "   go build -o quarkfin-backend ."
echo "   pm2 start ./quarkfin-backend --name backend"
echo ""
echo "5. Check if services are running:"
echo "   pm2 status"
echo "   curl localhost:3001/health"
echo "   curl localhost:8081/health"

# Clean up
rm deployment.tar.gz

echo ""
echo "🎯 After deployment, test the load balancer again!"
