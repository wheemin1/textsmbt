#!/bin/bash

echo "🚀 Starting SemantleKo build process..."

# Print Node.js and npm versions
echo "Node.js version: $(node --version)"
echo "NPM version: $(npm --version)"

# Use client-only package.json for build
echo "📦 Installing client dependencies only..."
cp package-client.json package.json

# Install with exact versions to avoid version conflicts
npm install --legacy-peer-deps --no-optional

# Build the client with explicit vite
echo "🔨 Building client application..."
./node_modules/.bin/vite build

# Verify build output
echo "✅ Verifying build output..."
if [ -d "client/dist" ]; then
    ls -la client/dist/
    echo "🎉 Build completed successfully!"
else
    echo "❌ Build failed - client/dist directory not found"
    exit 1
fi
