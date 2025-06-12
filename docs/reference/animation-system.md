# Animation System Reference

## Overview

The Modern Expo Starter Kit includes a comprehensive cross-platform animation system that provides smooth, performant animations across web, iOS, and Android platforms.

## Core Components

### 1. Animation Utilities (`/lib/animations/`)

#### Constants
```typescript
// Duration presets
DURATIONS = {
  instant: 0,
  fast: 150,
  normal: 300,
  slow: 500,
  verySlow: 1000,
}

// Easing functions
EASINGS = {
  standard: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
  accelerate: 'cubic-bezier(0.4, 0.0, 1, 1)',
  decelerate: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
  spring: { damping: 0.8, stiffness: 100, mass: 1 },
  bounce: { damping: 0.6, stiffness: 150, mass: 0.8 },
}
```

#### Animation Hooks
- `useFadeAnimation()` - Fade in/out animations
- `useScaleAnimation()` - Scale animations with spring physics
- `useSlideAnimation()` - Directional slide animations
- `useBounceAnimation()` - Bounce effects
- `useShakeAnimation()` - Shake effects for errors
- `useEntranceAnimation()` - Combined entrance animations
- `useListAnimation()` - Staggered list animations

### 2. Platform-Specific Animations

#### Web (CSS-based)
```typescript
// CSS keyframes automatically injected
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

// Usage
<Box style={createAnimationStyle('fade', { duration: 300 })} />
```

#### Native (Reanimated)
```typescript
// Worklet-based animations
const { animatedStyle, fadeIn } = useFadeAnimation();

return <Animated.View style={animatedStyle}>...</Animated.View>
```

### 3. Animation Context & Store

#### AnimationProvider
Wraps your app to provide animation preferences:
```typescript
<AnimationProvider>
  <App />
</AnimationProvider>
```

#### Animation Store (Zustand)
```typescript
interface AnimationState {
  reducedMotion: boolean;
  animationSpeed: number; // 0.5 = slow, 1 = normal, 2 = fast
  enableAnimations: boolean;
}
```

### 4. Haptic Feedback (`/lib/haptics/`)

Integrated haptic feedback for touch interactions:
```typescript
haptics.buttonPress();    // Light feedback
haptics.success();        // Success notification
haptics.error();          // Error notification
haptics.warning();        // Warning notification
```

## Usage Patterns

### Basic Animation
```typescript
const { animatedStyle, fadeIn } = useFadeAnimation({ 
  duration: 300,
  delay: 100 
});

useEffect(() => {
  fadeIn();
}, []);

return <Animated.View style={animatedStyle}>...</Animated.View>
```

### Cross-Platform Component
```typescript
function AnimatedComponent({ children }) {
  if (Platform.OS === 'web') {
    return (
      <Box style={createAnimationStyle('fade', { duration: 300 })}>
        {children}
      </Box>
    );
  }
  
  const { animatedStyle, fadeIn } = useFadeAnimation();
  
  useEffect(() => {
    fadeIn();
  }, []);
  
  return (
    <Animated.View style={animatedStyle}>
      {children}
    </Animated.View>
  );
}
```

### With Haptic Feedback
```typescript
<Button
  onPress={() => {
    haptics.buttonPress();
    handlePress();
  }}
>
  Press Me
</Button>
```

## Performance Guidelines

1. **Use Native Driver**: Always use native driver for transforms and opacity
2. **Avoid Layout Animations**: Prefer transforms over layout properties
3. **Batch Animations**: Group related animations together
4. **Respect Preferences**: Check `reducedMotion` before animating
5. **Optimize for 60fps**: Keep animations under 16ms per frame

## Accessibility

The animation system respects user preferences:
- Checks system `prefers-reduced-motion` setting
- Provides global toggle for animations
- Supports custom animation speeds
- Ensures all animations are optional

## Platform Differences

| Feature | Web | iOS | Android |
|---------|-----|-----|---------|
| Engine | CSS Animations | Reanimated | Reanimated |
| Default | Transitions | Spring | Material |
| Gestures | Mouse | Touch | Touch |
| Driver | GPU Compositing | Native | Native |

## API Reference

### Hooks

#### useFadeAnimation
```typescript
const { animatedStyle, fadeIn, fadeOut, opacity } = useFadeAnimation({
  duration?: number;
  delay?: number;
  initialOpacity?: number;
  finalOpacity?: number;
});
```

#### useScaleAnimation
```typescript
const { animatedStyle, scaleIn, scaleOut, scale } = useScaleAnimation({
  duration?: number;
  delay?: number;
  initialScale?: number;
  finalScale?: number;
  springConfig?: 'default' | 'gentle' | 'wobbly' | 'stiff';
});
```

#### useSlideAnimation
```typescript
const { animatedStyle, slideIn, slideOut, translateX, translateY } = useSlideAnimation({
  duration?: number;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  distance?: number;
});
```

### Utilities

#### shouldAnimate()
Returns whether animations should run based on user preferences.

#### getAnimationConfig()
Returns platform-specific animation configuration.

#### createAnimationStyle()
Creates CSS animation styles for web platform.

### Layout Animations (Native Only)

Layout animations are only available on native platforms (iOS/Android) and are automatically excluded from web builds to prevent import errors.

```typescript
import { Layout, isLayoutAnimationAvailable } from '@/lib/animations/layout-animations';

// Check if layout animations are available
if (isLayoutAnimationAvailable) {
  // Use layout animations
  <AnimatedComponent layout={Layout.duration(300)} />
}
```

Available layout animations:
- `Layout` - Basic layout animation
- `LinearTransition` - Linear layout transitions
- `SequencedTransition` - Sequenced layout changes
- `FadingTransition` - Fading layout transitions
- `JumpingTransition` - Jumping layout effects
- `CurvedTransition` - Curved layout animations
- `EntryExitTransition` - Entry/exit layout transitions

## Best Practices

1. **Always provide fallbacks**: Ensure UI works without animations
2. **Test on all platforms**: Verify animations work across web/iOS/Android
3. **Keep it subtle**: Less is more with animations
4. **Be consistent**: Use the same animation patterns throughout
5. **Optimize for performance**: Profile animations on low-end devices

---

*For implementation examples, see the [Cross-Platform Animation Guide](../design-system/cross-platform-animation-guide.md)*