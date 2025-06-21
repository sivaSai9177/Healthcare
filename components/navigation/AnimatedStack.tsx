import React from 'react';
import { Stack, StackProps, Tabs } from 'expo-router';
import { Platform, View } from 'react-native';
import { useTheme } from '@/lib/theme/provider';
import { 
  pageTransitions, 
  getDefaultPageTransition,
  applyPageTransition,
  TransitionType 
} from '@/lib/navigation/page-transitions';
import { useAnimationStore } from '@/lib/stores/animation-store';

interface AnimatedStackProps extends Partial<StackProps> {
  transitionType?: TransitionType;
  enableGestures?: boolean;
  children?: React.ReactNode;
}

export function AnimatedStack({ 
  transitionType = getDefaultPageTransition(),
  enableGestures = true,
  children,
  ...props 
}: AnimatedStackProps) {
  const theme = useTheme();
  const { reducedMotion } = useAnimationStore();
  
  // Use no transition if reduced motion is enabled
  const finalTransitionType = reducedMotion ? 'none' : transitionType;
  const transition = applyPageTransition(finalTransitionType);

  return (
    <Stack
      {...props}
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: theme.background,
        },
        ...transition,
        gestureEnabled: enableGestures && !reducedMotion && Platform.OS !== 'web',
        // Apply theme-specific header styles if header is shown
        headerStyle: {
          backgroundColor: theme.card,
          ...(Platform.OS === 'web' && finalTransitionType === 'glass' && {
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            backgroundColor: theme.card + 'CC', // Semi-transparent
          }),
        },
        headerTintColor: theme.foreground,
        headerTitleStyle: {
          fontFamily: Platform.select({
            ios: 'SF Pro Display',
            android: 'Roboto',
            default: 'System',
          }),
          fontWeight: '600',
          fontSize: 17,
        },
        headerBackTitle: 'Back',
        headerBackTitleVisible: Platform.OS === 'ios',
        ...props.screenOptions,
      }}
    >
      {children}
    </Stack>
  );
}

// Screen wrapper with animation support
interface AnimatedScreenProps {
  children: React.ReactNode;
  transitionType?: TransitionType;
  options?: any;
}

export function AnimatedScreen({ 
  children, 
  transitionType,
  options = {} 
}: AnimatedScreenProps) {
  return (
    <Stack.Screen
      options={{
        ...options,
        ...(transitionType && applyPageTransition(transitionType)),
      }}
    >
      {children}
    </Stack.Screen>
  );
}

// Tab navigator with animations
export function AnimatedTabs({ children, ...props }: any) {
  const theme = useTheme();
  const { reducedMotion } = useAnimationStore();
  
  return (
    <Tabs
      {...props}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.mutedForeground,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.border,
          borderTopWidth: 1,
          ...(Platform.OS === 'web' && {
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            backgroundColor: theme.card + 'CC',
          }),
        },
        tabBarShowLabel: true,
        tabBarHideOnKeyboard: Platform.OS !== 'web',
        // Disable animations if reduced motion is enabled
        animationEnabled: !reducedMotion,
        ...props.screenOptions,
      }}
    >
      {children}
    </Tabs>
  );
}