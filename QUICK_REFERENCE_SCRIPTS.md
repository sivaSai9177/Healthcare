# Quick Reference - Script Development & Testing

## 🚀 Getting Started

### 1. Start Docker Environment
```bash
./scripts/docker-dev.sh start --with-tools
```

### 2. Test Your Scripts
```bash
# Run script in container
./scripts/docker-dev.sh run-script scripts/users/manage-users.ts list

# Access script container shell
./scripts/docker-dev.sh shell scripts

# Run directly in container
docker-compose -f docker-compose.dev.yml exec scripts bun run scripts/users/manage-users.ts
```

## 📋 Current Status

### ✅ Completed
- **manage-users.ts** - Full user management with healthcare support
- **Docker environment** - Complete development setup
- **Kamal deployment** - Production ready

### 🔄 Next Tasks
1. **manage-database.ts** - Consolidate DB scripts
2. **manage-auth.ts** - Consolidate auth/OAuth scripts
3. **Unit tests** - Test utility functions
4. **Integration tests** - Test scripts with real services

## 🛠️ Script Development Pattern

### 1. Create New Script
Use the template structure from manage-users.ts:
```typescript
#!/usr/bin/env bun
import { initScript } from '../config/utils';
import { db } from '../../src/db';
import chalk from 'chalk';

async function main() {
  // Your script logic
}

initScript({
  name: 'Script Name',
  description: 'What it does',
  requiresDatabase: true,
}, main);
```

### 2. Test in Docker
```bash
# Quick test
./scripts/docker-dev.sh run-script scripts/your-script.ts

# Debug if needed
./scripts/docker-dev.sh shell scripts
bun run scripts/your-script.ts --help
```

### 3. Common Issues & Solutions

**Import Errors**
```typescript
// ❌ Wrong
import { db } from '@/src/db';

// ✅ Correct
import { db } from '../../src/db';
```

**Database Connection**
```bash
# Check if DB is running
docker-compose -f docker-compose.dev.yml ps

# View DB logs
./scripts/docker-dev.sh logs postgres
```

**TypeScript Errors**
```bash
# Check types
bun run typecheck

# Fix imports
bun run lint:fix
```

## 🧪 Testing

### Unit Test Template
```typescript
// scripts/test/your-script.test.ts
import { describe, it, expect } from 'bun:test';

describe('YourScript', () => {
  it('should do something', () => {
    expect(true).toBe(true);
  });
});
```

### Run Tests
```bash
# All tests
bun test

# Specific test
bun test scripts/test/manage-users.test.ts

# In Docker
./scripts/docker-dev.sh shell scripts
bun test
```

## 📁 File Locations

### Scripts
- User management: `scripts/users/`
- Database ops: `scripts/database/`
- Auth/OAuth: `scripts/auth/`
- Tests: `scripts/test/`
- Config: `scripts/config/`
- Utils: `scripts/lib/`

### Docker Files
- Dev compose: `docker-compose.dev.yml`
- Dev Dockerfile: `Dockerfile.development`
- Prod Dockerfile: `Dockerfile.production`
- Manager: `scripts/docker-dev.sh`

### Deployment
- Kamal config: `config/deploy.yml`
- Hooks: `.kamal/hooks/`
- Guide: `KAMAL_DEPLOYMENT_MVP.md`

## 🔍 Debugging

### View Logs
```bash
# App logs
./scripts/docker-dev.sh logs app

# All logs
./scripts/docker-dev.sh logs

# Follow logs
./scripts/docker-dev.sh logs -f
```

### Database Access
```bash
# PostgreSQL shell
docker-compose -f docker-compose.dev.yml exec postgres psql -U postgres healthcare_dev

# Quick query
docker-compose -f docker-compose.dev.yml exec postgres psql -U postgres healthcare_dev -c "SELECT * FROM users;"
```

### Environment Variables
```bash
# Check env in container
./scripts/docker-dev.sh shell scripts
env | grep DATABASE

# Set custom env
DATABASE_URL=custom docker-compose -f docker-compose.dev.yml exec scripts bun run scripts/test.ts
```

## 📝 Next Script: manage-database.ts

Should consolidate these scripts:
- `reset-database.ts`
- `db-reset.sh`
- `drop-all-tables.ts`
- `check-tables.ts`
- `apply-indexes.ts`
- Database backup/restore functionality

Key features to include:
```typescript
// Commands
- reset: Drop and recreate database
- backup: Create database backup
- restore: Restore from backup
- health: Check database health
- migrate: Run migrations
- seed: Seed test data
- analyze: Show table statistics
```

## 🚀 Deployment

### Quick Deploy
```bash
# Load production env
export $(cat .env.production | xargs)

# Deploy
kamal deploy

# Check status
kamal app logs
```

### Post-Deploy
```bash
# Run migrations
kamal app exec 'bun run db:push'

# Create admin
kamal app exec 'bun run scripts/users/manage-users.ts create admin@domain.com'
```

---

**Remember**: Always test in Docker first! 🐳