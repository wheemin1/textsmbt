#!/bin/bash

echo "🚀 Starting SemantleKo build process..."

# Print Node.js and npm versions
echo "Node.js version: $(node --version)"
echo "NPM version: $(npm --version)"

# Use client-only package.json for build
echo "📦 Installing client dependencies only..."
cp package-client.json package.json
npm ci --legacy-peer-deps

# Verify Vite installation
echo "📋 Checking Vite installation..."
npx vite --version

# Build the client
echo "🔨 Building client application..."
npx vite build

# Verify build output
echo "✅ Verifying build output..."
if [ -d "client/dist" ]; then
    ls -la client/dist/
    echo "🎉 Build completed successfully!"
else
    echo "❌ Build failed - client/dist directory not found"
    exit 1
fi
