# Animation Testing Guide

This guide provides comprehensive patterns and best practices for testing animations in the Expo Modern Starter Kit.

## Overview

The animation system uses Tailwind CSS on web and React Native Reanimated on mobile platforms. Testing ensures animations work consistently across all platforms while maintaining performance.

## Test Setup

### Basic Setup

```typescript
import { animationTestUtils, setupTest } from '@/__tests__/animations/setup';
import { useAnimationStore } from '@/lib/stores/animation-store';

// Mock the animation store
jest.mock('@/lib/stores/animation-store');

describe('Your Animation Tests', () => {
  let mockStore: any;
  
  beforeEach(() => {
    mockStore = animationTestUtils.createMockAnimationStore();
    (useAnimationStore as jest.Mock).mockReturnValue(mockStore);
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
});
```

### Platform-Specific Setup

```typescript
// Test iOS animations
setupTest('ios');

// Test Android animations
setupTest('android');

// Test Web animations
setupTest('web');
```

## Testing Patterns

### 1. Testing Animation Hooks

```typescript
import { renderHook, act } from '@testing-library/react-hooks';
import { useAnimation } from '@/lib/ui/animations/hooks';

it('should animate on web platform', () => {
  setupTest('web');
  
  const { result } = renderHook(() => 
    useAnimation('fadeIn', { duration: 'fast' })
  );
  
  // Web returns CSS classes
  expect(result.current.className).toContain('animate-fadeIn');
  expect(result.current.className).toContain('duration-fast');
});

it('should animate on native platform', () => {
  setupTest('ios');
  
  const { result } = renderHook(() => 
    useAnimation('fadeIn')
  );
  
  // Native returns animated styles
  expect(result.current.animatedStyle).toBeDefined();
  expect(result.current.animatedStyle.opacity).toBeDefined();
});
```

### 2. Testing Component Animations

```typescript
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '@/components/universal/Button';

it('should animate button press', () => {
  const { getByText } = render(
    <Button animated animationVariant="energetic">
      Press Me
    </Button>
  );
  
  const button = getByText('Press Me').parent?.parent;
  
  // Trigger press animation
  fireEvent(button!, 'pressIn');
  
  // Verify haptic feedback
  animationTestUtils.expectHapticFeedback('light');
  
  fireEvent(button!, 'pressOut');
});
```

### 3. Testing Animation Variants

```typescript
it('should apply animation variant configuration', () => {
  const config = getAnimationConfig('subtle');
  
  expect(config.scale.hover).toBe(1.01);
  expect(config.duration.normal).toBe(250);
  expect(config.entrance.fade).toBe(true);
  expect(config.entrance.scale).toBe(false);
});
```

### 4. Testing Stagger Animations

```typescript
it('should stagger list item animations', async () => {
  const { getAllByTestId } = render(
    <List animated animationType="stagger">
      {[1, 2, 3].map(i => (
        <List.Item key={i} testID={`item-${i}`}>
          Item {i}
        </List.Item>
      ))}
    </List>
  );
  
  const items = getAllByTestId(/item-/);
  
  // Each item should have increasing delay
  items.forEach((item, index) => {
    const delay = 50 * index; // Base delay multiplied by index
    // Verify stagger delay applied
  });
});
```

### 5. Testing Platform-Specific Behaviors

```typescript
describe('Platform-specific animations', () => {
  it('should use CSS on web', () => {
    setupTest('web');
    
    const { getByTestId } = render(
      <Box animated className="animate-pulse" testID="web-box">
        Web Content
      </Box>
    );
    
    const box = getByTestId('web-box');
    const styles = animationTestUtils.getWebStyles(box);
    
    expect(styles.hasAnimation('pulse')).toBe(true);
  });
  
  it('should use Reanimated on iOS', () => {
    setupTest('ios');
    
    const { getByTestId } = render(
      <Box animated testID="ios-box">
        iOS Content
      </Box>
    );
    
    const box = getByTestId('ios-box');
    const styles = animationTestUtils.getNativeStyles(box);
    
    expect(styles).toBeDefined();
  });
});
```

## Common Testing Scenarios

### 1. Testing Animation Completion

```typescript
it('should call onComplete callback', async () => {
  const onComplete = jest.fn();
  const timer = animationTestUtils.mockAnimationTiming();
  
  const { result } = renderHook(() => 
    useAnimation('fadeIn', { duration: 'fast', onComplete })
  );
  
  act(() => {
    result.current.trigger();
  });
  
  timer.advanceTimersByTime(150); // fast duration
  
  expect(onComplete).toHaveBeenCalled();
  
  timer.cleanup();
});
```

### 2. Testing Reduced Motion

```typescript
it('should respect reduced motion preference', () => {
  animationTestUtils.mockReducedMotion(true);
  mockStore.reducedMotion = true;
  
  const { getByTestId } = render(
    <Button animated testID="reduced-motion">
      Button
    </Button>
  );
  
  const button = getByTestId('reduced-motion');
  fireEvent(button, 'pressIn');
  
  // No animations should occur
  expect(mockStore.shouldAnimate()).toBe(false);
});
```

### 3. Testing Animation Interruptions

```typescript
it('should handle animation interruptions gracefully', () => {
  const { getByTestId, rerender } = render(
    <Card animated animationType="lift" testID="card">
      Content
    </Card>
  );
  
  const card = getByTestId('card');
  
  // Start animation
  fireEvent(card, 'pressIn');
  
  // Interrupt by changing animation type
  rerender(
    <Card animated animationType="tilt" testID="card">
      Content
    </Card>
  );
  
  // Should not crash
  expect(card).toBeDefined();
});
```

### 4. Testing Memory Leaks

```typescript
it('should clean up animation listeners on unmount', async () => {
  const { unmount } = render(
    <Card animated>
      <Card.Content>Animated Content</Card.Content>
    </Card>
  );
  
  // Unmount component
  unmount();
  
  // Verify no memory leaks (implementation specific)
  // In real tests, you might check for listener cleanup
});
```

## Test Utilities Reference

### animationTestUtils

- `setPlatform(platform)` - Set the test platform
- `waitForAnimation(duration)` - Wait for animation completion
- `mockAnimationTiming()` - Mock animation timers
- `getWebStyles(element)` - Get CSS classes for web
- `getNativeStyles(element)` - Get animated styles for native
- `mockReducedMotion(enabled)` - Mock reduced motion preference
- `createMockAnimationStore(overrides)` - Create mock store
- `expectAnimationCompleted(callback)` - Assert animation completed
- `expectHapticFeedback(type)` - Assert haptic feedback triggered

### Common Pitfalls

1. **Forgetting Platform Setup**
   ```typescript
   // Bad - platform not set
   const { result } = renderHook(() => useAnimation('fadeIn'));
   
   // Good - platform explicitly set
   setupTest('ios');
   const { result } = renderHook(() => useAnimation('fadeIn'));
   ```

2. **Not Cleaning Up Timers**
   ```typescript
   // Bad - timer not cleaned up
   jest.useFakeTimers();
   
   // Good - proper cleanup
   const timer = animationTestUtils.mockAnimationTiming();
   // ... test code ...
   timer.cleanup();
   ```

3. **Testing Implementation Details**
   ```typescript
   // Bad - testing internal state
   expect(component.state.animationProgress).toBe(0.5);
   
   // Good - testing observable behavior
   expect(getByTestId('animated-element')).toBeDefined();
   ```

## Performance Testing

### Testing Animation Performance

```typescript
it('should maintain performance with multiple animations', () => {
  const startTime = performance.now();
  
  const { container } = render(
    <>
      {Array.from({ length: 50 }, (_, i) => (
        <Card key={i} animated>
          Card {i}
        </Card>
      ))}
    </>
  );
  
  const renderTime = performance.now() - startTime;
  
  // Should render quickly even with many animated elements
  expect(renderTime).toBeLessThan(100); // milliseconds
});
```

### Testing Animation Frame Rate

```typescript
it('should maintain 60fps during animations', async () => {
  // In a real test environment, you might use:
  // - React DevTools Profiler API
  // - Performance Observer API
  // - Custom frame rate measurement
  
  const { getByTestId } = render(
    <Card animated animationType="lift" testID="perf-card">
      Performance Test
    </Card>
  );
  
  // Trigger animation
  fireEvent(getByTestId('perf-card'), 'pressIn');
  
  // Measure frame rate (implementation specific)
});
```

## Best Practices

1. **Test Across All Platforms**
   - Always test animations on iOS, Android, and Web
   - Use platform-specific assertions

2. **Test Animation States**
   - Initial state
   - During animation
   - After completion
   - Interrupted state

3. **Test Edge Cases**
   - Rapid triggering
   - Component unmounting during animation
   - Invalid animation types
   - Extreme animation values

4. **Mock External Dependencies**
   - Animation store
   - Theme provider
   - Haptic feedback
   - AsyncStorage

5. **Use Descriptive Test Names**
   ```typescript
   // Good
   it('should fade in with 300ms duration on iOS platform')
   
   // Bad
   it('should work')
   ```

6. **Group Related Tests**
   ```typescript
   describe('Button Animations', () => {
     describe('Press Animations', () => {
       // Press-related tests
     });
     
     describe('Loading Animations', () => {
       // Loading-related tests
     });
   });
   ```

## Debugging Animation Tests

### Enable Debug Logging

```typescript
// In your test
mockStore.debugMode = true;

// Or use environment variable
process.env.DEBUG_ANIMATIONS = 'true';
```

### Inspect Animation Values

```typescript
it('should debug animation values', () => {
  const { result } = renderHook(() => useAnimation('scaleIn'));
  
  console.log('Animation style:', result.current.animatedStyle);
  console.log('Animation state:', {
    isAnimating: result.current.isAnimating,
    trigger: typeof result.current.trigger,
  });
});
```

### Visual Debugging

For complex animations, consider:
- Recording test runs
- Using snapshot testing for specific states
- Creating visual regression tests

## Continuous Integration

### CI Configuration

```yaml
# Example GitHub Actions config
- name: Run Animation Tests
  run: |
    npm run test:animations
  env:
    ANIMATION_TEST_PLATFORM: all
```

### Platform-Specific CI

```typescript
// Run platform-specific tests in CI
const platform = process.env.TEST_PLATFORM || 'all';

if (platform === 'all' || platform === 'ios') {
  describe('iOS Animations', () => {
    // iOS tests
  });
}
```

## Resources

- [React Native Reanimated Testing](https://docs.swmansion.com/react-native-reanimated/docs/testing)
- [Testing Library React Native](https://callstack.github.io/react-native-testing-library/)
- [Jest Timer Mocks](https://jestjs.io/docs/timer-mocks)
- [React Hooks Testing Library](https://react-hooks-testing-library.com/)