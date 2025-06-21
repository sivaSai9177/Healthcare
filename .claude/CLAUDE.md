# Claude Context - Healthcare Alert System MVP

## Project Overview

**Project**: Healthcare Alert System MVP  
**Tech Stack**: Expo SDK 52, React Native, TypeScript, tRPC, Better Auth, Drizzle ORM  
**Architecture**: Containerized with Docker, Deployed with Kamal  
**Status**: 90% Production Ready - Script consolidation and testing phase

### Key Features
- 🏥 Real-time Healthcare Alert Management
- 🔐 Complete Authentication (Better Auth v1.2.8)
- 📱 Cross-platform (iOS, Android, Web)
- 🐳 Fully Containerized with Docker
- 🚀 Kamal Deployment Ready
- 🔄 WebSocket Real-time Updates
- 📧 Multi-channel Notifications

## Current Phase: Production Preparation

**Focus**: Script consolidation, testing infrastructure, and deployment verification  
**Timeline**: June 19-30, 2025

### Active Tasks
```bash
# View current todos in your session
# Currently working on:
# 1. Script consolidation (manage-users.ts ✅, manage-database.ts pending)
# 2. Docker environment testing
# 3. Unit and integration tests
# 4. Kamal deployment preparation
```

## Docker Development Environment

### Quick Start
```bash
# Start full development environment
./scripts/docker-dev.sh start --with-tools

# Access containers
./scripts/docker-dev.sh shell app      # Main app
./scripts/docker-dev.sh shell scripts  # Script runner

# Run scripts in container
./scripts/docker-dev.sh run-script scripts/users/manage-users.ts list

# View logs
./scripts/docker-dev.sh logs app
```

### Container Services
- **app**: Main Expo application (ports: 8081, 3000)
- **postgres**: PostgreSQL database (port: 5432)
- **redis**: Cache and WebSocket support (port: 6379)
- **websocket**: Real-time server (port: 3002)
- **scripts**: Isolated script runner
- **mailhog**: Email testing (port: 8025) - optional
- **pgadmin**: Database UI (port: 5050) - optional

## Script Management

### Completed Scripts
1. **manage-users.ts** - Enhanced user management
   - Healthcare profile support
   - Organization/hospital creation
   - Multiple scenarios (demo, healthcare, MVP)
   - User verification and permissions
   ```bash
   # Examples
   bun run scripts/users/manage-users.ts setup-healthcare
   bun run scripts/users/manage-users.ts verify doremon@gmail.com
   ```

### In Progress
2. **manage-database.ts** - Database operations (pending)
3. **manage-auth.ts** - Auth and OAuth management (pending)

### Script Development Workflow
```bash
# 1. Create/edit script
# 2. Test in Docker container
./scripts/docker-dev.sh run-script scripts/your-script.ts

# 3. Add unit tests
bun test scripts/test/your-script.test.ts

# 4. Run integration tests
./scripts/docker-dev.sh shell scripts
bun run test:integration
```

## Deployment with Kamal

### Production Deployment
```bash
# 1. Setup environment
cp .env.example .env.production
# Edit with production values

# 2. Deploy
export $(cat .env.production | xargs)
kamal setup    # First time
kamal deploy   # Updates

# 3. Post-deployment
kamal app exec 'bun run db:push'
kamal app exec 'bun run scripts/users/manage-users.ts setup-healthcare'
```

### Deployment Files
- `Dockerfile.production` - Multi-stage production build
- `Dockerfile.development` - Development with hot reload
- `docker-compose.dev.yml` - Local development stack
- `config/deploy.yml` - Kamal configuration
- `.kamal/hooks/*` - Deployment lifecycle hooks

## Testing Infrastructure

### Test Categories
1. **Unit Tests** - Individual functions and utilities
2. **Integration Tests** - Script functionality with real services
3. **E2E Tests** - Full user flows (pending)

### Running Tests
```bash
# Local tests
bun test

# Docker container tests
./scripts/docker-dev.sh shell scripts
bun test

# Specific test file
bun test scripts/test/manage-users.test.ts
```

## Project Structure

### Key Directories
- `/scripts` - All management scripts
  - `/users` - User management
  - `/database` - DB operations
  - `/auth` - Authentication
  - `/test` - Test scripts
  - `/config` - Shared configuration
  - `/lib` - Utility functions
- `/.kamal` - Deployment configuration
- `/docker` - Docker-specific files

### Important Files
- `docker-dev.sh` - Docker environment manager
- `KAMAL_DEPLOYMENT_MVP.md` - Deployment guide
- `MVP_DEPLOYMENT_STATUS.md` - Current status
- `.env.example` - Environment template

## Code Quality Standards

### For Scripts
- ✅ TypeScript with proper types
- ✅ Error handling with try/catch
- ✅ Colored output with chalk
- ✅ Help text and examples
- ✅ Environment validation
- ✅ Database transactions where needed
- ✅ Cleanup on exit (SIGINT/SIGTERM)

### Testing Requirements
- Unit tests for all utility functions
- Integration tests for critical paths
- Mock external services when needed
- Test both success and failure cases
- Minimum 80% coverage

## Quick Reference

### Database Operations
```bash
# Migrations
./scripts/docker-dev.sh migrate

# Reset database
./scripts/docker-dev.sh reset-db

# Seed data
./scripts/docker-dev.sh seed
```

### User Management
```bash
# Create users
bun run scripts/users/manage-users.ts setup-healthcare

# List users
bun run scripts/users/manage-users.ts list

# Verify user
bun run scripts/users/manage-users.ts verify email@example.com
```

### Debugging
```bash
# Container shells
docker-compose -f docker-compose.dev.yml exec app sh
docker-compose -f docker-compose.dev.yml exec scripts sh

# Database access
docker-compose -f docker-compose.dev.yml exec postgres psql -U postgres healthcare_dev

# Redis CLI
docker-compose -f docker-compose.dev.yml exec redis redis-cli
```

## Environment Variables

### Required for Development
```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/healthcare_dev
BETTER_AUTH_SECRET=development-secret
REDIS_URL=redis://localhost:6379
```

### Required for Production
```env
DEPLOY_SERVER_IP=your.server.ip
DEPLOY_DOMAIN=healthcare.yourdomain.com
DOCKER_REGISTRY_USERNAME=your-username
DATABASE_URL=postgres://user:pass@host/db
# ... see .env.example for full list
```

## Current Metrics

- **Scripts**: 270 total, 1 consolidated (manage-users.ts)
- **Docker**: Development environment ready ✅
- **Kamal**: Production deployment configured ✅
- **Tests**: Infrastructure ready, tests pending
- **TypeScript**: No errors in consolidated scripts ✅

## Next Actions

1. **Test manage-users.ts in Docker**
   ```bash
   ./scripts/docker-dev.sh start
   ./scripts/docker-dev.sh run-script scripts/users/manage-users.ts list
   ```

2. **Create manage-database.ts**
   - Consolidate DB reset, backup, migration scripts
   - Add health checks
   - Include maintenance operations

3. **Add Unit Tests**
   - Test utility functions in scripts/lib
   - Test configuration loaders
   - Mock external dependencies

4. **Deploy to Staging**
   - Test full Kamal deployment
   - Verify all services start
   - Check SSL and routing

---

**Remember**: Always test scripts in Docker container before deployment!