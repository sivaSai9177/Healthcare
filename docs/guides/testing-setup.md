# Testing Setup Guide

## Overview

This guide explains how to set up and run tests for the Healthcare Alert System. We use separate test databases to ensure isolation from development data.

## Test Environment Architecture

```
┌─────────────────────┐     ┌─────────────────────┐
│  Development DB     │     │     Test DB         │
│  (Port: 5432)      │     │  (Port: 5433)       │
│  myexpo_dev         │     │  myexpo_test        │
└─────────────────────┘     └─────────────────────┘
         ↑                           ↑
         │                           │
    Development                Integration Tests
      Server                    Unit Tests
```

## Quick Start

### 1. Start Test Database

```bash
# Start test database containers
bun run test:db:setup

# This will:
# - Start PostgreSQL on port 5433
# - Start Redis on port 6380 (if needed)
# - Run database migrations
# - Confirm everything is ready
```

### 2. Run Tests

```bash
# Run all integration tests
bun run test:integration

# Run specific test file
bun test __tests__/integration/healthcare/simple-db.test.ts

# Run tests in watch mode
bun run test:integration:watch
```

### 3. Clean Up

```bash
# Stop test containers
bun run test:db:teardown

# Reset test database (stop and restart fresh)
bun run test:db:reset
```

## Test Categories

### Unit Tests
- **Location**: `__tests__/unit/`
- **Database**: Not required
- **Run**: `bun test:unit`

### Integration Tests
- **Location**: `__tests__/integration/`
- **Database**: Required (port 5433)
- **Run**: `bun test:integration`

### Component Tests
- **Location**: `__tests__/components/`
- **Database**: Not required
- **Run**: `bun test:components`

### E2E Tests
- **Location**: `__tests__/e2e/`
- **Database**: Required
- **Run**: `bun test:e2e`

## Environment Configuration

### Test Environment Variables

The `.env.test` file contains test-specific configuration:

```env
# Test environment
APP_ENV=test
NODE_ENV=test

# Test database (different port)
DATABASE_URL=postgresql://myexpo:myexpo123@localhost:5433/myexpo_test

# Test auth
BETTER_AUTH_SECRET=test-secret-key-for-testing-only

# Disable external services
WEBSOCKET_ENABLED=false
EMAIL_ENABLED=false
```

### Database Isolation

Test database runs on **port 5433** (vs 5432 for development):
- **Development**: `localhost:5432/myexpo_dev`
- **Test**: `localhost:5433/myexpo_test`

## Writing Tests

### Integration Test Example

```typescript
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { db } from '@/src/db';
import { setupTestDatabase, cleanupTestDatabase } from '@/__tests__/helpers/setup-test-db';

describe('Healthcare API Integration', () => {
  let isDbAvailable = false;

  beforeAll(async () => {
    isDbAvailable = await setupTestDatabase();
  });

  afterAll(async () => {
    if (isDbAvailable) {
      await cleanupTestDatabase();
    }
  });

  it('should create an alert', async () => {
    if (!isDbAvailable) {
      console.log('Skipping - database not available');
      return;
    }

    // Your test logic here
  });
});
```

### Test Utilities

Available test helpers in `__tests__/helpers/`:
- `setup-test-db.ts` - Database setup/teardown
- `test-utils.ts` - Common test utilities
- `mock-data.ts` - Test data generators

## Troubleshooting

### Database Connection Failed

1. Check if test containers are running:
   ```bash
   docker ps | grep test
   ```

2. Verify port 5433 is available:
   ```bash
   lsof -i :5433
   ```

3. Check container logs:
   ```bash
   docker logs myexpo-test-postgres
   ```

### Tests Timeout

1. Increase timeout in test:
   ```typescript
   jest.setTimeout(30000); // 30 seconds
   ```

2. Check database queries are optimized

3. Ensure indexes are created

### Import Errors

1. Check `jest.config.integration.js` for proper module mapping
2. Ensure TypeScript paths are configured
3. Verify ts-jest is installed

## CI/CD Integration

For GitHub Actions:

```yaml
- name: Start test database
  run: docker-compose -f docker-compose.test.yml up -d

- name: Wait for database
  run: ./scripts/wait-for-db.sh

- name: Run tests
  run: bun run test:integration
```

## Best Practices

1. **Always use test database** for integration tests
2. **Clean up test data** after each test suite
3. **Use transactions** for test isolation
4. **Mock external services** (email, push notifications)
5. **Run tests in parallel** where possible

## Common Commands

```bash
# Full test suite
bun test

# Integration tests only
bun run test:integration

# With coverage
bun run test:integration --coverage

# Specific file
bun test path/to/test.ts

# Debug mode
node --inspect-brk ./node_modules/.bin/jest --runInBand
```

## Next Steps

1. Set up E2E tests with Detox/Playwright
2. Add performance testing
3. Implement visual regression tests
4. Set up test data factories

---

For more information, see:
- [Jest Documentation](https://jestjs.io)
- [Testing Best Practices](./testing-best-practices.md)
- [CI/CD Setup](./ci-cd.md)