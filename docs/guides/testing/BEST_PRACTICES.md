# Testing Best Practices

## Overview

This guide outlines best practices for writing maintainable, reliable, and efficient tests in the Healthcare Alert System.

## General Principles

### 1. Write Tests First (TDD)
Consider writing tests before implementation:
- Clarifies requirements
- Ensures testable code design
- Prevents over-engineering

### 2. Follow AAA Pattern
Structure tests with Arrange, Act, Assert:

```typescript
it('sends alert notification', async () => {
  // Arrange
  const alert = createMockAlert();
  const user = createMockUser();
  
  // Act
  const result = await sendAlertNotification(alert, user);
  
  // Assert
  expect(result.success).toBe(true);
  expect(result.notificationId).toBeDefined();
});
```

### 3. One Assertion Per Test (When Possible)
Keep tests focused:

```typescript
// Good - Separate tests
it('validates email format', () => {
  expect(isValidEmail('test@example.com')).toBe(true);
});

it('rejects invalid email format', () => {
  expect(isValidEmail('invalid-email')).toBe(false);
});

// Avoid - Multiple unrelated assertions
it('validates user input', () => {
  expect(isValidEmail('test@example.com')).toBe(true);
  expect(isValidPassword('password123')).toBe(true);
  expect(isValidPhone('+1234567890')).toBe(true);
});
```

## Component Testing

### 1. Test User Behavior, Not Implementation

```typescript
// Good - Tests behavior
it('submits form when user fills all required fields', async () => {
  const onSubmit = jest.fn();
  const { getByLabelText, getByText } = renderWithProviders(
    <ContactForm onSubmit={onSubmit} />
  );
  
  fireEvent.changeText(getByLabelText('Name'), 'John Doe');
  fireEvent.changeText(getByLabelText('Email'), 'john@example.com');
  fireEvent.press(getByText('Submit'));
  
  await waitFor(() => {
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'John Doe',
      email: 'john@example.com',
    });
  });
});

// Avoid - Tests implementation details
it('updates state when input changes', () => {
  // Don't test internal state directly
});
```

### 2. Use Accessible Queries

```typescript
// Good - Accessible queries
getByRole('button', { name: 'Submit' });
getByLabelText('Email address');
getByText('Welcome back');

// Avoid - Implementation details
getByTestId('submit-btn-id');
container.querySelector('.submit-button');
```

### 3. Test Edge Cases

```typescript
describe('AlertList', () => {
  it('shows empty state when no alerts', () => {
    const { getByText } = renderWithProviders(
      <AlertList alerts={[]} />
    );
    expect(getByText('No active alerts')).toBeTruthy();
  });

  it('handles maximum alerts gracefully', () => {
    const manyAlerts = Array(100).fill(null).map((_, i) => 
      createMockAlert({ id: i })
    );
    const { getByText } = renderWithProviders(
      <AlertList alerts={manyAlerts} />
    );
    expect(getByText('Showing 50 of 100 alerts')).toBeTruthy();
  });
});
```

## Hook Testing

### 1. Test Hook Logic Separately

```typescript
// Custom hook
export function useCounter(initialValue = 0) {
  const [count, setCount] = useState(initialValue);
  const increment = () => setCount(c => c + 1);
  const decrement = () => setCount(c => c - 1);
  const reset = () => setCount(initialValue);
  
  return { count, increment, decrement, reset };
}

// Test
describe('useCounter', () => {
  it('increments count', () => {
    const { result } = renderHook(() => useCounter(5));
    
    expect(result.current.count).toBe(5);
    
    act(() => {
      result.current.increment();
    });
    
    expect(result.current.count).toBe(6);
  });
});
```

### 2. Test Hook Integration

```typescript
it('integrates with component correctly', () => {
  const CounterComponent = () => {
    const { count, increment } = useCounter();
    return (
      <View>
        <Text>{count}</Text>
        <Button onPress={increment} title="Increment" />
      </View>
    );
  };

  const { getByText } = renderWithProviders(<CounterComponent />);
  
  expect(getByText('0')).toBeTruthy();
  fireEvent.press(getByText('Increment'));
  expect(getByText('1')).toBeTruthy();
});
```

## Async Testing

### 1. Always Handle Async Operations

```typescript
// Good - Proper async handling
it('loads user data', async () => {
  const { getByText, findByText } = renderWithProviders(<UserProfile />);
  
  // Shows loading initially
  expect(getByText('Loading...')).toBeTruthy();
  
  // Wait for data to load
  const userName = await findByText('John Doe');
  expect(userName).toBeTruthy();
});

// Avoid - No async handling
it('loads user data', () => {
  const { getByText } = renderWithProviders(<UserProfile />);
  expect(getByText('John Doe')).toBeTruthy(); // Might fail
});
```

### 2. Use Proper Timeout Values

```typescript
it('handles slow API responses', async () => {
  const { findByText } = renderWithProviders(<DataTable />);
  
  // Increase timeout for slow operations
  const data = await findByText('Data loaded', {}, { timeout: 5000 });
  expect(data).toBeTruthy();
});
```

## Mocking Best Practices

### 1. Mock at the Right Level

```typescript
// Good - Mock external dependencies
jest.mock('@/lib/api/client', () => ({
  api: {
    alerts: {
      create: jest.fn().mockResolvedValue({ id: '123' }),
    },
  },
}));

// Avoid - Mocking too much
jest.mock('@/components/universal/Button'); // Don't mock your own components
```

### 2. Reset Mocks Between Tests

```typescript
describe('AlertService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
});
```

### 3. Use Mock Factories

```typescript
// test-utils/factories.ts
export const createMockUser = (overrides = {}) => ({
  id: '1',
  email: 'test@example.com',
  role: 'operator',
  organizationId: 'org-1',
  ...overrides,
});

export const createMockAlert = (overrides = {}) => ({
  id: '1',
  priority: 'high',
  title: 'Test Alert',
  status: 'active',
  createdAt: new Date().toISOString(),
  ...overrides,
});

// Usage in tests
it('displays high priority alerts first', () => {
  const alerts = [
    createMockAlert({ priority: 'low' }),
    createMockAlert({ priority: 'high' }),
    createMockAlert({ priority: 'medium' }),
  ];
  
  const { getAllByTestId } = renderWithProviders(
    <AlertList alerts={alerts} />
  );
  
  const renderedAlerts = getAllByTestId('alert-item');
  expect(renderedAlerts[0]).toHaveTextContent('high');
});
```

## Performance Testing

### 1. Test Render Performance

```typescript
it('renders large lists efficiently', () => {
  const items = Array(1000).fill(null).map((_, i) => ({
    id: i,
    name: `Item ${i}`,
  }));

  const startTime = performance.now();
  
  const { getByText } = renderWithProviders(
    <VirtualizedList items={items} />
  );
  
  const renderTime = performance.now() - startTime;
  
  expect(renderTime).toBeLessThan(100); // Should render in under 100ms
  expect(getByText('Item 0')).toBeTruthy();
});
```

### 2. Test Memory Leaks

```typescript
it('cleans up subscriptions on unmount', () => {
  const unsubscribe = jest.fn();
  const subscribe = jest.fn(() => unsubscribe);
  
  const { unmount } = renderHook(() => 
    useSubscription(subscribe)
  );
  
  expect(subscribe).toHaveBeenCalled();
  
  unmount();
  
  expect(unsubscribe).toHaveBeenCalled();
});
```

## Accessibility Testing

### 1. Test Screen Reader Support

```typescript
it('provides accessible labels', () => {
  const { getByLabelText, getByRole } = renderWithProviders(
    <AlertCard alert={mockAlert} />
  );
  
  expect(getByLabelText('Alert priority: High')).toBeTruthy();
  expect(getByRole('button', { name: 'Acknowledge alert' })).toBeTruthy();
});
```

### 2. Test Keyboard Navigation

```typescript
it('supports keyboard navigation', () => {
  const { getAllByRole } = renderWithProviders(<MenuList />);
  const menuItems = getAllByRole('menuitem');
  
  // First item should be focused
  expect(menuItems[0]).toHaveFocus();
  
  // Simulate arrow down
  fireEvent.keyDown(menuItems[0], { key: 'ArrowDown' });
  expect(menuItems[1]).toHaveFocus();
});
```

## Test Organization

### 1. Group Related Tests

```typescript
describe('AlertNotification', () => {
  describe('rendering', () => {
    it('shows alert title', () => {});
    it('shows alert description', () => {});
    it('displays timestamp', () => {});
  });

  describe('interactions', () => {
    it('handles acknowledge action', () => {});
    it('handles escalate action', () => {});
  });

  describe('real-time updates', () => {
    it('updates when alert status changes', () => {});
    it('shows new comments in real-time', () => {});
  });
});
```

### 2. Use Descriptive Test Names

```typescript
// Good - Descriptive names
it('displays error message when email format is invalid');
it('prevents form submission with empty required fields');
it('shows success notification after alert is acknowledged');

// Avoid - Vague names
it('works correctly');
it('handles errors');
it('updates state');
```

## Common Pitfalls to Avoid

### 1. Testing Implementation Details
Don't test how something works, test what it does.

### 2. Excessive Mocking
Mock only what's necessary (external dependencies).

### 3. Ignoring Test Warnings
Address console warnings and errors in tests.

### 4. Not Testing Error Cases
Always test error scenarios and edge cases.

### 5. Brittle Tests
Avoid tests that break with minor UI changes.

### 6. Not Cleaning Up
Always clean up after tests (timers, subscriptions, etc.).

## Continuous Improvement

1. **Review Test Coverage**: Aim for meaningful coverage, not 100%
2. **Refactor Tests**: Keep tests clean and maintainable
3. **Learn from Failures**: When tests catch bugs, add more similar tests
4. **Update Documentation**: Keep test documentation current
5. **Share Knowledge**: Document testing patterns that work well