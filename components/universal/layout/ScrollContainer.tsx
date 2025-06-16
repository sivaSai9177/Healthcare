import React, { useRef, useEffect } from 'react';
import { Animated, ScrollViewProps, View, Platform } from 'react-native';
import { SafeAreaView , useSafeAreaInsets } from 'react-native-safe-area-context';
import { Box, BoxProps } from './Box';
import { ScrollHeader } from './ScrollHeader';
import { BREAKPOINTS } from '@/lib/design/responsive';
import { useAnimationStore } from '@/lib/stores/animation-store';
import { useAnimationVariant } from '@/hooks/useAnimationVariant';
import { cn } from '@/lib/core/utils';
import { useTheme } from '@/lib/theme/provider';

interface ScrollContainerProps extends Omit<BoxProps, 'maxWidth'> {
  safe?: boolean;
  scrollProps?: ScrollViewProps;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  centered?: boolean;
  headerTitle?: string;
  headerChildren?: React.ReactNode;
  children?: React.ReactNode;
}

export const ScrollContainer = React.forwardRef<any, ScrollContainerProps>(({
  safe = true,
  scrollProps = {},
  maxWidth = 'full',
  centered = true,
  headerTitle,
  headerChildren,
  children,
  style,
  // Animation props
  animated = false,
  animationVariant = 'moderate',
  animationType = 'scroll-fade',
  animationDuration,
  animationDelay = 0,
  parallaxSpeed = 0.5,
  fadeThreshold = 100,
  animationConfig,
  ...props
}, ref) => {
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const { shouldAnimate } = useAnimationStore();
  const { config, isAnimated } = useAnimationVariant({
    variant: animationVariant,
    overrides: animationConfig,
  });
  const theme = useTheme();
  
  const duration = animationDuration ?? config.duration.normal;
  
  const maxWidthValue = {
    sm: BREAKPOINTS.sm,
    md: BREAKPOINTS.md,
    lg: BREAKPOINTS.lg,
    xl: BREAKPOINTS.xl,
    '2xl': BREAKPOINTS['2xl'],
    full: '100%' as const,
  }[maxWidth];

  const headerHeight = Platform.select({
    ios: 44,
    android: 56,
    default: 56,
  });

  const totalHeaderHeight = headerTitle ? headerHeight + insets.top : 0;
  
  // Animation values
  const opacity = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  
  // Apply scroll-based animations
  useEffect(() => {
    if (animated && isAnimated && shouldAnimate() && animationType === 'scroll-fade') {
      scrollY.addListener(({ value }) => {
        // Fade content as it scrolls
        const newOpacity = Math.max(0, Math.min(1, 1 - (value / fadeThreshold)));
        opacity.setValue(newOpacity);
      });
      
      return () => scrollY.removeAllListeners();
    }
  }, [animated, isAnimated, shouldAnimate, animationType, scrollY, fadeThreshold, opacity]);
  
  useEffect(() => {
    if (animated && isAnimated && shouldAnimate() && animationType === 'parallax') {
      scrollY.addListener(({ value }) => {
        // Parallax effect
        translateY.setValue(value * parallaxSpeed);
      });
      
      return () => scrollY.removeAllListeners();
    }
  }, [animated, isAnimated, shouldAnimate, animationType, scrollY, parallaxSpeed, translateY]);
  
  const animatedStyle = animated && isAnimated && shouldAnimate() 
    ? {
        opacity: animationType === 'scroll-fade' ? opacity : 1,
        transform: animationType === 'parallax' ? [{ translateY }] : [],
      }
    : {};
  
  const containerContent = (
    <Animated.View style={animatedStyle}>
      <Box
        flex={1}
        width="100%"
        maxWidth={maxWidthValue}
        alignSelf={centered ? 'center' : undefined}
        {...props}
      >
        {children}
      </Box>
    </Animated.View>
  );
  
  const scrollContent = (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {headerTitle && (
        <ScrollHeader 
          title={headerTitle} 
          scrollY={scrollY}
        >
          {headerChildren}
        </ScrollHeader>
      )}
      <Animated.ScrollView
        ref={ref}
        style={{ flex: 1, backgroundColor: 'transparent' }}
        contentContainerStyle={{ 
          flexGrow: 1,
          paddingTop: totalHeaderHeight,
          backgroundColor: 'transparent',
        }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        {...scrollProps}
      >
        {containerContent}
      </Animated.ScrollView>
    </View>
  );
  
  if (safe) {
    return (
      <SafeAreaView
        className={cn("flex-1", props.className)}
        style={[{ flex: 1, backgroundColor: theme.background }, style]}
        edges={headerTitle ? ['left', 'right', 'bottom'] : undefined}
      >
        {scrollContent}
      </SafeAreaView>
    );
  }
  
  return scrollContent;
});

ScrollContainer.displayName = 'ScrollContainer';