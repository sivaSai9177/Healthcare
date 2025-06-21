#!/bin/bash
# Start PostHog self-hosted instance

echo "🚀 Starting PostHog..."

# Create network if it doesn't exist
docker network create myexpo-local 2>/dev/null || true

# Start PostHog using the simple configuration
docker-compose -f docker-compose.posthog-simple.yml up -d

# Check if services started successfully
if [ $? -eq 0 ]; then
    echo "✅ PostHog services started successfully"
    echo ""
    echo "⏳ Waiting for PostHog to be ready (this may take a few minutes on first run)..."
    
    # Wait for PostHog to be ready
    max_attempts=60
    attempt=0
    while [ $attempt -lt $max_attempts ]; do
        if curl -s -f http://localhost:8000/_health/ > /dev/null; then
            echo "✅ PostHog is ready!"
            break
        fi
        echo -n "."
        sleep 5
        attempt=$((attempt + 1))
    done
    
    if [ $attempt -eq $max_attempts ]; then
        echo "❌ PostHog failed to start within 5 minutes"
        echo "Check logs with: docker-compose -f docker-compose.posthog-simple.yml logs posthog"
        exit 1
    fi
    
    echo ""
    echo "📊 PostHog Dashboard: http://localhost:8000"
    echo ""
    echo "🔑 First-time setup:"
    echo "1. Visit http://localhost:8000 to create your account"
    echo "2. Create a project and get your API key"
    echo "3. Add the API key to your .env file:"
    echo "   POSTHOG_API_KEY=your-api-key-here"
    echo "   POSTHOG_API_HOST=http://localhost:8000"
    echo ""
    echo "📝 To view logs: docker-compose -f docker-compose.posthog-simple.yml logs -f posthog"
else
    echo "❌ Failed to start PostHog"
    exit 1
fi