# Reanimated Warning Fix Guide

## Warning Message
```
WARN  [Reanimated] Reading from `value` during component render. Please ensure that you don't access the `value` property nor use `get` method of a shared value while React is rendering a component.
```

## Common Causes

### 1. **Reading .value in render**
```typescript
// ❌ WRONG - Reading .value during render
function Component() {
  const opacity = useSharedValue(0);
  
  // This will cause the warning
  const currentOpacity = opacity.value;
  
  return <View style={{ opacity: currentOpacity }} />;
}

// ✅ CORRECT - Use useAnimatedStyle
function Component() {
  const opacity = useSharedValue(0);
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value
    };
  });
  
  return <Animated.View style={animatedStyle} />;
}
```

### 2. **Conditional logic with .value**
```typescript
// ❌ WRONG - Using .value in conditional
function Component() {
  const progress = useSharedValue(0);
  
  if (progress.value > 0.5) {
    // This causes the warning
  }
  
  return <View />;
}

// ✅ CORRECT - Use useDerivedValue
function Component() {
  const progress = useSharedValue(0);
  
  const isHalfway = useDerivedValue(() => {
    return progress.value > 0.5;
  });
  
  return <View />;
}
```

### 3. **Passing .value as prop**
```typescript
// ❌ WRONG - Passing .value directly
function Component() {
  const scale = useSharedValue(1);
  
  return <ChildComponent scale={scale.value} />;
}

// ✅ CORRECT - Pass the shared value itself
function Component() {
  const scale = useSharedValue(1);
  
  return <ChildComponent sharedScale={scale} />;
}
```

## Debugging Steps

1. **Enable strict mode** to catch these errors early:
```typescript
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';

configureReanimatedLogger({
  level: ReanimatedLogLevel.warning,
  strict: true,
});
```

2. **Search for .value access**:
```bash
# Find all .value accesses
grep -rn "\.value" components/

# Find potential problematic patterns
grep -rn "\.value[^=]" components/ | grep -v "useAnimatedStyle\|useDerivedValue\|worklet"
```

3. **Common patterns to fix**:
- Move all `.value` reads inside `useAnimatedStyle` or `useDerivedValue`
- Use `runOnJS` for callbacks that need the value
- Use `useAnimatedProps` for animated component props
- Use state instead of shared values for non-animated values

## Potential Locations in Our Codebase

Based on the warning timing, check these components:
1. `ProfileIncompletePrompt.tsx` - Uses fade animation
2. `FloatingAlertButton.tsx` - Has scale and rotation animations
3. `ErrorBanner.tsx` - Recently modified with animations
4. Any component using `useFadeAnimation` hook

## Quick Fix Pattern

If you need to read a shared value in React:
```typescript
// Use useDerivedValue to create a reactive value
const displayValue = useDerivedValue(() => {
  return `Current: ${sharedValue.value}`;
});

// Use useAnimatedReaction to trigger side effects
useAnimatedReaction(
  () => sharedValue.value,
  (current, previous) => {
    if (current !== previous) {
      runOnJS(setSomeState)(current);
    }
  }
);
```