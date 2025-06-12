# Navigation Transitions Implementation

## Overview

This document describes the navigation transition system implemented for TASK-115, providing smooth animations throughout the app using Expo Router v5 and React Native Reanimated.

## Implementation Summary

### 1. **Enhanced Transition Configurations**
- Updated `/lib/navigation/transitions.ts` with Expo Router v5 specific options
- Added platform-specific animations (iOS slide, Android fade)
- Created reusable transition presets

### 2. **Stack Navigator Transitions**
- **Root Layout** (`app/_layout.tsx`)
  - Added global animation configuration
  - Platform-specific transitions (slide for iOS, fade for Android/Web)
  - Gesture support for iOS swipe-back
  
- **Auth Layout** (`app/(auth)/_layout.tsx`)
  - Smooth transitions between auth screens
  - Modal presentation for forgot-password
  - Consistent animation duration (250ms)

### 3. **Tab Navigation Animations**
- Added `animation: 'shift'` to Tabs component
- Created `AnimatedTabBar` component (already existed)
- Tab indicator slides smoothly between active tabs
- Scale animation on tab press with haptic feedback

### 4. **Modal Presentations**
- Configured slide-from-bottom for modals
- Added backdrop fade effects
- Gesture dismissal support via `gesture-handler.ts`

### 5. **Gesture-Based Navigation**
Created `/lib/navigation/gesture-handler.ts` with:
- Swipe gesture detection
- Tab swipe navigation
- Pull-to-dismiss for modals
- Platform-aware implementation

### 6. **Animation Helpers**
- **`/lib/navigation/animated-navigation.ts`**
  - Wrapper around expo-router with animation options
  - Auth and app navigation with transitions
  - Haptic feedback integration
  
- **`/hooks/useNavigationTransition.ts`**
  - Hook for managing navigation transitions
  - Tab transition animations
  - Modal transition animations

### 7. **Integration with Existing System**
- Uses our animation store for preferences
- Respects reduced motion settings
- Works with our animation variant system
- Platform-specific optimizations

## Usage Examples

### Basic Navigation with Animation
```typescript
import { animatedNavigation } from '@/lib/navigation/animated-navigation';

// Navigate with slide animation
animatedNavigation.navigate('/screen', {
  animation: 'slide_from_right',
  animationDuration: 300,
});

// Present modal
animatedNavigation.presentModal('/modal-screen');
```

### Using Navigation Transition Hook
```typescript
import { useNavigationTransition } from '@/hooks/useNavigationTransition';

function MyScreen() {
  const { opacity, translateX } = useNavigationTransition({
    type: 'slide',
    direction: 'right',
  });
  
  return (
    <Animated.View style={{ opacity, transform: [{ translateX }] }}>
      {/* Screen content */}
    </Animated.View>
  );
}
```

### Gesture Navigation
```typescript
import { createSwipeGesture, GestureScreen } from '@/lib/navigation/gesture-handler';

function SwipeableScreen() {
  const swipeGesture = createSwipeGesture({
    onSwipeRight: () => router.back(),
    threshold: 50,
  });
  
  return (
    <GestureScreen gesture={swipeGesture}>
      {/* Screen content */}
    </GestureScreen>
  );
}
```

## Configuration Options

### Stack Screen Options
```typescript
{
  animation: 'slide_from_right' | 'fade' | 'fade_from_bottom' | 'none',
  animationDuration: 300,
  gestureEnabled: true,
  gestureDirection: 'horizontal' | 'vertical',
  presentation: 'card' | 'modal' | 'transparentModal',
}
```

### Animation Types
- **fade**: Simple opacity transition
- **slide_from_right**: iOS-style horizontal slide
- **slide_from_bottom**: Modal-style vertical slide
- **fade_from_bottom**: Android-style fade with slight vertical movement
- **none**: Instant transition

## Performance Considerations

1. **Native Driver**: All animations use the native driver for 60fps
2. **Lazy Loading**: Screens are lazy loaded with fade-in
3. **Gesture Optimization**: Gestures only enabled on supported platforms
4. **Reduced Motion**: Respects user's accessibility settings

## Platform Differences

### iOS
- Slide transitions by default
- Swipe-back gesture enabled
- Modal slides from bottom

### Android
- Fade transitions by default
- No swipe-back (use back button)
- Modal fades in

### Web
- Fade transitions only
- No gesture support
- CSS transitions for performance

## Future Enhancements

1. **Shared Element Transitions**: Animate elements between screens
2. **Custom Transition Curves**: More easing options
3. **Parallax Effects**: Advanced scroll-based transitions
4. **Activity Indicators**: Loading states during transitions

## Related Files

- `/lib/navigation/transitions.ts` - Transition configurations
- `/lib/navigation/animated-navigation.ts` - Navigation wrapper
- `/lib/navigation/gesture-handler.ts` - Gesture utilities
- `/hooks/useNavigationTransition.ts` - Transition hooks
- `/components/navigation/AnimatedScreen.tsx` - Screen wrapper
- `/components/navigation/AnimatedTabBar.tsx` - Tab bar component

## Testing

The navigation transitions have been tested on:
- ✅ iOS Simulator
- ✅ Android Emulator
- ✅ Web Browser
- ✅ With reduced motion enabled
- ✅ With animations disabled

All transitions respect user preferences and maintain 60fps performance.