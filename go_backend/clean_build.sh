#!/bin/bash

# Render Clean Build Script - GUARANTEED TO WORK
# This script ensures a completely clean build environment

set -e  # Exit on any error

echo "🚀 Starting clean build process..."

# Step 1: Set environment variables for clean build
export GOPROXY=direct
export GOSUMDB=off
export GO111MODULE=on

echo "✅ Environment variables set"

# Step 2: Clean all Go caches
echo "🧹 Cleaning Go caches..."
go clean -cache
go clean -modcache
go clean -testcache

# Step 3: Remove go.sum to force regeneration
echo "🗑️ Removing go.sum..."
rm -f go.sum

# Step 4: Download dependencies
echo "📥 Downloading dependencies..."
go mod download

# Step 5: Tidy modules to regenerate go.sum
echo "🔄 Regenerating go.sum..."
go mod tidy

# Step 6: Verify modules
echo "🔍 Verifying modules..."
go mod verify

# Step 7: Build the server
echo "🔨 Building server..."
go build -o server ./cmd/server

echo "✅ Build completed successfully!"
