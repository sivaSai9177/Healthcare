import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  TouchableWithoutFeedback,
  ScrollView,
  Animated,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import ReAnimated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
  FadeIn,
  FadeOut,
  ZoomIn,
  SlideInDown,
} from 'react-native-reanimated';
import { Symbol } from '@/components/universal/display/Symbols';
import { Box } from '@/components/universal/layout/Box';
import { VStack } from '@/components/universal/layout/Stack';
import { Text as UniversalText } from '@/components/universal/typography/Text';
import { designSystem, AnimationVariant , SpacingScale } from '@/lib/design';
import { useSpacing } from '@/lib/stores/spacing-store';
import { useAnimationVariant } from '@/hooks/useAnimationVariant';
import { useAnimationStore } from '@/lib/stores/animation-store';
import { haptic } from '@/lib/ui/haptics';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const AnimatedView = ReAnimated.View;
const AnimatedPressable = ReAnimated.createAnimatedComponent(Pressable);

// Animated Button Component
const AnimatedButton = ({ onPress, variant, spacing, shouldAnimate, isAnimated, config, children }: any) => {
  const scale = useSharedValue(1);
  
  const handlePressIn = () => {
    if (isAnimated && shouldAnimate()) {
      scale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
    }
  };
  
  const handlePressOut = () => {
    if (isAnimated && shouldAnimate()) {
      scale.value = withSpring(1, config.spring);
    }
  };
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }] as any,
  }));
  
  const getBackgroundColor = (pressed: boolean, hovered: boolean) => {
    if (variant === 'ghost') {
      return hovered || pressed ? 'rgba(156, 163, 175, 0.1)' : 'transparent';
    } else if (variant === 'destructive') {
      return hovered ? 'rgba(239, 68, 68, 0.9)' : 'rgb(239, 68, 68)';
    } else {
      return hovered ? 'rgba(59, 130, 246, 0.9)' : 'rgb(59, 130, 246)';
    }
  };
  
  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        ({ pressed, hovered }: any) => ({
          borderRadius: spacing[2],
          paddingHorizontal: spacing[4],
          paddingVertical: spacing[2],
          backgroundColor: getBackgroundColor(pressed, hovered),
          opacity: pressed && !isAnimated ? 0.7 : 1,
        }),
        isAnimated && shouldAnimate() ? animatedStyle : {},
        Platform.OS === 'web' && {
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        } as any,
      ]}
    >
      {children}
    </AnimatedPressable>
  );
};

// Animated Close Button Component
const AnimatedCloseButton = ({ onPress, spacing, animated, isAnimated, shouldAnimate, config }: any) => {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  
  const handlePressIn = () => {
    if (animated && isAnimated && shouldAnimate()) {
      scale.value = withSpring(0.8, { damping: 15, stiffness: 400 });
      rotation.value = withSpring(90, { damping: 15, stiffness: 400 });
    }
  };
  
  const handlePressOut = () => {
    if (animated && isAnimated && shouldAnimate()) {
      scale.value = withSpring(1, config.spring);
      rotation.value = withSpring(0, config.spring);
    }
  };
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ] as any,
  }));
  
  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        {
          position: 'absolute',
          right: spacing[4],
          top: spacing[4],
          zIndex: 1,
          padding: spacing[2] as any,
          borderRadius: spacing[2],
        },
        animated && isAnimated && shouldAnimate() ? animatedStyle : {},
        Platform.OS === 'web' && {
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        } as any,
      ]}
    >
      <Symbol name="xmark"
        size={20}
        color="#6b7280"
      />
    </AnimatedPressable>
  );
};

export type DialogAnimationType = 'scale' | 'fade' | 'slide' | 'none';

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children?: React.ReactNode;
  
  // Animation props
  animated?: boolean;
  animationVariant?: AnimationVariant;
  animationType?: DialogAnimationType;
  animationDuration?: number;
  useHaptics?: boolean;
  animationConfig?: {
    duration?: number;
    spring?: { damping: number; stiffness: number };
  };
}

export interface DialogTriggerProps {
  asChild?: boolean;
  children: React.ReactElement;
  onPress?: () => void;
}

export interface DialogContentProps {
  children: React.ReactNode;
  showCloseButton?: boolean;
  maxWidth?: number;
  maxHeight?: number;
  disableScroll?: boolean;
  isLoading?: boolean;
  
  // Animation props (can override parent Dialog props)
  animated?: boolean;
  animationVariant?: AnimationVariant;
  animationType?: DialogAnimationType;
  animationDuration?: number;
  useHaptics?: boolean;
  animationConfig?: {
    duration?: number;
    spring?: { damping: number; stiffness: number };
  };
}

export interface DialogHeaderProps {
  children: React.ReactNode;
}

export interface DialogFooterProps {
  children: React.ReactNode;
}

export interface DialogTitleProps {
  children: React.ReactNode;
}

export interface DialogDescriptionProps {
  children: React.ReactNode;
}

// Dialog Context
const DialogContext = React.createContext<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  animated?: boolean;
  animationVariant?: AnimationVariant;
  animationType?: DialogAnimationType;
  animationDuration?: number;
  useHaptics?: boolean;
  animationConfig?: {
    duration?: number;
    spring?: { damping: number; stiffness: number };
  };
} | null>(null);

const useDialogContext = () => {
  const context = React.useContext(DialogContext);
  if (!context) {
    throw new Error('Dialog components must be used within a Dialog');
  }
  return context;
};

// Main Dialog Component
export function Dialog({ 
  open, 
  onOpenChange, 
  children,
  animated = true,
  animationVariant = 'moderate',
  animationType = 'scale',
  animationDuration,
  useHaptics = true,
  animationConfig,
}: DialogProps) {
  return (
    <DialogContext.Provider value={{ 
      open, 
      onOpenChange,
      animated,
      animationVariant,
      animationType,
      animationDuration,
      useHaptics,
      animationConfig,
    }}>
      {children}
    </DialogContext.Provider>
  );
}

// Dialog Trigger
export function DialogTrigger({ asChild, children, onPress }: DialogTriggerProps) {
  const { onOpenChange, useHaptics: contextUseHaptics } = useDialogContext();
  
  const handlePress = () => {
    // Haptic feedback
    if (contextUseHaptics && Platform.OS !== 'web') {
      haptic('selection');
    }
    
    onPress?.();
    onOpenChange(true);
  };
  
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onPress: handlePress,
    } as any);
  }
  
  return (
    <Pressable onPress={handlePress}>
      {children}
    </Pressable>
  );
}

// Dialog Portal (for web compatibility)
export function DialogPortal({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

// Dialog Overlay
function DialogOverlay({ 
  onPress, 
  animated,
  animationVariant,
  animationConfig 
}: { 
  onPress: () => void;
  animated?: boolean;
  animationVariant?: AnimationVariant;
  animationConfig?: any;
}) {
  const { shouldAnimate } = useAnimationStore();
  const { config, isAnimated } = useAnimationVariant({
    variant: animationVariant,
    overrides: animationConfig,
  });
  
  const opacity = useSharedValue(0);
  
  useEffect(() => {
    if (animated && isAnimated && shouldAnimate()) {
      opacity.value = withTiming(1, { duration: config.duration.normal });
    } else {
      opacity.value = 1;
    }
  }, [animated, isAnimated, shouldAnimate, config]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));
  
  // Dynamic overlay color based on theme
  const overlayColor = 'rgba(0, 0, 0, 0.5)';
  
  return (
    <TouchableWithoutFeedback onPress={onPress}>
      <AnimatedView
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: overlayColor,
          },
          animated && isAnimated && shouldAnimate() ? animatedStyle : { opacity: 1 as any },
        ]}
      />
    </TouchableWithoutFeedback>
  );
}

// Dialog Content
export function DialogContent({
  children,
  showCloseButton = true,
  maxWidth = 500,
  maxHeight = screenHeight * 0.8,
  disableScroll = false,
  isLoading = false,
  animated: propsAnimated,
  animationVariant: propsVariant,
  animationType: propsAnimationType,
  animationDuration: propsAnimationDuration,
  useHaptics: propsUseHaptics,
  animationConfig: propsAnimationConfig,
}: DialogContentProps) {
  const contextValues = useDialogContext();
  const { open, onOpenChange } = contextValues;
  
  // Use props if provided, otherwise fall back to context
  const animated = propsAnimated ?? contextValues.animated ?? true;
  const animationVariant = propsVariant ?? contextValues.animationVariant ?? 'moderate';
  const animationType = propsAnimationType ?? contextValues.animationType ?? 'scale';
  const animationDuration = propsAnimationDuration ?? contextValues.animationDuration;
  const useHaptics = propsUseHaptics ?? contextValues.useHaptics ?? true;
  const animationConfig = propsAnimationConfig ?? contextValues.animationConfig;
  
  const { spacing } = useSpacing();
  const { shouldAnimate } = useAnimationStore();
  const { config, isAnimated } = useAnimationVariant({
    variant: animationVariant,
    overrides: animationConfig,
  });
  
  // Animation values
  const scale = useSharedValue(animationType === 'scale' ? 0.9 : 1);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(animationType === 'slide' ? 50 : 0);
  
  useEffect(() => {
    if (open && animated && isAnimated && shouldAnimate()) {
      if (animationType === 'scale') {
        scale.value = withSpring(1, config.spring);
        opacity.value = withTiming(1, { duration: config.duration.fast });
      } else if (animationType === 'fade') {
        opacity.value = withTiming(1, { duration: config.duration.normal });
      } else if (animationType === 'slide') {
        translateY.value = withSpring(0, config.spring);
        opacity.value = withTiming(1, { duration: config.duration.fast });
      }
    } else if (open) {
      scale.value = 1;
      opacity.value = 1;
      translateY.value = 0;
    }
  }, [open, animated, isAnimated, shouldAnimate, animationType, config]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ] as any,
  }));
  
  const ContentWrapper = disableScroll ? View : ScrollView;
  
  return (
    <Modal
      visible={open}
      transparent
      animationType="none"
      onRequestClose={() => onOpenChange(false)}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <DialogOverlay 
            onPress={() => onOpenChange(false)} 
            animated={animated}
            animationVariant={animationVariant}
            animationConfig={animationConfig}
          />
          
          <AnimatedView
            style={[
              {
                width: Math.min(screenWidth - spacing[8], maxWidth),
                maxHeight,
                backgroundColor: '#ffffff',
                borderRadius: designSystem.borderRadius.lg,
                ...designSystem.shadows.lg,
                padding: spacing[6] as any,
                margin: spacing[4] as any,
              },
              animated && isAnimated && shouldAnimate() && animationType !== 'none' ? animatedStyle : { opacity: 1 as any },
              Platform.OS === 'web' && animated && isAnimated && shouldAnimate() && {
                transition: 'all 0.3s ease',
              } as any,
            ]}
          >
            {showCloseButton && (
              <AnimatedCloseButton
                onPress={() => {
                  if (useHaptics && Platform.OS !== 'web') {
                    haptic('selection');
                  }
                  onOpenChange(false);
                }}
                spacing={spacing}
                animated={animated}
                isAnimated={isAnimated}
                shouldAnimate={shouldAnimate}
                config={config}
              />
            )}
            
            <ContentWrapper
              showsVerticalScrollIndicator={false}
              style={{ flexGrow: 0 }}
            >
              {isLoading ? (
                <View style={{ padding: spacing[8] as any, alignItems: 'center' }}>
                  <ActivityIndicator size="lg" color="#3b82f6" />
                  <UniversalText
                    size="sm"
                    colorTheme="mutedForeground"
                    style={{ marginTop: spacing[3] }}
                  >
                    Loading...
                  </UniversalText>
                </View>
              ) : (
                children
              )}
            </ContentWrapper>
          </AnimatedView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// Dialog Close Button
export function DialogClose({ children }: { children: React.ReactNode }) {
  const { onOpenChange } = useDialogContext();
  
  return (
    <Pressable onPress={() => onOpenChange(false)}>
      {children}
    </Pressable>
  );
}

// Dialog Header
export function DialogHeader({ children }: DialogHeaderProps) {
  return (
    <VStack spacing={2} mb={4}>
      {children}
    </VStack>
  );
}

// Dialog Footer
export function DialogFooter({ children }: DialogFooterProps) {
  return (
    <Box
      flexDirection="row"
      justifyContent="flex-end"
      gap={2 as SpacingScale}
      mt={6}
      style={{
        flexWrap: 'wrap',
      }}
    >
      {children}
    </Box>
  );
}

// Dialog Title
export function DialogTitle({ children }: DialogTitleProps) {
  return (
    <UniversalText
      size="lg"
      weight="semibold"
      colorTheme="foreground"
      style={{
        textAlign: Platform.select({ web: 'left', default: 'center' }),
      }}
    >
      {children}
    </UniversalText>
  );
}

// Dialog Description
export function DialogDescription({ children }: DialogDescriptionProps) {
  return (
    <UniversalText
      size="sm"
      colorTheme="mutedForeground"
      style={{
        textAlign: Platform.select({ web: 'left', default: 'center' }),
      }}
    >
      {children}
    </UniversalText>
  );
}

// Alert Dialog variants (convenience components)
export interface AlertDialogProps extends DialogProps {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  destructive?: boolean;
  isLoading?: boolean;
}

export function AlertDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  destructive = false,
  isLoading = false,
}: AlertDialogProps) {
  const { spacing } = useSpacing();
  const { shouldAnimate } = useAnimationStore();
  const { config, isAnimated } = useAnimationVariant({ variant: 'moderate' });
  
  const handleCancel = () => {
    // Haptic feedback
    if (Platform.OS !== 'web') {
      haptic('selection');
    }
    
    onCancel?.();
    onOpenChange(false);
  };
  
  const handleConfirm = () => {
    // Haptic feedback
    if (Platform.OS !== 'web') {
      haptic('impact');
    }
    
    onConfirm();
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent isLoading={isLoading}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <DialogFooter>
          <AnimatedButton
            onPress={handleCancel}
            variant="ghost"
            theme={theme}
            spacing={spacing}
            shouldAnimate={shouldAnimate}
            isAnimated={isAnimated}
            config={config}
          >
            <UniversalText 
              size="sm" 
              weight="medium"
              colorTheme="foreground"
            >
              {cancelText}
            </UniversalText>
          </AnimatedButton>
          <AnimatedButton
            onPress={handleConfirm}
            variant={destructive ? 'destructive' : 'primary'}
            theme={theme}
            spacing={spacing}
            shouldAnimate={shouldAnimate}
            isAnimated={isAnimated}
            config={config}
          >
            <UniversalText
              size="sm"
              weight="medium"
              colorTheme={destructive ? 'destructiveForeground' : 'primaryForeground'}
            >
              {confirmText}
            </UniversalText>
          </AnimatedButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}