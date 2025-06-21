# Testing Guide

This guide covers the testing setup and best practices for our Expo React Native application.

## Table of Contents
- [Setup](#setup)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [E2E Testing](#e2e-testing)
- [Troubleshooting](#troubleshooting)

## Setup

Our testing stack includes:
- **Jest** with **jest-expo** preset for unit and integration testing
- **React Native Testing Library** for component testing
- **Maestro** for E2E testing

### Prerequisites

```bash
# Install dependencies
bun install

# Verify jest-expo is installed
bun list jest-expo
```

## Running Tests

### Unit Tests

```bash
# Run all tests
bun test:all

# Run tests in watch mode
bun test

# Run platform-specific tests
bun test:ios      # iOS-specific tests
bun test:android  # Android-specific tests
bun test:web      # Web-specific tests

# Run specific test suites
bun test:unit         # Unit tests only
bun test:integration  # Integration tests only
bun test:components   # Component tests only

# Healthcare-specific tests
bun test:healthcare:unit
bun test:healthcare:components
bun test:healthcare:integration
bun test:healthcare:all

# Generate coverage report
bun test:coverage
```

### E2E Tests with Maestro

```bash
# Install Maestro CLI
curl -Ls "https://get.maestro.mobile.dev" | bash

# Run E2E tests locally
maestro test .maestro/login-flow.yaml
maestro test .maestro/alert-creation-flow.yaml
maestro test .maestro/healthcare-navigation.yaml

# Run all E2E tests
maestro test .maestro/
```

## Writing Tests

### File Structure

```
__tests__/
├── unit/                    # Unit tests for hooks, utilities, etc.
│   ├── hooks/
│   └── healthcare/
├── components/              # Component tests
│   ├── healthcare/
│   └── navigation/
├── integration/             # Integration tests
│   └── healthcare/
└── e2e/                     # E2E test references
```

### Unit Test Example

```typescript
// __tests__/unit/hooks/usePermissions-test.tsx
import { renderHook } from '@testing-library/react-native';
import { usePermission } from '@/hooks/usePermissions';

describe('usePermission', () => {
  it('should return false when user has no role', () => {
    const { result } = renderHook(() => 
      usePermission(PERMISSIONS.VIEW_ALERTS)
    );
    
    expect(result.current.hasPermission).toBe(false);
  });
});
```

### Component Test Example

```typescript
// __tests__/components/Button-test.tsx
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '@/components/universal';

describe('Button', () => {
  it('should call onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Button onPress={onPress}>Click me</Button>
    );
    
    fireEvent.press(getByText('Click me'));
    expect(onPress).toHaveBeenCalled();
  });
});
```

### Navigation Test Example

```typescript
// __tests__/components/navigation/navigation-test.tsx
import { render } from '@testing-library/react-native';
import { useRouter } from 'expo-router';

describe('Navigation', () => {
  it('should navigate to healthcare dashboard', () => {
    const router = require('expo-router').router;
    
    // Trigger navigation
    router.push('/healthcare/dashboard');
    
    expect(router.push).toHaveBeenCalledWith('/healthcare/dashboard');
  });
});
```

### Platform-Specific Tests

```typescript
// __tests__/components/PlatformComponent.ios.test.tsx
describe('iOS specific behavior', () => {
  it('should render iOS-specific UI', () => {
    // iOS-specific test
  });
});

// __tests__/components/PlatformComponent.android.test.tsx
describe('Android specific behavior', () => {
  it('should render Android-specific UI', () => {
    // Android-specific test
  });
});
```

## Mocking

### Expo Router Mock

The Expo Router is automatically mocked in `__mocks__/expo-router.js`. You can control navigation state in tests:

```typescript
const expoRouter = require('expo-router');

// Set current pathname
expoRouter.__setMockPathname('/healthcare/alerts');

// Set params
expoRouter.__setMockParams({ id: '123' });

// Reset all mocks
expoRouter.__resetMocks();
```

### Auth Store Mock

```typescript
import { useAuthStore } from '@/lib/stores/auth-store';

jest.mock('@/lib/stores/auth-store');

// In your test
(useAuthStore as jest.Mock).mockImplementation((selector) => {
  const state = {
    user: { id: '1', role: 'doctor' },
    isAuthenticated: true,
    hasHydrated: true,
  };
  return selector(state);
});
```

## E2E Testing

E2E tests are written in YAML format for Maestro and stored in `.maestro/` directory.

### Basic E2E Test Structure

```yaml
appId: com.hospital.alertsystem
---
- launchApp
- assertVisible: "Welcome"
- tapOn: "Login"
- inputText: "user@example.com"
- tapOn: "Submit"
- assertVisible: "Dashboard"
```

### Running E2E Tests on CI

E2E tests can be integrated with EAS Build workflows. See `.eas/workflows/` for configuration.

## Best Practices

1. **Test File Naming**: Use `-test.tsx` suffix for test files
2. **Mock External Dependencies**: Always mock external services and APIs
3. **Test User Interactions**: Focus on user behavior rather than implementation
4. **Use Testing IDs**: Add `testID` props to components for reliable E2E testing
5. **Platform-Specific Tests**: Use `.ios.test.tsx`, `.android.test.tsx` for platform-specific tests
6. **Avoid Testing Inside App Directory**: Keep tests in `__tests__` directory, not in `app/`

## Troubleshooting

### Common Issues

1. **Transform Error**: If you see transform errors, check `transformIgnorePatterns` in `jest.config.js`

2. **Mock Not Working**: Ensure mocks are defined in `jest.setup.js` or `__mocks__/` directory

3. **Async Test Timeout**: Increase timeout for async operations:
   ```typescript
   jest.setTimeout(30000); // 30 seconds
   ```

4. **Platform-Specific Test Not Running**: Ensure you're using the correct command:
   ```bash
   bun test:ios    # For iOS tests
   bun test:android # For Android tests
   ```

### Debug Mode

Run tests in debug mode:
```bash
bun test:debug
```

Then open Chrome and navigate to `chrome://inspect` to debug.

## Coverage

We maintain the following coverage thresholds:
- Branches: 60%
- Functions: 60%
- Lines: 70%
- Statements: 70%

View coverage report:
```bash
bun test:coverage
open coverage/lcov-report/index.html
```

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Expo Testing Guide](https://docs.expo.dev/develop/unit-testing/)
- [Maestro Documentation](https://maestro.mobile.dev/)