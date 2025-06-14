#!/bin/bash

# Unified start script for all environments
# Usage: ./start-unified.sh [mode]
# Modes: network (default), local, tunnel, oauth, healthcare
# Updated with runtime fixes and pre-flight checks

MODE=${1:-"network"}

# Check if user wants healthcare mode
if [[ "$1" == "healthcare" ]] || [[ "$2" == "healthcare" ]]; then
    echo "🏥 Starting Healthcare Demo..."
    ./scripts/start-with-healthcare.sh
    exit 0
fi

echo "🚀 Starting in $MODE mode..."
echo "📋 Running pre-flight checks..."

# Ensure we're in the project root
cd "$(dirname "$0")/.."

# Pre-flight checks
check_dependencies() {
    local missing_deps=()
    
    command -v bun >/dev/null 2>&1 || missing_deps+=("bun")
    command -v docker >/dev/null 2>&1 || missing_deps+=("docker")
    command -v expo >/dev/null 2>&1 || missing_deps+=("expo-cli")
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        echo "❌ Missing required dependencies: ${missing_deps[*]}"
        exit 1
    fi
    
    # Check if @expo/server is installed
    if ! [ -d "node_modules/@expo/server" ]; then
        echo "📦 Installing @expo/server..."
        bun add @expo/server
    fi
    
    echo "✅ All dependencies checked"
}

# Kill existing processes on required ports
cleanup_ports() {
    echo "🧹 Cleaning up existing processes..."
    lsof -ti:8081 | xargs kill -9 2>/dev/null || true
    lsof -ti:3002 | xargs kill -9 2>/dev/null || true
    lsof -ti:3001 | xargs kill -9 2>/dev/null || true
}

# Run checks
check_dependencies
cleanup_ports

# Source environment variables
if [ -f .env.local ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
fi

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo "❌ Docker is not running. Please start Docker Desktop first."
        exit 1
    fi
}

# Function to get local IP
get_local_ip() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1
    else
        # Linux
        hostname -I | awk '{print $1}'
    fi
}

# Function to check service health
check_service_health() {
    local service_name=$1
    local port=$2
    local max_attempts=10
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if nc -z localhost $port 2>/dev/null; then
            echo "✅ $service_name is running on port $port"
            return 0
        fi
        attempt=$((attempt + 1))
        sleep 1
    done
    
    echo "⚠️  $service_name failed to start on port $port"
    return 1
}

# Function to start local database
start_local_db() {
    echo "🗄️  Starting local PostgreSQL..."
    docker-compose -f docker-compose.local.yml up -d postgres-local redis-local
    
    # Wait for database to be ready
    echo "⏳ Waiting for database to be ready..."
    sleep 3
    
    echo "⚡ Skipping database migration checks for faster startup"
    echo "   Use FORCE_DB_SETUP=true to force setup if needed"
}

# Function to setup healthcare if requested
setup_healthcare() {
    echo "🏥 Setting up healthcare demo data..."
    APP_ENV=local bun scripts/setup-healthcare-local.ts
}

# Set environment based on mode
case $MODE in
    "network")
        echo "📱 Network mode - Mobile devices can connect via IP"
        check_docker
        start_local_db
        
        LOCAL_IP=$(get_local_ip)
        echo "📍 Local IP: $LOCAL_IP"
        
        # Export environment variables
        export APP_ENV=local
        export DATABASE_URL="postgresql://myexpo:myexpo123@localhost:5432/myexpo_dev"
        export EXPO_PUBLIC_API_URL="http://$LOCAL_IP:8081"
        export EXPO_PUBLIC_AUTH_URL="http://localhost:8081"
        export AUTH_URL="http://localhost:8081"
        export BETTER_AUTH_URL="http://localhost:8081"
        
        # Start Expo
        EXPO_GO=1 expo start --host lan --go
        ;;
        
    "healthcare-network"|"network-healthcare")
        echo "🏥 Healthcare Network mode - Mobile devices can connect with healthcare demo"
        check_docker
        start_local_db
        setup_healthcare
        
        LOCAL_IP=$(get_local_ip)
        echo "📍 Local IP: $LOCAL_IP"
        
        # Export environment variables
        export APP_ENV=local
        export DATABASE_URL="postgresql://myexpo:myexpo123@localhost:5432/myexpo_dev"
        export EXPO_PUBLIC_API_URL="http://$LOCAL_IP:8081"
        export EXPO_PUBLIC_AUTH_URL="http://localhost:8081"
        export AUTH_URL="http://localhost:8081"
        export BETTER_AUTH_URL="http://localhost:8081"
        
        # Start email and WebSocket servers
        mkdir -p logs
        if [ -f ".env.email" ] || [ -n "$EMAIL_HOST" ]; then
            echo "📧 Starting email notification server..."
            bun scripts/start-email-server.ts > logs/email-server.log 2>&1 &
            EMAIL_PID=$!
        fi
        
        echo "🔌 Starting WebSocket server..."
        bun scripts/start-websocket-standalone.ts > logs/websocket-server.log 2>&1 &
        WS_PID=$!
        
        # Cleanup function
        cleanup() {
            echo -e "\n🛑 Shutting down services..."
            [ -n "$EMAIL_PID" ] && kill $EMAIL_PID 2>/dev/null
            [ -n "$WS_PID" ] && kill $WS_PID 2>/dev/null
            lsof -ti:3001 | xargs kill -9 2>/dev/null || true
            lsof -ti:3002 | xargs kill -9 2>/dev/null || true
            exit 0
        }
        trap cleanup EXIT INT TERM
        
        # Verify services
        sleep 2
        echo ""
        echo "🔍 Verifying services..."
        check_service_health "PostgreSQL" 5432
        check_service_health "Redis" 6379
        [ -n "$EMAIL_PID" ] && check_service_health "Email Server" 3001
        [ -n "$WS_PID" ] && check_service_health "WebSocket Server" 3002
        
        echo ""
        echo "✅ Healthcare Network mode ready!"
        echo ""
        echo "🌐 Access Points:"
        echo "   - Web App: http://localhost:8081"
        echo "   - Mobile: http://$LOCAL_IP:8081"
        if [ -n "$EMAIL_PID" ]; then
            echo "   - Email Server: http://localhost:3001"
        fi
        echo "   - WebSocket: ws://localhost:3002"
        echo ""
        echo "🔑 Demo credentials:"
        echo "   - Operator: johncena@gmail.com (any password)"
        echo "   - Nurse: doremon@gmail.com (any password)"
        echo "   - Doctor: johndoe@gmail.com (any password)"
        echo "   - Head Doctor: saipramod273@gmail.com (any password)"
        echo ""
        
        # Start Expo
        EXPO_GO=1 expo start --host lan --go
        ;;
        
    "local")
        echo "💻 Local mode - Everything on localhost"
        check_docker
        start_local_db
        
        # Export environment variables
        export APP_ENV=local
        export DATABASE_URL="postgresql://myexpo:myexpo123@localhost:5432/myexpo_dev"
        export EXPO_PUBLIC_API_URL="http://localhost:8081"
        export EXPO_PUBLIC_AUTH_URL="http://localhost:8081"
        export AUTH_URL="http://localhost:8081"
        export BETTER_AUTH_URL="http://localhost:8081"
        
        # Start Expo
        EXPO_GO=1 expo start --host localhost --go
        ;;
        
    "tunnel")
        echo "🌐 Tunnel mode - Remote access via Expo tunnel"
        
        # Export environment variables for cloud database
        export APP_ENV=development
        export DATABASE_URL=$NEON_DATABASE_URL
        
        # Start Expo with tunnel
        EXPO_GO=1 NODE_ENV=development expo start --tunnel --go
        ;;
        
    "oauth")
        echo "🔐 OAuth mode - Optimized for OAuth testing"
        check_docker
        start_local_db
        setup_healthcare
        
        # Export environment variables
        export APP_ENV=local
        export DATABASE_URL="postgresql://myexpo:myexpo123@localhost:5432/myexpo_dev"
        export EXPO_PUBLIC_API_URL="http://localhost:8081"
        export EXPO_PUBLIC_AUTH_URL="http://localhost:8081"
        export AUTH_URL="http://localhost:8081"
        export BETTER_AUTH_URL="http://localhost:8081"
        export EXPO_PUBLIC_OAUTH_REDIRECT_PROXY_URL="http://localhost:8081/api/auth/oauth-redirect-proxy"
        
        # Start email server if configured
        if [ -f ".env.email" ] || [ -n "$EMAIL_HOST" ]; then
            echo "📧 Starting email notification server..."
            mkdir -p logs
            bun scripts/start-email-server.ts > logs/email-server.log 2>&1 &
            EMAIL_PID=$!
            sleep 2
        fi
        
        # Start WebSocket server
        echo "🔌 Starting WebSocket server..."
        bun scripts/start-websocket-standalone.ts > logs/websocket-server.log 2>&1 &
        WS_PID=$!
        
        # Cleanup function
        cleanup() {
            echo -e "\n🛑 Shutting down services..."
            [ -n "$EMAIL_PID" ] && kill $EMAIL_PID 2>/dev/null
            [ -n "$WS_PID" ] && kill $WS_PID 2>/dev/null
            
            # Cleanup orphaned processes
            lsof -ti:3001 | xargs kill -9 2>/dev/null || true
            lsof -ti:3002 | xargs kill -9 2>/dev/null || true
            
            exit 0
        }
        trap cleanup EXIT INT TERM
        
        # Verify services are running
        echo ""
        echo "🔍 Verifying services..."
        check_service_health "PostgreSQL" 5432
        check_service_health "Redis" 6379
        [ -n "$EMAIL_PID" ] && check_service_health "Email Server" 3001
        [ -n "$WS_PID" ] && check_service_health "WebSocket Server" 3002
        
        echo "✅ OAuth mode ready!"
        echo ""
        echo "🌐 Access Points:"
        echo "   - Web App: http://localhost:8081"
        echo "   - API/Auth: http://localhost:8081"
        if [ -n "$EMAIL_PID" ]; then
            echo "   - Email Server: http://localhost:3001"
        fi
        echo "   - WebSocket: ws://localhost:3002"
        echo ""
        echo "🔑 Test credentials:"
        echo "   - johncena@gmail.com (any password)"
        echo "   - Or use 'Continue with Google'"
        echo ""
        echo "📱 Platform Options:"
        echo "   Press 'w' to open in web browser"
        echo "   Press 'i' for iOS simulator"
        echo "   Press 'a' for Android emulator"
        
        # Start Expo
        EXPO_GO=1 expo start --host localhost --go
        ;;
        
    *)
        echo "❌ Unknown mode: $MODE"
        echo "Available modes:"
        echo "  - network (default) - Mobile devices can connect via IP"
        echo "  - local - Everything on localhost"
        echo "  - tunnel - Remote access via Expo tunnel"
        echo "  - oauth - Optimized for OAuth testing"
        echo "  - healthcare - Full healthcare demo (redirects to healthcare script)"
        echo "  - healthcare-network - Healthcare with network access for mobile"
        echo ""
        echo "Usage: ./start-unified.sh [mode]"
        echo "Example: ./start-unified.sh healthcare-network"
        exit 1
        ;;
esac