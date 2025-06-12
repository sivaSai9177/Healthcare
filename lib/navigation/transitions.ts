import { Platform } from 'react-native';
import { DURATIONS, EASINGS } from '@/lib/ui/animations/constants';

// Expo Router v5 screen options for stack animations
export const stackScreenOptions = {
  default: {
    headerShown: false,
    animation: Platform.select({
      ios: 'slide_from_right' as const,
      android: 'fade' as const,
      web: 'fade' as const,
    }),
    animationDuration: DURATIONS.normal,
    gestureEnabled: Platform.OS === 'ios',
    gestureDirection: 'horizontal' as const,
    animationTypeForReplace: 'pop' as const,
  },
  modal: {
    presentation: 'modal' as const,
    animation: 'slide_from_bottom' as const,
    animationDuration: DURATIONS.normal,
    gestureEnabled: true,
    gestureDirection: 'vertical' as const,
  },
  transparentModal: {
    presentation: 'transparentModal' as const,
    animation: 'fade' as const,
    animationDuration: DURATIONS.fast,
  },
  card: {
    presentation: 'card' as const,
    animation: 'slide_from_right' as const,
    animationDuration: DURATIONS.normal,
    gestureEnabled: true,
  },
};

// Tab animation configuration
export const tabAnimationConfig = {
  tabBarShowLabel: true,
  tabBarHideOnKeyboard: Platform.OS !== 'web',
  tabBarActiveTintColor: undefined, // Will be set by theme
  tabBarInactiveTintColor: undefined, // Will be set by theme
  tabBarStyle: {
    position: 'absolute' as const,
    elevation: 0,
    borderTopWidth: 1,
  },
  // Animation when switching tabs
  animationEnabled: true,
  swipeEnabled: Platform.OS !== 'web',
  lazy: true,
};

// Drawer animation config
export const drawerConfig = {
  drawerType: 'slide' as const,
  overlayColor: 'rgba(0,0,0,0.5)',
  drawerStyle: {
    width: Platform.OS === 'web' ? 280 : '85%',
  },
  swipeEnabled: Platform.OS !== 'web',
  gestureHandlerProps: {
    enabled: Platform.OS !== 'web',
  },
};

// Legacy transition configurations (kept for reference but not used)
export const navigationTransitions = {
  slideFromRight: {
    transitionSpec: {
      open: {
        animation: 'timing',
        config: {
          duration: DURATIONS.normal,
          easing: EASINGS.decelerate,
        },
      },
      close: {
        animation: 'timing',
        config: {
          duration: DURATIONS.fast,
          easing: EASINGS.accelerate,
        },
      },
    },
  },
  
  slideFromBottom: {
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
          easing: EASINGS.accelerate,
        },
      },
    },
  },
  
  fade: {
    transitionSpec: {
      open: {
        animation: 'timing',
        config: {
          duration: DURATIONS.normal,
        },
      },
      close: {
        animation: 'timing',
        config: {
          duration: DURATIONS.fast,
        },
      },
    },
  },
  
  scale: {
    cardStyleInterpolator: ({ current, layouts }) => {
      return {
        cardStyle: {
          opacity: current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1],
          }),
          transform: [
            {
              scale: current.progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0.9, 1],
              }),
            },
          ],
        },
      };
    },
    transitionSpec: {
      open: {
        animation: 'spring',
        config: {
          damping: 15,
          stiffness: 150,
          mass: 1,
        },
      },
      close: {
        animation: 'timing',
        config: {
          duration: DURATIONS.fast,
        },
      },
    },
  },
  
  none: {
    cardStyleInterpolator: () => ({}),
    transitionSpec: {
      open: {
        animation: 'timing',
        config: {
          duration: 0,
        },
      },
      close: {
        animation: 'timing',
        config: {
          duration: 0,
        },
      },
    },
  },
};

// Get platform-specific default transition
export function getDefaultTransition() {
  if (Platform.OS === 'ios') {
    return navigationTransitions.slideFromRight;
  } else if (Platform.OS === 'android') {
    return navigationTransitions.fade;
  }
  return navigationTransitions.fade;
}

// Tab switch animation config
export const tabSwitchConfig = {
  animation: 'timing',
  config: {
    duration: DURATIONS.fast,
    easing: EASINGS.standard,
  },
};

// Custom transition specs for advanced animations
export const customTransitionSpecs = {
  zoom: {
    animation: 'spring',
    config: {
      stiffness: 1000,
      damping: 500,
      mass: 3,
      overshootClamping: true,
      restDisplacementThreshold: 0.01,
      restSpeedThreshold: 0.01,
    },
  },
  flip: {
    animation: 'timing',
    config: {
      duration: DURATIONS.normal,
      easing: EASINGS.standard,
    },
  },
  crossFade: {
    animation: 'timing',
    config: {
      duration: DURATIONS.fast,
      easing: EASINGS.standard,
    },
  },
};