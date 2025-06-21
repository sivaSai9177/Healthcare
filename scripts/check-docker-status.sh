#!/bin/bash
# Check status of all Docker services

echo "🐳 Healthcare Alert System - Docker Status"
echo "=========================================="
echo ""

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "❌ Docker is not running!"
    exit 1
fi

# Function to check container status
check_container() {
    local name=$1
    local port=$2
    local service=$3
    
    if docker ps --format '{{.Names}}' | grep -q "^${name}$"; then
        echo "✅ $service is running"
        
        # Check if port is accessible
        if [ -n "$port" ] && nc -z localhost $port 2>/dev/null; then
            echo "   ✓ Port $port is accessible"
        elif [ -n "$port" ]; then
            echo "   ⚠️  Port $port is not accessible"
        fi
        
        # Show last log entry
        local last_log=$(docker logs $name --tail 1 2>&1 | head -1)
        if [ -n "$last_log" ]; then
            echo "   📋 Last log: ${last_log:0:60}..."
        fi
    else
        echo "❌ $service is not running"
    fi
    echo ""
}

# Check all services
check_container "healthcare-postgres" "5432" "PostgreSQL"
check_container "healthcare-redis" "6379" "Redis"
check_container "healthcare-app" "8081" "Expo App"
check_container "healthcare-websocket" "3002" "WebSocket Server"
check_container "healthcare-scripts" "" "Scripts Runner"

# Show connection URLs
echo "📌 Service URLs:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 Expo Web:      http://localhost:8081"
echo "📱 Expo Mobile:   exp://localhost:8081"
echo "🔌 WebSocket:     ws://localhost:3002"
echo "🗄️  PostgreSQL:   postgres://postgres:postgres@localhost:5432/healthcare_dev"
echo "📦 Redis:         redis://:redis_password@localhost:6379"
echo ""

# Show helpful commands
echo "💡 Helpful Commands:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "docker logs -f healthcare-app         # View Expo logs"
echo "docker logs -f healthcare-websocket   # View WebSocket logs"
echo "docker exec -it healthcare-scripts bash  # Access scripts container"
echo "docker-compose -f docker-compose.dev.yml down  # Stop all services"