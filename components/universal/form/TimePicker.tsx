import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  ViewStyle,
  Platform,
  ScrollView,
  Pressable,
  Modal,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  SlideInDown,
} from 'react-native-reanimated';
import { Text } from '@/components/universal/typography/Text';
import { Button } from '@/components/universal/interaction/Button';
import { Symbol } from '@/components/universal/display/Symbols';
import { useSpacing } from '@/lib/stores/spacing-store';
import { Card } from '@/components/universal/display/Card';
import { cn } from '@/lib/core/utils';
import { haptic } from '@/lib/ui/haptics';

export type TimePickerAnimationType = 'fade' | 'slide' | 'scale' | 'none';

export interface TimePickerProps {
  value?: Date;
  onChange?: (date: Date) => void;
  disabled?: boolean;
  placeholder?: string;
  format?: '12' | '24';
  minuteInterval?: 1 | 5 | 10 | 15 | 30;
  style?: ViewStyle;
  testID?: string;
  
  // Animation props
  animated?: boolean;
  animationType?: TimePickerAnimationType;
  animationDuration?: number;
  useHaptics?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const TimePicker = React.forwardRef<View, TimePickerProps>(
  (
    {
      value,
      onChange,
      disabled = false,
      placeholder = 'Select time',
      format = '12',
      minuteInterval = 5,
      style,
      testID,
      animated = true,
      animationType = 'slide',
      animationDuration = 300,
      useHaptics = true,
    },
    ref
  ) => {
    const { spacing } = useSpacing();
    const [showPicker, setShowPicker] = useState(false);
    const [selectedHour, setSelectedHour] = useState(value ? value.getHours() : 12);
    const [selectedMinute, setSelectedMinute] = useState(value ? value.getMinutes() : 0);
    const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>(
      value && value.getHours() >= 12 ? 'PM' : 'AM'
    );
    
    const hourScrollRef = useRef<ScrollView>(null);
    const minuteScrollRef = useRef<ScrollView>(null);
    
    // Animation values
    const scale = useSharedValue(1);
    const opacity = useSharedValue(1);
    
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    }));
    
    // Generate hours and minutes
    const hours = format === '24' 
      ? Array.from({ length: 24 }, (_, i) => i)
      : Array.from({ length: 12 }, (_, i) => i === 0 ? 12 : i);
      
    const minutes = Array.from(
      { length: 60 / minuteInterval }, 
      (_, i) => i * minuteInterval
    );
    
    const formatTime = (date: Date) => {
      const hours = format === '24' ? date.getHours() : date.getHours() % 12 || 12;
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const period = format === '12' && date.getHours() >= 12 ? 'PM' : 'AM';
      
      return format === '24' 
        ? `${hours.toString().padStart(2, '0')}:${minutes}`
        : `${hours}:${minutes} ${period}`;
    };
    
    const handleConfirm = () => {
      const newDate = new Date();
      let hour = selectedHour;
      
      if (format === '12') {
        if (selectedPeriod === 'PM' && hour !== 12) {
          hour += 12;
        } else if (selectedPeriod === 'AM' && hour === 12) {
          hour = 0;
        }
      }
      
      newDate.setHours(hour);
      newDate.setMinutes(selectedMinute);
      newDate.setSeconds(0);
      newDate.setMilliseconds(0);
      
      onChange?.(newDate);
      setShowPicker(false);
      
      if (useHaptics && Platform.OS !== 'web') {
        haptic('impact');
      }
    };
    
    const handlePress = () => {
      if (disabled) return;
      
      if (animated) {
        scale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
        setTimeout(() => {
          scale.value = withSpring(1);
        }, 100);
      }
      
      setShowPicker(true);
    };
    
    const TimeScrollPicker = ({ 
      items, 
      selectedValue, 
      onSelect,
      scrollRef,
      suffix = '',
    }: {
      items: number[];
      selectedValue: number;
      onSelect: (value: number) => void;
      scrollRef: React.RefObject<ScrollView>;
      suffix?: string;
    }) => {
      useEffect(() => {
        const index = items.indexOf(selectedValue);
        if (index !== -1) {
          scrollRef.current?.scrollTo({ y: index * 50, animated: false });
        }
      }, []);
      
      return (
        <ScrollView
          ref={scrollRef}
          style={{ height: 150 }}
          showsVerticalScrollIndicator={false}
          snapToInterval={50}
          decelerationRate="fast"
        >
          <View style={{ paddingVertical: 50 }}>
            {items.map((item) => (
              <Pressable
                key={item}
                onPress={() => {
                  onSelect(item);
                  if (useHaptics && Platform.OS !== 'web') {
                    haptic('selection');
                  }
                }}
                style={{
                  height: 50,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text
                  size="lg"
                  weight={selectedValue === item ? 'semibold' : 'normal'}
                  className={selectedValue === item ? 'text-primary' : 'text-muted-foreground'}
                >
                  {item.toString().padStart(2, '0')}{suffix}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      );
    };
    
    return (
      <>
        <AnimatedPressable
          ref={ref}
          onPress={handlePress}
          disabled={disabled}
          style={[
            {
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: spacing[3],
              paddingVertical: spacing[2.5],
              borderRadius: 8 as any,
              opacity: disabled ? 0.5 : 1,
            },
            style,
            animated ? animatedStyle : {},
          ]}
          className="border border-border bg-background"
          testID={testID}
        >
          <Symbol
            name="clock"
            size={20}
            color="#6b7280"
            style={{ marginRight: spacing[2] }}
          />
          <Text
            className={value ? 'text-foreground' : 'text-muted-foreground'}
            style={{ flex: 1 }}
          >
            {value ? formatTime(value) : placeholder}
          </Text>
        </AnimatedPressable>
        
        <Modal
          visible={showPicker}
          transparent
          animationType="none"
          onRequestClose={() => setShowPicker(false)}
        >
          <Pressable
            style={{
              flex: 1,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              justifyContent: 'center',
              alignItems: 'center',
              padding: spacing[4] as any,
            }}
            onPress={() => setShowPicker(false)}
          >
            <Animated.View
              entering={
                animated && Platform.OS !== 'web'
                  ? animationType === 'slide'
                    ? SlideInDown.duration(animationDuration)
                    : FadeIn.duration(animationDuration)
                  : undefined
              }
            >
              <Card
                className="bg-card"
                style={{
                  width: 300,
                  padding: spacing[4] as any,
                }}
              >
                <Text size="lg" weight="semibold" className="text-center mb-4">
                  Select Time
                </Text>
                
                <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                  <View style={{ alignItems: 'center' }}>
                    <Text size="sm" className="text-muted-foreground mb-2">
                      Hour
                    </Text>
                    <TimeScrollPicker
                      items={hours}
                      selectedValue={format === '12' ? selectedHour : selectedHour}
                      onSelect={setSelectedHour}
                      scrollRef={hourScrollRef}
                    />
                  </View>
                  
                  <View style={{ alignItems: 'center' }}>
                    <Text size="sm" className="text-muted-foreground mb-2">
                      Minute
                    </Text>
                    <TimeScrollPicker
                      items={minutes}
                      selectedValue={selectedMinute}
                      onSelect={setSelectedMinute}
                      scrollRef={minuteScrollRef}
                    />
                  </View>
                  
                  {format === '12' && (
                    <View style={{ alignItems: 'center' }}>
                      <Text size="sm" className="text-muted-foreground mb-2">
                        Period
                      </Text>
                      <View style={{ height: 150, justifyContent: 'center' }}>
                        <Pressable
                          onPress={() => {
                            setSelectedPeriod('AM');
                            if (useHaptics && Platform.OS !== 'web') {
                              haptic('selection');
                            }
                          }}
                          style={{
                            paddingVertical: spacing[2],
                            paddingHorizontal: spacing[3],
                            marginBottom: spacing[2],
                          }}
                          className={cn(
                            'rounded',
                            selectedPeriod === 'AM' ? 'bg-primary' : 'bg-transparent'
                          )}
                        >
                          <Text
                            weight={selectedPeriod === 'AM' ? 'semibold' : 'normal'}
                            className={
                              selectedPeriod === 'AM' 
                                ? 'text-primary-foreground' 
                                : 'text-muted-foreground'
                            }
                          >
                            AM
                          </Text>
                        </Pressable>
                        <Pressable
                          onPress={() => {
                            setSelectedPeriod('PM');
                            if (useHaptics && Platform.OS !== 'web') {
                              haptic('selection');
                            }
                          }}
                          style={{
                            paddingVertical: spacing[2],
                            paddingHorizontal: spacing[3],
                          }}
                          className={cn(
                            'rounded',
                            selectedPeriod === 'PM' ? 'bg-primary' : 'bg-transparent'
                          )}
                        >
                          <Text
                            weight={selectedPeriod === 'PM' ? 'semibold' : 'normal'}
                            className={
                              selectedPeriod === 'PM' 
                                ? 'text-primary-foreground' 
                                : 'text-muted-foreground'
                            }
                          >
                            PM
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  )}
                </View>
                
                <View
                  style={{
                    flexDirection: 'row',
                    gap: spacing[2] as any,
                    marginTop: spacing[4],
                  }}
                >
                  <Button
                    variant="outline"
                    onPress={() => setShowPicker(false)}
                    style={{ flex: 1 }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onPress={handleConfirm}
                    style={{ flex: 1 }}
                  >
                    Confirm
                  </Button>
                </View>
              </Card>
            </Animated.View>
          </Pressable>
        </Modal>
      </>
    );
  }
);

TimePicker.displayName = 'TimePicker';