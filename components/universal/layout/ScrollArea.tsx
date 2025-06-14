import React, { useRef } from 'react';
import { ScrollView, ScrollViewProps, View, ViewStyle, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolate,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { cn } from '@/lib/core/utils';
import { useAnimationStore } from '@/lib/stores/animation-store';

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

export interface ScrollAreaProps extends ScrollViewProps {
  children: React.ReactNode;
  className?: string;
  style?: ViewStyle;
  
  // Scrollbar props
  showScrollbar?: boolean;
  scrollbarSize?: 'sm' | 'default' | 'lg';
  scrollbarVariant?: 'default' | 'muted' | 'primary';
  autoHideScrollbar?: boolean;
  hideDelay?: number;
  
  // Animation props
  animated?: boolean;
  fadeEdges?: boolean;
  edgeFadeSize?: number;
}

// Scrollbar size config
const scrollbarSizeConfig = {
  sm: { width: 2, thumb: 20 },
  default: { width: 4, thumb: 30 },
  lg: { width: 6, thumb: 40 },
};

// Scrollbar variant classes
const scrollbarVariantClasses = {
  default: 'bg-border',
  muted: 'bg-muted-foreground/20',
  primary: 'bg-primary/30',
};

const scrollbarThumbVariantClasses = {
  default: 'bg-foreground/50',
  muted: 'bg-muted-foreground/50',
  primary: 'bg-primary',
};

export const ScrollArea = React.forwardRef<ScrollView, ScrollAreaProps>(({
  children,
  className,
  style,
  showScrollbar = true,
  scrollbarSize = 'default',
  scrollbarVariant = 'default',
  autoHideScrollbar = true,
  hideDelay = 1000,
  animated = true,
  fadeEdges = false,
  edgeFadeSize = 20,
  onScroll,
  ...props
}, ref) => {
  const { shouldAnimate } = useAnimationStore();
  const scrollY = useSharedValue(0);
  const contentHeight = useSharedValue(0);
  const containerHeight = useSharedValue(0);
  const scrollbarOpacity = useSharedValue(0);
  const hideTimer = useRef<NodeJS.Timeout>();
  
  const config = scrollbarSizeConfig[scrollbarSize];
  
  // Handle scroll
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
      contentHeight.value = event.contentSize.height;
      containerHeight.value = event.layoutMeasurement.height;
      
      // Show scrollbar
      if (autoHideScrollbar) {
        scrollbarOpacity.value = 1;
      }
      
      // Run user's onScroll
      if (onScroll && typeof onScroll === 'function') {
        'worklet';
        // @ts-ignore
        onScroll(event);
      }
    },
    onMomentumEnd: () => {
      // Hide scrollbar after delay
      if (autoHideScrollbar) {
        'worklet';
        setTimeout(() => {
          scrollbarOpacity.value = 0;
        }, hideDelay);
      }
    },
  });
  
  // Scrollbar styles
  const scrollbarAnimatedStyle = useAnimatedStyle(() => {
    const scrollableHeight = contentHeight.value - containerHeight.value;
    const scrollPercentage = scrollableHeight > 0 ? scrollY.value / scrollableHeight : 0;
    const thumbHeight = Math.max(
      config.thumb,
      (containerHeight.value / contentHeight.value) * containerHeight.value
    );
    const maxTranslate = containerHeight.value - thumbHeight;
    
    return {
      opacity: autoHideScrollbar ? scrollbarOpacity.value : 1,
      height: thumbHeight,
      transform: [{
        translateY: interpolate(
          scrollPercentage,
          [0, 1],
          [0, maxTranslate],
          Extrapolate.CLAMP
        ),
      }],
    };
  });
  
  // Edge fade styles
  const topFadeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [0, edgeFadeSize],
      [0, 1],
      Extrapolate.CLAMP
    ),
  }));
  
  const bottomFadeStyle = useAnimatedStyle(() => {
    const scrollableHeight = contentHeight.value - containerHeight.value;
    return {
      opacity: interpolate(
        scrollY.value,
        [scrollableHeight - edgeFadeSize, scrollableHeight],
        [1, 0],
        Extrapolate.CLAMP
      ),
    };
  });
  
  return (
    <View className={cn('relative flex-1', className)} style={style}>
      <AnimatedScrollView
        ref={ref}
        onScroll={animated && shouldAnimate() ? scrollHandler : onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        entering={animated && shouldAnimate() ? FadeIn : undefined}
        {...props}
      >
        {children}
      </AnimatedScrollView>
      
      {/* Custom scrollbar */}
      {showScrollbar && Platform.OS !== 'android' && (
        <View
          className={cn(
            'absolute right-0 top-0 bottom-0 rounded-full',
            scrollbarVariantClasses[scrollbarVariant]
          )}
          style={{ width: config.width }}
          pointerEvents="none"
        >
          <Animated.View
            className={cn(
              'absolute right-0 rounded-full',
              scrollbarThumbVariantClasses[scrollbarVariant]
            )}
            style={[
              { width: config.width },
              animated && shouldAnimate() ? scrollbarAnimatedStyle : {},
            ]}
          />
        </View>
      )}
      
      {/* Edge fades */}
      {fadeEdges && (
        <>
          <Animated.View
            className="absolute top-0 left-0 right-0 bg-gradient-to-b from-background to-transparent"
            style={[
              { height: edgeFadeSize },
              animated && shouldAnimate() ? topFadeStyle : {},
            ]}
            pointerEvents="none"
          />
          <Animated.View
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background to-transparent"
            style={[
              { height: edgeFadeSize },
              animated && shouldAnimate() ? bottomFadeStyle : {},
            ]}
            pointerEvents="none"
          />
        </>
      )}
    </View>
  );
});

ScrollArea.displayName = 'ScrollArea';

// Horizontal ScrollArea variant
export const HorizontalScrollArea = React.forwardRef<ScrollView, Omit<ScrollAreaProps, 'horizontal'>>(
  (props, ref) => (
    <ScrollArea ref={ref} horizontal {...props} />
  )
);

HorizontalScrollArea.displayName = 'HorizontalScrollArea';