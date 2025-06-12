import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Modal,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Pressable,
  Animated,
  PanResponder,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  ViewStyle,
  StyleSheet,
  Text,
} from 'react-native';
import ReAnimated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  useAnimatedGestureHandler,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Symbol } from './Symbols';
import { useTheme } from '@/lib/theme/provider';
import { useSpacing } from '@/lib/stores/spacing-store';
import { AnimationVariant } from '@/lib/design';
import { useAnimationVariant } from '@/hooks/useAnimationVariant';
import { useAnimationStore } from '@/lib/stores/animation-store';
import { haptic } from '@/lib/ui/haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const AnimatedView = ReAnimated.View;
const AnimatedPressable = ReAnimated.createAnimatedComponent(Pressable);
const AnimatedTouchableOpacity = ReAnimated.createAnimatedComponent(TouchableOpacity);

export type DrawerAnimationType = 'slide' | 'fade' | 'scale' | 'none';

export interface DrawerProps {
  visible: boolean;
  onClose: () => void;
  position?: 'left' | 'right' | 'top' | 'bottom';
  size?: 'sm' | 'md' | 'lg' | 'full';
  children: React.ReactNode;
  animationDuration?: number;
  swipeEnabled?: boolean;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  showHandle?: boolean;
  style?: ViewStyle;
  overlayStyle?: ViewStyle;
  testID?: string;
  
  // Animation props
  animated?: boolean;
  animationVariant?: AnimationVariant;
  animationType?: DrawerAnimationType;
  useHaptics?: boolean;
  animationConfig?: {
    duration?: number;
    spring?: { damping: number; stiffness: number };
  };
}

const DRAWER_SIZES = {
  sm: 280,
  md: 360,
  lg: 480,
  full: '100%' as const,
};

const SWIPE_THRESHOLD = 50;
const SWIPE_VELOCITY_THRESHOLD = 0.3;

export const Drawer = React.forwardRef<View, DrawerProps>(
  (
    {
      visible,
      onClose,
      position = 'left',
      size = 'md',
      children,
      animationDuration = 300,
      swipeEnabled = true,
      closeOnBackdrop = true,
      closeOnEscape = true,
      showHandle = true,
      style,
      overlayStyle,
      testID,
      animated = true,
      animationVariant = 'moderate',
      animationType = 'slide',
      useHaptics = true,
      animationConfig,
    },
    ref
  ) => {
    const theme = useTheme();
    const { spacing } = useSpacing();
    const { shouldAnimate } = useAnimationStore();
    const { config, isAnimated } = useAnimationVariant({
      variant: animationVariant,
      overrides: animationConfig,
    });
    const insets = useSafeAreaInsets();
    
    const translateValue = useRef(new Animated.Value(0)).current;
    const overlayOpacity = useRef(new Animated.Value(0)).current;
    
    const getDrawerSize = () => {
      if (size === 'full') return position === 'left' || position === 'right' ? SCREEN_WIDTH : SCREEN_HEIGHT;
      return DRAWER_SIZES[size];
    };
    
    const drawerSize = getDrawerSize();
    
    const getInitialTranslateValue = () => {
      const baseSize = typeof drawerSize === 'number' ? drawerSize : SCREEN_WIDTH;
      switch (position) {
        case 'left':
          return -baseSize;
        case 'right':
          return baseSize;
        case 'top':
          return -baseSize;
        case 'bottom':
          return baseSize;
        default:
          return -baseSize;
      }
    };
    
    const panResponder = useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => swipeEnabled,
        onMoveShouldSetPanResponder: (_, gestureState) => {
          if (!swipeEnabled) return false;
          
          const { dx, dy } = gestureState;
          switch (position) {
            case 'left':
              return dx < -10;
            case 'right':
              return dx > 10;
            case 'top':
              return dy < -10;
            case 'bottom':
              return dy > 10;
            default:
              return false;
          }
        },
        onPanResponderMove: (_, gestureState) => {
          const { dx, dy } = gestureState;
          let value = 0;
          
          switch (position) {
            case 'left':
              value = Math.min(0, dx);
              break;
            case 'right':
              value = Math.max(0, dx);
              break;
            case 'top':
              value = Math.min(0, dy);
              break;
            case 'bottom':
              value = Math.max(0, dy);
              break;
          }
          
          translateValue.setValue(value);
        },
        onPanResponderRelease: (_, gestureState) => {
          const { dx, dy, vx, vy } = gestureState;
          const shouldClose = 
            (position === 'left' && (dx < -SWIPE_THRESHOLD || vx < -SWIPE_VELOCITY_THRESHOLD)) ||
            (position === 'right' && (dx > SWIPE_THRESHOLD || vx > SWIPE_VELOCITY_THRESHOLD)) ||
            (position === 'top' && (dy < -SWIPE_THRESHOLD || vy < -SWIPE_VELOCITY_THRESHOLD)) ||
            (position === 'bottom' && (dy > SWIPE_THRESHOLD || vy > SWIPE_VELOCITY_THRESHOLD));
          
          if (shouldClose) {
            handleClose();
          } else {
            Animated.timing(translateValue, {
              toValue: 0,
              duration: animationDuration / 2,
              useNativeDriver: true,
            }).start();
          }
        },
      })
    ).current;
    
    const handleClose = useCallback(() => {
      // Haptic feedback for drawer close
      if (useHaptics && Platform.OS !== 'web') {
        haptics.impact('light');
      }
      Animated.parallel([
        Animated.timing(translateValue, {
          toValue: getInitialTranslateValue(),
          duration: animationDuration,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: animationDuration,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onClose();
      });
    }, [animationDuration, onClose, overlayOpacity, translateValue, useHaptics]);
    
    useEffect(() => {
      if (visible) {
        translateValue.setValue(getInitialTranslateValue());
        Animated.parallel([
          Animated.timing(translateValue, {
            toValue: 0,
            duration: animationDuration,
            useNativeDriver: true,
          }),
          Animated.timing(overlayOpacity, {
            toValue: 1,
            duration: animationDuration,
            useNativeDriver: true,
          }),
        ]).start();
      }
    }, [visible, animationDuration, overlayOpacity, translateValue]);
    
    useEffect(() => {
      if (Platform.OS === 'web' && closeOnEscape) {
        const handleEscape = (e: KeyboardEvent) => {
          if (e.key === 'Escape' && visible) {
            handleClose();
          }
        };
        
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
      }
    }, [visible, closeOnEscape, handleClose]);
    
    const getDrawerStyle = (): ViewStyle => {
      const isHorizontal = position === 'left' || position === 'right';
      const baseStyle: ViewStyle = {
        position: 'absolute',
        backgroundColor: theme.card,
        ...Platform.select({
          ios: {
            boxShadow: `0px 2px 8px ${Platform.OS === 'web' ? `${theme.border}40` : theme.border + '40'}`,
          },
          android: {
            elevation: 16,
          },
          default: {
            boxShadow: `0 2px 8px ${theme.foreground}20`,
          },
        }),
      };
      
      switch (position) {
        case 'left':
          return {
            ...baseStyle,
            left: 0,
            top: 0,
            bottom: 0,
            width: drawerSize,
            paddingLeft: insets.left,
          };
        case 'right':
          return {
            ...baseStyle,
            right: 0,
            top: 0,
            bottom: 0,
            width: drawerSize,
            paddingRight: insets.right,
          };
        case 'top':
          return {
            ...baseStyle,
            top: 0,
            left: 0,
            right: 0,
            height: drawerSize,
            paddingTop: insets.top,
          };
        case 'bottom':
          return {
            ...baseStyle,
            bottom: 0,
            left: 0,
            right: 0,
            height: drawerSize,
            paddingBottom: insets.bottom,
          };
      }
    };
    
    const getTransformStyle = (): any => {
      if (position === 'left' || position === 'right') {
        return {
          transform: [{ translateX: translateValue }],
        };
      } else {
        return {
          transform: [{ translateY: translateValue }],
        };
      }
    };
    
    const renderHandle = () => {
      if (!showHandle) return null;
      
      const isHorizontal = position === 'left' || position === 'right';
      
      const AnimatedHandle = () => {
        const pulseValue = useSharedValue(0.3);
        
        useEffect(() => {
          if (animated && isAnimated && shouldAnimate()) {
            // Subtle pulse animation for the handle
            pulseValue.value = withTiming(0.5, { duration: 1000 }, () => {
              pulseValue.value = withTiming(0.3, { duration: 1000 });
            });
          }
        }, []);
        
        const animatedHandleStyle = useAnimatedStyle(() => ({
          opacity: pulseValue.value,
        }));
        
        const handleStyle: ViewStyle = {
          backgroundColor: theme.mutedForeground,
          borderRadius: 2,
          alignSelf: 'center',
          marginVertical: isHorizontal ? 0 : spacing[2],
          marginHorizontal: isHorizontal ? spacing[2] : 0,
          ...(isHorizontal
            ? { width: 4, height: 40 }
            : { width: 40, height: 4 }),
        };
        
        return (
          <AnimatedView 
            style={[
              handleStyle,
              animated && isAnimated && shouldAnimate() ? animatedHandleStyle : { opacity: 0.3 },
            ]} 
          />
        );
      };
      
      return <AnimatedHandle />;
    };
    
    if (!visible) return null;
    
    return (
      <Modal
        visible={visible}
        transparent
        statusBarTranslucent
        animationType="none"
        onRequestClose={handleClose}
        testID={testID}
      >
        <View style={StyleSheet.absoluteFillObject}>
          <TouchableWithoutFeedback
            onPress={closeOnBackdrop ? handleClose : undefined}
            disabled={!closeOnBackdrop}
          >
            <Animated.View
              style={[
                StyleSheet.absoluteFillObject,
                {
                  backgroundColor: Platform.OS === 'web' 
                    ? `${theme.background}80` 
                    : theme.background + '80',
                  opacity: overlayOpacity,
                },
                overlayStyle,
              ]}
            />
          </TouchableWithoutFeedback>
          
          <Animated.View
            ref={ref}
            style={[getDrawerStyle(), getTransformStyle(), style]}
            {...panResponder.panHandlers}
          >
            {(position === 'right' || position === 'bottom') && renderHandle()}
            
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={{ flex: 1 }}
            >
              <ScrollView
                contentContainerStyle={{ flexGrow: 1 }}
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {children}
              </ScrollView>
            </KeyboardAvoidingView>
            
            {(position === 'left' || position === 'top') && renderHandle()}
          </Animated.View>
        </View>
      </Modal>
    );
  }
);

Drawer.displayName = 'Drawer';

// Helper component for drawer header
export interface DrawerHeaderProps {
  title?: string;
  onClose?: () => void;
  children?: React.ReactNode;
  style?: ViewStyle;
  animated?: boolean;
  useHaptics?: boolean;
}

export const DrawerHeader: React.FC<DrawerHeaderProps> = ({
  title,
  onClose,
  children,
  style,
  animated = true,
  useHaptics = true,
}) => {
  const theme = useTheme();
  const { spacing } = useSpacing();
  const { shouldAnimate } = useAnimationStore();
  const { config, isAnimated } = useAnimationVariant({ variant: 'moderate' });
  
  // Animation values for close button
  const closeButtonScale = useSharedValue(1);
  const closeButtonRotation = useSharedValue(0);
  
  const handlePressIn = () => {
    if (animated && isAnimated && shouldAnimate()) {
      closeButtonScale.value = withSpring(0.8, { damping: 15, stiffness: 400 });
      closeButtonRotation.value = withSpring(90, { damping: 15, stiffness: 400 });
    }
  };
  
  const handlePressOut = () => {
    if (animated && isAnimated && shouldAnimate()) {
      closeButtonScale.value = withSpring(1, config.spring);
      closeButtonRotation.value = withSpring(0, config.spring);
    }
  };
  
  const handleClose = () => {
    if (useHaptics && Platform.OS !== 'web') {
      haptic('selection');
    }
    onClose?.();
  };
  
  const animatedCloseButtonStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: closeButtonScale.value },
      { rotate: `${closeButtonRotation.value}deg` },
    ] as any,
  }));
  
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing[4],
          paddingVertical: spacing[3],
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
        },
        style,
      ]}
    >
      {children || (
        <>
          {title && (
            <Text style={{ fontSize: 18, fontWeight: '600', color: theme.foreground }}>
              {title}
            </Text>
          )}
          {onClose && (
            <AnimatedTouchableOpacity
              onPress={handleClose}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              style={[
                {
                  padding: spacing[2],
                  borderRadius: spacing[2],
                },
                animated && isAnimated && shouldAnimate() ? animatedCloseButtonStyle : {},
                Platform.OS === 'web' && {
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                } as any,
              ]}
            >
              <Symbol name="xmark" size={24} color={theme.mutedForeground} />
            </AnimatedTouchableOpacity>
          )}
        </>
      )}
    </View>
  );
};

// Helper component for drawer content
export interface DrawerContentProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const DrawerContent: React.FC<DrawerContentProps> = ({ children, style }) => {
  const { spacing } = useSpacing();
  
  return (
    <View style={[{ padding: spacing[4], flex: 1 }, style]}>
      {children}
    </View>
  );
};

// Helper component for drawer footer
export interface DrawerFooterProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const DrawerFooter: React.FC<DrawerFooterProps> = ({ children, style }) => {
  const theme = useTheme();
  const { spacing } = useSpacing();
  
  return (
    <View
      style={[
        {
          padding: spacing[4],
          borderTopWidth: 1,
          borderTopColor: theme.border,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};