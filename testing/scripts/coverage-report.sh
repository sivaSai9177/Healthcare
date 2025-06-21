#!/bin/bash

# Generate and display test coverage report

set -e

echo "📊 Generating Test Coverage Report"
echo "=================================="
echo ""

# Run tests with coverage
echo "Running tests with coverage..."
bun run test:healthcare:all --coverage --coverageReporters=text --coverageReporters=lcov --coverageReporters=html

# Display coverage summary
echo ""
echo "Coverage Summary:"
echo "-----------------"

# Extract coverage summary from lcov
if [ -f "coverage/lcov.info" ]; then
    # Parse lcov.info for summary
    LINES=$(grep -o "LF:[0-9]*" coverage/lcov.info | awk -F: '{sum += $2} END {print sum}')
    LINES_HIT=$(grep -o "LH:[0-9]*" coverage/lcov.info | awk -F: '{sum += $2} END {print sum}')
    
    if [ $LINES -gt 0 ]; then
        COVERAGE=$((LINES_HIT * 100 / LINES))
        echo "Overall Coverage: $COVERAGE%"
        echo "Lines: $LINES_HIT / $LINES"
    fi
fi

# Open HTML report if not in CI
if [ "$CI" != "true" ]; then
    echo ""
    echo "Opening HTML coverage report..."
    
    if [ -f "coverage/lcov-report/index.html" ]; then
        if command -v open &> /dev/null; then
            open coverage/lcov-report/index.html
        elif command -v xdg-open &> /dev/null; then
            xdg-open coverage/lcov-report/index.html
        else
            echo "HTML report available at: coverage/lcov-report/index.html"
        fi
    fi
fi

# Check coverage thresholds
echo ""
echo "Checking coverage thresholds..."

THRESHOLD=80
if [ $COVERAGE -lt $THRESHOLD ]; then
    echo "⚠️  Warning: Coverage ($COVERAGE%) is below threshold ($THRESHOLD%)"
    exit 1
else
    echo "✅ Coverage meets threshold!"
fi