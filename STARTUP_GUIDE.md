# Startup Guide

## Quick Start Options

### 1. Simple Mode (Recommended for development)
```bash
# Just start Expo without any backend services
bun run start
# or
bun run local
```

### 2. Full Stack Mode (With Database)
```bash
# First time setup (run once)
bun run db:setup:local

# Then start with all services
bun run local:healthcare
```

## Available Scripts

### Basic Development
- `bun run start` - Simple Expo start (no database needed)
- `bun run web` - Start web only
- `bun run ios` - Start iOS simulator
- `bun run android` - Start Android emulator

### Full Stack Development
- `bun run db:setup:local` - Initial database setup (run once)
- `bun run local:healthcare` - Start with all services (PostgreSQL, Redis, WebSocket, Email)
- `bun run db:local:up` - Start just the database containers
- `bun run db:local:down` - Stop database containers

### Database Management
- `bun run db:studio:local` - Open Drizzle Studio to view/edit database
- `bun run db:push:local` - Push schema changes to database
- `bun run db:reset` - Reset database to fresh state

## When to Use Each Mode

### Use Simple Mode (`bun run start`) when:
- Working on UI/UX only
- Testing component changes
- Don't need backend functionality
- Want faster startup times

### Use Full Stack Mode (`bun run local:healthcare`) when:
- Testing authentication flows
- Working with healthcare features
- Need real-time updates (WebSocket)
- Testing email notifications

## Troubleshooting

### If you see "Database not initialized" error:
```bash
bun run db:setup:local
```

### If ports are already in use:
```bash
# Kill processes on common ports
lsof -ti:8081 | xargs kill -9
lsof -ti:5432 | xargs kill -9
lsof -ti:6379 | xargs kill -9
```

### If Docker is not running:
Make sure Docker Desktop is running before using database-related commands.