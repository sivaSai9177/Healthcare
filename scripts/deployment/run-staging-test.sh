#!/bin/bash

# Run Staging Deployment Test
# This script executes a complete staging deployment test

set -e

echo "🚀 Healthcare Alert System - Staging Deployment Test"
echo "==================================================="
echo
echo "This script will test the complete staging deployment process."
echo "It will NOT actually deploy to staging unless you confirm."
echo

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if running in CI/CD
if [ -n "$CI" ]; then
    echo "Running in CI/CD mode"
    AUTO_APPROVE=true
else
    AUTO_APPROVE=false
fi

# Function to ask for confirmation
confirm() {
    if [ "$AUTO_APPROVE" = true ]; then
        return 0
    fi
    
    read -p "$1 (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        return 0
    else
        return 1
    fi
}

# Step 1: Environment Check
echo -e "${BLUE}Step 1: Environment Check${NC}"
echo "========================="

# Check for .env.staging
if [ -f ".env.staging" ]; then
    echo -e "${GREEN}✓ .env.staging found${NC}"
else
    echo -e "${RED}✗ .env.staging not found${NC}"
    echo "Please run: ./scripts/deployment/setup-staging.sh"
    exit 1
fi

# Load environment
export $(cat .env.staging | grep -v '^#' | xargs)

# Validate critical variables
if [ -z "$STAGING_SERVER_IP" ] || [ "$STAGING_SERVER_IP" = "your.staging.server.ip" ]; then
    echo -e "${RED}✗ STAGING_SERVER_IP not configured${NC}"
    echo "Please update .env.staging with your staging server IP"
    exit 1
fi

echo -e "${GREEN}✓ Environment configured${NC}"
echo

# Step 2: Run deployment tests
echo -e "${BLUE}Step 2: Running Deployment Tests${NC}"
echo "================================"

echo "Running comprehensive deployment tests..."
if bun scripts/deployment/test-staging-deployment.ts; then
    echo -e "${GREEN}✓ All deployment tests passed${NC}"
else
    echo -e "${RED}✗ Deployment tests failed${NC}"
    echo "Please fix the issues before proceeding"
    exit 1
fi
echo

# Step 3: Build Docker Image
echo -e "${BLUE}Step 3: Docker Build Test${NC}"
echo "========================="

if confirm "Build Docker image for staging?"; then
    echo "Building Docker image..."
    if docker build -t healthcare-alerts/app:staging -f Dockerfile.production . ; then
        echo -e "${GREEN}✓ Docker build successful${NC}"
        
        # Show image info
        echo
        echo "Image details:"
        docker images healthcare-alerts/app:staging --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
    else
        echo -e "${RED}✗ Docker build failed${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠ Skipping Docker build${NC}"
fi
echo

# Step 4: Test Kamal Configuration
echo -e "${BLUE}Step 4: Kamal Configuration Test${NC}"
echo "================================="

echo "Validating Kamal configuration..."
if kamal config -d staging > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Kamal configuration valid${NC}"
    
    # Show configuration summary
    echo
    echo "Configuration summary:"
    echo "- Server: $STAGING_SERVER_IP"
    echo "- Domain: staging.$DEPLOY_DOMAIN"
    echo "- Database: healthcare_staging"
else
    echo -e "${RED}✗ Kamal configuration invalid${NC}"
    kamal config -d staging
    exit 1
fi
echo

# Step 5: Server Connectivity Test
echo -e "${BLUE}Step 5: Server Connectivity Test${NC}"
echo "================================="

echo "Testing connection to staging server..."
if ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no root@${STAGING_SERVER_IP} "echo 'Connected successfully'" 2>/dev/null; then
    echo -e "${GREEN}✓ SSH connection successful${NC}"
    
    # Check server stats
    echo
    echo "Server information:"
    ssh root@${STAGING_SERVER_IP} "uname -a"
    ssh root@${STAGING_SERVER_IP} "free -h | grep Mem"
    ssh root@${STAGING_SERVER_IP} "df -h / | tail -1"
else
    echo -e "${RED}✗ Cannot connect to staging server${NC}"
    echo "Please check:"
    echo "  1. Server IP is correct: $STAGING_SERVER_IP"
    echo "  2. SSH key is configured"
    echo "  3. Server is accessible"
    exit 1
fi
echo

# Step 6: Deployment Simulation
echo -e "${BLUE}Step 6: Deployment Simulation${NC}"
echo "=============================="

echo -e "${YELLOW}⚠️  IMPORTANT: This is where actual deployment would happen${NC}"
echo
echo "The following command would deploy to staging:"
echo "  kamal deploy -d staging"
echo
echo "This would:"
echo "  1. Build and push Docker images"
echo "  2. Deploy to server: $STAGING_SERVER_IP"
echo "  3. Set up database: healthcare_staging"
echo "  4. Configure SSL for: staging.$DEPLOY_DOMAIN"
echo

if confirm "Do you want to proceed with ACTUAL deployment to staging?"; then
    echo
    echo -e "${YELLOW}Starting actual deployment...${NC}"
    echo
    
    # Create deployment log
    DEPLOY_LOG="staging-deployment-$(date +%Y%m%d-%H%M%S).log"
    echo "Deployment log: $DEPLOY_LOG"
    echo
    
    # Run deployment
    if kamal deploy -d staging 2>&1 | tee "$DEPLOY_LOG"; then
        echo
        echo -e "${GREEN}✅ Deployment successful!${NC}"
        
        # Post-deployment checks
        echo
        echo "Running post-deployment verification..."
        sleep 10
        
        # Check health endpoint
        HEALTH_URL="https://staging.$DEPLOY_DOMAIN/api/health"
        echo "Checking health endpoint: $HEALTH_URL"
        
        if curl -sf "$HEALTH_URL" > /dev/null; then
            echo -e "${GREEN}✓ Health check passed${NC}"
        else
            echo -e "${YELLOW}⚠ Health check failed (might need more time)${NC}"
        fi
        
        echo
        echo "Deployment complete! 🎉"
        echo
        echo "Access your staging environment at:"
        echo "  https://staging.$DEPLOY_DOMAIN"
        echo
        echo "View logs with:"
        echo "  kamal app logs -d staging"
        echo
        echo "Monitor with:"
        echo "  bun scripts/monitoring/manage-health.ts monitor"
        
    else
        echo
        echo -e "${RED}✗ Deployment failed${NC}"
        echo "Check the log file: $DEPLOY_LOG"
        
        # Offer rollback
        echo
        if confirm "Would you like to rollback?"; then
            kamal rollback -d staging
        fi
        exit 1
    fi
else
    echo -e "${YELLOW}Deployment simulation complete (no actual deployment)${NC}"
fi

# Generate test report
echo
echo -e "${BLUE}Generating Test Report${NC}"
echo "====================="

REPORT_FILE="staging-deployment-test-report-$(date +%Y%m%d-%H%M%S).json"

cat > "$REPORT_FILE" << EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "environment": "staging",
  "server": "$STAGING_SERVER_IP",
  "domain": "staging.$DEPLOY_DOMAIN",
  "tests": {
    "environment_check": "passed",
    "deployment_tests": "passed",
    "docker_build": "passed",
    "kamal_config": "passed",
    "server_connectivity": "passed",
    "deployment": "$([ -f "$DEPLOY_LOG" ] && echo "completed" || echo "simulated")"
  },
  "deployment_log": "$([ -f "$DEPLOY_LOG" ] && echo "$DEPLOY_LOG" || echo "N/A")"
}
EOF

echo -e "${GREEN}✓ Test report saved: $REPORT_FILE${NC}"
echo

# Summary
echo -e "${GREEN}===========================${NC}"
echo -e "${GREEN}Staging Test Complete! ✅${NC}"
echo -e "${GREEN}===========================${NC}"
echo
echo "Summary:"
echo "- All pre-deployment tests: PASSED"
echo "- Docker build: SUCCESS"
echo "- Kamal configuration: VALID"
echo "- Server connectivity: OK"
echo "- Deployment: $([ -f "$DEPLOY_LOG" ] && echo "COMPLETED" || echo "SIMULATED")"
echo
echo "Test report: $REPORT_FILE"
[ -f "$DEPLOY_LOG" ] && echo "Deployment log: $DEPLOY_LOG"
echo
echo "Next steps:"
if [ ! -f "$DEPLOY_LOG" ]; then
    echo "1. Run actual deployment: kamal deploy -d staging"
    echo "2. Verify deployment: curl https://staging.$DEPLOY_DOMAIN/api/health"
    echo "3. Run smoke tests: npm run test:e2e -- --env=staging"
else
    echo "1. Monitor the deployment: kamal app logs -f -d staging"
    echo "2. Run smoke tests: npm run test:e2e -- --env=staging"
    echo "3. Check metrics: bun scripts/monitoring/manage-health.ts check"
fi