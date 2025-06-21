# Testing Troubleshooting Guide

## Common Test Failures and Solutions

### 1. Module Resolution Issues

#### Problem: Cannot find module '@/components/...'
```
Cannot find module '@/components/universal/Button' from '__tests__/components/Button-test.tsx'
```

**Solution:**
Ensure your `tsconfig.json` has the correct path mappings:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*", "./*"]
    }
  }
}
```

#### Problem: Mock module not found
```
Cannot find module '../__mocks__/async-storage' from 'jest.setup.js'
```

**Solution:**
Check that mock files exist in the correct location:
```bash
__mocks__/
├── @react-native-async-storage/
│   └── async-storage.js
└── react-native-safe-area-context.js
```

### 2. React Native Specific Errors

#### Problem: Invariant Violation: TurboModuleRegistry
```
Invariant Violation: TurboModuleRegistry.getEnforcing(...): 'NativeAnimatedModule'
```

**Solution:**
This is handled by jest-expo. Ensure you're using the correct preset:
```javascript
// jest.config.js
module.exports = {
  preset: 'jest-expo',
  // ...
};
```

#### Problem: NativeModule is null
```
[@RNC/AsyncStorage]: NativeModule: AsyncStorage is null.
```

**Solution:**
The module is already mocked. If still seeing errors, clear cache:
```bash
npm test -- --clearCache
```

### 3. Component Rendering Issues

#### Problem: Element not found
```
Unable to find an element with text: Login
```

**Solution 1:** Wait for async rendering:
```typescript
const { getByText } = renderWithProviders(<LoginScreen />);
await waitFor(() => {
  expect(getByText('Login')).toBeTruthy();
});
```

**Solution 2:** Check if element is conditionally rendered:
```typescript
// Debug to see what's rendered
const { debug } = renderWithProviders(<Component />);
debug();
```

#### Problem: Multiple elements found
```
Found multiple elements with text: Submit
```

**Solution:** Use more specific queries:
```typescript
// Use testID
const { getByTestId } = renderWithProviders(<Form />);
fireEvent.press(getByTestId('submit-button'));

// Or use getAllByText and index
const { getAllByText } = renderWithProviders(<Form />);
fireEvent.press(getAllByText('Submit')[0]);
```

### 4. Hook Testing Issues

#### Problem: Hook called outside of component
```
Error: Invalid hook call. Hooks can only be called inside of the body of a function component.
```

**Solution:** Use renderHook:
```typescript
import { renderHook } from '@testing-library/react-native';

const { result } = renderHook(() => useMyHook(), {
  wrapper: ({ children }) => (
    <Providers>{children}</Providers>
  ),
});
```

#### Problem: Updates not reflected
```
Expected: 2
Received: 1
```

**Solution:** Wrap updates in act:
```typescript
import { act } from '@testing-library/react-native';

act(() => {
  result.current.increment();
});

expect(result.current.count).toBe(2);
```

### 5. Async Testing Issues

#### Problem: Test completes before async operation
```
Warning: An update to Component inside a test was not wrapped in act(...)
```

**Solution 1:** Use waitFor:
```typescript
await waitFor(() => {
  expect(mockApi).toHaveBeenCalled();
});
```

**Solution 2:** Use findBy queries:
```typescript
const element = await findByText('Loaded Content');
expect(element).toBeTruthy();
```

### 6. Navigation Testing Issues

#### Problem: No navigator available
```
Error: Couldn't find a navigation object. Is your component inside a screen in a navigator?
```

**Solution:** Wrap with NavigationContainer:
```typescript
import { NavigationContainer } from '@react-navigation/native';

const { getByText } = render(
  <NavigationContainer>
    <MyScreen />
  </NavigationContainer>
);
```

Or mock the navigation:
```typescript
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
}));
```

### 7. Animation Testing Issues

#### Problem: Animation values not updating
```
Expected: 1
Received: 0
```

**Solution:** Mock animation driver:
```typescript
import { mockAnimationDriver } from '@/testing/animation-test-utils';

beforeEach(() => {
  mockAnimationDriver();
});
```

#### Problem: Reanimated worklet errors
```
[Reanimated] Trying to access property `value` of an undefined object.
```

**Solution:** Mock Reanimated:
```typescript
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});
```

### 8. Store Testing Issues

#### Problem: Store state not resetting between tests
```
Expected initial state but got previous test state
```

**Solution:** Reset stores in afterEach:
```typescript
import { useAuthStore } from '@/lib/stores/auth-store';

afterEach(() => {
  useAuthStore.setState(useAuthStore.getInitialState());
});
```

### 9. TypeScript Errors in Tests

#### Problem: Property does not exist on type
```
Property 'mockResolvedValue' does not exist on type
```

**Solution:** Type your mocks:
```typescript
const mockFn = jest.fn() as jest.MockedFunction<typeof originalFn>;
mockFn.mockResolvedValue(data);
```

### 10. Performance Issues

#### Problem: Tests running slowly
**Solutions:**

1. Run tests in parallel:
```bash
npm test -- --maxWorkers=4
```

2. Use focused tests during development:
```typescript
it.only('specific test', () => {
  // This test runs exclusively
});
```

3. Mock heavy operations:
```typescript
jest.mock('@/lib/api/client', () => ({
  api: {
    heavyOperation: jest.fn().mockResolvedValue(mockData),
  },
}));
```

## Debug Strategies

### 1. Print Component Tree
```typescript
const { debug } = renderWithProviders(<Component />);
debug(); // Shows rendered output
```

### 2. Log Specific Elements
```typescript
const { container } = renderWithProviders(<Component />);
console.log(container.innerHTML);
```

### 3. Check Test Environment
```typescript
console.log('Platform:', Platform.OS);
console.log('NODE_ENV:', process.env.NODE_ENV);
```

### 4. Increase Test Timeout
```typescript
it('long running test', async () => {
  // Test code
}, 10000); // 10 second timeout
```

### 5. Use Step-by-Step Debugging
```typescript
it('complex test', async () => {
  console.log('Step 1: Rendering');
  const { getByText } = renderWithProviders(<Component />);
  
  console.log('Step 2: User interaction');
  fireEvent.press(getByText('Button'));
  
  console.log('Step 3: Checking result');
  await waitFor(() => {
    expect(getByText('Success')).toBeTruthy();
  });
});
```

## Platform-Specific Issues

### iOS Testing
- Haptic feedback mocks needed
- Safe area considerations
- iOS-specific gesture handling

### Android Testing
- Different status bar height
- Back button handling
- Android-specific permissions

### Web Testing
- window.matchMedia mocking
- Mouse vs touch events
- Responsive breakpoints

## Getting Help

1. Check test output carefully - error messages often point to the issue
2. Use `--verbose` flag for more detailed output
3. Search for similar issues in the codebase
4. Check Jest and React Native Testing Library documentation
5. Ask in team chat with:
   - Full error message
   - Minimal reproduction code
   - What you've already tried