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
import { Text } from './Text';
import { Button } from './Button';
import { Input } from './Input';
import { useTheme } from '@/lib/theme/provider';
import { useSpacing } from '@/lib/stores/spacing-store';
import { Symbol } from './Symbols';
import { 
  AnimationVariant,
  getAnimationConfig,
} from '@/lib/design';
import { useAnimationVariant } from '@/hooks/useAnimationVariant';
import { useAnimationStore } from '@/lib/stores/animation-store';
import { haptic } from '@/lib/ui/haptics';

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
  style?: ViewStyle;
  inputStyle?: ViewStyle;
  calendarStyle?: ViewStyle;
  testID?: string;
  
  // Animation props
  animated?: boolean;
  animationVariant?: AnimationVariant;
  animationType?: DatePickerAnimationType;
  animationDuration?: number;
  calendarAnimation?: 'slide' | 'fade' | 'scale';
  dateSelectionAnimation?: boolean;
  monthTransition?: 'slide' | 'fade';
  useHaptics?: boolean;
  animationConfig?: {
    duration?: number;
    spring?: { damping: number; stiffness: number };
  };
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const AnimatedView = Animated.View;
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Day cell component for animations
const AnimatedDayCell = ({ 
  day, 
  isSelected, 
  isToday, 
  isDisabled, 
  onPress,
  animated,
  shouldAnimate,
  theme,
  animationDuration,
}: any) => {
  const scale = useSharedValue(1);
  const backgroundColor = useSharedValue(isSelected ? theme.primary : 'transparent');
  
  useEffect(() => {
    if (animated && shouldAnimate()) {
      backgroundColor.value = withTiming(
        isSelected ? theme.primary : 'transparent',
        { duration: animationDuration }
      );
    }
  }, [isSelected]);
  
  const animatedDayStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: backgroundColor.value,
  }));
  
  const handlePressIn = () => {
    if (animated && shouldAnimate()) {
      scale.value = withSpring(0.9);
    }
  };
  
  const handlePressOut = () => {
    if (animated && shouldAnimate()) {
      scale.value = withSpring(1);
    }
  };
  
  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        {
          width: 40,
          height: 40,
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: 20,
          borderWidth: isToday ? 1 : 0,
          borderColor: theme.primary,
          opacity: isDisabled ? 0.3 : 1,
        },
        animated && shouldAnimate() ? animatedDayStyle : {
          backgroundColor: isSelected ? theme.primary : 'transparent',
        },
      ]}
      disabled={isDisabled}
    >
      <Text
        size="sm"
        weight={isSelected || isToday ? 'medium' : 'normal'}
        style={{
          color: isSelected ? theme.primaryForeground : theme.foreground,
        }}
      >
        {day}
      </Text>
    </AnimatedPressable>
  );
};

export const DatePicker = React.forwardRef<View, DatePickerProps>(
  (
    {
      value,
      onValueChange,
      placeholder = 'Select date',
      minDate,
      maxDate,
      disabled = false,
      format = 'MM/DD/YYYY',
      showTimePicker = false,
      locale = 'en-US',
      style,
      inputStyle,
      calendarStyle,
      testID,
      // Animation props
      animated = true,
      animationVariant = 'moderate',
      animationType = 'slide',
      animationDuration,
      calendarAnimation = 'slide',
      dateSelectionAnimation = true,
      monthTransition = 'slide',
      useHaptics = true,
      animationConfig,
    },
    ref
  ) => {
    const theme = useTheme();
    const { spacing, componentSpacing } = useSpacing();
    const { shouldAnimate } = useAnimationStore();
    const [isOpen, setIsOpen] = useState(false);
    const [viewDate, setViewDate] = useState(value || new Date());
    const [selectedDate, setSelectedDate] = useState(value);
    const [selectedTime, setSelectedTime] = useState({
      hours: value?.getHours() || 0,
      minutes: value?.getMinutes() || 0,
    });
    
    // Get animation config
    const { config, isAnimated } = useAnimationVariant({
      variant: animationVariant,
      overrides: animationConfig,
    });
    
    const duration = animationDuration ?? config.duration.normal;
    
    // Animation values
    const calendarScale = useSharedValue(0.9);
    const calendarOpacity = useSharedValue(0);
    const monthSlideX = useSharedValue(0);
    
    // Calendar entrance animation
    useEffect(() => {
      if (isOpen && animated && isAnimated && shouldAnimate()) {
        if (calendarAnimation === 'scale') {
          calendarScale.value = withSpring(1, config.spring);
        }
        calendarOpacity.value = withTiming(1, { duration: config.duration.fast });
      } else {
        calendarScale.value = 0.9;
        calendarOpacity.value = 0;
      }
    }, [isOpen, animated, isAnimated, shouldAnimate, calendarAnimation]);
    
    // Animated styles
    const calendarAnimatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: calendarScale.value }],
      opacity: calendarOpacity.value,
    }));
    
    const monthAnimatedStyle = useAnimatedStyle(() => ({
      transform: [{ translateX: monthSlideX.value }],
    }));

    // Format date for display
    const formatDate = (date: Date) => {
      if (!date) return '';
      
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const year = date.getFullYear();
      
      let formatted = format
        .replace('MM', month)
        .replace('DD', day)
        .replace('YYYY', String(year));
      
      if (showTimePicker) {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        formatted += ` ${hours}:${minutes}`;
      }
      
      return formatted;
    };

    // Get days in month
    const getDaysInMonth = (date: Date) => {
      const year = date.getFullYear();
      const month = date.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();
      const startingDayOfWeek = firstDay.getDay();
      
      const days: (number | null)[] = [];
      
      // Add empty cells for days before month starts
      for (let i = 0; i < startingDayOfWeek; i++) {
        days.push(null);
      }
      
      // Add days of month
      for (let i = 1; i <= daysInMonth; i++) {
        days.push(i);
      }
      
      return days;
    };

    // Check if date is within bounds
    const isDateDisabled = (date: Date) => {
      if (minDate && date < minDate) return true;
      if (maxDate && date > maxDate) return true;
      return false;
    };

    // Check if date is selected
    const isDateSelected = (day: number) => {
      if (!selectedDate) return false;
      return (
        selectedDate.getDate() === day &&
        selectedDate.getMonth() === viewDate.getMonth() &&
        selectedDate.getFullYear() === viewDate.getFullYear()
      );
    };

    // Handle date selection
    const handleDateSelect = (day: number) => {
      const newDate = new Date(
        viewDate.getFullYear(),
        viewDate.getMonth(),
        day,
        selectedTime.hours,
        selectedTime.minutes
      );
      
      if (!isDateDisabled(newDate)) {
        setSelectedDate(newDate);
        if (!showTimePicker) {
          onValueChange(newDate);
          setIsOpen(false);
        }
      }
    };

    // Handle time change
    const handleTimeChange = (type: 'hours' | 'minutes', value: string) => {
      const numValue = parseInt(value) || 0;
      const newTime = { ...selectedTime };
      
      if (type === 'hours' && numValue >= 0 && numValue <= 23) {
        newTime.hours = numValue;
      } else if (type === 'minutes' && numValue >= 0 && numValue <= 59) {
        newTime.minutes = numValue;
      }
      
      setSelectedTime(newTime);
      
      if (selectedDate) {
        const newDate = new Date(selectedDate);
        newDate.setHours(newTime.hours, newTime.minutes);
        setSelectedDate(newDate);
      }
    };

    // Navigate months
    const goToPreviousMonth = () => {
      if (animated && isAnimated && shouldAnimate() && monthTransition === 'slide') {
        monthSlideX.value = withSequence(
          withTiming(100, { duration: config.duration.fast / 2 }),
          withTiming(0, { duration: 0 })
        );
      }
      if (useHaptics) {
        haptic('impact');
      }
      setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1));
    };

    const goToNextMonth = () => {
      if (animated && isAnimated && shouldAnimate() && monthTransition === 'slide') {
        monthSlideX.value = withSequence(
          withTiming(-100, { duration: config.duration.fast / 2 }),
          withTiming(0, { duration: 0 })
        );
      }
      if (useHaptics) {
        haptic('impact');
      }
      setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1));
    };

    const days = useMemo(() => getDaysInMonth(viewDate), [viewDate]);

    const containerStyle: ViewStyle = {
      opacity: disabled ? 0.5 : 1,
      ...style,
    };

    const calendarContainerStyle: ViewStyle = {
      backgroundColor: theme.popover || theme.card,
      borderRadius: 12,
      padding: spacing[4],
      boxShadow: '0px 4px 12px theme.mutedForeground + "10"',
      elevation: 8,
      maxWidth: 350,
      ...calendarStyle,
    };

    const headerStyle: ViewStyle = {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing[3],
    };

    const weekdayStyle: TextStyle = {
      width: 40,
      textAlign: 'center',
      marginBottom: spacing[2],
    };

    const dayStyle: ViewStyle = {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 20,
    };

    const timePickerStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing[2],
      marginTop: spacing[4],
      paddingTop: spacing[4],
      borderTopWidth: 1,
      borderTopColor: theme.border,
    };

    return (
      <View ref={ref} style={containerStyle} testID={testID}>
        <Pressable onPress={() => !disabled && setIsOpen(true)}>
          <Input
            value={value ? formatDate(value) : ''}
            placeholder={placeholder}
            editable={false}
            pointerEvents="none"
            style={inputStyle}
            rightIcon={
              <Symbol name="calendar"
                size={20}
                color={theme.mutedForeground}
              />
            }
          />
        </Pressable>

        <Modal
          visible={isOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsOpen(false)}
        >
          <Pressable
            style={{
              flex: 1,
              backgroundColor: Platform.OS === 'web' 
                ? `${theme.background}80` 
                : theme.background + '80',
              justifyContent: 'center',
              alignItems: 'center',
              padding: spacing[4],
            }}
            onPress={() => setIsOpen(false)}
          >
            <Pressable onPress={(e) => e.stopPropagation()}>
              {animated && isAnimated && shouldAnimate() ? (
                <AnimatedView style={[calendarContainerStyle, calendarAnimatedStyle]}>
                  {/* Header */}
                  <AnimatedView style={[headerStyle, monthAnimatedStyle]}>
                  <Pressable onPress={goToPreviousMonth}>
                    <Symbol name="chevron.left"
                      size={24}
                      color={theme.foreground}
                    />
                  </Pressable>
                  
                  <Text size="lg" weight="semibold">
                    {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
                  </Text>
                  
                  <Pressable onPress={goToNextMonth}>
                    <Symbol name="chevron.right"
                      size={24}
                      color={theme.foreground}
                    />
                  </Pressable>
                  </AnimatedView>

                {/* Weekdays */}
                <View style={{ flexDirection: 'row' }}>
                  {WEEKDAYS.map((day) => (
                    <Text
                      key={day}
                      size="sm"
                      weight="medium"
                      colorTheme="mutedForeground"
                      style={weekdayStyle}
                    >
                      {day}
                    </Text>
                  ))}
                </View>

                {/* Days */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {days.map((day, index) => {
                    if (!day) {
                      return <View key={index} style={dayStyle} />;
                    }

                    const date = new Date(
                      viewDate.getFullYear(),
                      viewDate.getMonth(),
                      day
                    );
                    const isDisabled = isDateDisabled(date);
                    const isSelected = isDateSelected(day);
                    const isToday =
                      date.toDateString() === new Date().toDateString();

                    return (
                      <AnimatedDayCell
                        key={index}
                        day={day}
                        isSelected={isSelected}
                        isToday={isToday}
                        isDisabled={isDisabled}
                        onPress={() => {
                          if (useHaptics) {
                            haptic('impact');
                          }
                          handleDateSelect(day);
                        }}
                        animated={animated && dateSelectionAnimation}
                        shouldAnimate={shouldAnimate}
                        theme={theme}
                        animationDuration={duration}
                      />
                    );
                  })}
                </View>

                {/* Time Picker */}
                {showTimePicker && (
                  <View style={timePickerStyle}>
                    <Text size="sm" colorTheme="mutedForeground">
                      Time:
                    </Text>
                    <Input
                      value={String(selectedTime.hours).padStart(2, '0')}
                      onChangeText={(text) => handleTimeChange('hours', text)}
                      keyboardType="numeric"
                      maxLength={2}
                      style={{ width: 50 }}
                    />
                    <Text size="lg">:</Text>
                    <Input
                      value={String(selectedTime.minutes).padStart(2, '0')}
                      onChangeText={(text) => handleTimeChange('minutes', text)}
                      keyboardType="numeric"
                      maxLength={2}
                      style={{ width: 50 }}
                    />
                  </View>
                )}

                {/* Actions */}
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'flex-end',
                    gap: spacing[2],
                    marginTop: spacing[4],
                  }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onPress={() => setIsOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="solid"
                    size="sm"
                    onPress={() => {
                      if (selectedDate) {
                        onValueChange(selectedDate);
                      }
                      setIsOpen(false);
                    }}
                    disabled={!selectedDate}
                  >
                    Select
                  </Button>
                </View>
                </AnimatedView>
              ) : (
                <View style={calendarContainerStyle}>
                  {/* Header */}
                  <View style={headerStyle}>
                    <Pressable onPress={goToPreviousMonth}>
                      <Symbol name="chevron.left"
                        size={24}
                        color={theme.foreground}
                      />
                    </Pressable>
                    
                    <Text size="lg" weight="semibold">
                      {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
                    </Text>
                    
                    <Pressable onPress={goToNextMonth}>
                      <Symbol name="chevron.right"
                        size={24}
                        color={theme.foreground}
                      />
                    </Pressable>
                  </View>

                  {/* Weekdays */}
                  <View style={{ flexDirection: 'row' }}>
                    {WEEKDAYS.map((day) => (
                      <Text
                        key={day}
                        size="sm"
                        weight="medium"
                        colorTheme="mutedForeground"
                        style={weekdayStyle}
                      >
                        {day}
                      </Text>
                    ))}
                  </View>

                  {/* Days */}
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                    {days.map((day, index) => {
                      if (!day) {
                        return <View key={index} style={dayStyle} />;
                      }

                      const date = new Date(
                        viewDate.getFullYear(),
                        viewDate.getMonth(),
                        day
                      );
                      const isDisabled = isDateDisabled(date);
                      const isSelected = isDateSelected(day);
                      const isToday =
                        date.toDateString() === new Date().toDateString();

                      return (
                        <Pressable
                          key={index}
                          onPress={() => handleDateSelect(day)}
                          disabled={isDisabled}
                          style={({ pressed }) => [
                            dayStyle,
                            {
                              backgroundColor: isSelected
                                ? theme.primary
                                : pressed
                                ? theme.accent
                                : isToday
                                ? theme.muted
                                : 'transparent',
                              opacity: isDisabled ? 0.3 : 1,
                            },
                          ]}
                        >
                          <Text
                            size="sm"
                            colorTheme={
                              isSelected ? 'primaryForeground' : 'foreground'
                            }
                            weight={isSelected || isToday ? 'semibold' : 'normal'}
                          >
                            {day}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  {/* Time Picker */}
                  {showTimePicker && (
                    <View style={timePickerStyle}>
                      <Input
                        value={String(selectedTime.hours).padStart(2, '0')}
                        onChangeText={(text) => handleTimeChange('hours', text)}
                        keyboardType="numeric"
                        maxLength={2}
                        style={{ width: 60, textAlign: 'center' }}
                      />
                      <Text size="lg" weight="semibold">:</Text>
                      <Input
                        value={String(selectedTime.minutes).padStart(2, '0')}
                        onChangeText={(text) => handleTimeChange('minutes', text)}
                        keyboardType="numeric"
                        maxLength={2}
                        style={{ width: 60, textAlign: 'center' }}
                      />
                    </View>
                  )}

                  {/* Actions */}
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'flex-end',
                      gap: spacing[2],
                      marginTop: spacing[4],
                    }}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onPress={() => setIsOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="solid"
                      size="sm"
                      onPress={() => {
                        if (selectedDate) {
                          onValueChange(selectedDate);
                        }
                        setIsOpen(false);
                      }}
                      disabled={!selectedDate}
                    >
                      Select
                    </Button>
                  </View>
                </View>
              )}
            </Pressable>
          </Pressable>
        </Modal>
      </View>
    );
  }
);

DatePicker.displayName = 'DatePicker';

// Date Range Picker Component
export interface DateRangePickerProps {
  startDate?: Date;
  endDate?: Date;
  onRangeChange: (start: Date, end: Date) => void;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  format?: string;
  style?: ViewStyle;
  inputStyle?: ViewStyle;
  calendarStyle?: ViewStyle;
  testID?: string;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onRangeChange,
  placeholder = 'Select date range',
  minDate,
  maxDate,
  disabled = false,
  format = 'MM/DD/YYYY',
  style,
  inputStyle,
  testID,
}) => {
  const theme = useTheme();
  const { spacing } = useSpacing();
  const [tempStartDate, setTempStartDate] = useState(startDate);
  const [tempEndDate, setTempEndDate] = useState(endDate);

  const formatDateRange = () => {
    if (!startDate || !endDate) return '';
    const formatDate = (date: Date) => {
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const year = date.getFullYear();
      
      return format
        .replace('MM', month)
        .replace('DD', day)
        .replace('YYYY', String(year));
    };
    
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  return (
    <View style={[{ gap: spacing[2] }, style]} testID={testID}>
      <DatePicker
        value={tempStartDate}
        onValueChange={(date) => {
          setTempStartDate(date);
          if (tempEndDate && date <= tempEndDate) {
            onRangeChange(date, tempEndDate);
          }
        }}
        placeholder="Start date"
        maxDate={tempEndDate}
        disabled={disabled}
        format={format}
        style={inputStyle}
      />
      <DatePicker
        value={tempEndDate}
        onValueChange={(date) => {
          setTempEndDate(date);
          if (tempStartDate && tempStartDate <= date) {
            onRangeChange(tempStartDate, date);
          }
        }}
        placeholder="End date"
        minDate={tempStartDate}
        disabled={disabled}
        format={format}
        style={inputStyle}
      />
    </View>
  );
};