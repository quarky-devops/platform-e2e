#!/bin/bash
# Set QuarkfinAI Production Environment Variables
# Run this script to set the required AWS Cognito values

echo "🔐 QuarkfinAI Environment Variable Setup"
echo "========================================"
echo ""

echo "This script will help you set the required AWS Cognito environment variables."
echo "You need these values from your CDK deployment outputs."
echo ""

# Function to update .env file
update_env_var() {
    local var_name=$1
    local var_value=$2
    local env_file="frontend/.env"
    
    if grep -q "^${var_name}=" "$env_file"; then
        # Update existing variable
        sed -i.bak "s/^${var_name}=.*/${var_name}=${var_value}/" "$env_file"
    else
        # Add new variable
        echo "${var_name}=${var_value}" >> "$env_file"
    fi
}

# Get User Pool ID
read -p "📝 Enter your AWS Cognito User Pool ID (e.g., us-east-1_xxxxxxxxx): " USER_POOL_ID
if [ -z "$USER_POOL_ID" ]; then
    echo "❌ User Pool ID is required!"
    exit 1
fi

# Get Client ID
read -p "📝 Enter your AWS Cognito Client ID (e.g., xxxxxxxxxxxxxxxxxxxxxxxxxx): " CLIENT_ID
if [ -z "$CLIENT_ID" ]; then
    echo "❌ Client ID is required!"
    exit 1
fi

# Get AWS Region (optional, defaults to us-east-1)
read -p "📝 Enter your AWS Region [us-east-1]: " AWS_REGION
AWS_REGION=${AWS_REGION:-us-east-1}

echo ""
echo "🔄 Updating environment variables..."

# Update .env file
update_env_var "NEXT_PUBLIC_COGNITO_USER_POOL_ID" "$USER_POOL_ID"
update_env_var "NEXT_PUBLIC_COGNITO_CLIENT_ID" "$CLIENT_ID"
update_env_var "NEXT_PUBLIC_AWS_REGION" "$AWS_REGION"

echo "✅ Environment variables updated successfully!"
echo ""
echo "📄 Updated frontend/.env with:"
echo "   • NEXT_PUBLIC_COGNITO_USER_POOL_ID=$USER_POOL_ID"
echo "   • NEXT_PUBLIC_COGNITO_CLIENT_ID=$CLIENT_ID"  
echo "   • NEXT_PUBLIC_AWS_REGION=$AWS_REGION"
echo ""
echo "🚀 You can now run: ./deploy-production.sh"
