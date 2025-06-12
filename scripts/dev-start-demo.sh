#!/bin/bash

# Start the app with healthcare setup based on environment
# This script auto-detects the environment and database configuration

echo "🏥 Hospital Alert System - Starting with Healthcare Setup"
echo "========================================================="
echo ""

# Load environment variables from unified .env file
if [ -f .env ]; then
    echo "📋 Loading environment from .env..."
    set -a
    source .env
    set +a
else
    echo "⚠️  No .env file found! Please create one based on .env.example"
    exit 1
fi

# Determine environment
if [ -n "$APP_ENV" ]; then
    ENV=$APP_ENV
elif [ -n "$EXPO_PUBLIC_ENVIRONMENT" ]; then
    ENV=$EXPO_PUBLIC_ENVIRONMENT
else
    ENV="local"
fi

echo "📍 Environment: $ENV"

# Set database URL based on environment
case $ENV in
    "local")
        export DATABASE_URL="postgresql://myexpo:myexpo123@localhost:5432/myexpo_dev"
        export APP_ENV="local"
        
        # Check if local database is running
        if ! docker ps | grep -q "myexpo-postgres-local"; then
            echo "⚠️  Local PostgreSQL is not running!"
            echo "Starting local database services..."
            docker-compose -f docker-compose.local.yml up -d postgres-local redis-local
            sleep 3
        fi
        
        echo "✅ Using local PostgreSQL"
        ;;
        
    "development"|"staging"|"production")
        if [ -z "$DATABASE_URL" ] && [ -n "$NEON_DATABASE_URL" ]; then
            export DATABASE_URL=$NEON_DATABASE_URL
        fi
        echo "☁️  Using Neon Cloud Database"
        ;;
        
    *)
        echo "❌ Unknown environment: $ENV"
        exit 1
        ;;
esac

# Display database info (hide password)
DB_DISPLAY=$(echo $DATABASE_URL | sed 's/:[^:@]*@/:****@/')
echo "🗄️  Database: $DB_DISPLAY"
echo ""

# Run healthcare setup
echo "🔧 Setting up healthcare tables and data..."
bun run scripts/setup-healthcare-local.ts

if [ $? -eq 0 ]; then
    echo "✅ Healthcare setup completed successfully!"
else
    echo "⚠️  Healthcare setup encountered issues, but continuing..."
fi

echo ""
echo "🚀 Starting services..."
echo ""

# Start WebSocket server if enabled
if [ "$EXPO_PUBLIC_ENABLE_WS" = "true" ]; then
    echo "📡 Starting WebSocket server on port ${EXPO_PUBLIC_WS_PORT:-3001}..."
    bun scripts/trpc-ws-server.ts &
    WS_PID=$!
    sleep 2  # Give WebSocket server time to start
    
    # Ensure WebSocket server shuts down when script exits
    trap "kill $WS_PID 2>/dev/null" EXIT
fi

# Ensure OAuth credentials are available
if [ -z "$GOOGLE_CLIENT_ID" ] || [ -z "$GOOGLE_CLIENT_SECRET" ]; then
    echo "⚠️  Warning: Google OAuth credentials not found!"
    echo "   OAuth sign-in will not work without proper credentials."
fi

echo ""
echo "🎯 Starting Expo..."
echo ""

# Start based on environment
if [ "$ENV" = "local" ]; then
    # Force Expo Go mode for local
    export EXPO_USE_DEV_CLIENT=false
    
    # Get LAN IP for network access
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        LAN_IP=$(ipconfig getifaddr en0 || ipconfig getifaddr en1 || echo "localhost")
    else
        # Linux
        LAN_IP=$(hostname -I | awk '{print $1}' || echo "localhost")
    fi
    
    echo "📡 LAN IP: $LAN_IP"
    
    # Ensure all OAuth-related vars are exported
    export BETTER_AUTH_BASE_URL="http://localhost:8081/api/auth"
    export BETTER_AUTH_URL="http://localhost:8081"
    export EXPO_PUBLIC_API_URL="http://$LAN_IP:8081"
    
    # For iOS simulator, always use localhost
    if [ "$LAN_IP" != "localhost" ]; then
        echo "   iOS Simulator: http://localhost:8081"
        echo "   Physical Device: http://$LAN_IP:8081"
    fi
    
    exec npx expo start --host lan --clear --go
else
    # Regular start for other environments
    exec bun run start
fi