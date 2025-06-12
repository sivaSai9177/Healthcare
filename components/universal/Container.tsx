import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, ScrollViewProps } from 'react-native';
import { Box, BoxProps } from './Box';
import { useTheme } from '@/lib/theme/provider';
import { 
  designSystem, 
  AnimationVariant, 
  ContainerAnimationType,
  getAnimationConfig 
} from '@/lib/design';
import { useAnimationVariant } from '@/hooks/useAnimationVariant';

interface ContainerProps extends Omit<BoxProps, 'maxWidth' | 'animated' | 'animationVariant' | 'animationType'> {
  safe?: boolean;
  scroll?: boolean;
  scrollProps?: ScrollViewProps;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  centered?: boolean;
  children?: React.ReactNode;
  
  // Animation props
  animated?: boolean;
  animationVariant?: AnimationVariant;
  animationType?: ContainerAnimationType;
  animationDuration?: number;
  animationDelay?: number;
  parallaxOffset?: number;
  animationConfig?: {
    duration?: number;
    spring?: { damping: number; stiffness: number };
  };
}

export const Container = React.forwardRef<any, ContainerProps>(({
  safe = true,
  scroll = false,
  scrollProps = {},
  maxWidth = 'full',
  centered = true,
  children,
  style,
  // Animation props
  animated = false,
  animationVariant = 'moderate',
  animationType = 'fade',
  animationDuration,
  animationDelay = 0,
  parallaxOffset = 20,
  animationConfig,
  ...props
}, ref) => {
  const theme = useTheme();
  const { config, isAnimated } = useAnimationVariant({
    variant: animationVariant,
    overrides: animationConfig,
  });
  
  const maxWidthValue = {
    sm: designSystem.breakpoints.sm,
    md: designSystem.breakpoints.md,
    lg: designSystem.breakpoints.lg,
    xl: designSystem.breakpoints.xl,
    '2xl': designSystem.breakpoints['2xl'],
    full: '100%' as const,
  }[maxWidth];
  
  const containerContent = (
    <Box
      flex={1}
      width="100%"
      maxWidth={maxWidthValue}
      alignSelf={centered ? 'center' : undefined}
      animated={animated && isAnimated}
      animationVariant={animationVariant}
      animationType={animationType}
      animationDuration={animationDuration}
      animationDelay={animationDelay}
      animationConfig={animationConfig}
      {...props}
    >
      {children}
    </Box>
  );
  
  const scrollContent = scroll ? (
    <ScrollView
      ref={ref}
      style={{ flex: 1 }}
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
      {...scrollProps}
    >
      {containerContent}
    </ScrollView>
  ) : (
    containerContent
  );
  
  if (safe) {
    return (
      <SafeAreaView
        ref={!scroll ? ref : undefined}
        style={[{ flex: 1, backgroundColor: theme.background }, style]}
      >
        {scrollContent}
      </SafeAreaView>
    );
  }
  
  return scrollContent;
});

Container.displayName = 'Container';