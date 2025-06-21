# Auth Flow Integration Test Feedback

**Test File**: `__tests__/integration/auth-flow-improvements.test.tsx`  
**Status**: ❌ FAILING  
**Last Run**: 2025-01-19  

## Current Issues

### 1. TRPC Client Not Mocked
```
Error: No QueryClient set, use QueryClientProvider
```

**Root Cause**: TRPC requires QueryClient but it's not provided in tests.

**Fix Required**:
- Set up TRPC test client
- Mock API responses

### 2. Navigation Not Working
```
Error: useRouter must be wrapped in a <Router />
```

**Root Cause**: Expo Router context missing.

**Fix Required**:
- Use renderRouter from expo-router/testing-library
- Mock navigation properly

### 3. Async State Updates
```
Warning: An update to AuthProvider inside a test was not wrapped in act(...)
```

**Root Cause**: Async state updates happening outside act().

**Fix Required**:
- Use waitFor for async operations
- Wrap state updates in act()

## Proposed Solutions

### Solution 1: TRPC Test Setup
```typescript
import { createTRPCMsw } from 'msw-trpc';
import { setupServer } from 'msw/node';

const trpcMsw = createTRPCMsw<AppRouter>();

const server = setupServer(
  trpcMsw.auth.signIn.mutation((req, res, ctx) => {
    return res(ctx.status(200), ctx.data({
      user: { id: '1', email: 'test@example.com' },
      session: { token: 'test-token' }
    }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Solution 2: Router Test Setup
```typescript
import { renderRouter } from 'expo-router/testing-library';

test('auth flow', async () => {
  const { getByText } = renderRouter({
    'index': () => <LoginScreen />,
    'dashboard': () => <Dashboard />,
  }, {
    initialUrl: '/'
  });
  
  // Test flow...
});
```

### Solution 3: Async Handling
```typescript
import { waitFor, act } from '@testing-library/react-native';

test('login flow', async () => {
  const { getByTestId } = render(<LoginScreen />);
  
  const emailInput = getByTestId('email-input');
  const passwordInput = getByTestId('password-input');
  
  await act(async () => {
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
  });
  
  const loginButton = getByTestId('login-button');
  fireEvent.press(loginButton);
  
  await waitFor(() => {
    expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
  });
});
```

## Test Scenarios

- [ ] Successful login flow
- [ ] Failed login with error message
- [ ] Password reset flow
- [ ] Email verification flow
- [ ] OAuth login flow
- [ ] Session persistence
- [ ] Auto-redirect when authenticated
- [ ] Profile completion after OAuth

## Test Data

```typescript
const testUsers = {
  valid: {
    email: 'test@example.com',
    password: 'Test123!',
  },
  invalid: {
    email: 'wrong@example.com',
    password: 'wrong',
  },
  oauth: {
    provider: 'google',
    email: 'oauth@gmail.com',
  }
};
```

## Dependencies

- Depends on: TRPC setup, Router setup, Auth providers
- Blocks: All authenticated feature tests

## Priority: 🔴 CRITICAL

Auth flow is the entry point for all authenticated features.