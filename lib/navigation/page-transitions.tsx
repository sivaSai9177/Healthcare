import React from 'react';
import { Platform, Easing } from 'react-native';
import Animated, {
  withSpring,
  withTiming,
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
  SlideInUp,
  SlideOutDown,
  ZoomIn,
  ZoomOut,
} from 'react-native-reanimated';
import { StackCardInterpolationProps } from '@react-navigation/stack';
import { DURATIONS } from '@/lib/ui/animations/constants';

// Page transition types
export type TransitionType = 
  | 'slide'
  | 'fade'
  | 'modal'
  | 'zoom'
  | 'flip'
  | 'glass'
  | 'parallax'
  | 'cube'
  | 'none';

// Enhanced transition configurations
export const pageTransitions = {
  // Slide from right (iOS style)
  slide: {
    cardStyleInterpolator: ({ current, next, layouts }: StackCardInterpolationProps) => {
      const translateX = current.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [layouts.screen.width, 0],
        extrapolate: 'clamp',
      });

      const opacity = current.progress.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0, 0.7, 1],
        extrapolate: 'clamp',
      });

      const scale = next
        ? next.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 0.95],
        extrapolate: 'clamp',
      })
        : 1;

      return {
        cardStyle: {
          transform: [{ translateX }, { scale }],
          opacity,
        },
        overlayStyle: {
          opacity: current.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 0.5],
        extrapolate: 'clamp',
      }),
        },
      };
    },
    transitionSpec: {
      open: {
        animation: 'spring',
        config: {
          stiffness: 1000,
          damping: 500,
          mass: 3,
          overshootClamping: true,
        },
      },
      close: {
        animation: 'timing',
        config: {
          duration: DURATIONS.normal,
          easing: Easing.out(Easing.poly(4)),
        },
      },
    },
  },

  // Fade transition
  fade: {
    cardStyleInterpolator: ({ current }: StackCardInterpolationProps) => ({
      cardStyle: {
        opacity: current.progress,
      },
    }),
    transitionSpec: {
      open: {
        animation: 'timing',
        config: {
          duration: DURATIONS.normal,
          easing: Easing.inOut(Easing.ease),
        },
      },
      close: {
        animation: 'timing',
        config: {
          duration: DURATIONS.fast,
          easing: Easing.inOut(Easing.ease),
        },
      },
    },
  },

  // Modal slide from bottom
  modal: {
    cardStyleInterpolator: ({ current, layouts }: StackCardInterpolationProps) => {
      const translateY = current.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [layouts.screen.height, 0],
        extrapolate: 'clamp',
      });

      const opacity = current.progress.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0, 0.8, 1],
        extrapolate: 'clamp',
      });

      return {
        cardStyle: {
          transform: [{ translateY }],
          opacity,
        },
      };
    },
    transitionSpec: {
      open: {
        animation: 'spring',
        config: {
          damping: 20,
          stiffness: 100,
          mass: 1,
        },
      },
      close: {
        animation: 'timing',
        config: {
          duration: DURATIONS.fast,
          easing: Easing.out(Easing.ease),
        },
      },
    },
  },

  // Zoom transition
  zoom: {
    cardStyleInterpolator: ({ current }: StackCardInterpolationProps) => {
      const scale = current.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0.8, 1],
        extrapolate: 'clamp',
      });

      const opacity = current.progress.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0, 0.9, 1],
        extrapolate: 'clamp',
      });

      return {
        cardStyle: {
          transform: [{ scale }],
          opacity,
        },
      };
    },
    transitionSpec: {
      open: {
        animation: 'spring',
        config: {
          stiffness: 200,
          damping: 20,
          mass: 1,
        },
      },
      close: {
        animation: 'timing',
        config: {
          duration: DURATIONS.fast,
          easing: Easing.out(Easing.ease),
        },
      },
    },
  },

  // Glass morphism transition
  glass: {
    cardStyleInterpolator: ({ current, next, layouts }: StackCardInterpolationProps) => {
      const translateX = current.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [layouts.screen.width * 0.3, 0],
        extrapolate: 'clamp',
      });

      const opacity = current.progress.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0, 0.8, 1],
        extrapolate: 'clamp',
      });

      const blur = current.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [20, 0],
        extrapolate: 'clamp',
      });

      const scale = current.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0.95, 1],
        extrapolate: 'clamp',
      });

      return {
        cardStyle: {
          transform: [{ translateX }, { scale }],
          opacity,
          // Glass effect with backdrop blur
          ...(Platform.OS === 'web' && {
            backdropFilter: `blur(${blur}px)`,
            WebkitBackdropFilter: `blur(${blur}px)`,
          }),
        },
        overlayStyle: {
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          opacity: current.progress,
        },
      };
    },
    transitionSpec: {
      open: {
        animation: 'spring',
        config: {
          stiffness: 150,
          damping: 25,
          mass: 1,
        },
      },
      close: {
        animation: 'timing',
        config: {
          duration: DURATIONS.normal,
          easing: Easing.inOut(Easing.ease),
        },
      },
    },
  },

  // Parallax transition
  parallax: {
    cardStyleInterpolator: ({ current, next, layouts }: StackCardInterpolationProps) => {
      const translateX = current.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [layouts.screen.width, 0],
        extrapolate: 'clamp',
      });

      const nextTranslateX = next
        ? next.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -layouts.screen.width * 0.3],
        extrapolate: 'clamp',
      })
        : 0;

      return {
        cardStyle: {
          transform: [{ translateX }],
        },
        overlayStyle: {
          transform: [{ translateX: nextTranslateX }],
          opacity: current.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 0.3],
        extrapolate: 'clamp',
      }),
        },
      };
    },
    transitionSpec: {
      open: {
        animation: 'timing',
        config: {
          duration: DURATIONS.normal,
          easing: Easing.inOut(Easing.ease),
        },
      },
      close: {
        animation: 'timing',
        config: {
          duration: DURATIONS.normal,
          easing: Easing.inOut(Easing.ease),
        },
      },
    },
  },

  // Cube transition (3D effect)
  cube: {
    cardStyleInterpolator: ({ current, next, layouts }: StackCardInterpolationProps) => {
      const perspective = layouts.screen.width;
      const translateX = current.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [layouts.screen.width, 0],
        extrapolate: 'clamp',
      });

      const rotateY = current.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [-90, 0],
        extrapolate: 'clamp',
      });

      const nextRotateY = next
        ? next.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 90],
        extrapolate: 'clamp',
      })
        : 0;

      const opacity = current.progress.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0, 0.6, 1],
        extrapolate: 'clamp',
      });

      return {
        cardStyle: {
          transform: [
            { perspective },
            { translateX },
            { rotateY: `${rotateY}deg` },
          ],
          opacity,
        },
        overlayStyle: next
          ? {
              transform: [
                { perspective },
                { rotateY: `${nextRotateY}deg` },
              ],
              opacity: next.progress.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [1, 0.6, 0],
        extrapolate: 'clamp',
      }),
            }
          : {},
      };
    },
    transitionSpec: {
      open: {
        animation: 'timing',
        config: {
          duration: DURATIONS.slow,
          easing: Easing.inOut(Easing.ease),
        },
      },
      close: {
        animation: 'timing',
        config: {
          duration: DURATIONS.slow,
          easing: Easing.inOut(Easing.ease),
        },
      },
    },
  },

  // No transition
  none: {
    cardStyleInterpolator: () => ({}),
    transitionSpec: {
      open: {
        animation: 'timing',
        config: { duration: 0 },
      },
      close: {
        animation: 'timing',
        config: { duration: 0 },
      },
    },
  },
};

// Animated page wrapper for custom transitions
export const AnimatedPageWrapper: React.FC<{
  children: React.ReactNode;
  entering?: any;
  exiting?: any;
  style?: any;
}> = ({ children, entering = FadeIn, exiting = FadeOut, style }) => {
  return (
    <Animated.View 
      entering={entering} 
      exiting={exiting} 
      style={[{ flex: 1 }, style]}
    >
      {children}
    </Animated.View>
  );
};

// Custom entering animations
export const pageEnteringAnimations = {
  fadeIn: FadeIn.duration(DURATIONS.normal),
  slideInRight: SlideInRight.duration(DURATIONS.normal).easing(Easing.out(Easing.poly(4))),
  slideInUp: SlideInUp.duration(DURATIONS.normal).springify(),
  zoomIn: ZoomIn.duration(DURATIONS.normal).springify(),
  glassIn: () => {
    'worklet';
    const animations = {
      opacity: withTiming(1, { duration: DURATIONS.normal }),
      transform: [
        { scale: withSpring(1, { damping: 15, stiffness: 150 }) },
        { translateX: withTiming(0, { duration: DURATIONS.normal }) },
      ],
    };
    const initialValues = {
      opacity: 0,
      transform: [{ scale: 0.9 }, { translateX: 50 }],
    };
    return { animations, initialValues };
  },
};

// Custom exiting animations
export const pageExitingAnimations = {
  fadeOut: FadeOut.duration(DURATIONS.fast),
  slideOutLeft: SlideOutLeft.duration(DURATIONS.fast).easing(Easing.in(Easing.poly(4))),
  slideOutDown: SlideOutDown.duration(DURATIONS.fast),
  zoomOut: ZoomOut.duration(DURATIONS.fast),
  glassOut: () => {
    'worklet';
    const animations = {
      opacity: withTiming(0, { duration: DURATIONS.fast }),
      transform: [
        { scale: withTiming(0.9, { duration: DURATIONS.fast }) },
        { translateX: withTiming(-50, { duration: DURATIONS.fast }) },
      ],
    };
    const initialValues = {
      opacity: 1,
      transform: [{ scale: 1 }, { translateX: 0 }],
    };
    return { animations, initialValues };
  },
};

// Helper function to get platform-specific default transition
export function getDefaultPageTransition(): TransitionType {
  if (Platform.OS === 'ios') return 'slide';
  if (Platform.OS === 'android') return 'fade';
  return 'glass'; // Premium glass effect for web
}

// Helper to apply transition to Stack.Screen
export function applyPageTransition(transitionType: TransitionType = 'slide') {
  const transition = pageTransitions[transitionType];
  return {
    ...transition,
    presentation: transitionType === 'modal' ? 'modal' : 'card',
    gestureEnabled: transitionType !== 'none',
    gestureDirection: transitionType === 'modal' ? 'vertical' : 'horizontal',
  };
}