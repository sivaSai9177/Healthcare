#!/bin/bash

# Smart start script - checks what's already running
echo "🚀 Smart Healthcare Start Script"
echo "================================"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to check if a container is running
check_container() {
    local container_name=$1
    if docker ps --format '{{.Names}}' | grep -q "^${container_name}$"; then
        return 0
    else
        return 1
    fi
}

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

echo "🔍 Checking Docker status..."
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker Desktop first.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker is running${NC}"

echo ""
echo "🔍 Checking existing containers..."

# Check PostgreSQL
if check_container "myexpo-postgres-local"; then
    echo -e "${GREEN}✅ PostgreSQL container already running${NC}"
else
    echo -e "${YELLOW}⚠️  PostgreSQL not running. Starting...${NC}"
    docker-compose -f docker-compose.local.yml up -d postgres-local
fi

# Check Redis
if check_container "myexpo-redis-local"; then
    echo -e "${GREEN}✅ Redis container already running${NC}"
else
    echo -e "${YELLOW}⚠️  Redis not running. Starting...${NC}"
    docker-compose -f docker-compose.local.yml up -d redis-local
fi

# Check Email Service
if check_container "myexpo-email-local"; then
    echo -e "${YELLOW}⚠️  Email container exists (may be unhealthy)${NC}"
else
    echo "📧 Starting email service..."
    docker-compose -f docker-compose.local.yml up -d email-local
fi

# Check WebSocket Service
if check_container "myexpo-websocket-local"; then
    echo -e "${YELLOW}⚠️  WebSocket container exists (may be unhealthy)${NC}"
else
    echo "🔌 Starting WebSocket service..."
    docker-compose -f docker-compose.local.yml up -d websocket-local
fi

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 5

# Verify services
echo ""
echo "🔍 Verifying service health..."

# Check PostgreSQL
if check_port 5432; then
    echo -e "${GREEN}✅ PostgreSQL is accessible on port 5432${NC}"
else
    echo -e "${RED}❌ PostgreSQL not accessible on port 5432${NC}"
fi

# Check Redis
if check_port 6379; then
    echo -e "${GREEN}✅ Redis is accessible on port 6379${NC}"
else
    echo -e "${RED}❌ Redis not accessible on port 6379${NC}"
fi

# Check database connection
echo ""
echo "🗄️  Testing database connection..."
if docker exec myexpo-postgres-local pg_isready -U myexpo > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Database connection successful${NC}"
    
    # Show user count
    USER_COUNT=$(docker exec myexpo-postgres-local psql -U myexpo -d myexpo_dev -t -c "SELECT COUNT(*) FROM \"user\";" 2>/dev/null | tr -d ' ')
    if [ -n "$USER_COUNT" ] && [ "$USER_COUNT" -gt 0 ]; then
        echo -e "${GREEN}✅ Database has $USER_COUNT users${NC}"
    fi
else
    echo -e "${RED}❌ Database connection failed${NC}"
fi

echo ""
echo "📱 Demo Credentials:"
echo "   Admin: admin@hospital.demo"
echo "   Doctor: adella23@hotmail.com"
echo "   Nurse: mason.bailey19@hotmail.com"
echo "   (Password: use any password)"

echo ""
echo "🚀 Starting Expo..."
echo "================================"

# Kill any existing Expo processes
if check_port 8081; then
    echo "🧹 Cleaning up port 8081..."
    lsof -ti:8081 | xargs kill -9 2>/dev/null || true
    sleep 2
fi

# Start Expo
export APP_ENV=local
bunx expo start --web