# Complete Scripts Guide

## 🆕 New Services (Logging & Analytics)

### Logging Service
```bash
# Start logging service (Docker)
bun run server:logging

# Test logging service
bun run test:logging

# View logging demo
bun run demo:logging

# View logs
bun run docker:logs:logging
```

### PostHog Analytics
```bash
# Start PostHog (self-hosted)
bun run server:posthog
# or
bun run docker:posthog

# Stop PostHog
bun run docker:posthog:down

# View PostHog logs
bun run docker:posthog:logs
```

## 🚀 Quick Start Commands

### Main Development Commands
```bash
# Network mode - Auto-detects your local IP for mobile devices
bun start

# Local mode - Everything on localhost (OAuth-safe)
bun start:local

# Tunnel mode - Remote access via Expo tunnel
bun start:tunnel

# Healthcare demo with all services
bun local:healthcare      # Smart start - checks existing containers
bun local:healthcare:web  # Auto-opens web browser
```

### 🧠 Smart Start Features (NEW)
The healthcare script now includes smart container management:
- **Checks existing containers** before attempting to start new ones
- **Preserves running services** to avoid conflicts
- **Only kills ports when necessary**
- **Shows container health status**

Example output:
```
🗄️  Checking database containers...
✅ PostgreSQL already running
✅ Redis already running
✅ Email server already running (may be unhealthy due to React Native issue)
✅ WebSocket server already running (may be unhealthy due to React Native issue)
```

## 📦 Service Management

### Docker Services
```bash
# Start essential services (PostgreSQL, Redis)
bun run docker:up

# Start all services (includes WebSocket, Email, Logging)
bun run docker:up:all

# Start with services profile (Email, Queue Worker)
bun run docker:up:services

# Start analytics stack (PostHog, ClickHouse)
bun run docker:analytics

# Rebuild and start services
bun run docker:up:build

# Stop all services
bun run docker:down

# Reset everything (WARNING: Deletes all data)
bun run docker:reset

# View service status
bun run docker:ps
```

### Individual Service Control
```bash
# WebSocket Service
bun run server:ws

# Email Service
bun run server:email

# Logging Service
bun run server:logging

# PostHog Analytics
bun run server:posthog
```

## 🗄️ Database Management

### Local Database
```bash
# Initial setup (run once)
bun run db:setup:local

# Start database containers
bun run db:local:up

# Stop database containers
bun run db:local:down

# Reset database (deletes all data)
bun run db:local:reset

# Open database UI
bun run db:studio:local

# Push schema changes
bun run db:push:local

# Run migrations
bun run db:migrate:local

# Generate migrations
bun run db:generate:local
```

### Database Seeds
```bash
# Seed basic data
bun run db:seed:local

# Create demo data
bun run db:seed:demo

# Full healthcare setup
bun run db:seed:healthcare
```

## 📊 Monitoring & Logs

### View Logs
```bash
# All services
bun run docker:logs

# Specific services
bun run docker:logs:postgres
bun run docker:logs:ws
bun run docker:logs:email
bun run docker:logs:logging

# PostHog logs
bun run docker:posthog:logs
```

## 🧪 Testing

### API Testing
```bash
# Test WebSocket connection
bun run test:websocket
bun run test:websocket:simple

# Test email service
bun run test:email

# Test logging service
bun run test:logging

# Healthcare flow tests
bun run test:healthcare:flow
```

### Unit & Integration Tests
```bash
# Run all tests
bun test

# Run specific test file
bun test auth

# Run with coverage
bun test --coverage
```

## 🏗️ Build & Deploy

### EAS Build
```bash
# Configure EAS
bun run eas:config

# Development builds
bun run build:dev:ios
bun run build:dev:android

# Preview builds
bun run build:preview:ios
bun run build:preview:android

# Production builds
bun run build:prod:ios
bun run build:prod:android
```

## 🛠️ Development Utilities

### TypeScript & Linting
```bash
# Type checking
bun run typecheck

# Linting
bun run lint
bun run lint:fix

# Format code
bun run format
```

### Code Fixes
```bash
# Fix import paths
bun run fix:imports

# Remove console logs
bun run fix:console

# Fix iOS pods
bun run fix:ios

# Clear Metro cache
bun run fix:metro
```

## 📝 Environment Configuration

### Service URLs (Docker Network)
- PostgreSQL: `postgresql://myexpo:myexpo123@postgres-local:5432/myexpo_dev`
- Redis: `redis://redis-local:6379`
- WebSocket: `ws://websocket-local:3002`
- Email: `http://email-local:3001`
- Logging: `http://logging-local:3003`
- PostHog: `http://posthog:8000`

### Environment Variables
```bash
# Copy template
cp .env.example .env

# Key variables for services
LOGGING_SERVICE_ENABLED=true
LOGGING_SERVICE_URL=http://logging-local:3003
POSTHOG_API_KEY=your-key-here
POSTHOG_API_HOST=http://localhost:8000
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

## 🚨 Troubleshooting

### Port Conflicts
```bash
# Check what's using a port
lsof -i :8081  # Expo
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis
lsof -i :3001  # Email
lsof -i :3002  # WebSocket
lsof -i :3003  # Logging
lsof -i :8000  # PostHog

# Kill process on port
kill -9 $(lsof -ti:8081)
```

### Docker Issues
```bash
# If "Cannot connect to Docker daemon" error:
# 1. Restart Docker Desktop from menu bar
# 2. Try switching context:
docker context use default

# Clean Docker system
docker system prune -a

# Remove specific containers
docker-compose -f docker-compose.local.yml rm -f

# Rebuild specific service
docker-compose -f docker-compose.local.yml build --no-cache logging-local

# Container health issues (React Native import errors):
# Email and WebSocket containers may show unhealthy due to React Native imports
# This is a known issue - the app will work without real-time features
bun run docker:logs:email    # Check email logs
bun run docker:logs:ws       # Check websocket logs
```

### Smart Start Benefits
The `bun local:healthcare` script now:
- ✅ Checks if containers are already running
- ✅ Avoids port conflicts by checking before killing
- ✅ Shows clear status of each service
- ✅ Handles Docker connection gracefully
- ✅ Preserves existing healthy containers

### Database Issues
```bash
# Reset and recreate
bun run db:local:reset
bun run db:setup:local

# Manual connection
psql postgresql://myexpo:myexpo123@localhost:5432/myexpo_dev
```

## 📚 Additional Resources

- [Docker Integration Guide](../../getting-started/docker-integration-guide.md)
- [Environment Setup](../.env.example)
- [TRPC Logging Integration](../../../TRPC_LOGGING_INTEGRATION.md)
- [PostHog Documentation](https://posthog.com/docs)