# Test Fixes Implementation Guide

This guide provides step-by-step fixes for common test failures in our Expo app.

## 🔧 Quick Fixes

### 1. AsyncStorage Mock Fix
```javascript
// jest.setup.js
jest.mock('@react-native-async-storage/async-storage', () => 
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
```

### 2. Unified Logger Mock Fix
```javascript
// Create __mocks__/@/lib/core/debug/unified-logger.js
module.exports = {
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    trace: jest.fn(),
    system: { info: jest.fn(), error: jest.fn() },
    auth: { info: jest.fn(), error: jest.fn() },
    api: { info: jest.fn(), error: jest.fn() },
  },
  log: jest.fn(),
  UnifiedLogger: jest.fn(),
};
```

### 3. Expo Router Mock Fix
```javascript
// __mocks__/expo-router.js
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  // ... other methods
};

module.exports = {
  useRouter: () => mockRouter,
  usePathname: () => '/',
  useSegments: () => [],
  // ... other exports
  __resetMocks: () => {
    Object.values(mockRouter).forEach(fn => fn.mockClear());
  }
};
```

## 📦 Test Wrapper Setup

### Create Universal Test Wrapper
```typescript
// testing/helpers/test-utils.tsx
import React from 'react';
import { render } from '@testing-library/react-native';

const AllTheProviders = ({ children }) => {
  return (
    <SafeAreaProvider>
      <TRPCProvider>
        <SessionProvider>
          <HospitalProvider>
            <ThemeProvider>
              {children}
            </ThemeProvider>
          </HospitalProvider>
        </SessionProvider>
      </TRPCProvider>
    </SafeAreaProvider>
  );
};

export const renderWithProviders = (ui, options) =>
  render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react-native';
```

## 🎯 Common Mock Patterns

### Mock Hooks Pattern
```typescript
// At the top of test file
jest.mock('@/hooks/useAuth');

// In test
import { useAuth } from '@/hooks/useAuth';
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

beforeEach(() => {
  mockUseAuth.mockReturnValue({
    user: { id: '1', name: 'Test User', role: 'doctor' },
    isAuthenticated: true,
    hasHydrated: true,
  });
});
```

### Mock API Calls Pattern
```typescript
// Using msw for API mocking
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.post('/api/auth/login', (req, res, ctx) => {
    return res(ctx.json({ 
      user: { id: '1' }, 
      token: 'test-token' 
    }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Mock Navigation Pattern
```typescript
// In test
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Test navigation
fireEvent.press(getByText('Navigate'));
expect(mockPush).toHaveBeenCalledWith('/dashboard');
```

## 🚨 Error-Specific Fixes

### "Cannot find module" Errors
1. Check if module is in node_modules
2. Create mock in `__mocks__` directory
3. Add to `moduleNameMapper` in jest.config.js

### "X must be wrapped in Provider" Errors
1. Use test wrapper with all providers
2. Mock the hook instead of using provider
3. Check provider hierarchy order

### "Act() warning" Errors
1. Wrap state updates in `act()`
2. Use `waitFor` for async operations
3. Ensure all promises resolve

### Dynamic Import Errors
1. Mock the module completely
2. Avoid dynamic imports in tests
3. Use static imports for test files

## 📋 Test Checklist

Before running tests:
- [ ] All dependencies installed
- [ ] Mocks directory structure correct
- [ ] jest.setup.js properly configured
- [ ] Test uses correct render method
- [ ] Async operations properly handled
- [ ] Navigation context provided
- [ ] API calls mocked
- [ ] Timers mocked if needed

## 🎯 Priority Order for Fixes

1. **jest.setup.js** - Fix global mocks
2. **Mock files** - Create missing mocks
3. **Test wrappers** - Create provider wrapper
4. **Individual tests** - Fix specific test issues

## 🔍 Debugging Tips

```bash
# Run single test file
npm test -- usePermissions-test --no-coverage

# Run with verbose output
npm test -- --verbose

# Run specific test
npm test -- -t "should return false when user is not loaded"

# Debug mode
npm run test:debug
```

## 📚 Resources

- [Jest Docs](https://jestjs.io/docs/getting-started)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [MSW Docs](https://mswjs.io/docs/)
- [Expo Testing Guide](https://docs.expo.dev/develop/unit-testing/)