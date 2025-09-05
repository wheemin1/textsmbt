#!/bin/bash

echo "🚀 Starting SemantleKo build process..."

# Print Node.js and npm versions
echo "Node.js version: $(node --version)"
echo "NPM version: $(npm --version)"

# Use client-only package.json for build
echo "📦 Installing client dependencies only..."
cp package-client.json package.json

# Install with exact versions - ensure vite is installed
echo "Installing dependencies..."
npm install --legacy-peer-deps

# Verify Vite installation
echo "📋 Checking Vite installation..."
if [ ! -f "./node_modules/.bin/vite" ]; then
    echo "Vite not found in node_modules, installing globally..."
    npm install -g vite@5.4.19
    VITE_CMD="vite"
else
    echo "Vite found in node_modules"
    VITE_CMD="./node_modules/.bin/vite"
fi

# Build the client
echo "🔨 Building client application..."
$VITE_CMD build

# Verify build output
echo "✅ Verifying build output..."
if [ -d "client/dist" ]; then
    ls -la client/dist/
    echo "🎉 Build completed successfully!"
else
    echo "❌ Build failed - client/dist directory not found"
    exit 1
fi
