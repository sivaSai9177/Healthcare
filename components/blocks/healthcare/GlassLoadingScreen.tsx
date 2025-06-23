import React, { useEffect } from 'react';
import { View, Dimensions, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  withRepeat,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { Text } from '@/components/universal/typography';
import { StatusGlassCard } from '@/components/universal/display/GlassCard';
import { VStack, HStack, Box } from '@/components/universal/layout';
import { healthcareSpringConfigs, glassShimmerAnimation } from '@/lib/ui/animations/healthcare-animations';
import { useSpacing } from '@/lib/stores/spacing-store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const GlassLoadingScreen = ({ 
  message = 'Loading healthcare data...',
  showProgress = true 
}: {
  message?: string;
  showProgress?: boolean;
}) => {
  const { spacing } = useSpacing();
  
  // Animation values
  const mainScale = useSharedValue(0.8);
  const mainOpacity = useSharedValue(0);
  const shimmerProgress = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const progressWidth = useSharedValue(0);
  
  // Animated dots
  const dot1Opacity = useSharedValue(0);
  const dot2Opacity = useSharedValue(0);
  const dot3Opacity = useSharedValue(0);
  
  useEffect(() => {
    // Main card entrance
    mainScale.value = withSpring(1, healthcareSpringConfigs.gentle);
    mainOpacity.value = withTiming(1, { duration: 500 });
    
    // Start shimmer
    shimmerProgress.value = glassShimmerAnimation(shimmerProgress);
    
    // Pulse animation
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    
    // Progress animation
    if (showProgress) {
      progressWidth.value = withRepeat(
        withSequence(
          withTiming(80, { duration: 2000, easing: Easing.out(Easing.cubic) }),
          withTiming(20, { duration: 500 }),
          withTiming(95, { duration: 1500, easing: Easing.out(Easing.cubic) }),
          withTiming(30, { duration: 500 })
        ),
        -1,
        false
      );
    }
    
    // Animated dots
    dot1Opacity.value = withRepeat(
      withSequence(
        withDelay(0, withTiming(1, { duration: 300 })),
        withDelay(900, withTiming(0, { duration: 300 }))
      ),
      -1,
      false
    );
    
    dot2Opacity.value = withRepeat(
      withSequence(
        withDelay(300, withTiming(1, { duration: 300 })),
        withDelay(600, withTiming(0, { duration: 300 }))
      ),
      -1,
      false
    );
    
    dot3Opacity.value = withRepeat(
      withSequence(
        withDelay(600, withTiming(1, { duration: 300 })),
        withDelay(300, withTiming(0, { duration: 300 }))
      ),
      -1,
      false
    );
  }, [mainScale, mainOpacity, shimmerProgress, pulseScale, progressWidth, showProgress, dot1Opacity, dot2Opacity, dot3Opacity]);
  
  const mainStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: mainScale.value * pulseScale.value }
    ],
    opacity: mainOpacity.value,
  }));
  
  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{
      translateX: interpolate(
        shimmerProgress.value,
        [0, 1],
        [-SCREEN_WIDTH, SCREEN_WIDTH]
      )
    }],
  }));
  
  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));
  
  return (
    <View className="flex-1 items-center justify-center p-6">
      <Animated.View style={mainStyle}>
        <StatusGlassCard
          className="p-8 items-center"
          style={{ minWidth: 280 }}
          animationType="none"
        >
          <VStack gap={spacing[6] as any} align="center">
            {/* Healthcare Icon with pulse */}
            <Box className="relative">
              <Text size="5xl">🏥</Text>
              
              {/* Pulse rings */}
              <Animated.View
                className="absolute inset-0 rounded-full border-2 border-primary/20"
                style={useAnimatedStyle(() => ({
                  transform: [{ scale: pulseScale.value * 1.5 }],
                  opacity: interpolate(pulseScale.value, [1, 1.02], [0.4, 0]),
                }))}
              />
            </Box>
            
            {/* Loading message with dots */}
            <HStack gap={spacing[1] as any} align="center">
              <Text size="lg" colorTheme="foreground">{message}</Text>
              <HStack gap={spacing[0.5] as any}>
                <Animated.Text style={{ opacity: dot1Opacity }}>.</Animated.Text>
                <Animated.Text style={{ opacity: dot2Opacity }}>.</Animated.Text>
                <Animated.Text style={{ opacity: dot3Opacity }}>.</Animated.Text>
              </HStack>
            </HStack>
            
            {/* Progress bar */}
            {showProgress && (
              <Box className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <Animated.View
                  className="h-full bg-primary rounded-full"
                  style={progressStyle}
                />
              </Box>
            )}
            
            {/* Shimmer overlay */}
            <Animated.View
              className="absolute inset-0 opacity-10"
              style={[
                shimmerStyle,
                {
                  backgroundColor: Platform.OS === 'web' 
                    ? 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.7) 50%, transparent 60%)'
                    : 'rgba(255,255,255,0.7)',
                  pointerEvents: 'none' as any,
                }
              ]}
            />
          </VStack>
        </StatusGlassCard>
      </Animated.View>
    </View>
  );
};