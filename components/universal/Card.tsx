import React, { useState } from 'react';
import { View, Platform, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/lib/theme/provider';
import { Box, BoxProps } from './Box';
import { Text, TextProps } from './Text';
import { useSpacing } from '@/lib/stores/spacing-store';
import { 
 
  SpacingScale,
  AnimationVariant,
  CardAnimationType,
} from '@/lib/design';
import { useAnimationVariant } from '@/hooks/useAnimationVariant';
import { haptic } from '@/lib/ui/haptics';

const AnimatedBox = Animated.createAnimatedComponent(Box);

// Card component
interface CardProps extends BoxProps {
  hoverable?: boolean;
  pressable?: boolean;
  onPress?: () => void;
  
  // Animation props
  animated?: boolean;
  animationVariant?: AnimationVariant;
  animationType?: CardAnimationType;
}

export const Card = React.forwardRef<View, CardProps>(({
  children,
  style,
  hoverable = false,
  pressable = false,
  onPress,
  // Animation props
  animated = false,
  animationVariant = 'subtle',
  animationType = 'lift',
  ...props
}, ref) => {
  const theme = useTheme();
  const { componentSpacing, spacing } = useSpacing();
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  
  // Get animation config
  const { config, isAnimated, hoverScale } = useAnimationVariant({ 
    variant: animationVariant 
  });
  
  // Animation values
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);
  const rotateX = useSharedValue(0);
  const shadowScale = useSharedValue(1);
  
  // Handle hover state
  React.useEffect(() => {
    if (!animated || !isAnimated) return;
    
    if (isHovered) {
      switch (animationType) {
        case 'lift':
          translateY.value = withSpring(-4, config.spring);
          shadowScale.value = withSpring(1.2, config.spring);
          break;
        case 'tilt':
          rotateX.value = withSpring(5, config.spring);
          break;
        case 'reveal':
          scale.value = withSpring(hoverScale, config.spring);
          break;
      }
      if (Platform.OS !== 'web') {
        haptic('selection');
      }
    } else {
      translateY.value = withSpring(0, config.spring);
      rotateX.value = withSpring(0, config.spring);
      scale.value = withSpring(1, config.spring);
      shadowScale.value = withSpring(1, config.spring);
    }
  }, [isHovered, animated, isAnimated, animationType, config.spring, hoverScale]);
  
  // Handle press state
  React.useEffect(() => {
    if (!pressable || !animated) return;
    
    if (isPressed) {
      scale.value = withSpring(0.98, config.spring);
    } else {
      scale.value = withSpring(1, config.spring);
    }
  }, [isPressed, pressable, animated, config.spring]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
      { perspective: 1000 },
      { rotateX: `${rotateX.value}deg` },
    ],
  }));
  
  // Get shadow style based on hover state
  const getShadowStyle = () => {
    const baseShadow = isHovered ? 'var(--shadow-md)' : 'var(--shadow-sm)';
    if (Platform.OS === 'web') {
      return {
        boxShadow: baseShadow,
        transition: animated && isAnimated ? `all ${config.duration.normal}ms ease` : 'all 0.2s ease',
      };
    } else {
      return {
        elevation: isHovered ? 8 : 4,
        shadowColor: 'theme.foreground',
        shadowOffset: { width: 0, height: isHovered ? 4 : 2 },
        shadowOpacity: isHovered ? 0.15 : 0.1,
        shadowRadius: isHovered ? 8 : 4,
      };
    }
  };
  
  const shadowStyle = getShadowStyle();
  const cardStyle = [shadowStyle, style];
  
  const handleHoverIn = () => {
    if (hoverable || animated) {
      setIsHovered(true);
    }
  };
  
  const handleHoverOut = () => {
    setIsHovered(false);
  };
  
  const handlePressIn = () => {
    if (pressable) {
      setIsPressed(true);
    }
  };
  
  const handlePressOut = () => {
    setIsPressed(false);
  };
  
  const handlePress = () => {
    if (onPress) {
      haptic('medium');
      onPress();
    }
  };
  
  const CardContent = animated && isAnimated ? (
    <AnimatedBox
      ref={!pressable ? ref : undefined}
      bgTheme="card"
      rounded={'lg' as BorderRadius}
      borderWidth={1}
      borderTheme="border"
      style={[cardStyle, animatedStyle]}
      onPress={pressable ? handlePress : undefined}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      {...(Platform.OS === 'web' && (hoverable || animated) && {
        onMouseEnter: handleHoverIn,
        onMouseLeave: handleHoverOut,
        style: [
          cardStyle,
          animatedStyle,
          { cursor: pressable ? 'pointer' : 'default' },
        ],
      })}
      {...props}
    >
      {children}
    </AnimatedBox>
  ) : (
    <Box
      ref={!pressable ? ref : undefined}
      bgTheme="card"
      rounded={'lg' as BorderRadius}
      borderWidth={1}
      borderTheme="border"
      style={cardStyle}
      onPress={pressable ? handlePress : undefined}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      {...(Platform.OS === 'web' && (hoverable || pressable) && {
        onMouseEnter: handleHoverIn,
        onMouseLeave: handleHoverOut,
        style: [
          cardStyle,
          { cursor: pressable ? 'pointer' : 'default' },
        ],
      })}
      {...props}
    >
      {children}
    </Box>
  );

  if (pressable && onPress && Platform.OS !== 'web') {
    return (
      <Pressable ref={ref} onPress={handlePress}>
        {CardContent}
      </Pressable>
    );
  }

  return CardContent;
});

Card.displayName = 'Card';

// CardHeader component
interface CardHeaderProps extends BoxProps {}

export const CardHeader = React.forwardRef<View, CardHeaderProps>(({
  children,
  style,
  ...props
}, ref) => {
  const { componentSpacing } = useSpacing();
  
  return (
    <Box
      ref={ref}
      p={componentSpacing.cardPadding as SpacingScale}
      style={style}
      {...props}
    >
      {children}
    </Box>
  );
});

CardHeader.displayName = 'CardHeader';

// CardTitle component
interface CardTitleProps extends TextProps {}

export const CardTitle = React.forwardRef<any, CardTitleProps>(({
  children,
  style,
  ...props
}, ref) => {
  return (
    <Text
      ref={ref}
      size="2xl"
      weight="semibold"
      colorTheme="cardForeground"
      style={style}
      {...props}
    >
      {children}
    </Text>
  );
});

CardTitle.displayName = 'CardTitle';

// CardDescription component
interface CardDescriptionProps extends TextProps {}

export const CardDescription = React.forwardRef<any, CardDescriptionProps>(({
  children,
  style,
  ...props
}, ref) => {
  return (
    <Text
      ref={ref}
      size="sm"
      colorTheme="mutedForeground"
      mt={1}
      style={style}
      {...props}
    >
      {children}
    </Text>
  );
});

CardDescription.displayName = 'CardDescription';

// CardContent component
interface CardContentProps extends BoxProps {}

export const CardContent = React.forwardRef<View, CardContentProps>(({
  children,
  style,
  ...props
}, ref) => {
  const { componentSpacing } = useSpacing();
  
  return (
    <Box
      ref={ref}
      p={componentSpacing.cardPadding as SpacingScale}
      pt={0}
      style={style}
      {...props}
    >
      {children}
    </Box>
  );
});

CardContent.displayName = 'CardContent';

// CardFooter component
interface CardFooterProps extends BoxProps {}

export const CardFooter = React.forwardRef<View, CardFooterProps>(({
  children,
  style,
  ...props
}, ref) => {
  const { componentSpacing } = useSpacing();
  
  return (
    <Box
      ref={ref}
      flexDirection="row"
      alignItems="center"
      p={componentSpacing.cardPadding as SpacingScale}
      pt={0}
      style={style}
      {...props}
    >
      {children}
    </Box>
  );
});

CardFooter.displayName = 'CardFooter';