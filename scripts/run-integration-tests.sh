#!/bin/bash

# Run Integration Tests with Real APIs
# This script sets up the test environment and runs integration tests

set -e

echo "🧪 Starting Integration Tests with Real APIs..."

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env.test exists
if [ ! -f .env.test ]; then
    echo -e "${YELLOW}⚠️  .env.test not found. Creating from template...${NC}"
    
    # Create .env.test from template
    cat > .env.test << EOF
# Test Environment Configuration
NODE_ENV=test
BETTER_AUTH_URL=http://localhost:3000
EXPO_PUBLIC_API_URL=http://localhost:3000

# Test Database
TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hospital_alert_test
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hospital_alert_test

# Auth Secrets (test values)
BETTER_AUTH_SECRET=test-auth-secret-key-for-integration-tests
ENCRYPTION_KEY=test-encryption-key-32-characters

# OAuth (test values)
GOOGLE_CLIENT_ID=test-google-client-id
GOOGLE_CLIENT_SECRET=test-google-client-secret

# Email
EMAIL_PROVIDER=mock
EMAIL_FROM=test@hospital-alert.com

# WebSocket
WEBSOCKET_URL=ws://localhost:3001

# Disable rate limiting for tests
DISABLE_RATE_LIMIT=true
EOF
    echo -e "${GREEN}✅ Created .env.test${NC}"
fi

# Check if test database exists
echo "🗄️  Checking test database..."
if ! psql -U postgres -lqt | cut -d \| -f 1 | grep -qw hospital_alert_test; then
    echo -e "${YELLOW}Creating test database...${NC}"
    createdb -U postgres hospital_alert_test
    echo -e "${GREEN}✅ Test database created${NC}"
fi

# Run migrations on test database
echo "🔄 Running migrations on test database..."
DATABASE_URL=$TEST_DATABASE_URL bun run db:migrate

# Start test API server in background
echo "🚀 Starting test API server..."
TEST_MODE=true DATABASE_URL=$TEST_DATABASE_URL bun run dev:api &
API_PID=$!

# Wait for API to be ready
echo "⏳ Waiting for API server to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:3000/api/health > /dev/null; then
        echo -e "${GREEN}✅ API server is ready${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ API server failed to start${NC}"
        kill $API_PID 2>/dev/null
        exit 1
    fi
    sleep 1
done

# Start WebSocket server in background
echo "🔌 Starting WebSocket server..."
TEST_MODE=true DATABASE_URL=$TEST_DATABASE_URL bun run dev:ws &
WS_PID=$!

# Wait for WebSocket to be ready
sleep 2

# Function to cleanup on exit
cleanup() {
    echo "🧹 Cleaning up..."
    kill $API_PID 2>/dev/null || true
    kill $WS_PID 2>/dev/null || true
    exit
}

trap cleanup EXIT INT TERM

# Run integration tests
echo "🧪 Running integration tests..."
echo "=================================="

# Run specific test suites
if [ "$1" ]; then
    # Run specific test file
    jest --config jest.config.integration.js "$1"
else
    # Run all integration tests
    jest --config jest.config.integration.js --runInBand
fi

TEST_EXIT_CODE=$?

# Generate coverage report
if [ "$TEST_EXIT_CODE" -eq 0 ]; then
    echo -e "${GREEN}✅ All integration tests passed!${NC}"
    
    # Show coverage summary
    if [ -f coverage/coverage-summary.json ]; then
        echo "📊 Coverage Summary:"
        cat coverage/coverage-summary.json | jq '.total'
    fi
else
    echo -e "${RED}❌ Some integration tests failed${NC}"
fi

exit $TEST_EXIT_CODE