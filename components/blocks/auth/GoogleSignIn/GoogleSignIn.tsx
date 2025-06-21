import React from "react";
import { Button, Text, HStack } from "@/components/universal";
import { Symbol } from '@/components/universal/display/Symbols';
import { useGoogleSignIn } from './useGoogleSignIn';
import type { GoogleSignInProps } from './types';
import { cn } from '@/lib/core/utils';
import { useResponsive } from '@/hooks/responsive';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const AnimatedButton = Animated.createAnimatedComponent(Button);

export function GoogleSignInButton({ 
  showIcon = true, 
  text = "Continue with Google",
  variant = "outline",
  size = "default",
  iconOnly = false,
  ...buttonProps 
}: GoogleSignInProps) {
  const { isLoading, handleGoogleSignIn } = useGoogleSignIn();
  const { isMobile } = useResponsive();
  const scale = useSharedValue(1);
  
  // Adjust size based on device type
  const responsiveSize = isMobile && size === "default" ? "lg" : size;
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  
  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
  };
  
  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  return (
    <AnimatedButton
      variant={variant}
      size={responsiveSize}
      isDisabled={isLoading}
      isLoading={isLoading}
      onPress={handleGoogleSignIn}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      fullWidth
      entering={FadeIn.springify()}
      style={animatedStyle}
      className={cn(
        "transition-all duration-200",
        variant === "outline" && "border-2",
        "animate-fade-in"
      )}
      {...buttonProps}
    >
      {!isLoading && (
        <HStack gap={(iconOnly || !text ? 0 : 2) as any} alignItems="center" justifyContent="center">
          {/* Google Logo - Note: Google brand colors are intentionally hardcoded per brand guidelines */}
          {showIcon && (
            <Symbol 
              name="globe" 
              size={responsiveSize === "lg" ? 20 : responsiveSize === "sm" ? 16 : 18} 
              color={variant === 'outline' ? "#4285F4" : "#ffffff"}
              className="animate-scale-in"
            />
          )}
          {!iconOnly && text && (
            <Text 
              size={responsiveSize === "lg" ? "base" : "sm"} 
              weight="medium"
              className={cn(
                variant === "outline" ? "text-foreground" : "text-primary-foreground"
              )}
            >
              {text}
            </Text>
          )}
          {iconOnly && (
            <Text size="xs" style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }}>
              Login with Google
            </Text>
          )}
        </HStack>
      )}
    </AnimatedButton>
  );
}