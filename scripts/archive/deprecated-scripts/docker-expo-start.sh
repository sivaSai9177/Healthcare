#!/bin/bash
# Start Expo in Docker container with proper configuration

echo "🚀 Starting Expo in Docker container..."

# Ensure node_modules are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    bun install
fi

# Export necessary environment variables
export EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
export EXPO_PACKAGER_HOSTNAME=0.0.0.0
export REACT_NATIVE_PACKAGER_HOSTNAME=0.0.0.0

# Clear Metro cache
echo "🧹 Clearing Metro cache..."
rm -rf /tmp/metro-*

# Start Expo
echo "🎯 Starting Expo server..."
bun run dev