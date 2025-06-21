#!/bin/bash
# Start Expo without requiring Docker services

echo "🚀 Starting Expo (Docker-optional mode)"
echo ""

# Clean up ports
echo "🧹 Cleaning up ports..."
lsof -ti:8081 | xargs kill -9 2>/dev/null || true

# Load environment
if [ -f .env.local ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
fi

# Check Docker (but don't fail if not available)
if docker info > /dev/null 2>&1; then
    echo "✅ Docker is available"
    
    # Try to check if PostgreSQL is running
    if docker ps | grep -q "myexpo-postgres-local"; then
        echo "✅ PostgreSQL container is running"
    else
        echo "⚠️  PostgreSQL container not found"
        echo "   You may need to start it manually or use an external database"
    fi
else
    echo "⚠️  Docker not available - some features will be limited"
fi

echo ""
echo "📱 Starting Expo..."
echo "Press 'w' to open in web browser"
echo ""

# Start with bun
bun run start:web 2>/dev/null || bunx expo start --web