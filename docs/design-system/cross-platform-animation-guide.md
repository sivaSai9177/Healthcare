# Cross-Platform Animation & Responsive Design Guide

## Overview

This guide documents our cross-platform animation system that handles differences between web (CSS animations) and native (React Native Reanimated) platforms, along with our responsive design token system.

## ✅ Completed Implementation

### 1. **Platform-Specific Animation System**

#### Web Animations (CSS-based)
- CSS keyframes for common animations
- Transition utilities for smooth interactions
- Hardware-accelerated transforms
- Media query support for responsive animations

#### Native Animations (Reanimated)
- Worklet-based animations for 60fps performance
- Spring physics for natural motion
- Gesture-driven animations
- Platform-optimized defaults (iOS spring, Android material)

### 2. **Responsive Design Tokens**

```typescript
// Breakpoint tokens
BREAKPOINTS = {
  xs: 0,      // Mobile portrait
  sm: 640,    // Mobile landscape
  md: 768,    // Tablet portrait
  lg: 1024,   // Tablet landscape
  xl: 1280,   // Desktop
  '2xl': 1536 // Large desktop
}

// Responsive spacing
RESPONSIVE_SPACING = {
  container: {
    paddingX: { xs: 16, sm: 20, md: 24, lg: 32, xl: 40 },
    maxWidth: { xs: '100%', sm: 640, md: 768, lg: 1024, xl: 1280 }
  }
}

// Responsive typography
RESPONSIVE_TYPOGRAPHY = {
  h1: {
    xs: { fontSize: 28, lineHeight: 36 },
    md: { fontSize: 36, lineHeight: 44 },
    lg: { fontSize: 48, lineHeight: 56 }
  }
}
```

### 3. **Platform-Specific Tokens**

```typescript
// Font families
PLATFORM_TOKENS.fontFamily = {
  ios: { sans: 'System', mono: 'Menlo' },
  android: { sans: 'Roboto', mono: 'monospace' },
  web: { sans: '-apple-system, BlinkMacSystemFont, sans-serif' }
}

// Shadows
PLATFORM_TOKENS.shadow = {
  ios: { shadowColor, shadowOffset, shadowOpacity, shadowRadius },
  android: { elevation },
  web: { boxShadow }
}
```

### 4. **Responsive Hooks**

- `useBreakpoint()` - Get current breakpoint
- `useResponsiveValue()` - Get responsive value for current screen
- `useMediaQuery()` - Check if screen matches breakpoint
- `useIsMobile()`, `useIsTablet()`, `useIsDesktop()` - Quick helpers

### 5. **Components Created**

#### AnimatedBox
Universal animated container that works on all platforms:
```tsx
<AnimatedBox
  animationType="fadeScale"
  duration={{ xs: 200, md: 300 }}
  delay={{ xs: 0, md: 100 }}
  px={{ xs: 4, md: 6, lg: 8 }}
>
  Content
</AnimatedBox>
```

#### Cross-Platform Implementation Example
```tsx
// Web version
if (Platform.OS === 'web') {
  return (
    <Box style={[createAnimationStyle('fade', { duration: 300 })]}>
      {content}
    </Box>
  );
}

// Native version
return (
  <Animated.View style={animatedStyle}>
    {content}
  </Animated.View>
);
```

## 🎯 Usage Examples

### 1. **Responsive Component**
```tsx
function MyComponent() {
  const isMobile = useIsMobile();
  const padding = useResponsiveValue({ xs: 3, md: 4, lg: 5 });
  const fontSize = useResponsiveValue({ xs: 'sm', md: 'base', lg: 'lg' });
  
  return (
    <AnimatedBox
      animationType="fadeSlide"
      duration={isMobile ? 200 : 300}
      p={padding}
    >
      <Text size={fontSize}>Responsive Text</Text>
    </AnimatedBox>
  );
}
```

### 2. **Platform-Specific Animations**
```tsx
// Automatically handles platform differences
<AnimatedBox
  animationType="scale"
  webStyle={{ cursor: 'pointer' }}
  nativeStyle={{ elevation: 4 }}
>
  <Button>Click Me</Button>
</AnimatedBox>
```

### 3. **Responsive Grid**
```tsx
const columns = useResponsiveValue({ 
  xs: 1,    // 1 column on mobile
  sm: 2,    // 2 columns on small tablets
  md: 3,    // 3 columns on tablets
  lg: 4,    // 4 columns on desktop
});
```

## 🚀 Performance Optimizations

### Web
- CSS transforms for GPU acceleration
- Will-change property for anticipated animations
- Transition timing functions for smooth motion
- Media queries compiled at build time

### Native
- Worklet functions run on UI thread
- Native driver for transforms and opacity
- Batched updates for multiple animations
- Gesture handler integration

## 🎨 Design Principles

1. **Platform Consistency**: Animations feel native to each platform
2. **Responsive First**: All values can be responsive
3. **Performance**: 60fps on all devices
4. **Accessibility**: Respect reduced motion preferences
5. **Developer Experience**: Simple, intuitive APIs

## 📱 Platform Differences

| Feature | Web | iOS | Android |
|---------|-----|-----|---------|
| Default animation | CSS transitions | Spring physics | Material timing |
| Shadow system | box-shadow | shadowOffset | elevation |
| Font system | Web fonts | System fonts | Roboto |
| Gesture handling | Mouse events | Touch gestures | Touch gestures |
| Performance | GPU compositing | Native driver | Native driver |

## 🔧 Configuration

### Animation Preferences (Zustand Store)
- `reducedMotion` - Disable animations
- `animationSpeed` - Global speed multiplier
- `enableAnimations` - Toggle all animations

### Responsive Configuration
- Breakpoints can be customized
- Spacing scale adjustable
- Typography scale configurable

## 📈 Benefits

1. **Write Once**: Single component works everywhere
2. **Optimized**: Platform-specific optimizations applied automatically
3. **Responsive**: Built-in responsive system
4. **Accessible**: Reduced motion support
5. **Performant**: 60fps animations on all platforms
6. **Type-Safe**: Full TypeScript support

---

*Last Updated: January 9, 2025*
*Cross-Platform Animation System v1.0*