import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Modal,
  Pressable,
  ViewStyle,
  TextStyle,
  ScrollView,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideInUp,
} from 'react-native-reanimated';
import { Text } from '@/components/universal/typography/Text';
import { Button } from '@/components/universal/interaction/Button';
import { Input } from './Input';
import { cn } from '@/lib/core/utils';
import { useSpacing } from '@/lib/stores/spacing-store';
import { Symbol } from '@/components/universal/display/Symbols';
import { useAnimationStore } from '@/lib/stores/animation-store';
import { haptic } from '@/lib/ui/haptics';
import { useShadow } from '@/hooks/useShadow';

export type DatePickerAnimationType = 'slide' | 'fade' | 'scale' | 'none';

export interface DatePickerProps {
  value?: Date;
  onValueChange: (date: Date) => void;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  format?: string;
  showTimePicker?: boolean;
  locale?: string;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'filled' | 'ghost';
  className?: string;
  shadow?: 'sm' | 'base' | 'md' | 'lg' | 'none';
  style?: ViewStyle;
  inputStyle?: ViewStyle;
  calendarStyle?: ViewStyle;
  testID?: string;
  
  // Animation props
  animated?: boolean;
  animationType?: DatePickerAnimationType;
  animationDuration?: number;
  calendarAnimation?: 'slide' | 'fade' | 'scale';
  dateSelectionAnimation?: boolean;
  monthTransition?: 'slide' | 'fade';
  useHaptics?: boolean;
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const AnimatedView = Animated.View;
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Size configurations
const sizeConfig = {
  sm: {
    fontSize: 'xs' as const,
    padding: 8,
    daySize: 32,
  },
  default: {
    fontSize: 'sm' as const,
    padding: 12,
    daySize: 40,
  },
  lg: {
    fontSize: 'base' as const,
    padding: 16,
    daySize: 48,
  },
};

// Variant classes
const variantClasses = {
  default: {
    input: 'border border-input bg-background',
    calendar: 'bg-background border border-border',
  },
  filled: {
    input: 'border-0 bg-muted',
    calendar: 'bg-card border-0',
  },
  ghost: {
    input: 'border-0 bg-transparent',
    calendar: 'bg-background/95 border border-border/50',
  },
};

// Day cell component for animations
const AnimatedDayCell = ({ 
  day, 
  isSelected, 
  isToday, 
  isDisabled, 
  onPress,
  animated,
  shouldAnimate,
  animationDuration,
  size,
}: any) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(isDisabled ? 0.3 : 1);
  
  const handlePress = () => {
    if (!isDisabled) {
      if (animated && shouldAnimate()) {
        scale.value = withSequence(
          withSpring(0.9, { damping: 10, stiffness: 300 }),
          withSpring(1, { damping: 10, stiffness: 300 })
        );
      }
      onPress();
    }
  };
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));
  
  const dayClasses = cn(
    'items-center justify-center rounded-lg',
    isSelected && 'bg-primary',
    isToday && !isSelected && 'border border-primary',
    isDisabled && 'opacity-30',
    !isDisabled && !isSelected && 'hover:bg-muted'
  );
  
  return (
    <AnimatedPressable
      onPress={handlePress}
      className={dayClasses}
      style={[
        {
          width: sizeConfig[size].daySize,
          height: sizeConfig[size].daySize,
        },
        animated && shouldAnimate() ? animatedStyle : {},
      ]}
    >
      <Text
        size={sizeConfig[size].fontSize}
        weight={isSelected || isToday ? 'semibold' : 'normal'}
        className={cn(
          isSelected ? 'text-primary-foreground' : 'text-foreground'
        )}
      >
        {day}
      </Text>
    </AnimatedPressable>
  );
};

export const DatePicker = React.forwardRef<View, DatePickerProps>(({
  value,
  onValueChange,
  placeholder = 'Select date',
  minDate,
  maxDate,
  disabled = false,
  format = 'MM/DD/YYYY',
  showTimePicker = false,
  locale = 'en-US',
  size = 'default',
  variant = 'default',
  className,
  shadow = 'lg',
  style,
  inputStyle,
  calendarStyle,
  testID,
  // Animation props
  animated = true,
  animationType = 'slide',
  animationDuration = 200,
  calendarAnimation = 'slide',
  dateSelectionAnimation = true,
  monthTransition = 'slide',
  useHaptics = true,
}, ref) => {
  const { spacing } = useSpacing();
  const { shouldAnimate } = useAnimationStore();
  const shadowStyle = useShadow(shadow);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(value || new Date());
  const [currentMonth, setCurrentMonth] = useState(value?.getMonth() || new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(value?.getFullYear() || new Date().getFullYear());
  
  const config = sizeConfig[size];
  const classes = variantClasses[variant];
  
  // Format date
  const formatDate = (date: Date) => {
    if (!date) return '';
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    
    return format
      .replace('MM', month)
      .replace('DD', day)
      .replace('YYYY', String(year));
  };
  
  // Get days in month
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };
  
  // Get first day of month
  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };
  
  // Generate calendar days
  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days = [];
    
    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    
    // Days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    return days;
  }, [currentMonth, currentYear]);
  
  // Handle date selection
  const handleSelectDate = (day: number) => {
    const newDate = new Date(currentYear, currentMonth, day);
    
    if (minDate && newDate < minDate) return;
    if (maxDate && newDate > maxDate) return;
    
    setSelectedDate(newDate);
    onValueChange(newDate);
    
    if (useHaptics) {
      haptic('selection');
    }
    
    setTimeout(() => setIsOpen(false), 150);
  };
  
  // Handle month navigation
  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
    
    if (useHaptics) {
      haptic('light');
    }
  };
  
  // Input classes
  const inputClasses = cn(
    'flex-row items-center justify-between rounded-lg',
    classes.input,
    disabled && 'opacity-50',
    className
  );
  
  // Calendar classes
  const calendarClasses = cn(
    'rounded-lg shadow-xl',
    classes.calendar
  );
  
  const enteringAnimation = animationType === 'fade' ? FadeIn : 
                           animationType === 'scale' ? FadeIn.springify() :
                           SlideInDown;
  
  const exitingAnimation = animationType === 'fade' ? FadeOut :
                          animationType === 'scale' ? FadeOut :
                          SlideInUp;
  
  return (
    <>
      {/* Date Input */}
      <Pressable
        ref={ref}
        onPress={() => !disabled && setIsOpen(true)}
        className={inputClasses}
        style={[
          {
            padding: config.padding,
          },
          inputStyle,
          style,
        ]}
        testID={testID}
      >
        <Text
          size={config.fontSize}
          className={value ? 'text-foreground' : 'text-muted-foreground'}
        >
          {value ? formatDate(value) : placeholder}
        </Text>
        <Symbol
          name="calendar"
          size={config.fontSize === 'xs' ? 16 : config.fontSize === 'sm' ? 18 : 20}
          className="text-muted-foreground"
        />
      </Pressable>
      
      {/* Calendar Modal */}
      <Modal
        visible={isOpen}
        transparent
        animationType="none"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable
          className="flex-1 justify-center items-center bg-black/50"
          onPress={() => setIsOpen(false)}
        >
          <AnimatedView
            entering={animated && shouldAnimate() ? enteringAnimation : undefined}
            exiting={animated && shouldAnimate() ? exitingAnimation : undefined}
            className={calendarClasses}
            style={[
              {
                width: spacing[80],
                padding: spacing[4],
              },
              shadowStyle,
              calendarStyle,
            ]}
          >
            {/* Header */}
            <View className="flex-row items-center justify-between mb-4">
              <Pressable
                onPress={() => navigateMonth('prev')}
                className="p-2"
              >
                <Symbol name="chevron.left" size={20} className="text-foreground" />
              </Pressable>
              
              <Text size="lg" weight="semibold">
                {MONTHS[currentMonth]} {currentYear}
              </Text>
              
              <Pressable
                onPress={() => navigateMonth('next')}
                className="p-2"
              >
                <Symbol name="chevron.right" size={20} className="text-foreground" />
              </Pressable>
            </View>
            
            {/* Weekdays */}
            <View className="flex-row mb-2">
              {WEEKDAYS.map((day) => (
                <View
                  key={day}
                  className="flex-1 items-center"
                >
                  <Text size="xs" className="text-muted-foreground">
                    {day}
                  </Text>
                </View>
              ))}
            </View>
            
            {/* Calendar Days */}
            <View className="flex-row flex-wrap">
              {calendarDays.map((day, index) => (
                <View
                  key={index}
                  style={{ width: '14.28%', padding: 2 }}
                >
                  {day && (
                    <AnimatedDayCell
                      day={day}
                      isSelected={
                        selectedDate &&
                        day === selectedDate.getDate() &&
                        currentMonth === selectedDate.getMonth() &&
                        currentYear === selectedDate.getFullYear()
                      }
                      isToday={
                        day === new Date().getDate() &&
                        currentMonth === new Date().getMonth() &&
                        currentYear === new Date().getFullYear()
                      }
                      isDisabled={
                        (minDate && new Date(currentYear, currentMonth, day) < minDate) ||
                        (maxDate && new Date(currentYear, currentMonth, day) > maxDate)
                      }
                      onPress={() => handleSelectDate(day)}
                      animated={animated}
                      shouldAnimate={shouldAnimate}
                      animationDuration={animationDuration}
                      size={size}
                    />
                  )}
                </View>
              ))}
            </View>
            
            {/* Actions */}
            <View className="flex-row justify-end gap-2 mt-4">
              <Button
                variant="ghost"
                size="sm"
                onPress={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                size="sm"
                onPress={() => {
                  onValueChange(selectedDate);
                  setIsOpen(false);
                }}
              >
                OK
              </Button>
            </View>
          </AnimatedView>
        </Pressable>
      </Modal>
    </>
  );
});

DatePicker.displayName = 'DatePicker';