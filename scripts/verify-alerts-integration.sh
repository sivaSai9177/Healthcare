#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Verifying Alerts Module Integration${NC}"
echo -e "${BLUE}=====================================${NC}"

# Check if WebSocket container is running
echo -e "\n${YELLOW}1. Checking WebSocket Server...${NC}"
if docker ps | grep -q myexpo-websocket-local; then
    echo -e "   ${GREEN}✅ WebSocket container is running${NC}"
    
    # Check WebSocket endpoint
    if curl -s http://localhost:3002/api/trpc > /dev/null 2>&1; then
        echo -e "   ${GREEN}✅ WebSocket endpoint is responding${NC}"
        RESPONSE=$(curl -s http://localhost:3002/api/trpc)
        echo -e "   Response: ${BLUE}${RESPONSE}${NC}"
    else
        echo -e "   ${RED}❌ WebSocket endpoint not responding${NC}"
    fi
    
    # Check WebSocket logs
    echo -e "\n   ${YELLOW}Recent WebSocket logs:${NC}"
    docker logs myexpo-websocket-local --tail 10 2>&1 | sed 's/^/   /'
else
    echo -e "   ${RED}❌ WebSocket container not running${NC}"
    echo -e "   ${YELLOW}Start it with: docker run -d --name myexpo-websocket-local -p 3002:3002 -e NODE_ENV=development my-expo-websocket-local${NC}"
fi

# Check if API server is running
echo -e "\n${YELLOW}2. Checking API Server...${NC}"
if curl -s http://localhost:8081/api/health > /dev/null 2>&1; then
    echo -e "   ${GREEN}✅ API server is running${NC}"
else
    echo -e "   ${RED}❌ API server not running on port 8081${NC}"
fi

# Check database connection
echo -e "\n${YELLOW}3. Checking Database...${NC}"
if docker exec myexpo-postgres-local pg_isready -U myexpo > /dev/null 2>&1; then
    echo -e "   ${GREEN}✅ PostgreSQL is ready${NC}"
    
    # Check if healthcare tables exist
    TABLES=$(docker exec myexpo-postgres-local psql -U myexpo -d myexpo_dev -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%alert%';" 2>/dev/null | tr -d ' ')
    if [ "$TABLES" -gt "0" ]; then
        echo -e "   ${GREEN}✅ Alert tables exist in database (${TABLES} tables)${NC}"
    else
        echo -e "   ${RED}❌ No alert tables found in database${NC}"
    fi
else
    echo -e "   ${RED}❌ PostgreSQL not ready${NC}"
fi

# Check Redis
echo -e "\n${YELLOW}4. Checking Redis...${NC}"
if docker exec myexpo-redis-local redis-cli ping > /dev/null 2>&1; then
    echo -e "   ${GREEN}✅ Redis is running${NC}"
else
    echo -e "   ${RED}❌ Redis not running${NC}"
fi

# Test WebSocket connection with wscat if available
echo -e "\n${YELLOW}5. Testing WebSocket Connection...${NC}"
if command -v wscat &> /dev/null; then
    echo -e "   ${YELLOW}Attempting WebSocket connection...${NC}"
    timeout 2 wscat -c ws://localhost:3002/api/trpc 2>&1 | head -5 | sed 's/^/   /' || true
else
    echo -e "   ${YELLOW}wscat not installed. Install with: npm install -g wscat${NC}"
fi

# Check environment variables
echo -e "\n${YELLOW}6. Environment Variables:${NC}"
echo -e "   EXPO_PUBLIC_API_URL: ${BLUE}${EXPO_PUBLIC_API_URL:-Not set}${NC}"
echo -e "   EXPO_PUBLIC_WS_URL: ${BLUE}${EXPO_PUBLIC_WS_URL:-Not set}${NC}"
echo -e "   DATABASE_URL: ${BLUE}${DATABASE_URL:0:40}...${NC}"
echo -e "   NODE_ENV: ${BLUE}${NODE_ENV:-Not set}${NC}"

# Test TRPC endpoints
echo -e "\n${YELLOW}7. Testing TRPC Endpoints...${NC}"
if [ -n "$EXPO_PUBLIC_API_URL" ]; then
    # Test health endpoint
    if curl -s "${EXPO_PUBLIC_API_URL}/api/trpc/healthcare.getActiveAlerts" > /dev/null 2>&1; then
        echo -e "   ${GREEN}✅ TRPC healthcare endpoints accessible${NC}"
    else
        echo -e "   ${RED}❌ TRPC healthcare endpoints not accessible${NC}"
    fi
fi

echo -e "\n${BLUE}=====================================${NC}"
echo -e "${GREEN}Verification complete!${NC}"

# Summary
echo -e "\n${BLUE}Summary:${NC}"
echo -e "• WebSocket server should be running on ws://localhost:3002/api/trpc"
echo -e "• API server should be running on http://localhost:8081"
echo -e "• Real-time alerts will be delivered via WebSocket subscriptions"
echo -e "• Test alerts are emitted every minute in development mode"

echo -e "\n${YELLOW}To test real-time alerts:${NC}"
echo -e "1. Open the app and navigate to the Alerts screen"
echo -e "2. Watch the console for WebSocket connection messages"
echo -e "3. Test alerts should appear automatically every minute"
echo -e "4. Check Docker logs: docker logs -f myexpo-websocket-local"