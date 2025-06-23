import React, { useState, useEffect } from 'react';
import { View, Pressable, ViewStyle, ScrollView, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  interpolate,
  FadeIn,
  SlideInRight,
} from 'react-native-reanimated';
import { Text } from '@/components/universal/typography/Text';
import { Button } from '@/components/universal/interaction/Button';
import { useTheme } from '@/lib/theme/provider';
import { useSpacing } from '@/lib/stores/spacing-store';
import { Symbol } from '@/components/universal/display/Symbols';
import { 
  AnimationVariant,
} from '@/lib/design';
import { useAnimationVariant } from '@/hooks/useAnimationVariant';
import { useAnimationStore } from '@/lib/stores/animation-store';
import { haptic } from '@/lib/ui/haptics';

export interface StepperStep {
  id: string;
  title: string;
  description?: string;
  content?: React.ReactNode;
  icon?: string;
  optional?: boolean;
  disabled?: boolean;
  error?: boolean;
  completed?: boolean;
}

export type StepperAnimationType = 'progress' | 'fade' | 'slide' | 'scale' | 'none';

export interface StepperProps {
  steps: StepperStep[];
  activeStep: number;
  onStepChange?: (step: number) => void;
  orientation?: 'horizontal' | 'vertical';
  variant?: 'default' | 'compact' | 'dots';
  showStepNumbers?: boolean;
  showNavigation?: boolean;
  navigationPosition?: 'bottom' | 'top' | 'both';
  allowStepClick?: boolean;
  linear?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  navigationStyle?: ViewStyle;
  testID?: string;
  showProgress?: boolean; // Add progress bar
  progressPosition?: 'top' | 'bottom' | 'inline';
  
  // Animation props
  animated?: boolean;
  animationVariant?: AnimationVariant;
  animationType?: StepperAnimationType;
  animationDuration?: number;
  connectorAnimation?: boolean;
  stepTransition?: 'slide' | 'fade' | 'scale' | 'none';
  useHaptics?: boolean;
  animationConfig?: {
    duration?: number;
    spring?: { damping: number; stiffness: number };
  };
}

const AnimatedView = Animated.View;

// Connector Component
const StepConnector = ({ 
  status, 
  isLast, 
  stepIndex, 
  orientation, 
  theme, 
  spacing, 
  animated, 
  isAnimated, 
  shouldAnimate, 
  connectorAnimation,
  progress,
}: any) => {
  const animatedConnectorStyle = useAnimatedStyle(() => {
    const isCompleted = progress.value > 0;
    return {
      backgroundColor: isCompleted ? (theme.success || theme.primary) : theme.border,
    };
  });
  
  const animatedProgressStyle = useAnimatedStyle(() => {
    return {
      width: `${progress.value * 100}%`,
      height: '100%',
      backgroundColor: theme.success || theme.primary,
    };
  });
  
  if (isLast) return null;

  const connectorStyle: ViewStyle = {
    flex: 1,
    height: 3,
    backgroundColor: theme.border,
    marginHorizontal: spacing[1],
    borderRadius: 1.5,
    overflow: 'hidden',
    alignSelf: 'center',
  };

  if (orientation === 'vertical') {
    connectorStyle.width = 3;
    connectorStyle.height = 40;
    connectorStyle.marginHorizontal = 0;
    connectorStyle.marginVertical = spacing[1];
  }

  const ConnectorComponent = animated && isAnimated && shouldAnimate() && connectorAnimation 
    ? AnimatedView 
    : View;

  return (
    <View style={connectorStyle}>
      {animated && isAnimated && shouldAnimate() && connectorAnimation ? (
        <AnimatedView style={animatedProgressStyle} />
      ) : (
        status === 'completed' && (
          <View style={{
            width: '100%',
            height: '100%',
            backgroundColor: theme.success || theme.primary,
          }} />
        )
      )}
    </View>
  );
};

// Step Icon Component
const StepIcon = ({ 
  step, 
  stepIndex, 
  status, 
  variant, 
  showStepNumbers, 
  theme, 
  animated, 
  isAnimated, 
  shouldAnimate, 
  config 
}: any) => {
  const iconSize = variant === 'compact' ? 28 : 36;
  const iconColor = status === 'completed' ? (theme.success || theme.primary) 
    : status === 'active' ? theme.primary 
    : status === 'error' ? theme.destructive 
    : theme.mutedForeground;
  
  const iconScale = useSharedValue(status === 'active' ? 1 : 0.8);
  
  useEffect(() => {
    if (animated && isAnimated && shouldAnimate()) {
      if (status === 'active') {
        iconScale.value = withSpring(1, config.spring);
      } else {
        iconScale.value = withTiming(0.8, { duration: config.duration.fast });
      }
    }
  }, [status, animated, isAnimated, shouldAnimate, iconScale, config]);
  
  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const iconContainerStyle: ViewStyle = {
    width: iconSize,
    height: iconSize,
    borderRadius: variant === 'dots' ? iconSize / 2 : iconSize / 2,
    backgroundColor: status === 'active' || status === 'completed' ? iconColor : theme.background,
    borderWidth: 2,
    borderColor: iconColor,
    alignItems: 'center',
    justifyContent: 'center',
  };

  const IconContainer = animated && isAnimated && shouldAnimate() ? AnimatedView : View;

  if (variant === 'dots') {
    return (
      <IconContainer
        style={[
          iconContainerStyle,
          {
            width: status === 'active' ? 12 : 8,
            height: status === 'active' ? 12 : 8,
            backgroundColor: iconColor,
            borderWidth: 0,
          },
          animated && isAnimated && shouldAnimate() ? iconAnimatedStyle : {},
        ]}
      />
    );
  }

  let iconContent: React.ReactNode;

  if (status === 'completed') {
    iconContent = (
      <Symbol name="checkmark"
        size={iconSize * 0.6}
        color={theme.background}
      />
    );
  } else if (status === 'error') {
    iconContent = (
      <Symbol name="xmark"
        size={iconSize * 0.6}
        color={theme.background}
      />
    );
  } else if (step.icon) {
    iconContent = (
      <Symbol
        name={step.icon as any}
        size={iconSize * 0.6}
        color={status === 'active' ? theme.background : iconColor}
      />
    );
  } else if (showStepNumbers) {
    iconContent = (
      <Text
        size="sm"
        weight="semibold"
        style={{ color: status === 'active' ? theme.background : iconColor }}
      >
        {stepIndex + 1}
      </Text>
    );
  }

  return (
    <IconContainer 
      style={[
        iconContainerStyle,
        animated && isAnimated && shouldAnimate() ? iconAnimatedStyle : {},
      ]}
    >
      {iconContent}
    </IconContainer>
  );
};

export const Stepper = React.forwardRef<View, StepperProps>(
  (
    {
      steps,
      activeStep,
      onStepChange,
      orientation = 'horizontal',
      variant = 'default',
      showStepNumbers = true,
      showNavigation = true,
      navigationPosition = 'bottom',
      allowStepClick = true,
      linear = true,
      style,
      contentStyle,
      navigationStyle,
      testID,
      showProgress = false,
      progressPosition = 'bottom',
      // Animation props
      animated = true,
      animationVariant = 'moderate',
      animationType = 'progress',
      animationDuration,
      connectorAnimation = true,
      stepTransition = 'slide',
      useHaptics = true,
      animationConfig,
    },
    ref
  ) => {
    const theme = useTheme();
    const { spacing } = useSpacing();
    const { shouldAnimate } = useAnimationStore();
    
    // Get animation config
    const { config, isAnimated } = useAnimationVariant({
      variant: animationVariant,
    });
    
    const duration = animationDuration ?? config.duration.normal;
    
    // Animation values for connectors
    // Create individual shared values for up to 10 steps
    const progress0 = useSharedValue(0);
    const progress1 = useSharedValue(0);
    const progress2 = useSharedValue(0);
    const progress3 = useSharedValue(0);
    const progress4 = useSharedValue(0);
    const progress5 = useSharedValue(0);
    const progress6 = useSharedValue(0);
    const progress7 = useSharedValue(0);
    const progress8 = useSharedValue(0);
    const progress9 = useSharedValue(0);
    
    const connectorProgress = React.useMemo(() => [
      progress0, progress1, progress2, progress3, progress4,
      progress5, progress6, progress7, progress8, progress9
    ], [progress0, progress1, progress2, progress3, progress4, progress5, progress6, progress7, progress8, progress9]);
    
    // Content transition animation
    const contentOpacity = useSharedValue(1);
    const contentTranslateX = useSharedValue(0);
    
    // Progress animation
    const progressAnimation = useSharedValue(0);
    
    // Update connector animations
    useEffect(() => {
      if (animated && isAnimated && shouldAnimate() && connectorAnimation) {
        connectorProgress.forEach((progress, index) => {
          if (index < activeStep) {
            progress.value = withTiming(1, { duration });
          } else {
            progress.value = withTiming(0, { duration });
          }
        });
      }
    }, [activeStep, animated, isAnimated, shouldAnimate, connectorAnimation, duration, connectorProgress]);
    
    // Content transition animation
    useEffect(() => {
      if (animated && isAnimated && shouldAnimate() && stepTransition !== 'none') {
        if (stepTransition === 'fade') {
          contentOpacity.value = withSequence(
            withTiming(0, { duration: config.duration.fast }),
            withTiming(1, { duration: config.duration.fast })
          );
        } else if (stepTransition === 'slide') {
          contentTranslateX.value = withSequence(
            withTiming(50, { duration: config.duration.fast }),
            withTiming(0, { duration: config.duration.fast })
          );
          contentOpacity.value = withSequence(
            withTiming(0, { duration: config.duration.fast / 2 }),
            withTiming(1, { duration: config.duration.fast })
          );
        }
      }
    }, [activeStep, animated, isAnimated, shouldAnimate, stepTransition, config.duration.fast, contentOpacity, contentTranslateX]);

    const canNavigateToStep = (stepIndex: number) => {
      if (!linear) return true;
      if (stepIndex <= activeStep) return true;
      
      // Check if all previous steps are completed
      for (let i = 0; i < stepIndex; i++) {
        if (!steps[i].completed && i !== activeStep) return false;
      }
      
      return true;
    };

    const handleStepClick = (stepIndex: number) => {
      if (
        allowStepClick &&
        onStepChange &&
        !steps[stepIndex].disabled &&
        canNavigateToStep(stepIndex)
      ) {
        if (useHaptics) {
          haptic('medium');
        }
        onStepChange(stepIndex);
      }
    };

    const handleNext = () => {
      if (onStepChange && activeStep < steps.length - 1) {
        onStepChange(activeStep + 1);
      }
    };

    const handlePrevious = () => {
      if (onStepChange && activeStep > 0) {
        onStepChange(activeStep - 1);
      }
    };

    const getStepStatus = (stepIndex: number, step: StepperStep) => {
      if (step.error) return 'error';
      if (step.completed || stepIndex < activeStep) return 'completed';
      if (stepIndex === activeStep) return 'active';
      return 'pending';
    };

    // const getStepColor = (status: string) => {
    //   switch (status) {
    //     case 'completed':
    //       return theme.success || theme.primary;
    //     case 'active':
    //       return theme.primary;
    //     case 'error':
    //       return theme.destructive;
    //     default:
    //       return theme.mutedForeground;
    //   }
    // };

    const renderStepIcon = (step: StepperStep, stepIndex: number, status: string) => {
      return (
        <StepIcon
          step={step}
          stepIndex={stepIndex}
          status={status}
          variant={variant}
          showStepNumbers={showStepNumbers}
          theme={theme}
          animated={animated}
          isAnimated={isAnimated}
          shouldAnimate={shouldAnimate}
          config={config}
        />
      );
    };

    const renderConnector = (status: string, isLast: boolean, stepIndex: number) => {
      const progress = connectorProgress[stepIndex];
      
      return (
        <StepConnector
          status={status}
          isLast={isLast}
          stepIndex={stepIndex}
          orientation={orientation}
          theme={theme}
          spacing={spacing}
          animated={animated}
          isAnimated={isAnimated}
          shouldAnimate={shouldAnimate}
          connectorAnimation={connectorAnimation}
          progress={progress}
        />
      );
    };

    const renderStep = (step: StepperStep, stepIndex: number) => {
      const status = getStepStatus(stepIndex, step);
      const isLast = stepIndex === steps.length - 1;
      const canClick = allowStepClick && !step.disabled && canNavigateToStep(stepIndex);

      const stepContainerStyle: ViewStyle = {
        flexDirection: orientation === 'horizontal' ? 'row' : 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flex: orientation === 'horizontal' ? 1 : undefined,
      };

      const labelContainerStyle: ViewStyle = {
        alignItems: orientation === 'horizontal' ? 'center' : 'flex-start',
        marginTop: orientation === 'horizontal' ? spacing[1.5] : 0,
        marginLeft: orientation === 'vertical' ? spacing[3] : 0,
        paddingHorizontal: orientation === 'horizontal' ? spacing[1] : 0,
      };

      return (
        <View key={step.id} style={stepContainerStyle}>
          <Pressable
            onPress={() => handleStepClick(stepIndex)}
            disabled={!canClick}
            style={{
              flexDirection: orientation === 'horizontal' ? 'column' : 'row',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: step.disabled ? 0.5 : 1,
              cursor: Platform.OS === 'web' && canClick ? 'pointer' : 'default',
            }}
          >
            {renderStepIcon(step, stepIndex, status)}
            
            {variant !== 'dots' && (
              <View style={labelContainerStyle}>
                <Text
                  size={variant === 'compact' ? 'xs' : 'sm'}
                  weight={status === 'active' ? 'semibold' : 'medium'}
                  colorTheme={status === 'active' ? 'foreground' : status === 'completed' ? 'foreground' : 'mutedForeground'}
                  style={{ 
                    textAlign: orientation === 'horizontal' ? 'center' : 'left',
                    maxWidth: orientation === 'horizontal' ? 100 : undefined,
                  }}
                  numberOfLines={2}
                >
                  {step.title}
                </Text>
                {step.description && variant !== 'compact' && (
                  <Text
                    size="xs"
                    colorTheme="mutedForeground"
                    style={{
                      textAlign: orientation === 'horizontal' ? 'center' : 'left',
                      marginTop: spacing[0.5],
                    }}
                  >
                    {step.description}
                  </Text>
                )}
                {step.optional && (
                  <Text
                    size="xs"
                    colorTheme="mutedForeground"
                    style={{
                      textAlign: orientation === 'horizontal' ? 'center' : 'left',
                      fontStyle: 'italic',
                    }}
                  >
                    Optional
                  </Text>
                )}
              </View>
            )}
          </Pressable>
          
          {orientation === 'horizontal' && !isLast && (
            <View style={{ alignSelf: 'center', marginTop: variant !== 'dots' ? -20 : 0 }}>
              {renderConnector(status, isLast, stepIndex)}
            </View>
          )}
        </View>
      );
    };

    // Update progress animation
    const progress = ((activeStep + 1) / steps.length) * 100;
    
    useEffect(() => {
      if (showProgress && animated && isAnimated && shouldAnimate()) {
        progressAnimation.value = withSpring(progress, {
          damping: 20,
          stiffness: 90,
        });
      } else if (showProgress) {
        progressAnimation.value = progress;
      }
    }, [progress, showProgress, animated, isAnimated, shouldAnimate, progressAnimation]);
    
    const animatedProgressBarStyle = useAnimatedStyle(() => ({
      width: `${progressAnimation.value}%`,
    }));
    
    const renderProgress = () => {
      if (!showProgress) return null;
      
      return (
        <View style={{
          marginTop: spacing[3],
          marginBottom: spacing[2],
          paddingHorizontal: spacing[2],
        }}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: spacing[1],
          }}>
            <Text size="xs" colorTheme="mutedForeground">
              Step {activeStep + 1} of {steps.length}
            </Text>
            <Text size="xs" colorTheme="mutedForeground">
              {Math.round(progress)}% Complete
            </Text>
          </View>
          <View style={{
            height: 4,
            backgroundColor: theme.muted,
            borderRadius: 2,
            overflow: 'hidden',
          }}>
            <AnimatedView style={[
              {
                height: '100%',
                backgroundColor: theme.primary,
                borderRadius: 2,
              },
              animated && isAnimated && shouldAnimate() ? animatedProgressBarStyle : { width: `${progress}%` },
            ]} />
          </View>
        </View>
      );
    };

    const renderNavigation = () => {
      if (!showNavigation) return null;

      const isFirstStep = activeStep === 0;
      const isLastStep = activeStep === steps.length - 1;
      const currentStep = steps[activeStep];

      const navigationContainerStyle: ViewStyle = {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing[3],
        ...navigationStyle,
      };

      return (
        <View style={navigationContainerStyle}>
          <Button
            variant="outline"
            size="sm"
            onPress={handlePrevious}
            disabled={isFirstStep}
            leftIcon={<Symbol name="arrow.left" size={16} />}
          >
            Previous
          </Button>

          <Text size="sm" colorTheme="mutedForeground">
            Step {activeStep + 1} of {steps.length}
          </Text>

          <Button
            variant="default"
            size="sm"
            onPress={handleNext}
            disabled={isLastStep || currentStep.disabled}
            rightIcon={<Symbol name="arrow.right" size={16} />}
          >
            {isLastStep ? 'Finish' : 'Next'}
          </Button>
        </View>
      );
    };

    const containerStyle: ViewStyle = {
      ...style,
    };

    const stepperContainerStyle: ViewStyle = {
      flexDirection: orientation === 'horizontal' ? 'row' : 'column',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing[3],
      paddingHorizontal: spacing[2],
      width: '100%',
    };

    const currentStepContent = steps[activeStep]?.content;

    return (
      <View ref={ref} style={containerStyle} testID={testID}>
        {showProgress && progressPosition === 'top' && renderProgress()}
        {showNavigation && navigationPosition === 'top' && renderNavigation()}
        
        <View>
          <ScrollView
            horizontal={orientation === 'horizontal'}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={stepperContainerStyle}
          >
            {steps.map((step, index) => renderStep(step, index))}
          </ScrollView>
          
          {showProgress && (progressPosition === 'inline' || progressPosition === 'bottom') && renderProgress()}
        </View>

        {currentStepContent && (
          <AnimatedView 
            style={[
              { marginTop: spacing[4] }, 
              contentStyle,
              animated && isAnimated && shouldAnimate() && stepTransition !== 'none' 
                ? {
                    opacity: contentOpacity.value,
                    transform: [{ translateX: contentTranslateX.value }],
                  }
                : {},
            ]}
            entering={Platform.OS !== 'web' && animated && isAnimated && shouldAnimate() && animationType === 'fade'
              ? FadeIn.duration(duration)
              : Platform.OS !== 'web' && animated && isAnimated && shouldAnimate() && animationType === 'slide'
              ? SlideInRight.duration(duration)
              : undefined
            }
          >
            {currentStepContent}
          </AnimatedView>
        )}

        {showNavigation && navigationPosition !== 'top' && renderNavigation()}
      </View>
    );
  }
);

Stepper.displayName = 'Stepper';

// Stepper Context for complex forms
interface StepperContextValue {
  activeStep: number;
  steps: StepperStep[];
  setActiveStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  completeStep: (stepId: string) => void;
  setStepError: (stepId: string, error: boolean) => void;
}

const StepperContext = React.createContext<StepperContextValue | null>(null);

export const useStepperContext = () => {
  const context = React.useContext(StepperContext);
  if (!context) {
    throw new Error('useStepperContext must be used within StepperProvider');
  }
  return context;
};

export interface StepperProviderProps {
  children: React.ReactNode;
  initialStep?: number;
  steps: StepperStep[];
}

export const StepperProvider: React.FC<StepperProviderProps> = ({
  children,
  initialStep = 0,
  steps: initialSteps,
}) => {
  const [activeStep, setActiveStep] = useState(initialStep);
  const [steps, setSteps] = useState(initialSteps);

  const nextStep = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
    }
  };

  const previousStep = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  const completeStep = (stepId: string) => {
    setSteps((prevSteps) =>
      prevSteps.map((step) =>
        step.id === stepId ? { ...step, completed: true, error: false } : step
      )
    );
  };

  const setStepError = (stepId: string, error: boolean) => {
    setSteps((prevSteps) =>
      prevSteps.map((step) =>
        step.id === stepId ? { ...step, error, completed: false } : step
      )
    );
  };

  const value: StepperContextValue = {
    activeStep,
    steps,
    setActiveStep,
    nextStep,
    previousStep,
    completeStep,
    setStepError,
  };

  return (
    <StepperContext.Provider value={value}>{children}</StepperContext.Provider>
  );
};