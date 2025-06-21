#!/bin/bash

# Staging Environment Setup Script
# Sets up everything needed for Kamal deployment to staging

set -e

echo "🚀 Healthcare Alert System - Staging Setup"
echo "=========================================="
echo

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if .env.staging exists
if [ ! -f ".env.staging" ]; then
    echo -e "${YELLOW}Creating .env.staging file...${NC}"
    cat > .env.staging << 'EOF'
# Staging Environment Configuration
# Copy this to .env.staging and fill in the values

# Server Configuration
STAGING_SERVER_IP=your.staging.server.ip
DEPLOY_DOMAIN=your-domain.com
DEPLOY_EMAIL=admin@your-domain.com

# Docker Registry
DOCKER_REGISTRY_USERNAME=your-registry-username
DOCKER_REGISTRY_PASSWORD=your-registry-password

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/healthcare_staging
POSTGRES_USER=healthcare_user
POSTGRES_PASSWORD=your-secure-password

# Redis
REDIS_PASSWORD=your-redis-password

# Authentication
BETTER_AUTH_SECRET=your-32-char-min-secret-key-here
BETTER_AUTH_URL=https://staging.your-domain.com

# OAuth (Optional for staging)
AUTH_GOOGLE_ID=your-google-client-id
AUTH_GOOGLE_SECRET=your-google-client-secret

# Email Service
EMAIL_FROM=noreply@your-domain.com
RESEND_API_KEY=your-resend-api-key

# PostHog Analytics (Optional for staging)
EXPO_PUBLIC_POSTHOG_API_KEY=your-posthog-api-key
POSTHOG_API_KEY=your-posthog-api-key
STAGING_POSTHOG_PROJECT_ID=your-staging-project-id
EOF
    echo -e "${GREEN}Created .env.staging template${NC}"
    echo -e "${RED}Please edit .env.staging and add your configuration values${NC}"
    exit 1
fi

# Load staging environment
export $(cat .env.staging | grep -v '^#' | xargs)

# Validate required environment variables
echo -e "${BLUE}Validating environment configuration...${NC}"

required_vars=(
    "STAGING_SERVER_IP"
    "DEPLOY_DOMAIN"
    "DOCKER_REGISTRY_USERNAME"
    "DATABASE_URL"
    "BETTER_AUTH_SECRET"
)

missing_vars=()
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=($var)
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    echo -e "${RED}Missing required environment variables:${NC}"
    printf '%s\n' "${missing_vars[@]}"
    echo
    echo "Please update .env.staging with the missing values"
    exit 1
fi

echo -e "${GREEN}✓ Environment configuration valid${NC}"

# Check prerequisites
echo
echo -e "${BLUE}Checking prerequisites...${NC}"

# Check Kamal
if ! command -v kamal &> /dev/null; then
    echo -e "${YELLOW}Kamal not installed. Installing...${NC}"
    gem install kamal
fi

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Prerequisites satisfied${NC}"

# Create Kamal secrets file
echo
echo -e "${BLUE}Setting up Kamal secrets...${NC}"

mkdir -p .kamal

cat > .kamal/secrets << EOF
# Kamal Secrets for Staging Deployment
# This file is sourced before deployment

# Load staging environment
export \$(cat .env.staging | grep -v '^#' | xargs)

# Registry password
export DOCKER_REGISTRY_PASSWORD="${DOCKER_REGISTRY_PASSWORD}"

# Database
export DATABASE_URL="${DATABASE_URL}"
export POSTGRES_USER="${POSTGRES_USER}"
export POSTGRES_PASSWORD="${POSTGRES_PASSWORD}"

# Redis
export REDIS_PASSWORD="${REDIS_PASSWORD}"
export REDIS_URL="redis://:${REDIS_PASSWORD}@${STAGING_SERVER_IP}:6379"

# Auth
export BETTER_AUTH_SECRET="${BETTER_AUTH_SECRET}"
export BETTER_AUTH_URL="${BETTER_AUTH_URL}"

# OAuth
export AUTH_GOOGLE_ID="${AUTH_GOOGLE_ID}"
export AUTH_GOOGLE_SECRET="${AUTH_GOOGLE_SECRET}"

# Email
export EMAIL_FROM="${EMAIL_FROM}"
export RESEND_API_KEY="${RESEND_API_KEY}"

# PostHog
export EXPO_PUBLIC_POSTHOG_API_KEY="${EXPO_PUBLIC_POSTHOG_API_KEY}"
export POSTHOG_API_KEY="${POSTHOG_API_KEY}"
EOF

chmod 600 .kamal/secrets
echo -e "${GREEN}✓ Kamal secrets configured${NC}"

# Test SSH connection
echo
echo -e "${BLUE}Testing SSH connection to staging server...${NC}"

if ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no root@${STAGING_SERVER_IP} "echo 'SSH connection successful'" 2>/dev/null; then
    echo -e "${GREEN}✓ SSH connection successful${NC}"
    
    # Check server requirements
    echo -e "${BLUE}Checking server requirements...${NC}"
    
    # Check Docker on server
    if ssh root@${STAGING_SERVER_IP} "command -v docker" &>/dev/null; then
        echo -e "${GREEN}✓ Docker installed on server${NC}"
    else
        echo -e "${YELLOW}Installing Docker on server...${NC}"
        ssh root@${STAGING_SERVER_IP} "curl -fsSL https://get.docker.com | sh"
    fi
    
    # Create required directories
    ssh root@${STAGING_SERVER_IP} "mkdir -p /letsencrypt /var/lib/postgresql/data /var/lib/redis"
    echo -e "${GREEN}✓ Server directories created${NC}"
    
else
    echo -e "${RED}✗ Cannot connect to staging server${NC}"
    echo "Please ensure:"
    echo "  1. STAGING_SERVER_IP is correct: ${STAGING_SERVER_IP}"
    echo "  2. You have SSH key access to the server"
    echo "  3. The server is accessible"
    exit 1
fi

# Test Docker registry login
echo
echo -e "${BLUE}Testing Docker registry login...${NC}"

if echo "${DOCKER_REGISTRY_PASSWORD}" | docker login -u "${DOCKER_REGISTRY_USERNAME}" --password-stdin 2>/dev/null; then
    echo -e "${GREEN}✓ Docker registry login successful${NC}"
else
    echo -e "${RED}✗ Docker registry login failed${NC}"
    echo "Please check your registry credentials"
    exit 1
fi

# Build test image
echo
echo -e "${BLUE}Building test image...${NC}"

if [ -f "Dockerfile.production" ]; then
    docker build -t healthcare-alerts/app:staging-test -f Dockerfile.production . --quiet
    echo -e "${GREEN}✓ Test image built successfully${NC}"
else
    echo -e "${RED}✗ Dockerfile.production not found${NC}"
    exit 1
fi

# Validate Kamal configuration
echo
echo -e "${BLUE}Validating Kamal configuration...${NC}"

if kamal config -d staging >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Kamal configuration valid${NC}"
else
    echo -e "${RED}✗ Kamal configuration invalid${NC}"
    echo "Run 'kamal config -d staging' to see errors"
    exit 1
fi

# Create deployment commands
echo
echo -e "${BLUE}Creating deployment helper scripts...${NC}"

# Create deploy script
cat > deploy-staging.sh << 'EOF'
#!/bin/bash
set -e

echo "🚀 Deploying to Staging Environment"
echo "==================================="

# Source secrets
source .kamal/secrets

# Run pre-deployment checks
echo "Running health check..."
bun scripts/monitoring/manage-health.ts check

# Deploy with Kamal
echo "Starting deployment..."
kamal deploy -d staging

# Post-deployment verification
echo "Verifying deployment..."
sleep 10
curl -sf https://staging.${DEPLOY_DOMAIN}/api/health || echo "Health check failed"

echo "✅ Deployment complete!"
echo "View logs: kamal app logs -d staging"
EOF

chmod +x deploy-staging.sh

# Create rollback script
cat > rollback-staging.sh << 'EOF'
#!/bin/bash
set -e

echo "🔄 Rolling back Staging Deployment"
echo "=================================="

# Source secrets
source .kamal/secrets

# Rollback
kamal rollback -d staging

echo "✅ Rollback complete!"
EOF

chmod +x rollback-staging.sh

echo -e "${GREEN}✓ Helper scripts created${NC}"

# Summary
echo
echo -e "${GREEN}✅ Staging setup complete!${NC}"
echo
echo "Next steps:"
echo "1. Review and update .env.staging if needed"
echo "2. Run tests: bun scripts/deployment/test-staging-deployment.ts"
echo "3. Deploy: ./deploy-staging.sh"
echo "4. Monitor: kamal app logs -f -d staging"
echo
echo "Useful commands:"
echo "  Deploy:    ./deploy-staging.sh"
echo "  Rollback:  ./rollback-staging.sh"
echo "  Logs:      kamal app logs -d staging"
echo "  SSH:       ssh root@${STAGING_SERVER_IP}"
echo
echo -e "${YELLOW}⚠️  Important: Ensure your staging server has sufficient resources${NC}"
echo "  Minimum: 2GB RAM, 20GB disk space"
echo "  Recommended: 4GB RAM, 40GB disk space"