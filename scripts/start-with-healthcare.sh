#!/bin/bash

# Start with healthcare setup
# This script combines database setup, healthcare data, and Expo start
# Updated with runtime fixes and pre-flight checks

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

# Kill any existing processes on required ports
echo "🧹 Cleaning up existing processes..."
lsof -ti:8081 | xargs kill -9 2>/dev/null || true
lsof -ti:3002 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

# Start local database
echo "🗄️  Starting local PostgreSQL..."
docker-compose -f docker-compose.local.yml up -d postgres-local redis-local

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 5

# Check if database is already set up
echo "🔍 Checking database setup..."
DB_CHECK=$(APP_ENV=local DATABASE_URL="postgresql://myexpo:myexpo123@localhost:5432/myexpo_dev" bun -e "
  import { sql } from '@/src/db';
  try {
    const result = await sql\`SELECT COUNT(*) as count FROM organizations\`;
    console.log(result[0].count);
  } catch (e) {
    console.log('0');
  }
" 2>/dev/null || echo "0")

if [ "$DB_CHECK" = "0" ]; then
  echo "⚠️  Database not initialized. Please run: bun run db:setup:local"
  echo "   This will set up the database schema and demo data."
  exit 1
else
  echo "✅ Database already set up with $DB_CHECK organizations"
fi

echo "✅ Healthcare setup complete!"
echo ""
echo "📱 Demo Credentials:"
echo "   Operator: johncena@gmail.com (any password)"
echo "   Nurse: doremon@gmail.com (any password)"
echo "   Doctor: johndoe@gmail.com (any password)"
echo "   Head Doctor: saipramod273@gmail.com (any password)"
echo ""

# Determine environment mode
ENV_MODE=${APP_ENV:-"local"}

if [ "$ENV_MODE" = "development" ]; then
    echo "☁️  Using Neon cloud database..."
    export DATABASE_URL=$NEON_DATABASE_URL
else
    echo "💻 Using local database..."
    export APP_ENV=local
    export DATABASE_URL="postgresql://myexpo:myexpo123@localhost:5432/myexpo_dev"
fi

# Set OAuth-friendly URLs
export EXPO_PUBLIC_API_URL="http://localhost:8081"
export EXPO_PUBLIC_AUTH_URL="http://localhost:8081"
export AUTH_URL="http://localhost:8081"
export BETTER_AUTH_URL="http://localhost:8081"

# Start email server in background if configured
if [ -f ".env.email" ] || [ -n "$EMAIL_HOST" ]; then
    echo "📧 Starting email notification server in background..."
    bun scripts/start-email-server.ts > logs/email-server.log 2>&1 &
    EMAIL_PID=$!
    echo "   Email server PID: $EMAIL_PID"
    echo "   Logs: logs/email-server.log"
    
    # Create logs directory if it doesn't exist
    mkdir -p logs
    
    # Wait a moment for email server to start
    sleep 2
else
    echo "⚠️  Email server not configured (no .env.email file)"
    echo "   To enable email notifications, create .env.email with SMTP settings"
fi

# Start WebSocket server in background
echo "🔌 Starting WebSocket server in background..."
bun scripts/start-websocket-standalone.ts > logs/websocket-server.log 2>&1 &
WS_PID=$!
echo "   WebSocket server PID: $WS_PID"
echo "   Logs: logs/websocket-server.log"

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
if [ -n "$EMAIL_PID" ]; then
    check_service_health "Email Server" 3001
fi
check_service_health "WebSocket Server" 3002

echo ""
echo "🏥 All services are running!"
echo "   - PostgreSQL: localhost:5432"
echo "   - Redis: localhost:6379"
if [ -n "$EMAIL_PID" ]; then
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