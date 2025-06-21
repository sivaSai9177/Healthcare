# PostgreSQL Docker Setup Guide

This project now uses PostgreSQL Docker containers for all environments (development, test, and production), removing the dependency on Neon cloud database.

## Overview

- **Development**: Uses local Docker PostgreSQL
- **Test**: Uses separate test database in Docker
- **Production**: Uses production-optimized PostgreSQL container

## Quick Start

### 1. Start Local Development Environment

```bash
# Start PostgreSQL and Redis
bun run docker:up

# Start all services (includes WebSocket, Email, etc.)
bun run docker:up:all

# Start with healthcare setup
bun run local:healthcare
```

### 2. Database Management

```bash
# Run migrations
bun run db:migrate:dev    # Development
bun run db:migrate:test   # Test
bun run db:migrate:prod   # Production

# Push schema changes
bun run db:push:dev
bun run db:push:test
bun run db:push:prod

# Open Drizzle Studio
bun run db:studio:dev
bun run db:studio:prod

# Reset database
bun run db:reset
```

## Environment Configuration

### Development (.env)

```env
# PostgreSQL Configuration
DATABASE_URL=postgresql://myexpo:myexpo123@localhost:5432/myexpo_dev
DEV_DATABASE_URL=postgresql://myexpo:myexpo123@localhost:5432/myexpo_dev
TEST_DATABASE_URL=postgresql://myexpo:myexpo123@localhost:5432/myexpo_test
PROD_DATABASE_URL=postgresql://myexpo:myexpo123@your-prod-host:5432/myexpo_prod

POSTGRES_USER=myexpo
POSTGRES_PASSWORD=myexpo123
POSTGRES_DB=myexpo_dev
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
```

## Docker Services

### Core Services

1. **PostgreSQL** (`postgres-local`)
   - Port: 5432
   - Databases: myexpo_dev, myexpo_test, myexpo_prod
   - Volume: local_postgres_data

2. **Redis** (`redis-local`)
   - Port: 6379
   - Volume: local_redis_data

3. **WebSocket Server** (`websocket-local`)
   - Port: 3002
   - Real-time alert subscriptions
   - TypeScript with hot reload

4. **Email Service** (`email-local`)
   - Port: 3001
   - Nodemailer with SMTP support
   - Email templates for healthcare alerts
   - Configure with your SMTP credentials

5. **Queue Worker** (`queue-worker-local`)
   - Background job processing
   - Alert notifications and escalations

### Optional Services

6. **MinIO** (`minio-local`)
   - API Port: 9000
   - Console: 9001
   - S3-compatible object storage

7. **PostHog** (`posthog-local`)
   - Port: 8000
   - Self-hosted analytics
   - Requires ClickHouse

8. **ClickHouse** (`clickhouse-local`)
   - HTTP Port: 8123
   - Native Port: 9000
   - Analytics database for PostHog

## Docker Commands

### Development

```bash
# Start core services
docker-compose -f docker-compose.local.yml up -d postgres-local redis-local

# Start all services
docker-compose -f docker-compose.local.yml up -d

# Start with specific profiles
docker-compose -f docker-compose.local.yml --profile services up -d
docker-compose -f docker-compose.local.yml --profile analytics up -d
docker-compose -f docker-compose.local.yml --profile storage up -d

# View logs
docker-compose -f docker-compose.local.yml logs -f websocket-local
docker-compose -f docker-compose.local.yml logs -f email-local

# Stop services
docker-compose -f docker-compose.local.yml down

# Reset everything (including volumes)
docker-compose -f docker-compose.local.yml down -v
```

### Production

```bash
# Start production stack
docker-compose -f docker-compose.prod.yml up -d

# Scale services
docker-compose -f docker-compose.prod.yml up -d --scale api-prod=3 --scale queue-worker-prod=2

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop production
docker-compose -f docker-compose.prod.yml down
```

## Database Schema

The project uses Drizzle ORM with the following main schemas:

- **Core**: Users, organizations, sessions
- **Healthcare**: Hospitals, alerts, healthcare users
- **Audit**: Activity logs, audit trails

## WebSocket Real-time Features

The WebSocket server (TypeScript) provides:

- Real-time alert notifications
- Metrics updates
- Hospital-specific event broadcasting
- Automatic reconnection support

### Testing WebSocket

```bash
# Simple connectivity test
bun run test:websocket:simple

# Full alert subscription test
bun run test:websocket
```

## PostHog Analytics Integration

To enable PostHog analytics:

1. Start PostHog services:
   ```bash
   bun run docker:analytics
   ```

2. Access PostHog at http://localhost:8000

3. Configure in your app:
   ```env
   POSTHOG_API_KEY=your-api-key
   POSTHOG_API_HOST=http://localhost:8000
   ```

## Troubleshooting

### Port Conflicts

If you have port conflicts:

```bash
# Check what's using a port
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis
lsof -i :3002  # WebSocket

# Kill process using a port
lsof -ti:3002 | xargs kill -9
```

### Database Connection Issues

1. Ensure Docker is running
2. Check if containers are healthy:
   ```bash
   docker-compose -f docker-compose.local.yml ps
   ```
3. Verify environment variables
4. Check container logs:
   ```bash
   docker logs myexpo-postgres-local
   ```

### WebSocket Connection Issues

1. Ensure WebSocket container is running
2. Check CORS settings in docker-compose.yml
3. Verify port 3002 is accessible
4. Check WebSocket logs:
   ```bash
   docker logs myexpo-websocket-local
   ```

## Migration from Neon

If migrating from Neon:

1. Export data from Neon
2. Import into local PostgreSQL:
   ```bash
   psql -U myexpo -d myexpo_dev -h localhost -p 5432 < backup.sql
   ```
3. Run migrations to ensure schema is up to date
4. Update all environment files to use PostgreSQL URLs

## Security Considerations

### Production

1. Change default passwords in production
2. Use SSL for PostgreSQL connections
3. Implement proper firewall rules
4. Use secrets management for credentials
5. Enable PostgreSQL audit logging
6. Regular backups with point-in-time recovery

### Development

1. Never commit .env files with real credentials
2. Use different passwords for each environment
3. Restrict database access to localhost in development