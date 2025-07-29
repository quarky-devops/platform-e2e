#!/bin/bash

echo "🔧 Building and testing QuarkfinAI Platform Backend..."

# Navigate to backend directory
cd "$(dirname "$0")"

# Test compilation
echo "📦 Testing compilation..."
go build cmd/server/main.go

if [ $? -eq 0 ]; then
    echo "✅ Compilation successful!"
    
    echo "🚀 Starting server in test mode..."
    echo "💡 Press Ctrl+C to stop the server"
    echo "🌐 Server will be available at: http://localhost:8080"
    echo "❤️ Health check: http://localhost:8080/health"
    echo ""
    
    # Run the server
    go run cmd/server/main.go
else
    echo "❌ Compilation failed!"
    exit 1
fi
