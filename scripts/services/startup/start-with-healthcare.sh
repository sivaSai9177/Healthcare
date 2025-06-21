#!/bin/bash

# Start with healthcare setup
# This script combines database setup, healthcare data, and Expo start
# Updated with runtime fixes and pre-flight checks

# Configuration
USE_DOCKER_WEBSOCKET=${USE_DOCKER_WEBSOCKET:-true}
USE_DOCKER_EMAIL=${USE_DOCKER_EMAIL:-true}
USE_EMAIL_SERVER=${USE_EMAIL_SERVER:-true}
USE_WEBSOCKET=${USE_WEBSOCKET:-true}

echo "🏥 Starting Hospital Alert System with Healthcare Setup..."
echo "📋 Running pre-flight checks..."

# Ensure we're in the project root
cd "$(dirname "$0")/.."

# Pre-flight checks
check_dependencies() {
    local missing_deps=()
    
    # Check for required commands
    command -v bun >/dev/null 2>&1 || missing_deps+=("bun")
    command -v docker >/dev/null 2>&1 || missing_deps+=("docker")
    command -v expo >/dev/null 2>&1 || missing_deps+=("expo-cli")
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        echo "❌ Missing required dependencies: ${missing_deps[*]}"
        echo "Please install them first."
        exit 1
    fi
    
    # Check if @expo/server is installed
    if ! [ -d "node_modules/@expo/server" ]; then
        echo "📦 Installing @expo/server..."
        bun add @expo/server
    fi
    
    echo "✅ All dependencies checked"
}

# Run dependency checks
check_dependencies

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

# Function to check if container is running
check_container() {
    local container_name=$1
    if docker ps --format '{{.Names}}' | grep -q "^${container_name}$"; then
        return 0
    else
        return 1
    fi
}

# Kill any existing processes on required ports (only if needed)
echo "🧹 Checking existing processes..."
if lsof -ti:8081 >/dev/null 2>&1; then
    echo "   Cleaning up port 8081..."
    lsof -ti:8081 | xargs kill -9 2>/dev/null || true
fi

# Smart container management
echo "🗄️  Checking database containers..."

# Check PostgreSQL
if check_container "myexpo-postgres-local"; then
    echo "✅ PostgreSQL already running"
else
    echo "📦 Starting PostgreSQL..."
    docker-compose -f docker-compose.local.yml up -d postgres-local
fi

# Check Redis
if check_container "myexpo-redis-local"; then
    echo "✅ Redis already running"
else
    echo "📦 Starting Redis..."
    docker-compose -f docker-compose.local.yml up -d redis-local
fi

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 5

# Check if we should skip database setup entirely
if [ "$SKIP_DB_SETUP" = "true" ]; then
  echo "⚡ Skipping database setup (SKIP_DB_SETUP=true)"
elif [ "$FORCE_DB_SETUP" = "true" ]; then
  echo "🔄 Force running database setup..."
  
  # Run migrations
  echo "📋 Running database migrations..."
  APP_ENV=local DATABASE_URL="postgresql://myexpo:myexpo123@localhost:5432/myexpo_dev" drizzle-kit push --config=drizzle.config.ts
  
  if [ $? -ne 0 ]; then
    echo "❌ Database migration failed"
    echo "   You can try running manually: bun run db:setup:local"
    exit 1
  fi
  
  # Setup healthcare demo data
  echo "🏥 Setting up healthcare demo data..."
  APP_ENV=local DATABASE_URL="postgresql://myexpo:myexpo123@localhost:5432/myexpo_dev" bun scripts/setup-healthcare-local.ts
  
  if [ $? -ne 0 ]; then
    echo "❌ Healthcare data setup failed"
    exit 1
  fi
  
  echo "✅ Database setup completed successfully!"
else
  echo "⚡ Skipping database migration checks for faster startup"
  echo "   Use FORCE_DB_SETUP=true to force setup if needed"
fi

echo "✅ Healthcare setup complete!"
echo ""
echo "📱 Demo Credentials:"
echo "   Operator: johncena@gmail.com (any password)"
echo "   Nurse: doremon@gmail.com (any password)"
echo "   Doctor: johndoe@gmail.com (any password)"
echo "   Head Doctor: saipramod273@gmail.com (any password)"
echo ""

# Determine environment mode and database
ENV_MODE=${APP_ENV:-"local"}

case "$ENV_MODE" in
    "production")
        echo "🚀 Using production database..."
        export DATABASE_URL=${PROD_DATABASE_URL:-"postgresql://myexpo:myexpo123@localhost:5432/myexpo_prod"}
        ;;
    "test")
        echo "🧪 Using test database..."
        export DATABASE_URL=${TEST_DATABASE_URL:-"postgresql://myexpo:myexpo123@localhost:5432/myexpo_test"}
        ;;
    *)
        echo "💻 Using development database..."
        export APP_ENV=${ENV_MODE}
        export DATABASE_URL=${DEV_DATABASE_URL:-"postgresql://myexpo:myexpo123@localhost:5432/myexpo_dev"}
        ;;
esac

# Set OAuth-friendly URLs
export EXPO_PUBLIC_API_URL="http://localhost:8081"
export EXPO_PUBLIC_AUTH_URL="http://localhost:8081"
export AUTH_URL="http://localhost:8081"
export BETTER_AUTH_URL="http://localhost:8081"

# Start email server in background if configured
if [ -f ".env.email" ] || [ -n "$EMAIL_HOST" ]; then
    if [ "$USE_DOCKER_EMAIL" = "true" ] || [ -f /.dockerenv ]; then
        if check_container "myexpo-email-local"; then
            echo "✅ Email server already running (may be unhealthy due to React Native issue)"
        else
            echo "🐳 Starting email server in Docker..."
            docker-compose -f docker-compose.local.yml up -d email-local
        fi
        echo "   Email server container: myexpo-email-local"
        echo "   Logs: docker-compose -f docker-compose.local.yml logs -f email-local"
    else
        echo "📧 Starting email notification server locally..."
        bun scripts/start-email-server.ts > logs/email-server.log 2>&1 &
        EMAIL_PID=$!
        echo "   Email server PID: $EMAIL_PID"
        echo "   Logs: logs/email-server.log"
        
        # Create logs directory if it doesn't exist
        mkdir -p logs
        
        # Wait a moment for email server to start
        sleep 2
    fi
else
    echo "⚠️  Email server not configured (no .env.email file)"
    echo "   To enable email notifications, create .env.email with SMTP settings"
fi

# Start WebSocket server (Docker or local)
if [ "$USE_DOCKER_WEBSOCKET" = "true" ] || [ -f /.dockerenv ]; then
    if check_container "myexpo-websocket-local"; then
        echo "✅ WebSocket server already running (may be unhealthy due to React Native issue)"
    else
        echo "🐳 Starting WebSocket server in Docker..."
        docker-compose -f docker-compose.local.yml up -d websocket-local
    fi
    echo "   WebSocket server container: myexpo-websocket-local"
    echo "   Logs: docker-compose -f docker-compose.local.yml logs -f websocket-local"
else
    # Check if port 3002 is available
    if ./scripts/check-port.sh check 3002 >/dev/null 2>&1; then
        echo "🔌 Starting WebSocket server locally..."
    else
        echo "⚠️  Port 3002 is already in use. Attempting to free it..."
        ./scripts/check-port.sh kill 3002
        sleep 2
    fi
    
    echo "🔌 Starting WebSocket server locally..."
    # Create logs directory if it doesn't exist
    mkdir -p logs
    node scripts/start-websocket-trpc.js > logs/websocket-server.log 2>&1 &
    WS_PID=$!
    echo "   WebSocket server PID: $WS_PID"
    echo "   Logs: logs/websocket-server.log"
fi

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

# Function to cleanup background processes
cleanup() {
    echo -e "\n🛑 Shutting down services..."
    if [ -n "$EMAIL_PID" ]; then
        kill $EMAIL_PID 2>/dev/null
        echo "   Email server stopped"
    fi
    if [ -n "$WS_PID" ]; then
        kill $WS_PID 2>/dev/null
        echo "   WebSocket server stopped"
    fi
    
    # Cleanup any orphaned processes
    lsof -ti:3001 | xargs kill -9 2>/dev/null || true
    lsof -ti:3002 | xargs kill -9 2>/dev/null || true
    
    exit 0
}

# Set up trap to cleanup on exit
trap cleanup EXIT INT TERM

# Check service health
echo ""
echo "🔍 Verifying services..."
check_service_health "PostgreSQL" 5432
check_service_health "Redis" 6379
if [ "$USE_EMAIL_SERVER" = "true" ]; then
    check_service_health "Email Server" 3001
fi
check_service_health "WebSocket Server" 3002

echo ""
echo "🏥 All services are running!"
echo "   - PostgreSQL: localhost:5432"
echo "   - Redis: localhost:6379"
if [ "$USE_EMAIL_SERVER" = "true" ]; then
    echo "   - Email Server: http://localhost:3001"
fi
echo "   - WebSocket: ws://localhost:3002"
echo "   - Expo Server: http://localhost:8081"
echo "   - Web App: http://localhost:8081"
echo ""

# Start Expo (this will block and keep the script running)
echo "🚀 Starting Expo..."
echo ""
echo "📱 Platform Options:"
echo "   Press 'w' to open in web browser (http://localhost:8081)"
echo "   Press 'i' for iOS simulator"
echo "   Press 'a' for Android emulator"
echo "   Press 'q' to quit"
echo ""

# Check if we should auto-open web
if [ "$1" = "--web" ] || [ "$AUTO_OPEN_WEB" = "true" ]; then
    echo "🌐 Auto-opening web browser in 5 seconds..."
    (sleep 5 && open http://localhost:8081) &
fi

# Start Expo with web support
EXPO_GO=1 expo start --host lan --go