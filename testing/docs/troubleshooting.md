# Testing Troubleshooting Guide

## Common Issues and Solutions

### 1. TextEncoder is not defined

**Error**:
```
ReferenceError: TextEncoder is not defined
```

**Cause**: The `pg` (PostgreSQL) library requires TextEncoder/TextDecoder which aren't available in the Jest environment.

**Solution**:
Add to your Jest setup file:
```javascript
// jest.setup.js
if (typeof TextEncoder === 'undefined') {
  global.TextEncoder = require('util').TextEncoder;
}
if (typeof TextDecoder === 'undefined') {
  global.TextDecoder = require('util').TextDecoder;
}
```

### 2. React Component Import Errors

**Error**:
```
Element type is invalid: expected a string (for built-in components) 
or a class/function (for composite components) but got: undefined.
```

**Cause**: Missing or incorrect component exports/imports.

**Solutions**:
1. Check component exports:
```typescript
// ❌ Wrong
export const MyComponent = () => {...}
export default OtherComponent;

// ✅ Correct
export { MyComponent };
export default MyComponent;
```

2. Check imports:
```typescript
// ❌ Wrong
import MyComponent from './MyComponent'; // But it's named export
import { Button } from './Button'; // But it's default export

// ✅ Correct
import { MyComponent } from './MyComponent';
import Button from './Button';
```

### 3. TRPC useUtils is not a function

**Error**:
```
TypeError: api.useUtils is not a function
```

**Cause**: Incomplete TRPC mock implementation.

**Solution**:
Add complete TRPC mock to Jest setup:
```javascript
jest.mock('@/lib/api/trpc', () => ({
  api: {
    useUtils: jest.fn(() => ({
      healthcare: {
        getActiveAlerts: { invalidate: jest.fn() },
        // Add other invalidate methods
      },
    })),
    healthcare: {
      // Add your API methods here
    },
  },
}));
```

### 4. Database Connection Timeout

**Error**:
```
Timeout - Async callback was not invoked within the 5000 ms timeout
```

**Cause**: Tests trying to connect to real database.

**Solutions**:

1. Mock the database module:
```javascript
// __mocks__/src/db/index.ts
export const db = {
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  // Add other methods
};
```

2. Use in-memory database for integration tests:
```javascript
import { createTestDatabase } from '@/test-utils';
const testDb = await createTestDatabase();
```

### 5. React Native Module Mocking

**Error**:
```
Cannot find module 'react-native-reanimated'
```

**Solution**:
Add to Jest config:
```javascript
moduleNameMapper: {
  '^react-native-reanimated$': '<rootDir>/__mocks__/react-native-reanimated.js',
}
```

Create mock file:
```javascript
// __mocks__/react-native-reanimated.js
module.exports = {
  default: {
    createAnimatedComponent: (comp) => comp,
    // Add other methods
  },
};
```

### 6. Async Test Failures

**Error**:
```
Warning: An update to Component inside a test was not wrapped in act(...)
```

**Solution**:
Wrap state updates in act:
```javascript
import { act, render } from '@testing-library/react-native';

it('should update state', async () => {
  const { getByText } = render(<Component />);
  
  await act(async () => {
    fireEvent.press(getByText('Button'));
  });
  
  expect(getByText('Updated')).toBeTruthy();
});
```

### 7. Module Path Resolution

**Error**:
```
Cannot find module '@/components/Button' from 'test.tsx'
```

**Solution**:
Ensure Jest config has proper module mapping:
```javascript
// jest.config.js
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/$1',
}
```

### 8. Test Environment Issues

**Error**:
```
The error below may be caused by using the wrong test environment
```

**Solution**:
Set correct test environment in Jest config:
```javascript
projects: [
  {
    displayName: 'node',
    testEnvironment: 'node',
    testMatch: ['**/__tests__/unit/**/*.test.ts'],
  },
  {
    displayName: 'jsdom',
    testEnvironment: 'jsdom',
    testMatch: ['**/__tests__/components/**/*.test.tsx'],
  },
]
```

### 9. Coverage Not Generated

**Issue**: Coverage reports not being generated.

**Solution**:
Add coverage configuration:
```javascript
// jest.config.js
collectCoverageFrom: [
  'src/**/*.{ts,tsx}',
  '!src/**/*.d.ts',
  '!src/**/*.test.{ts,tsx}',
],
coverageThreshold: {
  global: {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80,
  },
},
```

### 10. Slow Tests

**Issue**: Tests taking too long to run.

**Solutions**:

1. Mock heavy operations:
```javascript
jest.mock('@/lib/heavy-operation', () => ({
  processData: jest.fn().mockResolvedValue({ result: 'mocked' }),
}));
```

2. Use `beforeAll` for expensive setup:
```javascript
let testData;
beforeAll(async () => {
  testData = await setupExpensiveData();
});
```

3. Run tests in parallel:
```bash
jest --maxWorkers=4
```

## Debugging Tips

### 1. Verbose Output
```bash
bun run test --verbose
```

### 2. Run Single Test
```bash
bun run test -t "test name"
```

### 3. Debug in Chrome
```bash
node --inspect-brk ./node_modules/.bin/jest --runInBand
```
Then open `chrome://inspect`

### 4. Show Test Coverage
```bash
bun run test --coverage --coverageReporters=text
```

### 5. Clear Jest Cache
```bash
jest --clearCache
```

## Environment Variables

Ensure these are set for tests:
```bash
# .env.test
NODE_ENV=test
DATABASE_URL=postgresql://test:test@localhost:5432/test_db
BETTER_AUTH_SECRET=test-secret
EXPO_PUBLIC_API_URL=http://localhost:3000
```

## Getting Help

1. Check Jest documentation: https://jestjs.io/docs/
2. React Testing Library: https://testing-library.com/docs/react-native-testing-library/intro/
3. Project issues: Create an issue with test logs
4. Community: Stack Overflow with [jest] tag