#!/bin/bash

# Maestro Test Runner Script
# This script runs all Maestro E2E tests

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_ID="com.yourhospital.alertsystem"
RESULTS_DIR="maestro-results"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Create results directory
mkdir -p "$RESULTS_DIR"

echo -e "${GREEN}🎭 Maestro Test Runner${NC}"
echo "========================="
echo ""

# Check if Maestro is installed
if ! command -v maestro &> /dev/null; then
    echo -e "${RED}❌ Maestro is not installed${NC}"
    echo "Please install Maestro: curl -Ls https://get.maestro.mobile.dev | bash"
    exit 1
fi

# Function to run a test flow
run_test() {
    local flow_path=$1
    local flow_name=$(basename "$flow_path" .yaml)
    
    echo -e "${YELLOW}Running: $flow_name${NC}"
    
    if maestro test "$flow_path" \
        --env APP_ID="$APP_ID" \
        --format junit \
        --output "$RESULTS_DIR/${flow_name}_${TIMESTAMP}.xml" \
        2>&1 | tee "$RESULTS_DIR/${flow_name}_${TIMESTAMP}.log"; then
        echo -e "${GREEN}✅ $flow_name passed${NC}"
        return 0
    else
        echo -e "${RED}❌ $flow_name failed${NC}"
        return 1
    fi
}

# Count results
TOTAL=0
PASSED=0
FAILED=0

# Run auth tests
echo -e "\n${GREEN}🔐 Running Auth Tests${NC}"
echo "---------------------"
for flow in maestro/flows/auth/*.yaml; do
    if [ -f "$flow" ]; then
        ((TOTAL++))
        if run_test "$flow"; then
            ((PASSED++))
        else
            ((FAILED++))
        fi
        echo ""
    fi
done

# Run healthcare tests
echo -e "\n${GREEN}🏥 Running Healthcare Tests${NC}"
echo "--------------------------"
for flow in maestro/flows/healthcare/*.yaml; do
    if [ -f "$flow" ]; then
        ((TOTAL++))
        if run_test "$flow"; then
            ((PASSED++))
        else
            ((FAILED++))
        fi
        echo ""
    fi
done

# Run common tests
echo -e "\n${GREEN}🧭 Running Common Tests${NC}"
echo "----------------------"
for flow in maestro/flows/common/*.yaml; do
    if [ -f "$flow" ]; then
        ((TOTAL++))
        if run_test "$flow"; then
            ((PASSED++))
        else
            ((FAILED++))
        fi
        echo ""
    fi
done

# Summary
echo -e "\n${GREEN}📊 Test Summary${NC}"
echo "==============="
echo "Total Tests: $TOTAL"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""
echo "Results saved to: $RESULTS_DIR"
echo "Timestamp: $TIMESTAMP"

# Generate HTML report
echo -e "\n${GREEN}📄 Generating HTML Report${NC}"
cat > "$RESULTS_DIR/report_${TIMESTAMP}.html" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Maestro Test Report - $TIMESTAMP</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f0f0f0; padding: 20px; border-radius: 5px; }
        .summary { margin: 20px 0; }
        .passed { color: green; }
        .failed { color: red; }
        table { border-collapse: collapse; width: 100%; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Maestro E2E Test Report</h1>
        <p>Generated: $(date)</p>
    </div>
    
    <div class="summary">
        <h2>Summary</h2>
        <p>Total Tests: $TOTAL</p>
        <p class="passed">Passed: $PASSED</p>
        <p class="failed">Failed: $FAILED</p>
        <p>Success Rate: $(( TOTAL > 0 ? PASSED * 100 / TOTAL : 0 ))%</p>
    </div>
    
    <h2>Test Results</h2>
    <table>
        <tr>
            <th>Test Flow</th>
            <th>Status</th>
            <th>Log File</th>
        </tr>
EOF

# Add test results to HTML
for log_file in "$RESULTS_DIR"/*_${TIMESTAMP}.log; do
    if [ -f "$log_file" ]; then
        flow_name=$(basename "$log_file" _${TIMESTAMP}.log)
        if grep -q "✅" "$log_file"; then
            status="<span class='passed'>PASSED</span>"
        else
            status="<span class='failed'>FAILED</span>"
        fi
        echo "        <tr><td>$flow_name</td><td>$status</td><td><a href='$(basename "$log_file")'>View Log</a></td></tr>" >> "$RESULTS_DIR/report_${TIMESTAMP}.html"
    fi
done

cat >> "$RESULTS_DIR/report_${TIMESTAMP}.html" << EOF
    </table>
</body>
</html>
EOF

echo "HTML report generated: $RESULTS_DIR/report_${TIMESTAMP}.html"

# Exit with appropriate code
if [ $FAILED -gt 0 ]; then
    exit 1
else
    exit 0
fi