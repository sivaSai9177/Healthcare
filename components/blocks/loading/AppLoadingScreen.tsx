import React, { useEffect, useState } from 'react';
import { View, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { Text } from '@/components/universal/typography';
import { VStack, Box } from '@/components/universal/layout';
import { useTheme } from '@/lib/theme';
import { useSpacing } from '@/lib/stores/spacing-store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const AppLoadingScreen = ({ 
  showProgress = true,
  progress = undefined,
  minDisplayTime = 1500 // Minimum time to show the loader in milliseconds
}: {
  showProgress?: boolean;
  progress?: number;
  minDisplayTime?: number;
}) => {
  const theme = useTheme();
  const { spacing } = useSpacing();
  const [isVisible, setIsVisible] = useState(true);
  
  // Animation values
  const mainScale = useSharedValue(0.8);
  const mainOpacity = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const progressWidth = useSharedValue(0);
  
  useEffect(() => {
    // Set minimum display time
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, minDisplayTime);
    
    // Main entrance
    mainScale.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.back) });
    mainOpacity.value = withTiming(1, { duration: 500 });
    
    // Pulse animation for hospital icon
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    
    // Progress animation
    if (showProgress && progress === undefined) {
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
    } else if (progress !== undefined) {
      progressWidth.value = withTiming(progress, { duration: 300 });
    }
    
    return () => clearTimeout(timer);
  }, [mainScale, mainOpacity, pulseScale, progressWidth, showProgress, progress, minDisplayTime]);
  
  const mainStyle = useAnimatedStyle(() => ({
    transform: [{ scale: mainScale.value }],
    opacity: mainOpacity.value,
  }));
  
  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));
  
  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));
  
  const pulseRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value * 1.5 }],
    opacity: interpolate(pulseScale.value, [1, 1.02], [0.4, 0]),
  }));
  
  return (
    <View style={{ 
      flex: 1, 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: theme.background,
      padding: spacing[6],
    }}>
      <Animated.View style={mainStyle}>
        <VStack gap={spacing[6] as any} align="center">
          {/* Company Logo (concentric rings) */}
          <View style={{ width: 80, height: 80, position: 'relative' }}>
            {/* Outer ring */}
            <View style={{
              position: 'absolute',
              width: 80,
              height: 80,
              borderRadius: 40,
              borderWidth: 2,
              borderColor: theme.primary,
              opacity: 0.3,
            }} />
            
            {/* Middle ring */}
            <View style={{
              position: 'absolute',
              left: 15,
              top: 15,
              width: 50,
              height: 50,
              borderRadius: 25,
              borderWidth: 2,
              borderColor: theme.primary,
              opacity: 0.5,
            }} />
            
            {/* Inner circle */}
            <View style={{
              position: 'absolute',
              left: 25,
              top: 25,
              width: 30,
              height: 30,
              borderRadius: 15,
              backgroundColor: theme.primary,
            }} />
          </View>
          
          {/* Healthcare Icon with pulse */}
          <Box className="relative">
            <Animated.View style={iconStyle}>
              <Text size="5xl">🏥</Text>
            </Animated.View>
            
            {/* Pulse rings */}
            <Animated.View
              className="absolute inset-0 rounded-full border-2 border-primary/20"
              style={pulseRingStyle}
            />
          </Box>
          
          {/* Progress bar */}
          {showProgress && (
            <Box className="w-full h-2 bg-muted rounded-full overflow-hidden" style={{ width: 280 }}>
              <Animated.View
                className="h-full bg-primary rounded-full"
                style={progressStyle}
              />
            </Box>
          )}
        </VStack>
      </Animated.View>
    </View>
  );
};