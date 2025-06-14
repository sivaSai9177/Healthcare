import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  ViewStyle,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  interpolate,
  ZoomIn,
  SlideInDown,
} from 'react-native-reanimated';
import { Symbol } from '@/components/universal/display/Symbols';
import { useSpacing } from '@/lib/stores/spacing-store';
import { Card } from '@/components/universal/display/Card';
import { Input } from './Input';
import { Button } from '@/components/universal/interaction/Button';
import { 
  AnimationVariant,
  SpacingScale,
  getAnimationConfig,
} from '@/lib/design';
import { useAnimationStore } from '@/lib/stores/animation-store';
import { haptic } from '@/lib/ui/haptics';
import { Text as UniversalText } from '@/components/universal/typography/Text';

const AnimatedView = Animated.View;
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Preset color button component
const PresetColorButton = ({
  preset,
  index,
  isSelected,
  onPress,
  disabled,
  animated,
  shouldAnimate,
  presetAnimation,
  config,
  duration,
}: any) => {
  const presetScaleValue = useSharedValue(1);
  
  const presetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: presetScaleValue.value }],
  }));
  
  const handlePresetPress = () => {
    if (animated && shouldAnimate() && presetAnimation) {
      presetScaleValue.value = withSequence(
        withTiming(0.9, { duration: config.duration.fast / 2 }),
        withSpring(1, config.spring)
      );
    }
    onPress(preset);
  };
  
  const ButtonComponent = animated && shouldAnimate() && presetAnimation
    ? AnimatedPressable
    : Pressable;
  
  return (
    <ButtonComponent
      onPress={handlePresetPress}
      disabled={disabled}
      className={`w-10 h-10 rounded-lg border-2 ${
        isSelected ? 'border-foreground' : 'border-border'
      }`}
      style={[
        {
          backgroundColor: preset,
        },
        animated && shouldAnimate() && presetAnimation
          ? presetAnimatedStyle
          : {},
      ]}
      entering={
        Platform.OS !== 'web' && animated && shouldAnimate() && presetAnimation
          ? ZoomIn.duration(duration).delay(index * 30)
          : undefined
      }
    />
  );
};

export type ColorPickerAnimationType = 'colorTransition' | 'pickerExpand' | 'fadeIn' | 'none';

export interface ColorPickerProps {
  value?: string;
  onChange?: (color: string) => void;
  defaultValue?: string;
  showInput?: boolean;
  showPresets?: boolean;
  presets?: string[];
  variant?: 'default' | 'compact' | 'popover';
  disabled?: boolean;
  placeholder?: string;
  label?: string;
  style?: ViewStyle;
  testID?: string;
  
  // Animation props
  animated?: boolean;
  animationVariant?: AnimationVariant;
  animationType?: ColorPickerAnimationType;
  animationDuration?: number;
  colorChangeAnimation?: boolean;
  pickerOpenAnimation?: 'scale' | 'fade' | 'slide';
  presetAnimation?: boolean;
  useHaptics?: boolean;
  animationConfig?: {
    duration?: number;
    spring?: { damping: number; stiffness: number };
  };
}

const DEFAULT_PRESETS = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
  '#FF00FF', '#00FFFF', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
  '#F8B739', '#6C5CE7', '#A29BFE', '#FD79A8', '#FDCB6E', '#6C5CE7',
];

const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
};

// const rgbToHex = (r: number, g: number, b: number): string => {
//   return '#' + [r, g, b].map(x => {
//     const hex = x.toString(16);
//     return hex.length === 1 ? '0' + hex : hex;
//   }).join('').toUpperCase();
// };

// const rgbToHsv = (r: number, g: number, b: number): { h: number; s: number; v: number } => {
//   r /= 255;
//   g /= 255;
//   b /= 255;
  
//   const max = Math.max(r, g, b);
//   const min = Math.min(r, g, b);
//   const diff = max - min;
  
//   let h = 0;
//   const s = max === 0 ? 0 : diff / max;
//   const v = max;
  
//   if (max !== min) {
//     switch (max) {
//       case r:
//         h = ((g - b) / diff + (g < b ? 6 : 0)) / 6;
//         break;
//       case g:
//         h = ((b - r) / diff + 2) / 6;
//         break;
//       case b:
//         h = ((r - g) / diff + 4) / 6;
//         break;
//     }
//   }
  
//   return { h, s, v };
// };

// const hsvToRgb = (h: number, s: number, v: number): { r: number; g: number; b: number } => {
//   const i = Math.floor(h * 6);
//   const f = h * 6 - i;
//   const p = v * (1 - s);
//   const q = v * (1 - f * s);
//   const t = v * (1 - (1 - f) * s);
  
//   let r: number, g: number, b: number;
  
//   switch (i % 6) {
//     case 0: r = v; g = t; b = p; break;
//     case 1: r = q; g = v; b = p; break;
//     case 2: r = p; g = v; b = t; break;
//     case 3: r = p; g = q; b = v; break;
//     case 4: r = t; g = p; b = v; break;
//     case 5: r = v; g = p; b = q; break;
//     default: r = 0; g = 0; b = 0;
//   }
  
//   return {
//     r: Math.round(r * 255),
//     g: Math.round(g * 255),
//     b: Math.round(b * 255),
//   };
// };

export const ColorPicker = React.forwardRef<View, ColorPickerProps>(
  (
    {
      value,
      onChange,
      defaultValue = '#000000',
      showInput = true,
      showPresets = true,
      presets = DEFAULT_PRESETS,
      variant = 'default',
      disabled = false,
      placeholder = 'Select color',
      label,
      style,
      testID,
      // Animation props
      animated = true,
      animationVariant = 'moderate',
      animationType = 'colorTransition',
      animationDuration,
      colorChangeAnimation = true,
      pickerOpenAnimation = 'scale',
      presetAnimation = true,
      useHaptics = true,
      animationConfig,
    },
    ref
  ) => {
    const { spacing } = useSpacing();
    const { shouldAnimate } = useAnimationStore();
    
    const [isOpen, setIsOpen] = useState(false);
    const [internalValue, setInternalValue] = useState(value || defaultValue);
    const [inputValue, setInputValue] = useState(value || defaultValue);
    
    const currentColor = value || internalValue;
    const rgb = hexToRgb(currentColor);
    // const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
    
    // Get animation config
    const config = getAnimationConfig(animationVariant);
    const finalConfig = animationConfig ? { ...config, ...animationConfig } : config;
    
    const duration = animationDuration ?? finalConfig.duration.normal;
    
    // Animation values
    const colorScale = useSharedValue(1);
    const modalScale = useSharedValue(0.9);
    const modalOpacity = useSharedValue(0);
    const sliderProgress = useSharedValue(0);
    
    useEffect(() => {
      if (value) {
        setInternalValue(value);
        setInputValue(value);
      }
    }, [value]);
    
    // Modal open/close animations
    useEffect(() => {
      if (animated && shouldAnimate()) {
        if (isOpen) {
          if (pickerOpenAnimation === 'scale') {
            modalScale.value = withSpring(1, finalConfig.spring);
            modalOpacity.value = withTiming(1, { duration: finalConfig.duration.fast });
          } else if (pickerOpenAnimation === 'fade') {
            modalScale.value = 1;
            modalOpacity.value = withTiming(1, { duration });
          } else if (pickerOpenAnimation === 'slide') {
            modalScale.value = 1;
            modalOpacity.value = withTiming(1, { duration: finalConfig.duration.fast });
          }
        } else {
          modalScale.value = 0.9;
          modalOpacity.value = 0;
        }
      }
    }, [isOpen, animated, shouldAnimate, pickerOpenAnimation, modalScale, modalOpacity, finalConfig.spring, finalConfig.duration.fast, duration]);
    
    // Color change animation
    useEffect(() => {
      if (animated && shouldAnimate() && colorChangeAnimation) {
        colorScale.value = withSequence(
          withTiming(1.1, { duration: finalConfig.duration.fast / 2 }),
          withSpring(1, finalConfig.spring)
        );
      }
    }, [currentColor, animated, shouldAnimate, colorChangeAnimation, colorScale, finalConfig.duration.fast, finalConfig.spring]);
    
    // Slider animation
    useEffect(() => {
      if (animated && shouldAnimate() && animationType === 'colorTransition') {
        sliderProgress.value = withTiming(1, { duration });
      }
    }, [rgb, animated, shouldAnimate, animationType, sliderProgress, duration]);
    
    // Animated styles
    const modalAnimatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: modalScale.value }],
      opacity: modalOpacity.value,
    }));
    
    const colorPreviewAnimatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: colorScale.value }],
    }));
    
    const sliderAnimatedStyle = useAnimatedStyle(() => ({
      opacity: interpolate(sliderProgress.value, [0, 1], [0.7, 1]),
    }));
    
    const handleColorChange = useCallback((newColor: string) => {
      setInternalValue(newColor);
      setInputValue(newColor);
      onChange?.(newColor);
      
      if (useHaptics) {
        haptic('impact');
      }
    }, [onChange, useHaptics]);
    
    const handleInputChange = useCallback((text: string) => {
      setInputValue(text);
      if (/^#[0-9A-F]{6}$/i.test(text)) {
        handleColorChange(text.toUpperCase());
      }
    }, [handleColorChange]);
    
    // const renderColorWheel = () => (
    //   <View
    //     style={{
    //       width: 200,
    //       height: 200,
    //       borderRadius: 100,
    //       overflow: 'hidden',
    //       marginBottom: spacing[4],
    //       alignSelf: 'center',
    //     }}
    //   >
    //     {/* Simplified color wheel - in production, use a proper color wheel library */}
    //     <TouchableOpacity
    //       style={{
    //         flex: 1,
    //         backgroundColor: currentColor,
    //         justifyContent: 'center',
    //         alignItems: 'center',
    //       }}
    //       onPress={() => {
    //         // In a real implementation, this would open a color wheel
    //         Alert.alert('Color Wheel', 'Full color wheel not implemented in this demo');
    //       }}
    //     >
    //       <Text style={{ color: rgb.r + rgb.g + rgb.b > 380 ? '#000' : '#FFF' }}>
    //         Tap to change
    //       </Text>
    //     </TouchableOpacity>
    //   </View>
    // );
    
    const renderSliders = () => {
      const SliderContainer = animated && shouldAnimate() ? AnimatedView : View;
      
      return (
        <SliderContainer 
          style={[
            { marginBottom: spacing[4] },
            animated && shouldAnimate() ? sliderAnimatedStyle : {},
          ]}>
        <View style={{ marginBottom: spacing[3] }}>
          <UniversalText className="text-foreground mb-1">
            Red: {rgb.r}
          </UniversalText>
          <View
            className="h-10 bg-muted rounded-full overflow-hidden"
          >
            <View
              style={{
                height: '100%',
                width: `${(rgb.r / 255) * 100}%`,
                backgroundColor: `rgb(${rgb.r}, 0, 0)`,
              }}
            />
          </View>
        </View>
        
        <View style={{ marginBottom: spacing[3] }}>
          <UniversalText className="text-foreground mb-1">
            Green: {rgb.g}
          </UniversalText>
          <View
            className="h-10 bg-muted rounded-full overflow-hidden"
          >
            <View
              style={{
                height: '100%',
                width: `${(rgb.g / 255) * 100}%`,
                backgroundColor: `rgb(0, ${rgb.g}, 0)`,
              }}
            />
          </View>
        </View>
        
        <View>
          <UniversalText className="text-foreground mb-1">
            Blue: {rgb.b}
          </UniversalText>
          <View
            className="h-10 bg-muted rounded-full overflow-hidden"
          >
            <View
              style={{
                height: '100%',
                width: `${(rgb.b / 255) * 100}%`,
                backgroundColor: `rgb(0, 0, ${rgb.b})`,
              }}
            />
          </View>
        </View>
      </SliderContainer>
    );
    };
    
    const renderPresetColors = () => {
      if (!showPresets) return null;
      
      return (
        <View>
          <UniversalText className="text-sm font-medium text-muted-foreground mb-2">
            Preset Colors
          </UniversalText>
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: spacing[2],
            }}
          >
            {presets.map((preset, index) => (
              <PresetColorButton
                key={`${preset}-${index}`}
                preset={preset}
                index={index}
                isSelected={currentColor === preset}
                onPress={handleColorChange}
                disabled={disabled}
                animated={animated}
                shouldAnimate={shouldAnimate}
                presetAnimation={presetAnimation}
                config={finalConfig}
                duration={duration}
              />
            ))}
          </View>
        </View>
      );
    };
    
    const renderCompact = () => {
      const ColorPreview = animated && shouldAnimate() && colorChangeAnimation
        ? AnimatedView
        : View;
      
      return (
        <Pressable
          ref={ref as any}
          onPress={() => !disabled && setIsOpen(true)}
          disabled={disabled}
          className={`flex-row items-center p-2 bg-card rounded-lg border border-border ${disabled ? 'opacity-50' : ''}`}
          style={style}
          testID={testID}
        >
          <ColorPreview
            className="w-6 h-6 rounded border border-border mr-2"
            style={[
              {
                backgroundColor: currentColor,
              },
              animated && shouldAnimate() && colorChangeAnimation
                ? colorPreviewAnimatedStyle
                : {},
            ]}
          />
          <UniversalText className="text-foreground flex-1">{currentColor}</UniversalText>
          <Symbol name="chevron.down" size={16} className="text-muted-foreground" />
        </Pressable>
      );
    };
    
    const renderDefault = () => (
      <View ref={ref} style={style} testID={testID}>
        {label && (
          <UniversalText className="text-sm font-medium text-foreground mb-2">
            {label}
          </UniversalText>
        )}
        
        <Card p={4 as SpacingScale}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing[4] }}>
            <AnimatedView
              className="w-[60px] h-[60px] rounded-lg border border-border mr-4"
              style={[
                {
                  backgroundColor: currentColor,
                },
                animated && shouldAnimate() && colorChangeAnimation
                  ? colorPreviewAnimatedStyle
                  : {},
              ]}
            />
            
            {showInput && (
              <View style={{ flex: 1 }}>
                <Input
                  value={inputValue}
                  onChangeText={handleInputChange}
                  placeholder="#000000"
                  isDisabled={disabled}
                  style={{ marginBottom: 0 }}
                />
              </View>
            )}
          </View>
          
          {renderSliders()}
          {renderPresetColors()}
        </Card>
      </View>
    );
    
    if (variant === 'compact' || variant === 'popover') {
      return (
        <>
          {renderCompact()}
          <Modal
            visible={isOpen}
            transparent
            animationType="fade"
            onRequestClose={() => setIsOpen(false)}
          >
            <Pressable
              className="flex-1 bg-background/80 justify-center items-center"
              onPress={() => setIsOpen(false)}
            >
              <AnimatedView
                className="bg-background rounded-xl p-4 w-[90%] max-w-[400px]"
                style={[
                  animated && shouldAnimate() ? modalAnimatedStyle : {},
                ]}
                entering={Platform.OS !== 'web' && animated && shouldAnimate() && pickerOpenAnimation === 'slide'
                  ? SlideInDown.duration(duration)
                  : undefined
                }
              >
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: spacing[4],
                  }}
                >
                  <UniversalText className="text-lg font-semibold text-foreground">
                    {placeholder}
                  </UniversalText>
                  <Pressable onPress={() => setIsOpen(false)}>
                    <Symbol name="xmark" size={24} className="text-muted-foreground" />
                  </Pressable>
                </View>
                
                <View style={{ marginBottom: spacing[4] }}>
                  <AnimatedView
                    className="w-20 h-20 rounded-xl border border-border self-center mb-4"
                    style={[
                      {
                        backgroundColor: currentColor,
                      },
                      animated && shouldAnimate() && colorChangeAnimation
                        ? colorPreviewAnimatedStyle
                        : {},
                    ]}
                  />
                  
                  {showInput && (
                    <Input
                      value={inputValue}
                      onChangeText={handleInputChange}
                      placeholder="#000000"
                      isDisabled={disabled}
                    />
                  )}
                </View>
                
                {renderSliders()}
                {renderPresetColors()}
                
                <Button
                  onPress={() => setIsOpen(false)}
                  style={{ marginTop: spacing[4] }}
                >
                  Done
                </Button>
              </AnimatedView>
            </Pressable>
          </Modal>
        </>
      );
    }
    
    return renderDefault();
  }
);

ColorPicker.displayName = 'ColorPicker';