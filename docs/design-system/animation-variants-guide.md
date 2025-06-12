# Animation Variants Guide

## Overview

The Animation Variant System provides a consistent way to apply animations across all components in the design system. Instead of creating separate animated versions of components, animations are integrated directly using variants.

## Core Concepts

### 1. Animation Variants

Four pre-defined animation variants control the overall feel:

```typescript
type AnimationVariant = 'subtle' | 'moderate' | 'energetic' | 'none';
```

- **`subtle`**: Minimal animations for professional, focused experiences
- **`moderate`**: Balanced animations for most use cases (default)
- **`energetic`**: Playful, bouncy animations for engaging experiences
- **`none`**: Disables all animations (accessibility/performance)

### 2. Component-Specific Animation Types

Each component category has its own animation types:

```typescript
// Button animations
type ButtonAnimationType = 'scale' | 'glow' | 'ripple' | 'shake' | 'none';

// Card animations  
type CardAnimationType = 'lift' | 'tilt' | 'reveal' | 'none';

// List animations
type ListAnimationType = 'stagger' | 'cascade' | 'wave' | 'none';

// Stack animations
type StackAnimationType = 'stagger' | 'fade' | 'slide' | 'none';
```

## Usage Examples

### Basic Animation

```tsx
// Simple animated button
<Button 
  animated
  animationVariant="moderate"
  animationType="scale"
  onPress={handlePress}
>
  Click Me
</Button>
```

### Card with Hover Animation

```tsx
<Card
  animated
  animationVariant="subtle"
  animationType="lift"
  hoverable
>
  <Text>Hover over me!</Text>
</Card>
```

### Staggered List

```tsx
<Stack
  animated
  animationVariant="energetic"
  animationType="stagger"
  staggerDirection="forward"
  spacing={4}
>
  {items.map(item => (
    <Card key={item.id}>{item.title}</Card>
  ))}
</Stack>
```

### Custom Animation Config

```tsx
<Box
  animated
  animationVariant="moderate"
  animationConfig={{
    hoverScale: 1.1,      // Override hover scale
    pressScale: 0.9,      // Override press scale
    duration: 500,        // Override duration
    spring: {
      damping: 12,
      stiffness: 180,
    }
  }}
>
  Custom Animation
</Box>
```

## Animation Variant Properties

Each variant defines these properties:

### Scale Values
- `hover`: Scale on hover (web) or focus
- `press`: Scale when pressed

### Duration Values
- `instant`: 0ms
- `fast`: 150-250ms
- `normal`: 250-400ms  
- `slow`: 400-600ms

### Spring Configuration
- `damping`: Controls oscillation (higher = less bouncy)
- `stiffness`: Controls speed (higher = faster)
- `mass`: Controls weight (higher = slower)

### Stagger Settings
- `base`: Base delay between items
- `multiplier`: How much delay increases per item

### Entrance Options
- `fade`: Opacity animation
- `scale`: Size animation
- `slide`: Position animation
- `distance`: Slide distance in pixels

## Using the Hook

The `useAnimationVariant` hook provides easy access to variant configurations:

```tsx
import { useAnimationVariant } from '@/hooks/useAnimationVariant';

function MyComponent() {
  const { 
    config,
    isAnimated,
    hoverScale,
    pressScale,
    getStaggerDelay,
  } = useAnimationVariant({ 
    variant: 'moderate' 
  });
  
  // Use config values in your animations
  const animatedStyle = {
    transform: `scale(${hoverScale})`,
    transition: `all ${config.duration.normal}ms ease`,
  };
}
```

## Accessibility

### Reduced Motion

The system automatically respects user preferences:

```tsx
// Automatically disabled when prefers-reduced-motion is set
<Button animated animationVariant="energetic">
  Respects User Preferences
</Button>
```

### Manual Override

```tsx
// Force disable animations
<Button animated={false}>No Animation</Button>

// Or use 'none' variant
<Button animated animationVariant="none">No Animation</Button>
```

## Performance Considerations

### Device Tier Adjustment

The system automatically adjusts animations based on device capabilities:

```typescript
// Low-end devices: energetic → subtle
// Medium devices: energetic → moderate
// High-end devices: No adjustment
```

### Animation Store

Global animation control via Zustand store:

```tsx
import { useAnimationStore } from '@/lib/stores/animation-store';

// Disable all animations globally
const { setAnimationsEnabled } = useAnimationStore();
setAnimationsEnabled(false);
```

## Best Practices

1. **Choose Appropriate Variants**
   - Professional apps: Use `subtle`
   - Consumer apps: Use `moderate` 
   - Games/Kids apps: Use `energetic`

2. **Consistent Usage**
   - Use the same variant across related components
   - Don't mix variants in the same view

3. **Performance**
   - Use `animated={false}` for large lists
   - Prefer CSS animations on web when possible

4. **Accessibility**
   - Always test with reduced motion enabled
   - Provide non-animated alternatives for critical actions

## Component Support

All universal components support animation variants:

- ✅ Box
- ✅ Button  
- ✅ Card
- ✅ Stack
- ✅ Container
- ✅ Grid
- ✅ ScrollContainer
- ✅ Separator
- ✅ Input
- ✅ Switch
- ✅ Tabs
- ✅ Dialog
- ✅ Toast
- ... and more

## Migration Guide

### From Separate Animated Components

```tsx
// Before
import { AnimatedButton } from '@/components/universal/AnimatedButton';
<AnimatedButton onPress={handlePress}>Click</AnimatedButton>

// After  
import { Button } from '@/components/universal/Button';
<Button animated animationVariant="moderate" onPress={handlePress}>
  Click
</Button>
```

### From Custom Animations

```tsx
// Before
<Pressable 
  onPressIn={() => scale.value = withSpring(0.95)}
  onPressOut={() => scale.value = withSpring(1)}
>

// After
<Button
  animated
  animationVariant="subtle"
  animationType="scale"
>
```

## Future Enhancements

1. **More Animation Types**
   - Morph animations
   - Path animations
   - Particle effects

2. **Animation Composer**
   - Combine multiple animation types
   - Custom timing functions

3. **Gesture Integration**
   - Swipe animations
   - Drag animations
   - Pinch/zoom animations