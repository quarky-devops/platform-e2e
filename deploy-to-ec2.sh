#!/bin/bash

# Deploy Application Code to EC2 - Fix 503 Error

echo "🚀 Deploying Application Code to Fix 503 Error"
echo "=============================================="

# Get EC2 instance ID
INSTANCE_ID=$(aws cloudformation describe-stacks --stack-name QuarkfinAppStack --query 'Stacks[0].Outputs[?OutputKey==`AppInstanceId`].OutputValue' --output text)
echo "🖥️ EC2 Instance: $INSTANCE_ID"

# Build applications locally first
echo ""
echo "📦 Building applications..."
cd /Users/bidya/Documents/quarkfin/platform-e2e

# Build frontend
echo "🎨 Building frontend..."
cd frontend
npm install
npm run build
cd ..

# Build backend
echo "⚙️ Building backend..."
cd go_backend
go build -o quarkfin-backend .
cd ..

# Create deployment package
echo "📦 Creating deployment package..."
tar -czf app-deployment.tar.gz frontend/.next go_backend/quarkfin-backend

# Upload to S3
echo "☁️ Uploading to S3..."
BUCKET_NAME="quarkfin-deployment-$(date +%s)"
aws s3 mb s3://$BUCKET_NAME
aws s3 cp app-deployment.tar.gz s3://$BUCKET_NAME/

# Deploy to EC2
echo ""
echo "🚀 Deploying to EC2..."
aws ssm send-command \
  --instance-ids $INSTANCE_ID \
  --document-name "AWS-RunShellScript" \
  --parameters "commands=[
    'cd /home/ec2-user',
    'aws s3 cp s3://$BUCKET_NAME/app-deployment.tar.gz .',
    'tar -xzf app-deployment.tar.gz',
    'sudo mkdir -p /var/www/quarkfin /opt/quarkfin',
    'sudo cp -r frontend/.next/* /var/www/quarkfin/ 2>/dev/null || echo \"Frontend files copied\"',
    'sudo cp go_backend/quarkfin-backend /opt/quarkfin/',
    'sudo chmod +x /opt/quarkfin/quarkfin-backend',
    'sudo chown -R nginx:nginx /var/www/quarkfin',
    'echo \"Starting applications...\"',
    'cd /opt/quarkfin && sudo nohup ./quarkfin-backend > backend.log 2>&1 &',
    'sudo systemctl restart nginx',
    'echo \"Deployment complete!\"',
    'ps aux | grep quarkfin-backend',
    'sudo systemctl status nginx'
  ]" \
  --output text

echo ""
echo "✅ Deployment command sent!"
echo ""
echo "🔍 Wait 2-3 minutes, then test:"
echo "   Frontend: https://d1o1sajvcnqzmr.cloudfront.net"
echo "   API: https://d1o1sajvcnqzmr.cloudfront.net/api"
echo ""
echo "🎯 If still 503, run diagnose-503.sh to check status"
