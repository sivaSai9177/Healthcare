# Test Migration Examples

This guide shows real examples of migrating tests from old patterns to the new jest-expo setup.

## Example 1: Simple Component Test

### Before (Old Pattern)
```typescript
// Button.test.tsx
// @ts-nocheck
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../Button';

describe('Button', () => {
  it('renders correctly', () => {
    const { getByText } = render(
      <Button onPress={() => {}}>Click me</Button>
    );
    expect(getByText('Click me')).toBeTruthy();
  });
});
```

### After (New Pattern)
```typescript
// Button-test.tsx
import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '@/testing/test-utils';
import { Button } from '@/components/universal/Button';

describe('Button', () => {
  it('renders correctly', () => {
    const onPress = jest.fn();
    const { getByText } = renderWithProviders(
      <Button onPress={onPress}>Click me</Button>
    );
    
    expect(getByText('Click me')).toBeTruthy();
  });

  it('handles press events', () => {
    const onPress = jest.fn();
    const { getByText } = renderWithProviders(
      <Button onPress={onPress}>Click me</Button>
    );
    
    fireEvent.press(getByText('Click me'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
```

### Key Changes:
1. File renamed from `.test.tsx` to `-test.tsx`
2. Removed `@ts-nocheck`
3. Use `renderWithProviders` for consistent setup
4. Added proper TypeScript types
5. More comprehensive test coverage

## Example 2: Hook Test Migration

### Before (Old Pattern)
```typescript
// useAuth.test.ts
// @ts-nocheck
import { renderHook, act } from '@testing-library/react-hooks';
import { useAuth } from '../useAuth';

test('should login user', async () => {
  const { result } = renderHook(() => useAuth());
  
  await act(async () => {
    await result.current.login('test@example.com', 'password');
  });
  
  expect(result.current.user).toBeDefined();
});
```

### After (New Pattern)
```typescript
// useAuth-test.ts
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useAuth } from '@/hooks/useAuth';
import { AuthProvider } from '@/components/providers/AuthProvider';

describe('useAuth', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  it('should login user successfully', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    await act(async () => {
      await result.current.login({
        email: 'test@example.com',
        password: 'password123'
      });
    });
    
    await waitFor(() => {
      expect(result.current.user).toEqual({
        id: expect.any(String),
        email: 'test@example.com',
        role: 'user'
      });
    });
  });

  it('should handle login errors', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    await act(async () => {
      await result.current.login({
        email: 'invalid@example.com',
        password: 'wrong'
      });
    });
    
    expect(result.current.error).toBe('Invalid credentials');
    expect(result.current.user).toBeNull();
  });
});
```

### Key Changes:
1. Import from `@testing-library/react-native` instead of `react-hooks`
2. Added proper wrapper with providers
3. Better error handling tests
4. Proper TypeScript types throughout

## Example 3: Animation Test Migration

### Before (Old Pattern)
```typescript
// animation.test.ts
import { Animated } from 'react-native';
import { fadeIn } from '../animations';

jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

test('fadeIn animation', () => {
  const value = new Animated.Value(0);
  fadeIn(value);
  expect(value).toBeDefined();
});
```

### After (New Pattern)
```typescript
// animation-config-test.ts
import { mockAnimationDriver } from '@/testing/animation-test-utils';
import { animationConfig, createAnimation } from '@/lib/ui/animations/config';
import { Animated } from 'react-native';

describe('Animation Config', () => {
  beforeEach(() => {
    mockAnimationDriver();
  });

  it('creates fade in animation with correct config', () => {
    const animation = createAnimation('fadeIn', {
      from: 0,
      to: 1,
      duration: animationConfig.duration.normal
    });
    
    expect(animation.duration).toBe(200);
    expect(animation.useNativeDriver).toBe(true);
  });

  it('runs fade in animation to completion', () => {
    const value = new Animated.Value(0);
    const animation = Animated.timing(value, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true
    });
    
    animation.start();
    
    // Fast-forward animations
    jest.advanceTimersByTime(200);
    
    expect(value).toBeDefined();
  });
});
```

### Key Changes:
1. Use animation test utilities
2. No manual NativeAnimatedHelper mock needed
3. More specific test assertions
4. Proper timer handling

## Example 4: Integration Test Migration

### Before (Old Pattern)
```typescript
// login-flow.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { LoginScreen } from '../screens/LoginScreen';
import { NavigationContainer } from '@react-navigation/native';

test('login flow', async () => {
  const { getByPlaceholderText, getByText } = render(
    <NavigationContainer>
      <LoginScreen />
    </NavigationContainer>
  );
  
  fireEvent.changeText(getByPlaceholderText('Email'), 'test@test.com');
  fireEvent.changeText(getByPlaceholderText('Password'), 'password');
  fireEvent.press(getByText('Login'));
  
  await waitFor(() => {
    expect(getByText('Dashboard')).toBeTruthy();
  });
});
```

### After (New Pattern)
```typescript
// auth-flow-test.tsx
import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '@/testing/test-utils';
import { LoginScreen } from '@/app/(auth)/login';
import { api } from '@/lib/api/trpc';

// Mock API
jest.mock('@/lib/api/trpc', () => ({
  api: {
    auth: {
      login: {
        useMutation: jest.fn(() => ({
          mutateAsync: jest.fn().mockResolvedValue({
            user: { id: '1', email: 'test@test.com' },
            token: 'mock-token'
          }),
          isLoading: false,
        })),
      },
    },
  },
}));

describe('Authentication Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('completes login flow successfully', async () => {
    const { getByPlaceholderText, getByText, getByTestId } = renderWithProviders(
      <LoginScreen />
    );
    
    // Fill form
    fireEvent.changeText(getByPlaceholderText('Email'), 'test@test.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'SecurePass123!');
    
    // Submit
    fireEvent.press(getByText('Sign In'));
    
    // Wait for navigation
    await waitFor(() => {
      expect(api.auth.login.useMutation).toHaveBeenCalled();
    });
  });

  it('shows validation errors for invalid input', async () => {
    const { getByPlaceholderText, getByText } = renderWithProviders(
      <LoginScreen />
    );
    
    // Submit with empty fields
    fireEvent.press(getByText('Sign In'));
    
    await waitFor(() => {
      expect(getByText('Email is required')).toBeTruthy();
      expect(getByText('Password is required')).toBeTruthy();
    });
  });

  it('handles API errors gracefully', async () => {
    // Mock API error
    (api.auth.login.useMutation as jest.Mock).mockReturnValueOnce({
      mutateAsync: jest.fn().mockRejectedValue(new Error('Network error')),
      isLoading: false,
    });

    const { getByPlaceholderText, getByText } = renderWithProviders(
      <LoginScreen />
    );
    
    fireEvent.changeText(getByPlaceholderText('Email'), 'test@test.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password');
    fireEvent.press(getByText('Sign In'));
    
    await waitFor(() => {
      expect(getByText('Network error')).toBeTruthy();
    });
  });
});
```

### Key Changes:
1. Comprehensive test coverage
2. Proper API mocking
3. Error case handling
4. Validation testing
5. Better test organization

## Example 5: Store Test Migration

### Before (Old Pattern)
```typescript
// store.test.ts
import { renderHook } from '@testing-library/react-hooks';
import { useStore } from '../store';

test('updates count', () => {
  const { result } = renderHook(() => useStore());
  result.current.increment();
  expect(result.current.count).toBe(1);
});
```

### After (New Pattern)
```typescript
// theme-store-test.ts
import { renderHook, act } from '@testing-library/react-native';
import { useThemeStore } from '@/lib/stores/theme-store';

describe('Theme Store', () => {
  beforeEach(() => {
    // Reset store to initial state
    useThemeStore.setState(useThemeStore.getInitialState());
  });

  it('toggles theme between light and dark', () => {
    const { result } = renderHook(() => useThemeStore());
    
    expect(result.current.theme).toBe('light');
    
    act(() => {
      result.current.toggleTheme();
    });
    
    expect(result.current.theme).toBe('dark');
    
    act(() => {
      result.current.toggleTheme();
    });
    
    expect(result.current.theme).toBe('light');
  });

  it('persists theme preference', async () => {
    const { result } = renderHook(() => useThemeStore());
    
    act(() => {
      result.current.setTheme('dark');
    });
    
    // Simulate app restart by resetting and rehydrating
    const savedState = useThemeStore.getState();
    useThemeStore.setState(useThemeStore.getInitialState());
    
    // Restore state
    act(() => {
      useThemeStore.setState(savedState);
    });
    
    expect(result.current.theme).toBe('dark');
  });
});
```

### Key Changes:
1. Proper store reset between tests
2. Testing persistence behavior
3. More comprehensive state testing
4. Act wrapper for state updates

## Common Patterns to Update

### 1. Replace Testing Library Imports
```typescript
// Old
import { renderHook } from '@testing-library/react-hooks';

// New
import { renderHook } from '@testing-library/react-native';
```

### 2. Use Test Utilities
```typescript
// Old
import { render } from '@testing-library/react-native';
const { getByText } = render(<Component />);

// New
import { renderWithProviders } from '@/testing/test-utils';
const { getByText } = renderWithProviders(<Component />);
```

### 3. Fix TypeScript Errors
```typescript
// Old
// @ts-nocheck
const mockFn = jest.fn();
mockFn.mockResolvedValue(data); // TS error

// New
const mockFn = jest.fn<Promise<DataType>, [ParamType]>();
mockFn.mockResolvedValue(data);
```

### 4. Update File Names
```bash
# Old
Component.test.tsx

# New
Component-test.tsx
```

## Checklist for Migration

- [ ] Rename file from `.test.tsx` to `-test.tsx`
- [ ] Remove `@ts-nocheck` directive
- [ ] Update imports to use new paths
- [ ] Replace render with renderWithProviders
- [ ] Fix all TypeScript errors
- [ ] Add proper test descriptions
- [ ] Test error cases
- [ ] Add loading state tests
- [ ] Verify mocks are working
- [ ] Run test to ensure it passes