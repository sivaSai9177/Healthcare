# Docker Services Fix Summary

## Issues Fixed
1. **WebSocket**: Was running locally with Node.js, now running in Docker
2. **Email Service**: Was running locally with Bun, now running in Docker

## Changes Made

### 1. Updated Startup Script
**File**: `scripts/start-with-healthcare.sh`

Added configuration flags:
```bash
USE_DOCKER_WEBSOCKET=${USE_DOCKER_WEBSOCKET:-true}
USE_DOCKER_EMAIL=${USE_DOCKER_EMAIL:-true}
```

Both services now default to Docker containers.

### 2. Fixed Environment Variables
**File**: `.env`
```bash
EXPO_PUBLIC_ENABLE_WS=true
EXPO_PUBLIC_WS_PORT=3002
```

### 3. Services Now Running

| Service | Container Name | Port | Status |
|---------|---------------|------|--------|
| WebSocket | myexpo-websocket-local | 3002 | ✅ Running |
| Email | myexpo-email-local | 3001 | ✅ Running |
| PostgreSQL | myexpo-postgres-local | 5432 | ✅ Running |
| Redis | myexpo-redis-local | 6379 | ✅ Running |

## How to Start Everything

1. **Stop current processes** (Ctrl+C in terminal)

2. **Clean restart**:
   ```bash
   # Kill any stray processes
   lsof -ti:3001 | xargs kill -9 2>/dev/null || true
   lsof -ti:3002 | xargs kill -9 2>/dev/null || true
   
   # Start everything
   bun run local:healthcare
   ```

3. **App should load** at http://localhost:8081

## Verify Services

```bash
# Check all Docker containers
docker ps | grep myexpo

# Check specific services
docker logs myexpo-websocket-local
docker logs myexpo-email-local

# Health checks
curl http://localhost:3001/health  # Email
curl http://localhost:3002/health  # WebSocket (may not have endpoint)
```

## Manual Container Management

```bash
# Start services manually if needed
docker-compose -f docker-compose.local.yml up -d websocket-local email-local

# Stop services
docker-compose -f docker-compose.local.yml stop websocket-local email-local

# View logs
docker-compose -f docker-compose.local.yml logs -f websocket-local
docker-compose -f docker-compose.local.yml logs -f email-local
```

## Troubleshooting

1. **Port already in use**:
   ```bash
   lsof -ti:3001 | xargs kill -9
   lsof -ti:3002 | xargs kill -9
   ```

2. **Container won't start**:
   ```bash
   # Remove and recreate
   docker-compose -f docker-compose.local.yml rm -f websocket-local email-local
   docker-compose -f docker-compose.local.yml up -d websocket-local email-local
   ```

3. **Check container status**:
   ```bash
   docker ps -a | grep myexpo
   ```

All services are now properly containerized and the app should load successfully!