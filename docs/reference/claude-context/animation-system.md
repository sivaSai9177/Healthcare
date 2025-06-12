# 🎭 Animation & Responsive Design System - Claude Context Module

*Last Updated: January 10, 2025*

## Animation System Overview

**Status**: 75% Complete (36/48 components animated)

### Platform-Specific Implementation
- **Web**: CSS transitions and animations
- **Native**: React Native Reanimated 2
- **Performance**: 60fps with worklet-based animations
- **Accessibility**: Respects reduced motion preferences

## Animation Variant System

### Available Variants
```typescript
type AnimationVariant = 'subtle' | 'moderate' | 'energetic' | 'none';
```

- **Subtle**: Minimal animations (150-200ms, small movements)
- **Moderate**: Balanced animations (250-300ms, medium movements) - Default
- **Energetic**: Playful animations (300-400ms, larger movements)
- **None**: Disables all animations

### Animation Types
```typescript
type AnimationType = 'fade' | 'scale' | 'slide' | 'bounce' | 'shake' | 'entrance' | 'stagger';
```

### Configuration
```typescript
const config = {
  duration: {
    instant: 0,
    fast: 150,
    normal: 250,
    slow: 350,
    verySlow: 500,
  },
  easing: {
    standard: [0.4, 0, 0.2, 1],
    accelerate: [0.4, 0, 1, 1],
    decelerate: [0, 0, 0.2, 1],
  },
  spring: {
    damping: 15,
    stiffness: 150,
  },
};
```

## Haptic Feedback System

### Available Haptics
```typescript
// Impact haptics
haptics.light();
haptics.medium();
haptics.heavy();

// Notification haptics
haptics.success();
haptics.warning();
haptics.error();

// Selection haptics
haptics.selection();

// Convenience methods
haptics.buttonPress();    // medium impact
haptics.toggleOn();       // light impact + success
haptics.toggleOff();      // light impact
```

### Platform Support
- **iOS**: Full haptic support via Haptics API
- **Android**: Vibration patterns via Vibration API
- **Web**: No haptics (graceful fallback)

## Animation Hooks

### Core Hooks
```typescript
// Fade animations
const { animatedStyle, fadeIn, fadeOut } = useFadeAnimation({
  duration: 300,
  delay: 0,
});

// Scale animations
const { animatedStyle, scale } = useScaleAnimation({
  from: 0.8,
  to: 1,
  onPress: true, // Auto-scale on press
});

// Slide animations
const { animatedStyle, slideIn, slideOut } = useSlideAnimation({
  direction: 'left' | 'right' | 'up' | 'down',
  distance: 100,
});

// Bounce animations
const { animatedStyle, bounce } = useBounceAnimation({
  intensity: 1.2,
});

// Shake animations (for errors)
const { animatedStyle, shake } = useShakeAnimation({
  intensity: 10,
  duration: 500,
});

// Entrance animations (combined effects)
const { animatedStyle } = useEntranceAnimation({
  type: 'fadeScale' | 'slideUp' | 'bounceIn',
  delay: 0,
});

// List animations (staggered)
const { getItemAnimation } = useListAnimation({
  staggerDelay: 50,
  type: 'fade' | 'scale' | 'slide',
});
```

### Animation Control Hooks
```typescript
// Check if animations should run
const { shouldAnimate } = useAnimationStore();

// Get animation variant config
const { config, isAnimated } = useAnimationVariant({
  variant: 'moderate',
  overrides: { duration: 400 },
});

// Detect reduced motion preference
const prefersReducedMotion = useReducedMotion();
```

## Responsive Design System

### Breakpoints
```typescript
const breakpoints = {
  xs: 0,    // Mobile portrait
  sm: 640,  // Mobile landscape
  md: 768,  // Tablet portrait
  lg: 1024, // Tablet landscape
  xl: 1280, // Desktop
  '2xl': 1536, // Large desktop
};
```

### Responsive Hooks
```typescript
// Get current breakpoint
const breakpoint = useBreakpoint(); // 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

// Get responsive value
const padding = useResponsiveValue({
  xs: 4,
  md: 6,
  lg: 8,
});

// Media query matching
const isLargeScreen = useMediaQuery('(min-width: 1024px)');

// Platform detection
const isMobile = useIsMobile();
const isTablet = useIsTablet();
const isDesktop = useIsDesktop();
```

### Responsive Props
```typescript
// All universal components accept responsive props
<Box 
  p={{ xs: 4, md: 6, lg: 8 }}
  flexDirection={{ xs: 'column', md: 'row' }}
  display={{ xs: 'none', lg: 'flex' }}
/>
```

## Animation Implementation Progress

### Phase Completion Status
1. **Core Layout** (62% - 5/8 components)
2. **Form Components** (60% - 9/15 components)
3. **Display Components** (100% - 8/8 components) ✅
4. **Navigation Components** (90% - 9/10 components)
5. **Overlay Components** (100% - 8/8 components) ✅

### Recently Completed Animations
- All overlay components (Dialog, Drawer, Popover, etc.)
- All display components (Alert, Badge, Progress, etc.)
- Most navigation components
- Core form inputs with validation feedback

### Remaining Components (12)
- Container, Grid, ScrollContainer (Core Layout)
- Form, Label, FilePicker, ColorPicker, Command (Form)
- Table (Navigation)

## Animation Patterns

### Component Animation Props
```typescript
interface AnimationProps {
  animated?: boolean;
  animationVariant?: AnimationVariant;
  animationType?: ComponentSpecificAnimationType;
  animationDuration?: number;
  useHaptics?: boolean;
  animationConfig?: {
    duration?: number;
    delay?: number;
    spring?: SpringConfig;
  };
}
```

### Implementation Example
```tsx
<Button
  animated
  animationVariant="moderate"
  animationType="scale"
  useHaptics
  onPress={handlePress}
>
  Press Me
</Button>
```

## Key Animation Files
- `lib/animations/constants.ts` - Animation constants
- `lib/animations/hooks.ts` - Animation hooks
- `lib/animations/utils.ts` - Animation utilities
- `lib/animations/presets.ts` - Animation presets
- `lib/animations/platform-animations.tsx` - Platform-specific implementations
- `lib/animations/AnimationContext.tsx` - Animation provider
- `lib/haptics/index.tsx` - Haptic feedback system
- `lib/design-system/animation-variants.ts` - Variant configurations
- `lib/stores/animation-store.ts` - Animation preferences store
- `hooks/useAnimationVariant.ts` - Animation variant hook
- `hooks/useReducedMotion.ts` - Reduced motion detection
- `hooks/useResponsive.ts` - Responsive design hooks

## Performance Considerations

1. **Worklet Animations**: Run on UI thread for 60fps
2. **Reduced Motion**: Respect user preferences
3. **Conditional Loading**: Load Reanimated only on native
4. **Batch Updates**: Group animations for efficiency
5. **Memory Management**: Clean up animations on unmount

---

*This module contains animation and responsive design details. For usage patterns, see patterns-conventions.md.*