#!/bin/bash

# Render Deployment Script for QuarkFin Platform Backend
# This script prepares the Go backend for deployment on Render

echo "🚀 Starting Render deployment preparation for QuarkFin Platform Backend..."

# Navigate to the backend directory
cd "$(dirname "$0")"

# Clean any existing builds
echo "🧹 Cleaning previous builds..."
rm -f server

# Verify go.mod and go.sum are in sync
echo "🔍 Verifying Go modules..."
go mod verify
if [ $? -ne 0 ]; then
    echo "❌ Go module verification failed!"
    exit 1
fi

# Tidy up dependencies
echo "📦 Tidying up dependencies..."
go mod tidy

# Test the build locally
echo "🔨 Testing build locally..."
go build -o server ./cmd/server
if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build successful!"

# Test that the server can start (quick test)
echo "🧪 Testing server startup..."
timeout 5s ./server &
SERVER_PID=$!
sleep 2

# Check if server is running
if kill -0 $SERVER_PID 2>/dev/null; then
    echo "✅ Server starts successfully!"
    kill $SERVER_PID
else
    echo "❌ Server failed to start!"
    exit 1
fi

# Clean up test build
rm -f server

echo "🎉 Render deployment preparation complete!"
echo ""
echo "Next steps:"
echo "1. Commit and push your changes to Bitbucket"
echo "2. In Render dashboard, trigger a manual deployment"
echo "3. Set environment variables in Render:"
echo "   - SUPABASE_URL"
echo "   - SUPABASE_SERVICE_KEY"
echo "   - PORT (should be 8080)"
echo "   - GIN_MODE (should be 'release')"
echo ""
echo "Build Command: go build -o server ./cmd/server"
echo "Start Command: ./server"
