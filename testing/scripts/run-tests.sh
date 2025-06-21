#!/bin/bash

# Healthcare App Test Runner
# This script runs all test suites with proper configuration

set -e

echo "🧪 Healthcare App Test Suite"
echo "============================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running in CI
if [ "$CI" = "true" ]; then
    echo "Running in CI mode..."
    COVERAGE_FLAG="--coverage"
    WATCH_FLAG=""
else
    echo "Running in local mode..."
    COVERAGE_FLAG=""
    WATCH_FLAG="--watch"
fi

# Parse command line arguments
TEST_SUITE="all"
if [ "$1" != "" ]; then
    TEST_SUITE=$1
fi

# Function to run tests and capture results
run_test_suite() {
    local suite_name=$1
    local command=$2
    
    echo -e "\n${YELLOW}Running $suite_name tests...${NC}"
    
    if $command; then
        echo -e "${GREEN}✅ $suite_name tests passed${NC}"
        return 0
    else
        echo -e "${RED}❌ $suite_name tests failed${NC}"
        return 1
    fi
}

# Set environment variables
export NODE_ENV=test
export APP_ENV=test
export DATABASE_URL=postgresql://test:test@localhost:5432/test_db

# Clear Jest cache
echo "Clearing Jest cache..."
bun run jest --clearCache

# Run tests based on selection
case $TEST_SUITE in
    "unit")
        run_test_suite "Unit" "bun run test:healthcare:unit $COVERAGE_FLAG"
        ;;
    "integration")
        run_test_suite "Integration" "bun run test:healthcare:integration $COVERAGE_FLAG"
        ;;
    "components")
        run_test_suite "Component" "bun run test:healthcare:components $COVERAGE_FLAG"
        ;;
    "all")
        echo "Running all test suites..."
        
        FAILED_SUITES=()
        
        # Run each suite and track failures
        run_test_suite "Unit" "bun run test:healthcare:unit" || FAILED_SUITES+=("Unit")
        run_test_suite "Integration" "bun run test:healthcare:integration" || FAILED_SUITES+=("Integration")
        run_test_suite "Component" "bun run test:healthcare:components" || FAILED_SUITES+=("Component")
        
        # Summary
        echo -e "\n${YELLOW}Test Summary${NC}"
        echo "=============="
        
        if [ ${#FAILED_SUITES[@]} -eq 0 ]; then
            echo -e "${GREEN}✅ All tests passed!${NC}"
            
            # Generate coverage report if all tests pass
            if [ "$CI" = "true" ]; then
                echo -e "\n${YELLOW}Generating coverage report...${NC}"
                bun run test:healthcare:all --coverage --coverageReporters=lcov
            fi
            
            exit 0
        else
            echo -e "${RED}❌ Failed test suites: ${FAILED_SUITES[*]}${NC}"
            exit 1
        fi
        ;;
    *)
        echo "Usage: $0 [unit|integration|components|all]"
        exit 1
        ;;
esac