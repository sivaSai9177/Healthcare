# Testing Strategy

## Overview

Our testing strategy follows a pyramid approach with comprehensive coverage across unit, integration, component, and E2E tests. We prioritize fast, reliable tests that catch bugs early and provide confidence in our healthcare system.

## Testing Pyramid

```
         /\
        /E2E\         <- User flows (5%)
       /------\
      /Component\     <- UI components (15%)
     /----------\
    /Integration \    <- API & services (30%)
   /--------------\
  /   Unit Tests   \  <- Business logic (50%)
 /------------------\
```

## Test Categories

### 1. Unit Tests (50% of tests)
**Purpose**: Test business logic in isolation

**What to test**:
- Pure functions
- Utility methods
- Validation logic
- Calculations
- Data transformations

**Example**:
```typescript
// alert-utils.test.ts
describe('calculateResponseTime', () => {
  it('should calculate time between creation and acknowledgment', () => {
    const alert = {
      createdAt: new Date('2024-01-01T10:00:00'),
      acknowledgedAt: new Date('2024-01-01T10:05:30'),
    };
    expect(calculateResponseTime(alert)).toBe(330); // 5.5 minutes
  });
});
```

### 2. Integration Tests (30% of tests)
**Purpose**: Test API endpoints and service interactions

**What to test**:
- TRPC routers
- Database operations
- External service calls
- Authentication flows
- WebSocket events

**Example**:
```typescript
// alert-creation-flow.test.ts
it('should create alert and notify staff', async () => {
  const alert = await caller.healthcare.createAlert({
    roomNumber: 'A301',
    urgencyLevel: 4,
  });
  
  expect(alert.status).toBe('active');
  expect(mockWebSocket.emit).toHaveBeenCalledWith('alert:new', alert);
});
```

### 3. Component Tests (15% of tests)
**Purpose**: Test React Native components

**What to test**:
- Component rendering
- User interactions
- Props handling
- State changes
- Error states

**Example**:
```typescript
// AlertList.test.tsx
it('should render empty state when no alerts', () => {
  const { getByText } = render(
    <AlertList alerts={[]} onRefresh={jest.fn()} />
  );
  expect(getByText('No active alerts')).toBeTruthy();
});
```

### 4. E2E Tests (5% of tests)
**Purpose**: Test complete user workflows

**What to test**:
- Critical user paths
- Cross-platform functionality
- Real API interactions
- Push notifications
- Offline scenarios

**Example**:
```typescript
// e2e/alert-flow.test.ts
it('should handle complete alert flow', async () => {
  await element(by.id('create-alert-btn')).tap();
  await element(by.id('room-input')).typeText('A301');
  await element(by.id('submit-btn')).tap();
  await expect(element(by.text('Alert created'))).toBeVisible();
});
```

## Best Practices

### 1. Test Naming
- Use descriptive names that explain what is being tested
- Follow pattern: `should [expected behavior] when [condition]`
- Group related tests with `describe` blocks

### 2. Test Structure (AAA)
```typescript
it('should acknowledge alert', async () => {
  // Arrange
  const alert = createMockAlert();
  
  // Act
  const result = await acknowledgeAlert(alert.id);
  
  // Assert
  expect(result.status).toBe('acknowledged');
});
```

### 3. Mocking Strategy
- Mock external dependencies (database, APIs, WebSocket)
- Use real implementations for business logic
- Create reusable mock utilities

### 4. Test Data
- Use factories for consistent test data
- Avoid hardcoded values
- Clean up after tests

### 5. Performance
- Keep tests fast (< 100ms for unit tests)
- Run tests in parallel
- Use `beforeAll` for expensive setup
- Mock heavy operations

## Testing Tools

### Core Tools
- **Jest**: Test runner and assertion library
- **React Testing Library**: Component testing
- **Supertest**: API endpoint testing
- **MSW**: API mocking
- **Detox**: E2E testing for React Native

### Utilities
- **test-utils.ts**: Common test helpers
- **mock-utils.ts**: Mock data factories
- **jest-setup.js**: Global test configuration

## Coverage Goals

| Type | Current | Target | Priority |
|------|---------|--------|----------|
| Unit | 85% | 95% | High |
| Integration | 0% | 80% | High |
| Component | 10% | 90% | Medium |
| E2E | 0% | 70% | Low |
| **Overall** | **40%** | **85%** | - |

## CI/CD Integration

### Pull Request Checks
1. All tests must pass
2. Coverage must not decrease
3. No new TypeScript errors
4. ESLint warnings < 100

### Deployment Gates
1. Unit tests: 100% pass rate
2. Integration tests: 95% pass rate
3. E2E smoke tests: 100% pass rate
4. Performance benchmarks met

## Testing Workflow

### Development
1. Write tests first (TDD) for new features
2. Run tests in watch mode
3. Fix failing tests immediately
4. Maintain coverage above 80%

### Pre-commit
```bash
# Run affected tests
bun run test --onlyChanged

# Check coverage
bun run test:coverage
```

### CI Pipeline
1. Lint and type check
2. Run all tests in parallel
3. Generate coverage report
4. Run E2E tests on staging
5. Performance tests

## Common Patterns

### Testing Async Operations
```typescript
it('should handle async operations', async () => {
  const promise = fetchData();
  await expect(promise).resolves.toEqual({ data: 'test' });
});
```

### Testing Errors
```typescript
it('should throw on invalid input', () => {
  expect(() => validateAlert({})).toThrow('Room number required');
});
```

### Testing Hooks
```typescript
const { result } = renderHook(() => useAlerts());
act(() => {
  result.current.acknowledgeAlert('123');
});
expect(result.current.alerts[0].status).toBe('acknowledged');
```

## Debugging Tests

### Common Issues
1. **Timeout errors**: Increase timeout or mock async operations
2. **Import errors**: Check module resolution and mocks
3. **State leakage**: Ensure proper cleanup between tests
4. **Flaky tests**: Remove time dependencies, use fake timers

### Debug Commands
```bash
# Run single test with debugging
node --inspect-brk ./node_modules/.bin/jest path/to/test.ts

# Run with verbose output
bun run test --verbose

# Run with specific test name
bun run test -t "should create alert"
```