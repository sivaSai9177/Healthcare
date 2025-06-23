import React, { useEffect } from 'react';
import { View, Dimensions, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  interpolate,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Text } from '@/components/universal/typography/Text';
import { VStack } from '@/components/universal/layout/Stack';
import { useTheme } from '@/lib/theme/provider';
import { haptic } from '@/lib/ui/haptics';
import { useResponsive } from '@/hooks/responsive';
import {
  successAnimationConfig,
  generateParticlePath,
  successEasings,
  successSequence,
} from '@/lib/ui/animations/success-animations';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SuccessAnimationProps {
  visible: boolean;
  title?: string;
  subtitle?: string;
  onComplete?: () => void;
  autoHide?: boolean;
  autoHideDelay?: number;
}

// Particle component for confetti effect
const Particle = ({ index, totalParticles }: { index: number; totalParticles: number }) => {
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);
  
  const particlePath = generateParticlePath(index, totalParticles);
  const particleColor = successAnimationConfig.particles.colors[
    index % successAnimationConfig.particles.colors.length
  ];
  
  React.useEffect(() => {
    opacity.value = withDelay(
      successSequence.particlesStart,
      withSequence(
        withTiming(1, { duration: 100 }),
        withDelay(
          successAnimationConfig.particles.duration - 300,
          withTiming(0, { duration: 300 })
        )
      )
    );
    
    translateX.value = withDelay(
      successSequence.particlesStart,
      withSpring(particlePath.endX, {
        damping: 12,
        stiffness: 100,
        mass: 0.8,
      })
    );
    
    translateY.value = withDelay(
      successSequence.particlesStart,
      withSpring(particlePath.endY, {
        damping: 12,
        stiffness: 100,
        mass: 0.8,
      })
    );
    
    scale.value = withDelay(
      successSequence.particlesStart,
      withSequence(
        withSpring(1.2, { damping: 10, stiffness: 200 }),
        withTiming(0, { duration: 300, easing: Easing.in(Easing.cubic) })
      )
    );
    
    rotate.value = withDelay(
      successSequence.particlesStart,
      withTiming(360, {
        duration: successAnimationConfig.particles.duration,
        easing: Easing.linear,
      })
    );
  }, []);
  
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));
  
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: particleColor,
        },
        animatedStyle,
      ]}
    />
  );
};

export function SuccessAnimation({
  visible,
  title = 'Success!',
  subtitle = 'Operation completed successfully',
  onComplete,
  autoHide = true,
  autoHideDelay = successSequence.autoHideDelay,
}: SuccessAnimationProps) {
  const theme = useTheme();
  const { isMobile } = useResponsive();
  
  // Animation values
  const containerOpacity = useSharedValue(0);
  const contentScale = useSharedValue(0.8);
  const circleProgress = useSharedValue(0);
  const checkmarkProgress = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  
  useEffect(() => {
    if (visible) {
      // Trigger haptic feedback
      haptic('success');
      
      // Container entrance
      containerOpacity.value = withTiming(1, {
        duration: successAnimationConfig.container.entranceDuration,
        easing: Easing.out(Easing.cubic),
      });
      
      contentScale.value = withSpring(1, {
        damping: 15,
        stiffness: 300,
        mass: 1,
      });
      
      // Circle animation
      circleProgress.value = withDelay(
        successSequence.circleStart,
        withTiming(1, {
          duration: successAnimationConfig.circle.duration,
          easing: Easing.out(Easing.cubic),
        })
      );
      
      // Checkmark animation
      checkmarkProgress.value = withDelay(
        successSequence.checkmarkStart,
        withSpring(1, {
          damping: 12,
          stiffness: 180,
          mass: 0.8,
        })
      );
      
      // Text fade in
      textOpacity.value = withDelay(
        successSequence.textFadeIn,
        withTiming(1, {
          duration: successAnimationConfig.text.duration,
          easing: Easing.out(Easing.cubic),
        })
      );
      
      // Auto hide
      if (autoHide && onComplete) {
        setTimeout(() => {
          // Fade out animations
          containerOpacity.value = withTiming(0, {
            duration: successSequence.fadeOutDuration,
            easing: Easing.in(Easing.cubic),
          }, () => {
            runOnJS(onComplete)();
          });
          
          contentScale.value = withTiming(0.8, {
            duration: successSequence.fadeOutDuration,
            easing: Easing.in(Easing.cubic),
          });
        }, autoHideDelay);
      }
    }
  }, [visible, autoHide, autoHideDelay, onComplete]);
  
  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));
  
  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ scale: contentScale.value }],
  }));
  
  const circleStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: circleProgress.value },
      { rotate: `${interpolate(circleProgress.value, [0, 1], [-90, 270])}deg` },
    ],
    opacity: circleProgress.value,
  }));
  
  const checkmarkStyle = useAnimatedStyle(() => ({
    opacity: checkmarkProgress.value,
    transform: [
      {
        scale: interpolate(
          checkmarkProgress.value,
          [0, 0.5, 1],
          [0, successAnimationConfig.checkmark.scale.overshoot, successAnimationConfig.checkmark.scale.to]
        ),
      },
    ],
  }));
  
  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [
      {
        translateY: interpolate(textOpacity.value, [0, 1], [10, 0]),
      },
    ],
  }));
  
  if (!visible) return null;
  
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          alignItems: 'center',
          justifyContent: 'center',
        },
        containerStyle,
      ]}
    >
      {/* Backdrop */}
      {Platform.OS === 'ios' ? (
        <BlurView
          intensity={80}
          tint="dark"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        />
      ) : (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
          }}
        />
      )}
      
      {/* Content */}
      <Animated.View style={[contentStyle, { alignItems: 'center' }]}>
        {/* Success Icon Container */}
        <View
          style={{
            width: (successAnimationConfig.circle.radius * 2 + 20) * (isMobile ? 0.8 : 1),
            height: (successAnimationConfig.circle.radius * 2 + 20) * (isMobile ? 0.8 : 1),
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Particles */}
          {Array.from({ length: successAnimationConfig.particles.count }).map((_, index) => (
            <Particle
              key={index}
              index={index}
              totalParticles={successAnimationConfig.particles.count}
            />
          ))}
          
          {/* Circle Background */}
          <View
            style={{
              position: 'absolute',
              width: successAnimationConfig.circle.radius * 2 * (isMobile ? 0.8 : 1),
              height: successAnimationConfig.circle.radius * 2 * (isMobile ? 0.8 : 1),
              borderRadius: successAnimationConfig.circle.radius * (isMobile ? 0.8 : 1),
              borderWidth: successAnimationConfig.circle.strokeWidth,
              borderColor: successAnimationConfig.circle.color + '30',
            }}
          />
          
          {/* Animated Circle */}
          <Animated.View
            style={[
              {
                position: 'absolute',
                width: successAnimationConfig.circle.radius * 2 * (isMobile ? 0.8 : 1),
                height: successAnimationConfig.circle.radius * 2 * (isMobile ? 0.8 : 1),
                borderRadius: successAnimationConfig.circle.radius * (isMobile ? 0.8 : 1),
                borderWidth: successAnimationConfig.circle.strokeWidth,
                borderColor: successAnimationConfig.circle.color,
              },
              circleStyle,
            ]}
          />
          
          {/* Checkmark */}
          <Animated.View style={[checkmarkStyle, { position: 'absolute' }]}>
            <Text size={isMobile ? "4xl" : "5xl"}>✓</Text>
          </Animated.View>
        </View>
        
        {/* Text Content */}
        <Animated.View style={[textStyle, { marginTop: isMobile ? 16 : 24 }]}>
          <VStack gap={isMobile ? 4 : 8} alignItems="center">
            <Text size={isMobile ? "xl" : "2xl"} weight="bold" style={{ color: 'white' }}>
              {title}
            </Text>
            <Text size={isMobile ? "sm" : "base"} style={{ color: 'rgba(255, 255, 255, 0.8)', textAlign: 'center', paddingHorizontal: 20 }}>
              {subtitle}
            </Text>
          </VStack>
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
}