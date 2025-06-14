import React, { useCallback, useState, useRef, useEffect } from 'react';
import {
  View,
  PanResponder,
  LayoutChangeEvent,
  Platform,
  AccessibilityInfo,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { Text } from '@/components/universal/typography/Text';
import { cn } from '@/lib/core/utils';
import { useSpacing } from '@/lib/stores/spacing-store';
import { useAnimationStore } from '@/lib/stores/animation-store';
import { haptic } from '@/lib/ui/haptics';
import { useShadow } from '@/hooks/useShadow';

export type SliderAnimationType = 'drag' | 'track-fill' | 'thumb' | 'none';

const AnimatedView = Animated.createAnimatedComponent(View);

export interface SliderProps {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'primary' | 'secondary';
  showValue?: boolean;
  valueFormat?: (value: number) => string;
  marks?: boolean | number[];
  markLabels?: Record<number, string>;
  className?: string;
  shadow?: 'sm' | 'base' | 'md' | 'lg' | 'none';
  style?: ViewStyle;
  trackStyle?: ViewStyle;
  thumbStyle?: ViewStyle;
  activeTrackStyle?: ViewStyle;
  testID?: string;
  
  // Animation props
  animated?: boolean;
  animationType?: SliderAnimationType;
  animationDuration?: number;
  useHaptics?: boolean;
}

// Size configurations
const sizeConfig = {
  sm: {
    thumbSize: 16,
    trackHeight: 3,
    fontSize: 'xs' as const,
  },
  default: {
    thumbSize: 20,
    trackHeight: 4,
    fontSize: 'sm' as const,
  },
  lg: {
    thumbSize: 24,
    trackHeight: 6,
    fontSize: 'base' as const,
  },
};

// Variant classes
const variantClasses = {
  default: {
    track: 'bg-muted',
    activeTrack: 'bg-primary',
    thumb: 'bg-primary-foreground border-2 border-primary',
  },
  primary: {
    track: 'bg-primary/20',
    activeTrack: 'bg-primary',
    thumb: 'bg-primary-foreground border-2 border-primary',
  },
  secondary: {
    track: 'bg-secondary/20',
    activeTrack: 'bg-secondary',
    thumb: 'bg-secondary-foreground border-2 border-secondary',
  },
};

export const Slider = React.forwardRef<View, SliderProps>(
  (
    {
      value,
      onValueChange,
      min = 0,
      max = 100,
      step = 1,
      disabled = false,
      size = 'default',
      variant = 'default',
      showValue = false,
      valueFormat = (v) => v.toString(),
      marks = false,
      markLabels,
      className,
      shadow = 'base',
      style,
      trackStyle,
      thumbStyle,
      activeTrackStyle,
      testID,
      // Animation props
      animated = true,
      animationType = 'drag',
      animationDuration = 200,
      useHaptics = true,
    },
    ref
  ) => {
    const { spacing } = useSpacing();
    const [sliderWidth, setSliderWidth] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const { shouldAnimate } = useAnimationStore();
    const shadowStyle = useShadow(shadow);
    
    const config = sizeConfig[size];
    const classes = variantClasses[variant];
    
    // Spring config
    const springConfig = {
      damping: 15,
      stiffness: 300,
    };
    
    // Animation values
    const thumbPosition = useSharedValue(0);
    const thumbScale = useSharedValue(1);
    const trackFillWidth = useSharedValue(0);
    const thumbOpacity = useSharedValue(1);
    
    // Calculate position from value
    const valueToPosition = useCallback(
      (val: number) => {
        const clampedValue = Math.max(min, Math.min(max, val));
        return ((clampedValue - min) / (max - min)) * sliderWidth;
      },
      [min, max, sliderWidth]
    );
    
    // Calculate value from position
    const positionToValue = useCallback(
      (pos: number) => {
        const percentage = Math.max(0, Math.min(1, pos / sliderWidth));
        const rawValue = min + percentage * (max - min);
        return Math.round(rawValue / step) * step;
      },
      [min, max, step, sliderWidth]
    );
    
    // Update thumb position when value changes
    useEffect(() => {
      if (sliderWidth > 0) {
        const position = valueToPosition(value);
        if (animated && shouldAnimate()) {
          thumbPosition.value = withSpring(position, springConfig);
          trackFillWidth.value = withSpring(position + config.thumbSize / 2, springConfig);
        } else {
          thumbPosition.value = position;
          trackFillWidth.value = position + config.thumbSize / 2;
        }
      }
    }, [value, sliderWidth, valueToPosition, animated, shouldAnimate, config.thumbSize]);
    
    // Handle value change with haptic feedback
    const handleValueChange = useCallback(
      (newValue: number) => {
        if (newValue !== value) {
          if (animated && shouldAnimate() && useHaptics) {
            haptic('selection');
          }
          onValueChange(newValue);
        }
      },
      [value, onValueChange, animated, shouldAnimate, useHaptics]
    );
    
    // Pan responder for dragging
    const panResponder = useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabled,
        onMoveShouldSetPanResponder: () => !disabled,
        onPanResponderGrant: (evt) => {
          setIsDragging(true);
          if (animated && shouldAnimate()) {
            thumbScale.value = withSpring(1.2, springConfig);
            thumbOpacity.value = withTiming(0.8, { duration: 150 });
          }
          
          const locationX = evt.nativeEvent.locationX;
          const newValue = positionToValue(locationX);
          handleValueChange(newValue);
        },
        onPanResponderMove: (evt) => {
          const locationX = evt.nativeEvent.locationX;
          const newValue = positionToValue(locationX);
          handleValueChange(newValue);
        },
        onPanResponderRelease: () => {
          setIsDragging(false);
          if (animated && shouldAnimate()) {
            thumbScale.value = withSpring(1, springConfig);
            thumbOpacity.value = withTiming(1, { duration: 150 });
          }
        },
      })
    ).current;
    
    // Layout handler
    const handleLayout = (event: LayoutChangeEvent) => {
      setSliderWidth(event.nativeEvent.layout.width);
    };
    
    // Animated styles
    const thumbAnimatedStyle = useAnimatedStyle(() => ({
      transform: [
        { translateX: thumbPosition.value },
        { scale: thumbScale.value },
      ],
      opacity: thumbOpacity.value,
    }));
    
    const trackFillAnimatedStyle = useAnimatedStyle(() => ({
      width: trackFillWidth.value,
    }));
    
    // Render marks
    const renderMarks = () => {
      if (!marks || sliderWidth === 0) return null;
      
      const markValues = Array.isArray(marks)
        ? marks
        : Array.from({ length: 11 }, (_, i) => min + (i * (max - min)) / 10);
      
      return markValues.map((markValue) => {
        const position = valueToPosition(markValue);
        return (
          <View
            key={markValue}
            className="absolute w-1 h-1 bg-muted-foreground/50 rounded-full"
            style={{
              left: position - 2,
              top: config.trackHeight + 4,
            }}
          />
        );
      });
    };
    
    // Container classes
    const containerClasses = cn(
      'relative',
      disabled && 'opacity-50',
      className
    );
    
    return (
      <View
        ref={ref}
        className={containerClasses}
        style={[
          {
            paddingTop: showValue ? spacing[6] : spacing[2],
            paddingBottom: marks ? spacing[6] : spacing[2],
            paddingHorizontal: config.thumbSize / 2,
          },
          style,
        ]}
        testID={testID}
      >
        {/* Value display */}
        {showValue && (
          <View
            className="absolute top-0 items-center"
            style={{
              left: thumbPosition.value,
              transform: [{ translateX: -20 }],
            }}
          >
            <Text size={config.fontSize} weight="medium">
              {valueFormat(value)}
            </Text>
          </View>
        )}
        
        {/* Track */}
        <View
          className={cn('rounded-full overflow-hidden', classes.track)}
          style={[
            {
              height: config.trackHeight,
            },
            trackStyle,
          ]}
          onLayout={handleLayout}
          {...panResponder.panHandlers}
        >
          {/* Active track fill */}
          <AnimatedView
            className={cn('absolute left-0 top-0 bottom-0', classes.activeTrack)}
            style={[
              animated && shouldAnimate() ? trackFillAnimatedStyle : { width: valueToPosition(value) + config.thumbSize / 2 },
              activeTrackStyle,
            ]}
          />
        </View>
        
        {/* Thumb */}
        <AnimatedView
          className={cn('absolute rounded-full', classes.thumb)}
          style={[
            {
              width: config.thumbSize,
              height: config.thumbSize,
              top: -((config.thumbSize - config.trackHeight) / 2),
              left: -config.thumbSize / 2,
            },
            shadowStyle,
            animated && shouldAnimate() ? thumbAnimatedStyle : {
              transform: [{ translateX: valueToPosition(value) }],
            },
            thumbStyle,
          ]}
          pointerEvents="none"
        />
        
        {/* Marks */}
        {renderMarks()}
        
        {/* Mark labels */}
        {markLabels && sliderWidth > 0 && (
          <View className="absolute left-0 right-0" style={{ top: config.trackHeight + 12 }}>
            {Object.entries(markLabels).map(([markValue, label]) => {
              const numValue = parseFloat(markValue);
              const position = valueToPosition(numValue);
              return (
                <Text
                  key={markValue}
                  size="xs"
                  className="absolute text-muted-foreground"
                  style={{
                    left: position,
                    transform: [{ translateX: -20 }],
                  }}
                >
                  {label}
                </Text>
              );
            })}
          </View>
        )}
      </View>
    );
  }
);

Slider.displayName = 'Slider';