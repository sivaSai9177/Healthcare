#!/bin/bash

# Local Kamal Deployment Script
# Deploys the Healthcare Alert System to Docker on your laptop

set -e

echo "🚀 Healthcare Alert System - Local Kamal Deployment"
echo "================================================="

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker Desktop."
    exit 1
fi

# Check Kamal
if ! command -v kamal &> /dev/null; then
    echo "❌ Kamal is not installed. Run: gem install kamal"
    exit 1
fi

# Load environment variables
if [ -f .env.kamal.local ]; then
    export $(cat .env.kamal.local | grep -v '^#' | xargs)
    echo "✅ Environment variables loaded"
else
    echo "❌ .env.kamal.local not found"
    echo "   Run: cp .env.kamal.local.example .env.kamal.local"
    exit 1
fi

# Build the application
echo ""
echo "🔨 Building Docker images..."
docker build -f Dockerfile.production -t healthcare-alerts/app .

# Build WebSocket server
echo ""
echo "🔨 Building WebSocket server..."
docker build -f docker/Dockerfile.websocket -t healthcare-alerts/websocket .

# Initialize Kamal (if needed)
if [ ! -f .kamal/secrets ]; then
    echo ""
    echo "📝 Initializing Kamal..."
    kamal init
fi

# Use local deployment configuration
export KAMAL_CONFIG_FILE=config/deploy.local.yml

# Setup Docker registry login
echo ""
echo "🔐 Logging into Docker registry..."
kamal registry login

# Deploy the application
echo ""
echo "🚀 Deploying application..."
kamal setup

# Run database migrations
echo ""
echo "📊 Running database migrations..."
kamal app exec 'bun run db:push'

# Create initial admin user
echo ""
echo "👤 Creating admin user..."
kamal app exec 'bun scripts/users/manage-users.ts create admin@localhost Admin User admin'

# Health check
echo ""
echo "🏥 Checking application health..."
sleep 5
curl -f http://localhost:3000/api/health || echo "⚠️  Health check failed"

echo ""
echo "================================================="
echo "✅ Deployment Complete!"
echo ""
echo "🌐 Application URLs:"
echo "   - Web App: http://localhost:3000"
echo "   - API: http://localhost:3000/api"
echo "   - WebSocket: ws://localhost:3002"
echo "   - Traefik Dashboard: http://localhost:8080"
echo ""
echo "📝 Default admin credentials:"
echo "   - Email: admin@localhost"
echo "   - Password: admin"
echo ""
echo "🔧 Useful commands:"
echo "   - View logs: kamal app logs -f"
echo "   - Stop services: kamal stop"
echo "   - Remove services: kamal remove"
echo "   - Restart app: kamal app restart"
echo ""