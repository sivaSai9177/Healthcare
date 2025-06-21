#!/bin/bash
# Setup PostHog self-hosted instance

set -e

echo "🚀 Setting up PostHog self-hosted instance..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker Desktop first.${NC}"
    exit 1
fi

# Create network if it doesn't exist
echo "📦 Creating Docker network..."
docker network create myexpo-local 2>/dev/null || echo "Network already exists"

# Generate secret key if not exists
if [ -z "$POSTHOG_SECRET_KEY" ]; then
    echo "🔐 Generating secret key..."
    export POSTHOG_SECRET_KEY=$(openssl rand -base64 32)
    echo "POSTHOG_SECRET_KEY=$POSTHOG_SECRET_KEY" >> .env
fi

# Start PostHog services
echo "🐳 Starting PostHog services..."
docker-compose -f docker-compose.posthog.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for PostHog to initialize (this may take a few minutes)..."
max_attempts=60
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if curl -s -f http://localhost:8000/_health/ > /dev/null 2>&1; then
        echo -e "\n${GREEN}✅ PostHog is ready!${NC}"
        break
    fi
    echo -n "."
    sleep 5
    attempt=$((attempt + 1))
done

if [ $attempt -eq $max_attempts ]; then
    echo -e "\n${RED}❌ PostHog failed to start within 5 minutes${NC}"
    echo "Check logs with: docker-compose -f docker-compose.posthog.yml logs"
    exit 1
fi

# Show next steps
echo ""
echo "===================================="
echo "PostHog Setup Complete! 🎉"
echo "===================================="
echo ""
echo "📊 PostHog Dashboard: http://localhost:8000"
echo ""
echo "🔑 Next Steps:"
echo "1. Visit http://localhost:8000 to create your account"
echo "2. Complete the setup wizard"
echo "3. Create a project and get your API key"
echo "4. Update your .env file with:"
echo "   POSTHOG_API_KEY=phc_your_api_key_here"
echo "   POSTHOG_API_HOST=http://localhost:8000"
echo ""
echo "📝 Useful Commands:"
echo "- View logs: docker-compose -f docker-compose.posthog.yml logs -f"
echo "- Stop PostHog: docker-compose -f docker-compose.posthog.yml down"
echo "- Reset PostHog: docker-compose -f docker-compose.posthog.yml down -v"
echo ""
echo "📚 Documentation: http://localhost:8000/docs"