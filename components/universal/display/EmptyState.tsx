import React, { useEffect } from 'react';
import { View, ViewStyle, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  FadeIn,
  ZoomIn,
  SlideInUp,
} from 'react-native-reanimated';
import { Text, Heading3 } from '@/components/universal/typography/Text';
import { Button } from '@/components/universal/interaction/Button';
import { useSpacing } from '@/lib/stores/spacing-store';
import { Symbol } from '@/components/universal/display/Symbols';
import { useAnimationStore } from '@/lib/stores/animation-store';
import { cn } from '@/lib/core/utils';
import { Box } from '@/components/universal/layout/Box';
import { VStack } from '@/components/universal/layout/Stack';


export type EmptyStateAnimationType = 'fadeIn' | 'iconBounce' | 'stagger' | 'none';

export interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  iconName?: keyof typeof any;
  iconSize?: number;
  action?: {
    label: string;
    onPress: () => void;
  };
  secondaryAction?: {
    label: string;
    onPress: () => void;
  };
  variant?: 'default' | 'compact' | 'large';
  style?: ViewStyle;
  testID?: string;
  
  // Animation props
  animated?: boolean;
  animationType?: EmptyStateAnimationType;
  animationDuration?: number;
  animationDelay?: number;
  iconBounceHeight?: number;
  staggerDelay?: number;
  animationConfig?: {
    duration?: number;
    spring?: { damping: number; stiffness: number };
  };
}

export const EmptyState = React.forwardRef<View, EmptyStateProps>(
  (
    {
      title = 'No data found',
      description,
      icon,
      iconName = 'folder-open-outline',
      iconSize,
      action,
      secondaryAction,
      variant = 'default',
      style,
      testID,
      // Animation props
      animated = true,
      animationType = 'stagger',
      animationDuration,
      animationDelay = 0,
      iconBounceHeight = 20,
      staggerDelay = 100,
      animationConfig,
    },
    ref
  ) => {
    const { spacing } = useSpacing();
    const { shouldAnimate } = useAnimationStore();
    
    const duration = animationDuration ?? 300;
    
    // Animation values
    const iconTranslateY = useSharedValue(0);
    const iconScale = useSharedValue(1);
    const opacity = useSharedValue(0);
    
    // Trigger animations on mount
    useEffect(() => {
      if (animated && isAnimated && shouldAnimate()) {
        if (animationType === 'iconBounce') {
          // Icon bounce animation
          iconTranslateY.value = withDelay(
            animationDelay,
            withSequence(
              withSpring(-iconBounceHeight, { ...config.spring, damping: 8 }),
              withSpring(0, config.spring)
            )
          );
          iconScale.value = withDelay(
            animationDelay,
            withSequence(
              withTiming(1.1, { duration: duration / 4 }),
              withSpring(1, config.spring)
            )
          );
        }
        
        if (animationType === 'fadeIn') {
          opacity.value = withDelay(
            animationDelay,
            withTiming(1, { duration })
          );
        }
      }
    }, [animated, isAnimated, shouldAnimate, animationType, animationDelay, iconBounceHeight, duration, config.spring]);
    
    // Animated styles
    const iconAnimatedStyle = useAnimatedStyle(() => ({
      transform: [
        { translateY: iconTranslateY.value },
        { scale: iconScale.value },
      ],
    }));
    
    const fadeAnimatedStyle = useAnimatedStyle(() => ({
      opacity: opacity.value,
    }));

    const sizeConfig = {
      compact: {
        iconSize: 48,
        spacing: 2,
        titleSize: 'md' as const,
        descriptionSize: 'sm' as const,
      },
      default: {
        iconSize: 64,
        spacing: 3,
        titleSize: 'lg' as const,
        descriptionSize: 'md' as const,
      },
      large: {
        iconSize: 80,
        spacing: 4,
        titleSize: 'xl' as const,
        descriptionSize: 'md' as const,
      },
    }[variant];

    const containerStyle: ViewStyle = {
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing[6],
      ...style,
    };

    const iconContainerStyle: ViewStyle = {
      marginBottom: spacing[sizeConfig.spacing],
    };

    const textContainerStyle: ViewStyle = {
      alignItems: 'center',
      marginBottom: action || secondaryAction ? spacing[sizeConfig.spacing] : 0,
    };

    const actionContainerStyle: ViewStyle = {
      flexDirection: 'row',
      gap: spacing[2],
    };

    const renderIcon = () => {
      const iconContent = icon || (
        <View
          style={{
            width: sizeConfig.iconSize + spacing[4],
            height: sizeConfig.iconSize + spacing[4],
            borderRadius: (sizeConfig.iconSize + spacing[4]) / 2,
            backgroundColor: theme.muted,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Symbol
            name="iconName"
            size={iconSize || sizeConfig.iconSize}
            color={theme.mutedForeground}
          />
        </View>
      );

      if (animated && isAnimated && shouldAnimate() && (animationType === 'iconBounce' || animationType === 'stagger')) {
        return (
          <Animated.View 
            style={[
              animationType === 'iconBounce' ? iconAnimatedStyle : {},
            ]}
            entering={Platform.OS !== 'web' && animationType === 'stagger' 
              ? ZoomIn.duration(duration).delay(animationDelay) 
              : undefined
            }
          >
            {iconContent}
          </Animated.View>
        );
      }

      return iconContent;
    };

    // Get stagger delays for each element
    const getStaggerDelay = (index: number) => 
      animationType === 'stagger' ? animationDelay + (index * staggerDelay) : animationDelay;

    // Web CSS animations
    const webAnimationStyle = Platform.OS === 'web' && animated && isAnimated && shouldAnimate() ? {
      '@keyframes fadeIn': {
        from: { opacity: 0 },
        to: { opacity: 1 },
      },
      '@keyframes bounceIn': {
        '0%': { transform: 'scale(0.3) translateY(20px)', opacity: 0 },
        '50%': { transform: 'scale(1.05) translateY(-10px)' },
        '70%': { transform: 'scale(0.9) translateY(5px)' },
        '100%': { transform: 'scale(1) translateY(0px)', opacity: 1 },
      },
    } as any : {};

    const AnimatedContainer = animated && isAnimated && shouldAnimate() && animationType === 'fadeIn' 
      ? Animated.View 
      : View;

    return (
      <AnimatedContainer 
        ref={ref} 
        style={[
          containerStyle,
          animated && isAnimated && shouldAnimate() && animationType === 'fadeIn' ? fadeAnimatedStyle : {},
          Platform.OS === 'web' && animated && isAnimated && shouldAnimate() && animationType === 'fadeIn' ? {
            animation: `fadeIn ${duration}ms ease-out ${animationDelay}ms backwards`,
          } as any : {},
          webAnimationStyle,
        ]} 
        testID={testID}
      >
        <Animated.View 
          style={iconContainerStyle}
          entering={Platform.OS !== 'web' && animated && isAnimated && shouldAnimate() && animationType === 'stagger' 
            ? FadeIn.duration(duration).delay(getStaggerDelay(0)) 
            : undefined
          }
        >
          {renderIcon()}
        </Animated.View>

        <Animated.View 
          style={textContainerStyle}
          entering={Platform.OS !== 'web' && animated && isAnimated && shouldAnimate() && animationType === 'stagger' 
            ? SlideInUp.duration(duration).delay(getStaggerDelay(1)) 
            : undefined
          }
        >
          <Heading3
            size={sizeConfig.titleSize}
            colorTheme="foreground"
            style={{ marginBottom: spacing[1], textAlign: 'center' }}
          >
            {title}
          </Heading3>
          {description && (
            <Text
              size={sizeConfig.descriptionSize}
              colorTheme="mutedForeground"
              style={{ textAlign: 'center', maxWidth: 300 }}
            >
              {description}
            </Text>
          )}
        </Animated.View>

        {(action || secondaryAction) && (
          <Animated.View 
            style={actionContainerStyle}
            entering={Platform.OS !== 'web' && animated && isAnimated && shouldAnimate() && animationType === 'stagger' 
              ? SlideInUp.duration(duration).delay(getStaggerDelay(2)) 
              : undefined
            }
          >
            {secondaryAction && (
              <Button
                variant="outline"
                size={variant === 'compact' ? 'sm' : 'md'}
                onPress={secondaryAction.onPress}
                animated={animated}
              >
                {secondaryAction.label}
              </Button>
            )}
            {action && (
              <Button
                variant="solid"
                size={variant === 'compact' ? 'sm' : 'md'}
                onPress={action.onPress}
                animated={animated}
              >
                {action.label}
              </Button>
            )}
          </Animated.View>
        )}
      </AnimatedContainer>
    );
  }
);

EmptyState.displayName = 'EmptyState';

// Pre-configured empty states
export const NoDataEmptyState: React.FC<Omit<EmptyStateProps, 'title' | 'iconName'>> = (props) => (
  <EmptyState
    title="No data found"
    description="There&apos;s no data to display at the moment."
    iconName="folder-open-outline"
    {...props}
  />
);

export const NoResultsEmptyState: React.FC<Omit<EmptyStateProps, 'title' | 'iconName'>> = (props) => (
  <EmptyState
    title="No results found"
    description="Try adjusting your search or filters to find what you&apos;re looking for."
    iconName="search-outline"
    {...props}
  />
);

export const ErrorEmptyState: React.FC<Omit<EmptyStateProps, 'title' | 'iconName'>> = (props) => (
  <EmptyState
    title="Something went wrong"
    description="We couldn&apos;t load the data. Please try again."
    iconName="alert-circle-outline"
    action={{ label: 'Retry', onPress: () => {} }}
    {...props}
  />
);

export const OfflineEmptyState: React.FC<Omit<EmptyStateProps, 'title' | 'iconName'>> = (props) => (
  <EmptyState
    title="No internet connection"
    description="Please check your connection and try again."
    iconName="wifi-outline"
    action={{ label: 'Retry', onPress: () => {} }}
    {...props}
  />
);

export const NoAccessEmptyState: React.FC<Omit<EmptyStateProps, 'title' | 'iconName'>> = (props) => (
  <EmptyState
    title="Access denied"
    description="You don&apos;t have permission to view this content."
    iconName="lock-closed-outline"
    {...props}
  />
);