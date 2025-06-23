#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Native Expo with Docker Services${NC}"
echo -e "${BLUE}=========================================${NC}"

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}⏹  Shutting down services...${NC}"
    docker-compose -f docker-compose.local.yml stop postgres-local redis-local logging-local
    docker stop myexpo-websocket-local 2>/dev/null || true
    exit 0
}

# Trap Ctrl+C and cleanup
trap cleanup INT TERM

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running! Please start Docker Desktop.${NC}"
    exit 1
fi

# Stop any existing Expo container to avoid conflicts
echo -e "${YELLOW}🧹 Cleaning up any existing Expo containers...${NC}"
docker stop myexpo-expo-local 2>/dev/null || true
docker rm myexpo-expo-local 2>/dev/null || true

# Stop and remove old WebSocket container if exists
docker stop myexpo-websocket-local 2>/dev/null || true
docker rm myexpo-websocket-local 2>/dev/null || true

# Start only the required services (not Expo)
echo -e "\n${YELLOW}🐳 Starting Docker services (without Expo)...${NC}"
docker-compose -f docker-compose.local.yml up -d postgres-local redis-local logging-local

# Build and start the new WebSocket server
echo -e "\n${YELLOW}🔌 Starting WebSocket server...${NC}"
docker build -t my-expo-websocket-local -f docker/Dockerfile.websocket . > /dev/null 2>&1
docker run -d --name myexpo-websocket-local -p 3002:3002 -e NODE_ENV=development -e EXPO_PUBLIC_WS_PORT=3002 my-expo-websocket-local > /dev/null 2>&1

# Wait for services to be healthy
echo -e "\n${YELLOW}⏳ Waiting for services to be ready...${NC}"

# Wait for PostgreSQL
echo -n "PostgreSQL"
until docker exec myexpo-postgres-local pg_isready -U myexpo > /dev/null 2>&1; do
    echo -n "."
    sleep 1
done
echo -e " ${GREEN}✅${NC}"

# Wait for Redis
echo -n "Redis"
until docker exec myexpo-redis-local redis-cli ping > /dev/null 2>&1; do
    echo -n "."
    sleep 1
done
echo -e " ${GREEN}✅${NC}"

# Wait for WebSocket (check if container is running and responding)
echo -n "WebSocket"
for i in {1..10}; do
    if docker ps | grep -q myexpo-websocket-local && curl -s http://localhost:3002/api/trpc > /dev/null 2>&1; then
        echo -e " ${GREEN}✅${NC}"
        break
    fi
    echo -n "."
    sleep 1
done

# Wait for Logging service
echo -n "Logging Service"
for i in {1..10}; do
    if curl -s http://localhost:3003/health > /dev/null 2>&1; then
        echo -e " ${GREEN}✅${NC}"
        break
    fi
    echo -n "."
    sleep 1
done

# Run database migrations
echo -e "\n${YELLOW}🗄  Running database migrations...${NC}"
DATABASE_URL="postgresql://myexpo:myexpo123@localhost:5432/myexpo_dev" \
APP_ENV=local \
bunx drizzle-kit push

# Get local IP for mobile access
LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -n 1)

# Export environment variables for Expo
export DATABASE_URL="postgresql://myexpo:myexpo123@localhost:5432/myexpo_dev"
export REDIS_URL="redis://localhost:6379"
export EXPO_PUBLIC_API_URL="http://${LOCAL_IP}:8081"
export EXPO_PUBLIC_WS_URL="ws://${LOCAL_IP}:3002/api/trpc"
export BETTER_AUTH_URL="http://${LOCAL_IP}:8081"
export BETTER_AUTH_SECRET="local-dev-secret"
export APP_ENV="local"
export NODE_ENV="development"
export EXPO_DEVTOOLS_LISTEN_ADDRESS="0.0.0.0"
export REACT_NATIVE_PACKAGER_HOSTNAME="${LOCAL_IP}"

# Logging service configuration
export LOGGING_SERVICE_ENABLED="true"
export LOGGING_SERVICE_URL="http://localhost:3003"
export EXPO_PUBLIC_LOGGING_SERVICE_URL="http://localhost:3003"

echo -e "\n${GREEN}✅ All services are running!${NC}"
echo -e "\n${BLUE}📱 Access Points:${NC}"
echo -e "   Expo Dev Server: http://localhost:8081"
echo -e "   Mobile (LAN): http://${LOCAL_IP}:8081"
echo -e "   Web Browser: http://localhost:8081"
echo -e "   Database: postgresql://localhost:5432/myexpo_dev"
echo -e "   WebSocket: ws://localhost:3002/api/trpc"
echo -e "   Logging Service: http://localhost:3003"

echo -e "\n${BLUE}📱 Expo Go Commands:${NC}"
echo -e "┌─────────────────────────────────────────┐"
echo -e "│ ${GREEN}i${NC} → Open iOS Simulator                 │"
echo -e "│ ${GREEN}a${NC} → Open Android Emulator              │"
echo -e "│ ${GREEN}w${NC} → Open Web Browser                   │"
echo -e "│ ${GREEN}r${NC} → Reload app                         │"
echo -e "│ ${GREEN}m${NC} → Toggle menu                        │"
echo -e "│ ${GREEN}d${NC} → Show developer tools               │"
echo -e "│ ${GREEN}shift+d${NC} → Show development menu       │"
echo -e "└─────────────────────────────────────────┘"

echo -e "\n${BLUE}📲 Test Credentials:${NC}"
echo -e "┌─────────────────────────────────────────┐"
echo -e "│ Operator: operator@test.com             │"
echo -e "│ Doctor:   doctor@test.com               │"
echo -e "│ Admin:    admin@test.com                │"
echo -e "│ Password: [Role]123! (e.g. Doctor123!)  │"
echo -e "└─────────────────────────────────────────┘"

echo -e "\n${YELLOW}Press Ctrl+C to stop all services${NC}"
echo -e "${BLUE}=========================================${NC}\n"

# Clear Expo cache first
echo -e "${YELLOW}🧹 Clearing Expo cache...${NC}"
rm -rf .expo
rm -rf node_modules/.cache

# Start Expo natively
echo -e "${YELLOW}🎯 Starting Expo...${NC}\n"
EXPO_GO=1 expo start --lan --go --clear

# Cleanup will be called when Expo exits
cleanup