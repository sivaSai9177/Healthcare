#!/bin/bash

# Start Docker Local Development Environment
# This script starts all necessary services for local development using Docker

set -e

echo "🚀 Starting Docker Local Development Environment"
echo "=============================================="

# Load environment variables
if [ -f .env.local ]; then
    set -o allexport
    source .env.local
    set +o allexport
    echo "✅ Environment variables loaded"
fi

# Get local IP for mobile device access
export LOCAL_IP=$(ipconfig getifaddr en0 || echo "localhost")
echo "📱 Local IP: $LOCAL_IP"

# Clean up any existing containers
echo ""
echo "🧹 Cleaning up existing containers..."
docker-compose -f docker-compose.local.yml down --remove-orphans

# Start core services
echo ""
echo "🐳 Starting core services..."
docker-compose -f docker-compose.local.yml up -d postgres-local redis-local

# Wait for database to be ready
echo ""
echo "⏳ Waiting for database to be ready..."
until docker exec myexpo-postgres-local pg_isready -U ${POSTGRES_USER:-myexpo} -d ${POSTGRES_DB:-myexpo_dev} > /dev/null 2>&1; do
    echo -n "."
    sleep 1
done
echo " ✅"

# Run migrations
echo ""
echo "📊 Running database migrations..."
docker-compose -f docker-compose.local.yml run --rm expo-local bun run db:push || {
    echo "⚠️  Migration failed, but continuing..."
}

# Start all services
echo ""
echo "🚀 Starting all services..."
docker-compose -f docker-compose.local.yml up -d expo-local websocket-local logging-local drizzle-studio-local

# Show logs
echo ""
echo "📋 Service Status:"
docker-compose -f docker-compose.local.yml ps

echo ""
echo "=============================================="
echo "✅ Docker Local Environment Started!"
echo ""
echo "🌐 Access Points:"
echo "   - Expo Dev Server: http://localhost:8081"
echo "   - Expo Web: http://localhost:19000"
echo "   - WebSocket: ws://localhost:3002"
echo "   - Database: localhost:5432"
echo "   - Redis: localhost:6379"
echo "   - Logging: http://localhost:3003"
echo "   - Drizzle Studio: http://localhost:4983"
echo ""
echo "📱 For mobile access, use: http://$LOCAL_IP:8081"
echo ""
echo "📝 Useful commands:"
echo "   - View logs: docker-compose -f docker-compose.local.yml logs -f expo-local"
echo "   - Stop all: docker-compose -f docker-compose.local.yml down"
echo "   - Restart expo: docker-compose -f docker-compose.local.yml restart expo-local"
echo ""
echo "🎯 Press Ctrl+C to stop following logs..."
echo ""

# Follow Expo logs
docker-compose -f docker-compose.local.yml logs -f expo-local