#!/bin/bash
# Start the logging service in Docker

echo "🚀 Starting Logging Service..."

# Build and start the logging service
docker-compose -f docker-compose.local.yml up -d logging-local

# Check if the service started successfully
if [ $? -eq 0 ]; then
    echo "✅ Logging service started successfully"
    echo "📊 Health check: http://localhost:3003/health"
    
    # Wait for service to be ready
    echo "⏳ Waiting for logging service to be ready..."
    sleep 5
    
    # Check health endpoint
    curl -s http://localhost:3003/health | jq '.' || echo "Health check endpoint not ready yet"
else
    echo "❌ Failed to start logging service"
    exit 1
fi

# Show logs
echo "📋 Logging service logs:"
docker-compose -f docker-compose.local.yml logs -f logging-local