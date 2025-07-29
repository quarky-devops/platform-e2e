#!/bin/bash

# QuarkfinAI Live Platform Testing Script

echo "🔍 Testing QuarkfinAI Live Platform"
echo "=================================="

# Your live URLs
FRONTEND_URL="https://d1o1sajvcnqzmr.cloudfront.net"
API_URL="https://d1o1sajvcnqzmr.cloudfront.net/api"
ALB_URL="http://quarkfin-production-alb-1406753168.us-east-1.elb.amazonaws.com"

echo ""
echo "🌐 Testing Frontend..."
if curl -s -I "$FRONTEND_URL" | grep -q "200 OK"; then
    echo "✅ Frontend is responding!"
else
    echo "❌ Frontend not responding"
fi

echo ""
echo "🔌 Testing API..."
if curl -s -I "$API_URL" | grep -q "200\|404"; then
    echo "✅ API endpoint is reachable!"
else
    echo "❌ API not reachable"
fi

echo ""
echo "⚖️ Testing Load Balancer..."
if curl -s -I "$ALB_URL" | grep -q "200\|404"; then
    echo "✅ Load Balancer is responding!"
else
    echo "❌ Load Balancer not responding"
fi

echo ""
echo "🏗️ Checking AWS Infrastructure..."
echo "VPC Stack:"
aws cloudformation describe-stacks --stack-name QuarkfinVpcStack --query 'Stacks[0].StackStatus' --output text 2>/dev/null || echo "Not found"

echo "Database Stack:"
aws cloudformation describe-stacks --stack-name QuarkfinDatabaseStack --query 'Stacks[0].StackStatus' --output text 2>/dev/null || echo "Not found"

echo "App Stack:"
aws cloudformation describe-stacks --stack-name QuarkfinAppStack --query 'Stacks[0].StackStatus' --output text 2>/dev/null || echo "Not found"

echo "CDN Stack:"
aws cloudformation describe-stacks --stack-name QuarkfinCdnStack --query 'Stacks[0].StackStatus' --output text 2>/dev/null || echo "Not found"

echo ""
echo "🔐 Getting Database Info..."
DB_ENDPOINT=$(aws cloudformation describe-stacks --stack-name QuarkfinDatabaseStack --query 'Stacks[0].Outputs[?OutputKey==`DatabaseEndpoint`].OutputValue' --output text 2>/dev/null)
echo "Database Endpoint: $DB_ENDPOINT"

echo ""
echo "🎯 Getting Cognito Info..."
USER_POOL_ID=$(aws cloudformation describe-stacks --stack-name QuarkfinAuthStack --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' --output text 2>/dev/null)
echo "Cognito User Pool: $USER_POOL_ID"

echo ""
echo "📊 TESTING COMPLETE!"
echo "==================="
echo ""
echo "🌐 Your Live Platform:"
echo "   Frontend: $FRONTEND_URL"
echo "   API: $API_URL"
echo "   Database: $DB_ENDPOINT"
echo "   Auth: $USER_POOL_ID"
echo ""
echo "🎯 Next Steps:"
echo "1. Point app.quarkfin.ai CNAME to: d1o1sajvcnqzmr.cloudfront.net"  
echo "2. Test user registration and login"
echo "3. Test risk assessment functionality"
echo "4. Set up monitoring and alerts"
echo ""
echo "🚀 Your platform is ready for customers!"
