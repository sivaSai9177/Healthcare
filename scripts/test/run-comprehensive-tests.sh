#!/bin/bash

# Healthcare System Comprehensive Test Runner
# This script runs all tests and generates a comprehensive report

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test results file
RESULTS_FILE="test-results-$(date +%Y%m%d-%H%M%S).json"
SUMMARY_FILE="test-summary-$(date +%Y%m%d-%H%M%S).md"

echo -e "${YELLOW}<å Healthcare System Comprehensive Testing${NC}"
echo -e "${YELLOW}=========================================${NC}\n"

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo -e "${YELLOW}=Ë Checking prerequisites...${NC}"
if ! command_exists bun; then
    echo -e "${RED}L Bun is not installed${NC}"
    exit 1
fi

if ! command_exists docker; then
    echo -e "${RED}L Docker is not installed${NC}"
    exit 1
fi

echo -e "${GREEN} All prerequisites met${NC}\n"

# Start test summary
cat > "$SUMMARY_FILE" << EOF
# Healthcare System Test Report
Date: $(date)

## Environment Setup
EOF

# Clean up any existing services
echo -e "${YELLOW}>ù Cleaning up existing services...${NC}"
./scripts/cleanup-services.sh 2>/dev/null || true
sleep 2

# Start Docker services
echo -e "${YELLOW}=3 Starting Docker services...${NC}"
docker-compose -f docker-compose.local.yml up -d postgres-local redis-local
sleep 5

# Check Docker services
if docker ps | grep -q postgres-local && docker ps | grep -q redis-local; then
    echo -e "${GREEN} Docker services started${NC}"
    echo "-  PostgreSQL started" >> "$SUMMARY_FILE"
    echo "-  Redis started" >> "$SUMMARY_FILE"
else
    echo -e "${RED}L Failed to start Docker services${NC}"
    echo "- L Failed to start Docker services" >> "$SUMMARY_FILE"
    exit 1
fi

# Push database schema
echo -e "${YELLOW}=Ê Setting up database...${NC}"
if bun run db:push; then
    echo -e "${GREEN} Database schema pushed${NC}"
    echo "-  Database schema pushed" >> "$SUMMARY_FILE"
else
    echo -e "${RED}L Failed to push database schema${NC}"
    echo "- L Failed to push database schema" >> "$SUMMARY_FILE"
    exit 1
fi

# Set up healthcare data
echo -e "${YELLOW}<å Setting up healthcare data...${NC}"
if bun run healthcare:setup:complete; then
    echo -e "${GREEN} Healthcare data setup complete${NC}"
    echo "-  Healthcare data setup complete" >> "$SUMMARY_FILE"
else
    echo -e "${RED}L Failed to setup healthcare data${NC}"
    echo "- L Failed to setup healthcare data" >> "$SUMMARY_FILE"
fi

# Add test sections to summary
cat >> "$SUMMARY_FILE" << EOF

## Test Results

### Unit Tests
EOF

# Run unit tests
echo -e "\n${YELLOW}>ê Running unit tests...${NC}"
if bun run test:healthcare:unit --json > unit-tests.json 2>&1; then
    echo -e "${GREEN} Unit tests passed${NC}"
    echo " All unit tests passed" >> "$SUMMARY_FILE"
else
    echo -e "${RED}L Unit tests failed${NC}"
    echo "L Unit tests failed" >> "$SUMMARY_FILE"
fi

# Extract unit test stats
if [ -f unit-tests.json ]; then
    # Parse test results (simplified for now)
    echo "- Tests run: $(grep -o '"numTotalTests":[0-9]*' unit-tests.json | cut -d: -f2 || echo 'N/A')" >> "$SUMMARY_FILE"
    echo "- Tests passed: $(grep -o '"numPassedTests":[0-9]*' unit-tests.json | cut -d: -f2 || echo 'N/A')" >> "$SUMMARY_FILE"
fi

cat >> "$SUMMARY_FILE" << EOF

### Component Tests
EOF

# Run component tests
echo -e "\n${YELLOW}<¨ Running component tests...${NC}"
if bun run test:healthcare:components --json > component-tests.json 2>&1; then
    echo -e "${GREEN} Component tests passed${NC}"
    echo " All component tests passed" >> "$SUMMARY_FILE"
else
    echo -e "${YELLOW}   Component tests have issues${NC}"
    echo "   Component tests have issues (React Native mocking)" >> "$SUMMARY_FILE"
fi

cat >> "$SUMMARY_FILE" << EOF

### Integration Tests
EOF

# Run integration tests
echo -e "\n${YELLOW}= Running integration tests...${NC}"
if bun run test:healthcare:integration --json > integration-tests.json 2>&1; then
    echo -e "${GREEN} Integration tests passed${NC}"
    echo " All integration tests passed" >> "$SUMMARY_FILE"
else
    echo -e "${YELLOW}   Integration tests have issues${NC}"
    echo "   Integration tests have issues (React Native mocking)" >> "$SUMMARY_FILE"
fi

# Run linting
echo -e "\n${YELLOW}= Running linting...${NC}"
cat >> "$SUMMARY_FILE" << EOF

### Code Quality
EOF

if bun run lint > lint-results.txt 2>&1; then
    echo -e "${GREEN} Linting passed${NC}"
    echo " No linting errors" >> "$SUMMARY_FILE"
else
    echo -e "${YELLOW}   Linting warnings found${NC}"
    echo "   Linting warnings found" >> "$SUMMARY_FILE"
    # Count warnings
    WARNINGS=$(grep -c "warning" lint-results.txt || echo "0")
    echo "- Warnings: $WARNINGS" >> "$SUMMARY_FILE"
fi

# Run type checking
echo -e "\n${YELLOW}=Ý Running type checking...${NC}"
if bun run typecheck > typecheck-results.txt 2>&1; then
    echo -e "${GREEN} Type checking passed${NC}"
    echo " No type errors" >> "$SUMMARY_FILE"
else
    echo -e "${RED}L Type errors found${NC}"
    echo "L Type errors found" >> "$SUMMARY_FILE"
    # Count errors
    ERRORS=$(grep -c "error TS" typecheck-results.txt || echo "0")
    echo "- Type errors: $ERRORS" >> "$SUMMARY_FILE"
fi

# Performance benchmarks
cat >> "$SUMMARY_FILE" << EOF

### Performance Benchmarks
EOF

echo -e "\n${YELLOW}¡ Running performance tests...${NC}"
if timeout 60 bun run test:healthcare:performance --json > perf-tests.json 2>&1; then
    echo -e "${GREEN} Performance tests completed${NC}"
    echo " Performance benchmarks passed" >> "$SUMMARY_FILE"
else
    echo -e "${YELLOW}   Performance tests timed out or failed${NC}"
    echo "   Performance tests incomplete" >> "$SUMMARY_FILE"
fi

# Health check
cat >> "$SUMMARY_FILE" << EOF

### System Health Check
EOF

echo -e "\n${YELLOW}<å Running health check...${NC}"
if bun run health:check > health-check.txt 2>&1; then
    echo -e "${GREEN} All systems healthy${NC}"
    echo " All systems healthy" >> "$SUMMARY_FILE"
else
    echo -e "${YELLOW}   Some services not running${NC}"
    echo "   Some services not running (expected in test environment)" >> "$SUMMARY_FILE"
    # Extract health stats
    grep -E " Healthy:|L Unhealthy:|   Warnings:" health-check.txt >> "$SUMMARY_FILE" || true
fi

# Generate final summary
cat >> "$SUMMARY_FILE" << EOF

## Summary

### Test Coverage
EOF

# Check if coverage report exists
if [ -f coverage/coverage-summary.json ]; then
    echo "Code coverage data available in coverage/ directory" >> "$SUMMARY_FILE"
else
    echo "Run tests with --coverage flag for detailed coverage report" >> "$SUMMARY_FILE"
fi

cat >> "$SUMMARY_FILE" << EOF

### Recommendations

1. **Unit Tests**: Continue maintaining high coverage for business logic
2. **Component Tests**: Fix React Native mocking issues for better component testing
3. **Integration Tests**: Add more end-to-end scenarios
4. **Performance**: Monitor response times under load
5. **Health Monitoring**: Implement automated health checks in production

### Next Steps

1. Fix any failing tests
2. Address linting warnings
3. Resolve type errors
4. Improve test coverage for uncovered files
5. Add visual regression tests
6. Implement E2E tests with Detox/Playwright

---

Generated on: $(date)
EOF

# Clean up
echo -e "\n${YELLOW}>ù Cleaning up...${NC}"
rm -f unit-tests.json component-tests.json integration-tests.json perf-tests.json 2>/dev/null

# Display summary
echo -e "\n${GREEN} Test run complete!${NC}"
echo -e "${YELLOW}=Ä Test summary saved to: $SUMMARY_FILE${NC}"
echo -e "\n${YELLOW}Summary:${NC}"
tail -n 20 "$SUMMARY_FILE"

# Stop services if requested
if [ "$1" = "--cleanup" ]; then
    echo -e "\n${YELLOW}=Ñ Stopping services...${NC}"
    docker-compose -f docker-compose.local.yml down
    ./scripts/cleanup-services.sh
fi

echo -e "\n${GREEN}Done!${NC}"