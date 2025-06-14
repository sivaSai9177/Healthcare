import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Modal,
  Pressable,
  ViewStyle,
  Platform,
  FlatList,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  interpolate,
  Extrapolation,
  FadeIn,
  FadeOut,
  SlideInDown,
  Layout,
} from 'react-native-reanimated';
import { cn } from '@/lib/core/utils';
import { Text } from '@/components/universal/typography/Text';
import { Input } from './Input';
import { Symbol } from '@/components/universal/display/Symbols';
import { useSpacing } from '@/lib/stores/spacing-store';
import { useAnimationStore } from '@/lib/stores/animation-store';
import { haptic } from '@/lib/ui/haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedView = Animated.View;

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
  icon?: string;
  description?: string;
}

export interface SelectProps {
  // Core props
  value?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  options: SelectOption[];
  placeholder?: string;
  
  // State
  disabled?: boolean;
  error?: string;
  isLoading?: boolean;
  
  // Features
  multiple?: boolean;
  searchable?: boolean;
  clearable?: boolean;
  grouped?: { label: string; options: SelectOption[] }[];
  
  // Appearance
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'outline' | 'filled' | 'ghost';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  maxHeight?: number;
  
  // Animation
  animated?: boolean;
  animationType?: 'dropdown' | 'fade' | 'slide' | 'scale';
  dropdownStagger?: boolean;
  
  // Style
  className?: string;
  dropdownClassName?: string;
  style?: ViewStyle;
  dropdownStyle?: ViewStyle;
  
  // Callbacks
  onOpen?: () => void;
  onClose?: () => void;
}

// Size configurations with density support
const sizeClasses = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-10 px-4 text-base',
  lg: 'h-12 px-5 text-lg',
};

const densitySizeClasses = {
  compact: {
    sm: 'h-8 px-2.5 text-sm',
    md: 'h-9 px-3 text-base',
    lg: 'h-10 px-4 text-lg',
  },
  medium: {
    sm: 'h-9 px-3 text-sm',
    md: 'h-10 px-4 text-base',
    lg: 'h-12 px-5 text-lg',
  },
  large: {
    sm: 'h-10 px-4 text-base',
    md: 'h-12 px-5 text-lg',
    lg: 'h-14 px-6 text-xl',
  },
};

const variantClasses = {
  outline: 'border border-input bg-background',
  filled: 'border-0 bg-muted',
  ghost: 'border-0 bg-transparent',
};

const roundedClasses = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  full: 'rounded-full',
};

export const Select = (React.forwardRef<View, SelectProps>(({
  // Core props
  value,
  onValueChange,
  options,
  placeholder = 'Select an option',
  
  // State
  disabled = false,
  error,
  isLoading = false,
  
  // Features
  multiple = false,
  searchable = false,
  clearable = false,
  grouped,
  
  // Appearance
  label,
  size = 'md',
  variant = 'outline',
  rounded = 'md',
  maxHeight = 300,
  
  // Animation
  animated = true,
  animationType = 'scale',
  dropdownStagger = true,
  
  // Style
  className,
  dropdownClassName,
  style,
  dropdownStyle,
  
  // Callbacks
  onOpen,
  onClose,
}, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const { density } = useSpacing();
  const { enableAnimations } = useAnimationStore();
  const { height: windowHeight } = useWindowDimensions();
  const selectRef = useRef<View>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  
  // Animation values
  const chevronRotation = useSharedValue(0);
  const dropdownScale = useSharedValue(0.95);
  const dropdownOpacity = useSharedValue(0);
  const itemAnimations = useSharedValue(0);
  
  // Get all options (flat list for grouped options)
  const allOptions = grouped 
    ? grouped.flatMap(group => group.options)
    : options;
  
  // Filter options based on search
  const filteredOptions = searchable && searchQuery
    ? allOptions.filter(opt => 
        opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opt.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allOptions;
  
  // Get selected options
  const selectedOptions = multiple && Array.isArray(value)
    ? allOptions.filter(opt => value.includes(opt.value))
    : allOptions.filter(opt => opt.value === value);
  
  const selectedLabel = selectedOptions.length > 0
    ? multiple
      ? `${selectedOptions[0].label}${selectedOptions.length > 1 ? ` +${selectedOptions.length - 1}` : ''}`
      : selectedOptions[0].label
    : placeholder;
  
  // Handle dropdown position for web
  useEffect(() => {
    if (isOpen && Platform.OS === 'web' && selectRef.current) {
      selectRef.current.measure((x, y, width, height, pageX, pageY) => {
        const spaceBelow = windowHeight - pageY - height;
        const dropdownHeight = Math.min(maxHeight, spaceBelow - 20);
        
        setDropdownPosition({
          top: pageY + height + 4,
          left: pageX,
          width,
        });
      });
    }
  }, [isOpen, windowHeight, maxHeight]);
  
  // Update animations
  useEffect(() => {
    if (enableAnimations) {
      chevronRotation.value = withSpring(isOpen ? 180 : 0, {
        damping: 15,
        stiffness: 300,
      });
      
      if (isOpen) {
        dropdownScale.value = withSpring(1, {
          damping: 12,
          stiffness: 200,
        });
        dropdownOpacity.value = withTiming(1, { duration: 200 });
        
        if (dropdownStagger) {
          itemAnimations.value = withTiming(1, { duration: 300 });
        }
      } else {
        dropdownScale.value = withTiming(0.95, { duration: 150 });
        dropdownOpacity.value = withTiming(0, { duration: 150 });
        itemAnimations.value = 0;
      }
    }
  }, [isOpen, enableAnimations, dropdownStagger]);
  
  // Handlers
  const handleOpen = useCallback(() => {
    if (!disabled) {
      setIsOpen(true);
      onOpen?.();
      haptic('light');
    }
  }, [disabled, onOpen]);
  
  const handleClose = useCallback(() => {
    setIsOpen(false);
    setSearchQuery('');
    setHighlightedIndex(-1);
    onClose?.();
  }, [onClose]);
  
  const handleSelect = useCallback((option: SelectOption) => {
    if (option.disabled) return;
    
    haptic('light');
    
    if (multiple && Array.isArray(value)) {
      const newValue = value.includes(option.value)
        ? value.filter(v => v !== option.value)
        : [...value, option.value];
      onValueChange?.(newValue);
    } else {
      onValueChange?.(option.value);
      handleClose();
    }
  }, [multiple, value, onValueChange, handleClose]);
  
  const handleClear = useCallback(() => {
    onValueChange?.(multiple ? [] : '');
    haptic('light');
  }, [multiple, onValueChange]);
  
  // Get size classes based on density
  const sizeClass = densitySizeClasses[density]?.[size] || sizeClasses[size];
  
  // Build trigger classes
  const triggerClasses = cn(
    'flex-row items-center justify-between',
    variantClasses[variant],
    roundedClasses[rounded],
    sizeClass,
    error && 'border-destructive',
    disabled && 'opacity-50',
    'transition-colors duration-200',
    className
  );
  
  // Animated styles
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevronRotation.value}deg` }],
  }));
  
  const animatedDropdownStyle = useAnimatedStyle(() => {
    const baseStyle = {
      opacity: dropdownOpacity.value,
    };
    
    if (animationType === 'scale') {
      return {
        ...baseStyle,
        transform: [
          { scale: dropdownScale.value },
          { translateY: interpolate(
            dropdownScale.value,
            [0.95, 1],
            [-10, 0],
            Extrapolation.CLAMP
          )},
        ],
      };
    }
    
    return baseStyle;
  });
  
  const renderOption = useCallback((option: SelectOption, index: number) => {
    const isSelected = multiple && Array.isArray(value) 
      ? value.includes(option.value)
      : value === option.value;
    
    const isHighlighted = index === highlightedIndex;
    
    const itemStyle = useAnimatedStyle(() => {
      if (!dropdownStagger || !enableAnimations) return {};
      
      const delay = index * 30;
      const progress = interpolate(
        itemAnimations.value,
        [0, 1],
        [0, 1],
        Extrapolation.CLAMP
      );
      
      return {
        opacity: progress,
        transform: [
          { translateX: interpolate(progress, [0, 1], [-20, 0]) },
        ],
      };
    });
    
    return (
      <AnimatedPressable
        key={option.value}
        onPress={() => handleSelect(option)}
        onHoverIn={() => setHighlightedIndex(index)}
        onHoverOut={() => setHighlightedIndex(-1)}
        style={[
          itemStyle,
          {
            opacity: option.disabled ? 0.5 : 1,
          },
        ]}
        className={cn(
          'px-4 py-3 flex-row items-center',
          isSelected && 'bg-accent',
          isHighlighted && !isSelected && 'bg-muted',
          'transition-colors duration-150'
        )}
      >
        {/* Icon */}
        {option.icon && (
          <Symbol 
            name={option.icon as any} 
            size={16} 
            color={isSelected ? 'accent-foreground' : 'foreground'}
            className="mr-3"
          />
        )}
        
        {/* Content */}
        <View className="flex-1">
          <Text
            size={size === 'sm' ? 'sm' : 'base'}
            weight={isSelected ? 'medium' : 'normal'}
            color={isSelected ? 'accent' : 'foreground'}
          >
            {option.label}
          </Text>
          {option.description && (
            <Text
              size="sm"
              color="muted"
              className="mt-0.5"
            >
              {option.description}
            </Text>
          )}
        </View>
        
        {/* Checkmark for selected items */}
        {isSelected && (
          <AnimatedView
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(150)}
          >
            <Symbol 
              name="checkmark" 
              size={16} 
              color="accent-foreground"
            />
          </AnimatedView>
        )}
      </AnimatedPressable>
    );
  }, [value, highlightedIndex, handleSelect, dropdownStagger, enableAnimations, multiple, size]);
  
  return (
    <>
      <View ref={ref} style={style}>
        {/* Label */}
        {label && (
          <Text
            size="sm"
            weight="medium"
            color={error ? 'destructive' : 'foreground'}
            className="mb-1.5"
          >
            {label}
          </Text>
        )}
        
        {/* Select Trigger */}
        <Pressable
          ref={selectRef}
          onPress={handleOpen}
          disabled={disabled}
          className={triggerClasses}
        >
          {/* Selected Value(s) */}
          <Text
            size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'base'}
            color={selectedOptions.length > 0 ? 'foreground' : 'muted'}
            className="flex-1 mr-2"
            numberOfLines={1}
          >
            {selectedLabel}
          </Text>
          
          {/* Clear Button */}
          {clearable && selectedOptions.length > 0 && !disabled && (
            <Pressable
              onPress={handleClear}
              className="p-1 mr-1"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Symbol name="x.circle.fill" size={16} color="muted" />
            </Pressable>
          )}
          
          {/* Chevron */}
          <AnimatedView style={chevronStyle}>
            <Symbol 
              name="chevron.down" 
              size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16}
              color={error ? 'destructive' : 'muted'}
            />
          </AnimatedView>
        </Pressable>
        
        {/* Error Message */}
        {error && (
          <Text size="sm" color="destructive" className="mt-1.5">
            {error}
          </Text>
        )}
      </View>
      
      {/* Dropdown Modal */}
      <Modal
        visible={isOpen}
        transparent
        animationType="none"
        onRequestClose={handleClose}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }}
          onPress={handleClose}
        >
          <AnimatedPressable
            style={[
              {
                position: Platform.OS === 'web' ? 'absolute' : 'relative',
                ...(Platform.OS === 'web' ? dropdownPosition : {
                  marginTop: 100,
                  marginHorizontal: 20,
                }),
                maxHeight,
              },
              animatedDropdownStyle,
              dropdownStyle,
            ]}
            className={cn(
              'bg-popover border border-border rounded-md shadow-lg overflow-hidden',
              dropdownClassName
            )}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Search Input */}
            {searchable && (
              <View className="p-3 border-b border-border">
                <Input
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search..."
                  size={size}
                  leftIcon="magnifyingglass"
                  showClearButton
                  autoFocus
                />
              </View>
            )}
            
            {/* Loading State */}
            {isLoading ? (
              <View className="p-8 items-center justify-center">
                <ActivityIndicator className="mb-3" />
                <Text size="sm" color="muted">Loading options...</Text>
              </View>
            ) : (
              /* Options List */
              <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {filteredOptions.length === 0 ? (
                  <View className="p-8 items-center">
                    <Symbol name="magnifyingglass" size={32} color="muted" className="mb-3" />
                    <Text size="sm" color="muted">No options found</Text>
                  </View>
                ) : grouped ? (
                  /* Grouped Options */
                  grouped.map((group, groupIndex) => {
                    const groupOptions = group.options.filter(opt =>
                      !searchQuery || filteredOptions.includes(opt)
                    );
                    
                    if (groupOptions.length === 0) return null;
                    
                    return (
                      <View key={group.label}>
                        {groupIndex > 0 && <View className="h-px bg-border my-1" />}
                        <Text
                          size="sm"
                          weight="medium"
                          color="muted"
                          className="px-4 py-2"
                        >
                          {group.label}
                        </Text>
                        {groupOptions.map((option, index) => 
                          renderOption(option, index)
                        )}
                      </View>
                    );
                  })
                ) : (
                  /* Flat Options */
                  filteredOptions.map((option, index) => 
                    renderOption(option, index)
                  )
                )}
              </ScrollView>
            )}
          </AnimatedPressable>
        </Pressable>
      </Modal>
    </>
  );
}));
Select.displayName = 'Select';

// Native-style picker for mobile (optional)
export const NativeSelect = React.forwardRef<View, SelectProps>((props, ref) => {
  // For true native feel on mobile, you could integrate with
  // @react-native-picker/picker or similar libraries
  // For now, using the same implementation
  return <Select {...props} ref={ref} />;
});

NativeSelect.displayName = 'NativeSelect';