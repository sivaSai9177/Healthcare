import React, { useEffect } from 'react';
import {
  View,
  Modal,
  Pressable,
  ViewStyle,
  Platform,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  FadeOut,
  SlideInDown,
} from 'react-native-reanimated';
import { useTheme } from '@/lib/theme/provider';
import { Text } from './Text';
import { Box } from './Box';
import { Symbol } from './Symbols';
import { useSpacing } from '@/lib/stores/spacing-store';
import { 
  SpacingScale,
  AnimationVariant,
  getAnimationConfig,
} from '@/lib/design';
import { useAnimationVariant } from '@/hooks/useAnimationVariant';
import { useAnimationStore } from '@/lib/stores/animation-store';
import { haptic } from '@/lib/ui/haptics';

// Import Input for searchable select
import { Input } from './Input';

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export type SelectAnimationType = 'dropdown' | 'fade' | 'slide' | 'none';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);


export interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'outline' | 'filled';
  style?: ViewStyle;
  dropdownStyle?: ViewStyle;
  searchable?: boolean;
  maxHeight?: number;
  isLoading?: boolean;
  
  // Animation props
  animated?: boolean;
  animationVariant?: AnimationVariant;
  animationType?: SelectAnimationType;
  animationDuration?: number;
  dropdownStagger?: number;
  useHaptics?: boolean;
  animationConfig?: {
    duration?: number;
    spring?: { damping: number; stiffness: number };
  };
}

export const Select = React.forwardRef<View, SelectProps>(({
  value,
  onValueChange,
  options,
  placeholder = 'Select an option',
  disabled = false,
  error = false,
  size = 'md',
  variant = 'outline',
  style,
  dropdownStyle,
  searchable = false,
  maxHeight = 300,
  isLoading = false,
  // Animation props
  animated = true,
  animationVariant = 'moderate',
  animationType = 'dropdown',
  animationDuration,
  dropdownStagger = 50,
  useHaptics = true,
  animationConfig,
}, ref) => {
  const theme = useTheme();
  const { spacing, componentSizes, componentSpacing } = useSpacing();
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isHovered, setIsHovered] = React.useState(false);
  const { shouldAnimate } = useAnimationStore();
  const { config, isAnimated } = useAnimationVariant({
    variant: animationVariant,
    overrides: animationConfig,
  });
  
  const duration = animationDuration ?? config.duration.normal;
  
  // Animation values
  const chevronRotation = useSharedValue(0);
  const dropdownScale = useSharedValue(0.95);
  const dropdownOpacity = useSharedValue(0);

  const selectedOption = options.find(opt => opt.value === value);

  // Size configuration
  const sizeConfig = {
    sm: {
      height: componentSizes.input.sm.height,
      paddingH: 3 as SpacingScale,
      fontSize: 'sm' as const,
      iconSize: componentSpacing.iconSize.sm,
    },
    md: {
      height: componentSizes.input.md.height,
      paddingH: 4 as SpacingScale,
      fontSize: 'md' as const,
      iconSize: componentSpacing.iconSize.md,
    },
    lg: {
      height: componentSizes.input.lg.height,
      paddingH: 4 as SpacingScale,
      fontSize: 'lg' as const,
      iconSize: componentSpacing.iconSize.lg,
    },
  };

  const selectSizeConfig = sizeConfig[size];

  // Filter options based on search
  const filteredOptions = searchable && searchQuery
    ? options.filter(opt => 
        opt.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  // Theme-aware colors
  const getColors = () => {
    if (disabled) {
      return {
        background: theme.muted,
        border: theme.border,
        text: theme.mutedForeground,
        placeholder: theme.mutedForeground,
        icon: theme.mutedForeground,
      };
    }

    if (error) {
      return {
        background: variant === 'filled' ? theme.muted : theme.background,
        border: theme.destructive,
        text: theme.foreground,
        placeholder: theme.mutedForeground,
        icon: theme.destructive,
      };
    }

    return {
      background: variant === 'filled' ? theme.muted : theme.background,
      border: isHovered ? theme.ring : theme.border,
      text: theme.foreground,
      placeholder: theme.mutedForeground,
      icon: theme.mutedForeground,
    };
  };

  const colors = getColors();
  
  // Update animation values when dropdown state changes
  useEffect(() => {
    if (animated && isAnimated && shouldAnimate()) {
      chevronRotation.value = withSpring(isOpen ? 180 : 0, config.spring);
      
      if (isOpen) {
        dropdownScale.value = withSpring(1, config.spring);
        dropdownOpacity.value = withTiming(1, { duration: duration / 2 });
      } else {
        dropdownScale.value = withSpring(0.95, config.spring);
        dropdownOpacity.value = withTiming(0, { duration: duration / 2 });
      }
    }
  }, [isOpen, animated, isAnimated, shouldAnimate, config.spring, duration]);

  const handleSelect = (option: SelectOption) => {
    if (!option.disabled) {
      if (animated && isAnimated && shouldAnimate() && useHaptics) {
        haptic('light');
      }
      onValueChange?.(option.value);
      setIsOpen(false);
      setSearchQuery('');
    }
  };
  
  const handleOpen = () => {
    if (!disabled) {
      if (animated && isAnimated && shouldAnimate() && useHaptics) {
        haptic('light');
      }
      setIsOpen(true);
    }
  };

  const webHandlers = Platform.OS === 'web' && !disabled ? {
    onHoverIn: () => setIsHovered(true),
    onHoverOut: () => setIsHovered(false),
  } : {};
  
  // Animated styles
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevronRotation.value}deg` }],
  }));
  
  const dropdownAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dropdownScale.value }],
    opacity: dropdownOpacity.value,
  }));
  
  

  return (
    <View ref={ref} style={style}>
      <Pressable
        onPress={handleOpen}
        disabled={disabled}
        {...webHandlers}
        style={({ pressed }) => ({
          height: selectSizeConfig.height,
          paddingHorizontal: spacing[selectSizeConfig.paddingH],
          backgroundColor: colors.background,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 6,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          opacity: disabled ? 0.6 : 1,
          ...(Platform.OS === 'web' && {
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'border-color 0.2s ease',
          } as any),
        })}
      >
        <Text
          size={selectSizeConfig.fontSize}
          style={{
            color: selectedOption ? colors.text : colors.placeholder,
            flex: 1,
          }}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <Symbol
          name="chevron.down"
          size={selectSizeConfig.iconSize}
          color={colors.icon}
          style={animated && isAnimated && shouldAnimate() ? chevronStyle : undefined}
        />
      </Pressable>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setIsOpen(false);
          setSearchQuery('');
        }}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: theme.background === 'theme.foreground' || theme.background === '#0a0a0a' 
              ? 'theme.foreground + "80"' 
              : 'theme.foreground + "80"',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onPress={() => {
            setIsOpen(false);
            setSearchQuery('');
          }}
        >
          <AnimatedPressable
            style={[
              {
                backgroundColor: theme.background,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: theme.border,
                width: '90%',
                maxWidth: 400,
                maxHeight,
                boxShadow: '0px 2px 4px theme.mutedForeground + "40"',
                elevation: 5,
              },
              animated && isAnimated && shouldAnimate() && animationType === 'dropdown' 
                ? dropdownAnimatedStyle 
                : {},
              dropdownStyle,
            ]}
            entering={Platform.OS !== 'web' && animated && isAnimated && shouldAnimate() && animationType === 'slide' 
              ? SlideInDown.duration(duration).springify() 
              : Platform.OS !== 'web' && animated && isAnimated && shouldAnimate() && animationType === 'fade'
              ? FadeIn.duration(duration)
              : undefined
            }
            exiting={Platform.OS !== 'web' && animated && isAnimated && shouldAnimate() 
              ? FadeOut.duration(duration / 2) 
              : undefined
            }
            onPress={(e) => e.stopPropagation()}
          >
            {isLoading ? (
              <Box p={4 as SpacingScale} alignItems="center">
                <ActivityIndicator size="sm" color={theme.primary} />
                <Text colorTheme="mutedForeground" size="sm" mt={2}>
                  Loading options...
                </Text>
              </Box>
            ) : searchable ? (
              <Box p={3 as SpacingScale} borderBottomWidth={1} borderColor={theme.border}>
                <Input
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search..."
                  size={size}
                  autoFocus
                />
              </Box>
            ) : null}

            {!isLoading && (
              <FlatList
              data={filteredOptions}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => handleSelect(item)}
                  disabled={item.disabled}
                  style={({ pressed }) => ({
                    paddingHorizontal: spacing[4],
                    paddingVertical: spacing[3],
                    backgroundColor: pressed && !item.disabled
                      ? theme.accent
                      : item.value === value
                        ? theme.accent
                        : 'transparent',
                    opacity: item.disabled ? 0.5 : 1,
                  })}
                >
                  <Text
                    size={selectSizeConfig.fontSize}
                    weight={item.value === value ? 'medium' : 'normal'}
                    style={{
                      color: item.value === value
                        ? theme.accentForeground
                        : theme.foreground,
                    }}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              )}
              ListEmptyComponent={
                <Box p={4 as SpacingScale} alignItems="center">
                  <Text colorTheme="mutedForeground" size="sm">
                    No options found
                  </Text>
                </Box>
              }
            />
            )}
          </AnimatedPressable>
        </Pressable>
      </Modal>
    </View>
  );
});

Select.displayName = 'Select';