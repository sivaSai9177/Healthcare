# Master Testing Guide - Healthcare App

## Table of Contents
1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Test Structure](#test-structure)
4. [Running Tests](#running-tests)
5. [Writing Tests](#writing-tests)
6. [Troubleshooting](#troubleshooting)
7. [CI/CD Integration](#cicd-integration)
8. [Best Practices](#best-practices)

## Overview

This guide consolidates all testing documentation for the Healthcare App. Our testing infrastructure includes:

- **74 Unit Tests** (100% passing)
- **37 Integration Tests** (written, environment fixes needed)
- **24 Component Tests** (17% passing)
- **GitHub Actions CI/CD** (configured and ready)

## Quick Start

```bash
# Run all tests
./testing/scripts/run-tests.sh all

# Run specific test suites
bun run test:healthcare:unit       # Unit tests only
bun run test:healthcare:integration # Integration tests
bun run test:healthcare:components  # Component tests

# Generate coverage report
./testing/scripts/coverage-report.sh

# Run tests in watch mode
bun run test:healthcare:watch
```

## Test Structure

```
my-expo/
├── __tests__/
│   ├── unit/
│   │   └── healthcare/         # Unit tests (100% passing)
│   ├── integration/
│   │   └── healthcare/         # Integration tests
│   └── components/
│       └── healthcare/         # Component tests
├── testing/
│   ├── config/                 # Jest configuration
│   ├── docs/                   # Testing documentation
│   ├── utils/                  # Test utilities
│   └── scripts/                # Test running scripts
└── coverage/                   # Coverage reports (generated)
```

## Running Tests

### Command Line Options

```bash
# Basic commands
bun run test                    # Run all tests
bun run test:healthcare:all     # Run all healthcare tests
bun run test:healthcare:unit    # Run unit tests only
bun run test:healthcare:watch   # Run in watch mode

# With options
bun run test --coverage         # Generate coverage
bun run test --verbose          # Verbose output
bun run test -t "alert"         # Run tests matching "alert"
bun run test --maxWorkers=4     # Parallel execution

# Debug mode
node --inspect-brk ./node_modules/.bin/jest --runInBand
```

### Environment Setup

```bash
# Required environment variables (.env.test)
NODE_ENV=test
APP_ENV=test
DATABASE_URL=postgresql://test:test@localhost:5432/test_db
BETTER_AUTH_SECRET=test-secret
EXPO_PUBLIC_API_URL=http://localhost:3000
```

## Writing Tests

### Unit Test Example

```typescript
// __tests__/unit/healthcare/alert-utils.test.ts
import { calculateEscalationTime } from '@/lib/healthcare/alert-utils';

describe('Alert Utils', () => {
  describe('calculateEscalationTime', () => {
    it('should return 5 minutes for urgency level 5', () => {
      expect(calculateEscalationTime(5)).toBe(5 * 60 * 1000);
    });
    
    it('should return 60 minutes for urgency level 1', () => {
      expect(calculateEscalationTime(1)).toBe(60 * 60 * 1000);
    });
  });
});
```

### Integration Test Example

```typescript
// __tests__/integration/healthcare/alert-flow.test.ts
import { createTestContext, createMockUser } from '@/testing/utils/test-utils';

describe('Alert Creation Flow', () => {
  let operator: MockUser;
  
  beforeEach(async () => {
    operator = await createMockUser({
      email: 'operator@test.com',
      role: 'operator',
      organizationId: 'test-org',
    });
  });
  
  it('should create and notify about new alert', async () => {
    const ctx = await createTestContext(operator);
    const caller = appRouter.createCaller(ctx);
    
    const alert = await caller.healthcare.createAlert({
      roomNumber: 'A301',
      urgencyLevel: 4,
      alertType: 'medical_emergency',
    });
    
    expect(alert.status).toBe('active');
    expect(mockWebSocket.emit).toHaveBeenCalledWith('alert:new', alert);
  });
});
```

### Component Test Example

```typescript
// __tests__/components/healthcare/AlertList.test.tsx
import { render, fireEvent } from '@testing-library/react-native';
import { AlertList } from '@/components/healthcare/AlertList';

describe('AlertList', () => {
  it('should render empty state', () => {
    const { getByText } = render(
      <AlertList alerts={[]} onRefresh={jest.fn()} />
    );
    
    expect(getByText('No active alerts')).toBeTruthy();
  });
  
  it('should call onRefresh when pulled', () => {
    const onRefresh = jest.fn();
    const { getByTestId } = render(
      <AlertList alerts={[]} onRefresh={onRefresh} />
    );
    
    fireEvent(getByTestId('alert-list'), 'refresh');
    expect(onRefresh).toHaveBeenCalled();
  });
});
```

## Troubleshooting

### Common Issues

1. **TextEncoder not defined**
   - Add polyfill to jest.setup.js
   - See [troubleshooting.md](./docs/troubleshooting.md#1-textencoder-is-not-defined)

2. **Component import errors**
   - Check named vs default exports
   - Verify mock configurations

3. **Database timeout**
   - Use mock database for tests
   - Don't connect to real PostgreSQL

4. **TRPC mock issues**
   - Ensure complete mock implementation
   - Match actual TRPC API structure

### Quick Fixes

```bash
# Clear Jest cache
jest --clearCache

# Update snapshots
bun run test -u

# Run specific file
bun run test path/to/test.ts

# Debug test
node --inspect-brk ./node_modules/.bin/jest path/to/test.ts
```

## CI/CD Integration

### GitHub Actions Workflow

Our CI pipeline (`.github/workflows/test.yml`) runs:

1. **Linting** - ESLint checks
2. **Type Checking** - TypeScript validation
3. **Unit Tests** - Fast, isolated tests
4. **Integration Tests** - API and service tests
5. **Component Tests** - UI component tests
6. **Coverage Report** - Codecov integration

### Pipeline Status

- ✅ Multi-node testing (Node 18.x, 20.x)
- ✅ PostgreSQL and Redis services
- ✅ Coverage reporting
- ⚠️ Tests run with `continue-on-error` (temporary)

## Best Practices

### 1. Test Organization
- Group related tests with `describe`
- Use clear, descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)

### 2. Mocking
- Mock external dependencies
- Use factory functions for test data
- Keep mocks close to tests

### 3. Performance
- Keep unit tests < 100ms
- Use `beforeAll` for expensive setup
- Run tests in parallel

### 4. Coverage
- Maintain > 80% coverage
- Focus on critical paths
- Don't test implementation details

### 5. Maintenance
- Update tests when changing code
- Remove obsolete tests
- Keep tests simple and focused

## Test Metrics Dashboard

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Unit Test Coverage | 85% | 95% | 🟡 |
| Integration Coverage | 0% | 80% | 🔴 |
| Component Coverage | 10% | 90% | 🔴 |
| Overall Coverage | 40% | 85% | 🔴 |
| Test Success Rate | 57% | 100% | 🟡 |
| CI Pipeline | ✅ | ✅ | 🟢 |

## Resources

- [Current Status](./docs/current-status.md) - Detailed test metrics
- [Testing Strategy](./docs/testing-strategy.md) - Overall approach
- [Troubleshooting](./docs/troubleshooting.md) - Common issues
- [Jest Documentation](https://jestjs.io/docs/)
- [React Testing Library](https://testing-library.com/docs/react-native-testing-library/intro/)

## Getting Help

1. Check the [troubleshooting guide](./docs/troubleshooting.md)
2. Run tests with `--verbose` for more info
3. Create an issue with test logs
4. Tag @healthcare-team for urgent issues

---

**Last Updated**: June 18, 2025
**Maintained By**: Healthcare Team
**Version**: 1.0.0