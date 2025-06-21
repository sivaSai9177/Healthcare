#!/bin/bash
# Start the logging service standalone (without Docker)

echo "🚀 Starting Logging Service (Standalone)..."

# Set environment variables
export LOGGING_SERVICE_PORT="${LOGGING_SERVICE_PORT:-3003}"
export LOGGING_ALLOWED_ORIGINS="${LOGGING_ALLOWED_ORIGINS:-http://localhost:8081,http://localhost:3000,http://localhost:19006}"
export LOGGING_MAX_SIZE="${LOGGING_MAX_SIZE:-10000}"
export LOGGING_RETENTION_MS="${LOGGING_RETENTION_MS:-86400000}"

echo "📋 Configuration:"
echo "  - Port: $LOGGING_SERVICE_PORT"
echo "  - Allowed Origins: $LOGGING_ALLOWED_ORIGINS"
echo "  - Max Log Size: $LOGGING_MAX_SIZE"
echo "  - Retention: $(($LOGGING_RETENTION_MS / 3600000)) hours"

# Start the service
bun run src/server/logging/start-standalone.ts