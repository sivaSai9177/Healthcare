# Scripts and Environments Complete Guide

## Table of Contents
1. [Environment Overview](#environment-overview)
2. [Environment Variables](#environment-variables)
3. [Main Start Commands](#main-start-commands)
4. [Database Commands](#database-commands)
5. [Docker Commands](#docker-commands)
6. [Server Commands](#server-commands)
7. [Testing Commands](#testing-commands)
8. [Build Commands](#build-commands)
9. [Utility Commands](#utility-commands)

---

## Environment Overview

### Understanding the Environment Confusion

The project has evolved to support multiple environments, which has created some confusion:

1. **`local`** - Development with local Docker databases (PostgreSQL, Redis)
2. **`development`** - Can mean either local development OR cloud development
3. **`production`** - Production environment
4. **`test`** - Test environment with separate database

### Key Environment Variables

```bash
APP_ENV          # Controls which environment: local, development, test, production
NODE_ENV         # Standard Node environment: development, production, test
DATABASE_URL     # PostgreSQL connection string
EXPO_PUBLIC_*    # Variables exposed to React Native app
```

---

## Main Start Commands

### 🚀 Unified Start Script
The main entry point for all environments:

```bash
# Default (network mode - mobile devices can connect)
bun start

# Local mode (localhost only)
bun start:local

# Tunnel mode (remote access via Expo tunnel)
bun start:tunnel

# OAuth mode (optimized for OAuth testing)
bun start:oauth
```

### 🏥 Healthcare Mode
Full healthcare system with demo data:

```bash
# Start healthcare with all services
bun run local:healthcare
# OR
bun run start:healthcare

# Healthcare with network access for mobile
./scripts/start-unified.sh healthcare-network
```

### 📱 Platform-Specific Commands (Expo Go)

```bash
# Start for specific platforms with Expo Go
bun run android    # Android with Expo Go
bun run ios        # iOS with Expo Go  
bun run web        # Web browser with Expo Go

# Development builds (without Expo Go)
bun run android:dev
bun run ios:dev
bun run web:dev
```

### 🌍 Environment-Specific Start Commands

```bash
# Local environment (Docker databases)
bun run local              # APP_ENV=local, uses local PostgreSQL
bun run local:tunnel       # Local with tunnel for remote access
bun run local:oauth        # Local optimized for OAuth testing

# Development environment 
bun run dev                # APP_ENV=development
bun run dev:healthcare     # Development with healthcare setup
bun run dev:tunnel         # Development with tunnel

# Other environments
bun run staging            # APP_ENV=staging
bun run prod               # APP_ENV=production
```

---

## Database Commands

### 🗄️ Database Management

```bash
# Docker database control
bun run db:local:up        # Start PostgreSQL & Redis containers
bun run db:local:down      # Stop containers
bun run db:local:reset     # Reset (delete data and restart)

# Database migrations
bun run db:migrate         # Run migrations (current environment)
bun run db:migrate:dev     # Run migrations for development
bun run db:migrate:test    # Run migrations for test
bun run db:migrate:prod    # Run migrations for production

# Database push (sync schema without migrations)
bun run db:push            # Push to current environment
bun run db:push:dev        # Push to development (APP_ENV=development)
bun run db:push:test       # Push to test database
bun run db:push:prod       # Push to production database

# Database studio (GUI)
bun run db:studio          # Open Drizzle Studio (current env)
bun run db:studio:dev      # Studio for development database
bun run db:studio:prod     # Studio for production database
```

### 🏥 Healthcare Setup Commands

```bash
# Setup healthcare demo data
bun run healthcare:setup              # Default setup
bun run healthcare:setup:local        # Explicitly for local
bun run healthcare:setup:dev          # For development environment
bun run healthcare:setup:complete     # Complete setup with all data

# Healthcare utilities
bun run healthcare:update-users       # Update user organizations
bun run db:fix-hospital              # Fix hospital data issues
```

### How Database URLs are Determined

The database URL is selected based on `APP_ENV`:

```typescript
// From drizzle.config.ts
switch (APP_ENV) {
  case 'test':
    DATABASE_URL = TEST_DATABASE_URL || 'postgresql://myexpo:myexpo123@localhost:5432/myexpo_test';
  case 'production':
    DATABASE_URL = PROD_DATABASE_URL || DATABASE_URL || 'postgresql://myexpo:myexpo123@localhost:5432/myexpo_prod';
  case 'development':
  case 'local':
  default:
    DATABASE_URL = DATABASE_URL || 'postgresql://myexpo:myexpo123@localhost:5432/myexpo_dev';
}
```

---

## Docker Commands

### 🐳 Basic Docker Operations

```bash
# Core services (PostgreSQL, Redis)
bun run docker:up          # Start core services
bun run docker:down        # Stop all services
bun run docker:reset       # Reset all containers and volumes
bun run docker:ps          # List running containers

# Start all services including microservices
bun run docker:up:all      # Start everything
bun run docker:up:services # Start with services profile
bun run docker:up:build    # Rebuild and start

# View logs
bun run docker:logs        # All containers
bun run docker:logs:postgres
bun run docker:logs:ws     # WebSocket logs
bun run docker:logs:email  # Email service logs
bun run docker:logs:logging # Logging service logs
```

### 📊 PostHog Analytics

```bash
# PostHog self-hosted
bun run docker:posthog      # Start PostHog
bun run docker:posthog:down # Stop PostHog
bun run docker:posthog:logs # View PostHog logs

# Analytics profile (includes PostHog)
bun run docker:analytics
```

### 🚀 Production Docker

```bash
bun run docker:prod:up     # Start production containers
bun run docker:prod:down   # Stop production containers
bun run docker:prod:logs   # View production logs
```

---

## Server Commands

### 🖥️ Individual Server Commands

```bash
# Start individual services (useful for debugging)
bun run server:dev         # API server
bun run server:auth        # Auth server  
bun run server:ws          # WebSocket server
bun run server:email       # Email notification server
bun run server:logging     # Logging service
bun run server:posthog     # PostHog setup script
```

### 🔌 WebSocket Testing

```bash
bun run test:websocket         # Test WebSocket alerts
bun run test:websocket:simple  # Simple WebSocket test
bun run ws:standalone          # Standalone WebSocket server
```

---

## Testing Commands

### 🧪 Test Scripts

```bash
# General testing
bun run test               # Run Jest tests
bun run test:api           # Test API endpoints
bun run api:health         # Check API health

# Authentication testing
bun run test:auth          # Test auth flow
bun run debug:auth         # Debug auth issues
bun run debug:mobile       # Debug mobile auth

# OAuth testing
bun run oauth:test         # Test OAuth flow
bun run oauth:test:server  # Test OAuth server
bun run oauth:reset        # Reset OAuth users

# Healthcare testing
bun run test:healthcare    # Test healthcare flow
bun run test:healthcare:full # Full integration test

# Service testing
bun run test:email         # Test email service
bun run test:logging       # Test logging service
bun run demo:logging       # Demo TRPC logging
```

### 🔍 Code Quality

```bash
# Linting
bun run lint               # Run ESLint
bun run lint:fix           # Fix lint issues

# Type checking
bun run type-check         # TypeScript type check
bun run typecheck          # Alias for type-check
```

---

## Build Commands

### 📱 EAS Build Commands

```bash
# Preview builds
bun run build:ios          # iOS preview build
bun run build:android      # Android preview build
bun run build:all          # Both platforms

# Production builds
bun run build:ios:production
bun run build:android:production
```

---

## Utility Commands

### 🛠️ Setup and Configuration

```bash
# Environment setup
bun run setup:env          # Setup environment
bun run oauth:env          # Generate OAuth env files

# iOS specific
bun run fix:ios            # Fix iOS dependencies
bun run credentials:setup  # Setup iOS credentials
```

### 🧹 Cleanup Commands

```bash
# Clean project
bun run clean              # Basic clean (node_modules, .expo)
bun run clean:all          # Deep clean (includes builds)

# Fix common issues
bun run fix:metro          # Clear Metro cache
bun run fix:imports        # Fix import issues
bun run fix:console        # Remove console.logs
```

### 🌐 Ngrok Commands

```bash
bun run ngrok:setup        # Setup ngrok
bun run ngrok:start        # Start ngrok tunnel
```

---

## Common Workflows

### Starting Fresh Development

```bash
# 1. Start Docker services
bun run docker:up

# 2. Setup database
bun run db:push:dev

# 3. Start development
bun run local:healthcare   # With healthcare demo
# OR
bun start                  # Basic start
```

### Testing OAuth Login

```bash
# 1. Start OAuth-optimized environment
bun run local:oauth

# 2. If needed, fix OAuth issues
bun run oauth:fix
```

### Mobile Device Testing

```bash
# 1. Start in network mode
bun start

# 2. Use the IP address shown in console
# Example: http://192.168.1.100:8081
```

### Production Deployment

```bash
# 1. Set production environment
export APP_ENV=production

# 2. Run migrations
bun run db:migrate:prod

# 3. Build for production
bun run build:ios:production
bun run build:android:production
```

---

## Environment Resolution Guide

### When to use `local` vs `development`

- **Use `local`** when:
  - Developing with Docker databases on your machine
  - Testing features that require local services
  - Working offline

- **Use `development`** when:
  - Connecting to cloud development databases
  - Testing with remote services
  - Collaborating with team members

### Recommended Approach

1. **Standardize on `local` for local development**
2. **Use `development` for cloud/shared environments**
3. **Always check `APP_ENV` in your scripts**

### Script Execution Flow

```mermaid
graph TD
    A[User runs command] --> B{Which command?}
    B -->|bun start| C[start-unified.sh]
    B -->|bun run local:healthcare| D[start-with-healthcare.sh]
    B -->|bun run db:*| E[drizzle-kit with APP_ENV]
    
    C --> F{Which mode?}
    F -->|network| G[Mobile-friendly setup]
    F -->|local| H[Localhost only]
    F -->|tunnel| I[Expo tunnel]
    F -->|oauth| J[OAuth optimized]
    
    D --> K[Start services]
    K --> L[PostgreSQL]
    K --> M[Redis]
    K --> N[Email Server]
    K --> O[WebSocket]
    K --> P[Expo]
```

---

## Troubleshooting

### Common Issues

1. **Docker not running**
   ```bash
   # Check Docker
   docker info
   # Start Docker Desktop manually
   ```

2. **Port already in use**
   ```bash
   # Kill processes on ports
   lsof -ti:8081 | xargs kill -9
   lsof -ti:3001 | xargs kill -9
   lsof -ti:3002 | xargs kill -9
   ```

3. **Database connection errors**
   ```bash
   # Ensure Docker is running
   bun run docker:up
   # Reset database
   bun run db:local:reset
   ```

4. **TypeScript errors**
   ```bash
   # Fix TypeScript issues
   bun run type-check
   # Update dependencies
   bun install
   ```