#!/bin/bash

echo "🚀 QuarkfinAI EC2 Deployment"
echo "==========================="

INSTANCE_ID="i-0e123a3106f19af14"

# Create the deployment script that will run on EC2
cat > ec2-setup.sh << 'EOF'
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
EOF

echo "📤 Sending deployment script to EC2..."

# Send the script to EC2 via SSM
aws ssm send-command \
  --instance-ids $INSTANCE_ID \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=[
    "sudo -u ec2-user bash -c \"$(cat << '\'END\''",
    "#!/bin/bash",
    "echo \"🔧 Setting up QuarkfinAI on EC2...\"",
    "cd /opt/quarkfin",
    "git clone https://bitbucket.org/quarkfin/platform-e2e.git . || git pull",
    "export PATH=$PATH:/usr/local/go/bin",
    "export NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_IPrV3lqL0",
    "export NEXT_PUBLIC_COGNITO_CLIENT_ID=1cf34bqt0pnhmdq0rl068v5d9t",
    "export NEXT_PUBLIC_AWS_REGION=us-east-1",
    "export NODE_ENV=production",
    "echo \"🏗️ Building frontend...\"",
    "cd frontend && npm install && npm run build",
    "pm2 start npm --name quarkfin-frontend -- start -- -p 3001 || pm2 restart quarkfin-frontend",
    "echo \"🏗️ Building backend...\"",
    "cd ../go_backend && go build -o quarkfin-backend .",
    "pm2 start ./quarkfin-backend --name quarkfin-backend || pm2 restart quarkfin-backend",
    "pm2 status",
    "sleep 5",
    "curl -s localhost:3001/health || echo \"Frontend not ready yet\"",
    "curl -s localhost:8081/health || curl -s localhost:8080/health || echo \"Backend not ready yet\"",
    "echo \"🎉 Deployment complete!\"",
    "'END'\")"]' \
  --output text \
  --query 'Command.CommandId'

echo ""
echo "📋 Next Steps:"
echo "1. Wait 2-3 minutes for deployment to complete"
echo "2. Test the load balancer: curl http://quarkfin-production-alb-1406753168.us-east-1.elb.amazonaws.com/api/health"
echo "3. Test CloudFront: https://d1o1sajvcnqzmr.cloudfront.net"
echo ""
echo "To check deployment status:"
echo "aws logs tail /var/log/messages --follow --instance-id $INSTANCE_ID"
