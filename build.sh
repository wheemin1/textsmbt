#!/bin/bash

echo "🚀 Starting SemantleKo build process..."

# Print Node.js and npm versions
echo "Node.js version: $(node --version)"
echo "NPM version: $(npm --version)"

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --legacy-peer-deps || npm install --legacy-peer-deps

# Build the client
echo "🔨 Building client application..."
npm run build:client

# Verify build output
echo "✅ Verifying build output..."
ls -la client/dist/

echo "🎉 Build completed successfully!"
