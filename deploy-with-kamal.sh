#!/bin/bash

# Healthcare Alert System - Kamal Deployment
# Simple deployment script for local or remote servers

set -e

echo "🚀 Healthcare Alert System - Kamal Deployment"
echo "============================================="

# Add Ruby gems to PATH
export PATH=$PATH:/usr/local/lib/ruby/gems/3.3.0/bin

# Check if local or remote deployment
if [ "$1" == "local" ]; then
    echo "📍 Deploying locally to Docker..."
    
    # Set local values
    export DEPLOY_SERVER_IP=localhost
    export DEPLOY_DOMAIN=localhost
    export DEPLOY_EMAIL=admin@localhost
    
    # Create minimal local env if not exists
    if [ ! -f .env.production ]; then
        cp .env.example .env.production
        echo "✅ Created .env.production from template"
    fi
else
    echo "🌐 Deploying to remote server..."
    
    # Check for production env
    if [ ! -f .env.production ]; then
        echo "❌ .env.production not found"
        echo "   Please create it with your production values"
        exit 1
    fi
fi

# Load environment
export $(cat .env.production | grep -v '^#' | xargs)

# Verify required variables
if [ -z "$DOCKER_REGISTRY_USERNAME" ]; then
    read -p "Enter Docker Hub username: " DOCKER_REGISTRY_USERNAME
    export DOCKER_REGISTRY_USERNAME
fi

if [ -z "$DOCKER_REGISTRY_PASSWORD" ]; then
    read -s -p "Enter Docker Hub password: " DOCKER_REGISTRY_PASSWORD
    echo
    export DOCKER_REGISTRY_PASSWORD
fi

# Deploy with Kamal
echo ""
echo "🚀 Starting deployment..."
kamal deploy

# Post-deployment
echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "  1. Run migrations: kamal app exec 'bun run db:push'"
echo "  2. Create admin: kamal app exec 'bun scripts/users/manage-users.ts create admin@$DEPLOY_DOMAIN'"
echo "  3. View logs: kamal app logs -f"
echo ""

if [ "$1" == "local" ]; then
    echo "🌐 Access at: http://localhost:3000"
else
    echo "🌐 Access at: https://$DEPLOY_DOMAIN"
fi