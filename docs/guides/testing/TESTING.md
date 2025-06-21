# Testing Guide

## Overview

This guide covers the testing infrastructure, patterns, and best practices for the Healthcare Alert System. We use jest-expo for React Native testing with platform-specific configurations.

## Table of Contents

1. [Test Infrastructure](#test-infrastructure)
2. [File Naming Convention](#file-naming-convention)
3. [Test Organization](#test-organization)
4. [Writing Tests](#writing-tests)
5. [Running Tests](#running-tests)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

## Test Infrastructure

### Jest Configuration

We use jest-expo preset with platform-specific test projects:

```javascript
// jest.config.js
module.exports = {
  preset: 'jest-expo',
  projects: [
    // iOS-specific tests
    {
      preset: 'jest-expo/ios',
      testMatch: ['<rootDir>/**/__tests__/**/*-test.[jt]s?(x)'],
    },
    // Android-specific tests
    {
      preset: 'jest-expo/android',
      testMatch: ['<rootDir>/**/__tests__/**/*-test.[jt]s?(x)'],
    },
    // Web-specific tests
    {
      preset: 'jest-expo/web',
      testMatch: ['<rootDir>/**/__tests__/**/*-test.[jt]s?(x)'],
    },
  ],
  // ... other config
};
```

### Test Utilities

Located in `testing/test-utils.tsx`:

```typescript
import { renderWithProviders } from '@/testing/test-utils';

// Renders component with all necessary providers
const { getByText } = renderWithProviders(<MyComponent />);
```

## File Naming Convention

All test files follow the `-test` pattern:
- Component tests: `ComponentName-test.tsx`
- Hook tests: `useHookName-test.ts`
- Utility tests: `utilityName-test.ts`
- Integration tests: `feature-flow-test.tsx`

## Test Organization

```
__tests__/
├── animations/          # Animation system tests
│   ├── core/           # Core animation logic
│   ├── platform/       # Platform-specific tests
│   ├── integration/    # Integration scenarios
│   ├── variants/       # Variant system tests
│   └── components/     # Component animations
├── unit/               # Unit tests
│   ├── hooks/         # Hook tests
│   ├── utils/         # Utility tests
│   └── stores/        # Store tests
├── components/        # Component tests
│   ├── universal/     # Universal components
│   ├── blocks/        # Block components
│   └── navigation/    # Navigation tests
├── integration/       # Integration tests
│   ├── auth/         # Auth flows
│   ├── healthcare/   # Healthcare workflows
│   └── api/          # API integration
├── e2e/              # End-to-end tests
│   └── maestro/      # Maestro test flows
├── helpers/          # Test utilities
├── mocks/            # Test mocks
└── setup/            # Test setup files
```

## Writing Tests

### Component Tests

```typescript
import React from 'react';
import { renderWithProviders } from '@/testing/test-utils';
import { Button } from '@/components/universal/Button';

describe('Button', () => {
  it('renders correctly', () => {
    const { getByText } = renderWithProviders(
      <Button onPress={jest.fn()}>Click me</Button>
    );
    
    expect(getByText('Click me')).toBeTruthy();
  });

  it('handles press events', () => {
    const onPress = jest.fn();
    const { getByText } = renderWithProviders(
      <Button onPress={onPress}>Click me</Button>
    );
    
    fireEvent.press(getByText('Click me'));
    expect(onPress).toHaveBeenCalled();
  });
});
```

### Hook Tests

```typescript
import { renderHook } from '@testing-library/react-native';
import { useCounter } from '@/hooks/useCounter';

describe('useCounter', () => {
  it('increments counter', () => {
    const { result } = renderHook(() => useCounter());
    
    act(() => {
      result.current.increment();
    });
    
    expect(result.current.count).toBe(1);
  });
});
```

### Animation Tests

```typescript
import { mockAnimationDriver } from '@/testing/animation-test-utils';
import { animationConfig } from '@/lib/ui/animations/config';

describe('Animation Config', () => {
  beforeEach(() => {
    mockAnimationDriver();
  });

  it('applies scale animation on press', () => {
    expect(animationConfig.scale.press).toBe(0.99);
  });
});
```

### Platform-Specific Tests

```typescript
import { testPlatformAnimation } from '@/testing/animation-test-utils';

describe('Platform Animations', () => {
  testPlatformAnimation('handles iOS haptic feedback', 'ios', () => {
    // iOS-specific test
  });

  testPlatformAnimation('handles Android ripple effect', 'android', () => {
    // Android-specific test
  });

  testPlatformAnimation('handles web hover states', 'web', () => {
    // Web-specific test
  });
});
```

## Running Tests

### All Tests
```bash
npm test
# or
bun test:all
```

### Specific Test File
```bash
npm test -- Button-test
# or
bun test:all Button-test
```

### Test Coverage
```bash
npm run test:coverage
# or
bun test:coverage
```

### Watch Mode
```bash
npm test -- --watch
# or
bun test:watch
```

### Platform-Specific Tests
```bash
# iOS only
npm test -- --selectProjects ios

# Android only
npm test -- --selectProjects android

# Web only
npm test -- --selectProjects web
```

## Best Practices

### 1. Use Test Utilities

Always use the provided test utilities for consistent setup:

```typescript
import { renderWithProviders } from '@/testing/test-utils';
```

### 2. Mock External Dependencies

```typescript
jest.mock('@/lib/api/trpc', () => ({
  api: {
    user: {
      getProfile: {
        useQuery: jest.fn(() => ({
          data: mockUserData,
          isLoading: false,
        })),
      },
    },
  },
}));
```

### 3. Test User Interactions

```typescript
it('submits form with valid data', async () => {
  const onSubmit = jest.fn();
  const { getByText, getByPlaceholderText } = renderWithProviders(
    <LoginForm onSubmit={onSubmit} />
  );
  
  fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
  fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
  fireEvent.press(getByText('Login'));
  
  await waitFor(() => {
    expect(onSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });
});
```

### 4. Test Error States

```typescript
it('displays error message on failed submission', async () => {
  const { getByText, getByTestId } = renderWithProviders(<Form />);
  
  fireEvent.press(getByText('Submit'));
  
  await waitFor(() => {
    expect(getByTestId('error-message')).toBeTruthy();
  });
});
```

### 5. Clean Up After Tests

```typescript
afterEach(() => {
  jest.clearAllMocks();
  cleanup();
});
```

## Troubleshooting

### Common Issues

#### 1. NativeAnimatedHelper Error
**Error:** Cannot find module 'react-native/Libraries/Animated/NativeAnimatedHelper'
**Solution:** This is handled by jest-expo. Ensure you're using the jest-expo preset.

#### 2. window.matchMedia Not Defined
**Error:** TypeError: window.matchMedia is not a function
**Solution:** Already mocked in jest.setup.js

#### 3. AsyncStorage Mock Issues
**Error:** [@RNC/AsyncStorage]: NativeModule: AsyncStorage is null
**Solution:** Use the mock from __mocks__/@react-native-async-storage/async-storage.js

#### 4. Navigation Mock Issues
**Error:** No navigator available
**Solution:** Use NavigationContainer in tests or mock useNavigation

### Debug Tips

1. **Use debug()** to inspect component output:
```typescript
const { debug } = renderWithProviders(<Component />);
debug(); // Prints component tree
```

2. **Check Platform in Tests**:
```typescript
import { Platform } from 'react-native';

if (Platform.OS === 'ios') {
  // iOS-specific assertions
}
```

3. **Wait for Async Operations**:
```typescript
await waitFor(() => {
  expect(mockFn).toHaveBeenCalled();
}, { timeout: 5000 });
```

## Migration from Old Patterns

If you're updating old tests:

1. Change file extension from `.test.tsx` to `-test.tsx`
2. Replace `@testing-library/react-hooks` with `@testing-library/react-native`
3. Use `renderWithProviders` instead of manual provider setup
4. Remove `@ts-nocheck` and fix TypeScript errors

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [jest-expo Documentation](https://docs.expo.dev/guides/testing-with-jest/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)