import React from 'react';
import { View, Pressable } from 'react-native';
import { Card, CardContent } from '@/components/universal/display';
import { Text } from '@/components/universal/typography';
import { VStack } from '@/components/universal/layout';
import { cn } from '@/lib/core/utils';
import { useShadow } from '@/hooks/useShadow';
import { useResponsive } from '@/hooks/responsive';
import { useSpacing } from '@/lib/stores/spacing-store';
import { haptic } from '@/lib/ui/haptics';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring,
  FadeIn,
  ZoomIn,
} from 'react-native-reanimated';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
  color?: string;
  disabled?: boolean;
}

export interface QuickActionsBlockProps {
  actions: QuickAction[];
  columns?: 2 | 3;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function QuickActionsBlock({
  actions,
  columns = 2,
}: QuickActionsBlockProps) {
  const { spacing } = useSpacing();
  const { isMobile } = useResponsive();
  const shadowMd = useShadow({ size: 'md' });
  
  // Golden ratio dimensions: 144x89px
  const goldenWidth = 144;
  const goldenHeight = 89;
  
  return (
    <Card
      shadow="md"
      className={cn(
        "animate-fade-in",
        "transition-all duration-200",
        "w-full"
      )}
      style={{
        maxWidth: goldenWidth,
        minHeight: goldenHeight,
      }}
    >
      <CardContent style={{ padding: spacing[2] }}>
        <View 
          className="flex-row flex-wrap justify-center"
          style={{ 
            gap: spacing[1],
          }}
        >
          {actions.slice(0, columns * 2).map((action, index) => (
            <QuickActionButton
              key={action.id}
              action={action}
              index={index}
              spacing={spacing}
              size={columns === 2 ? 56 : 40}
            />
          ))}
        </View>
      </CardContent>
    </Card>
  );
}

function QuickActionButton({
  action,
  index,
  spacing,
  size,
}: {
  action: QuickAction;
  index: number;
  spacing: any;
  size: number;
}) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));
  
  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
    opacity.value = withSpring(0.8);
    haptic('light');
  };
  
  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    opacity.value = withSpring(1);
  };
  
  const handlePress = () => {
    if (!action.disabled) {
      haptic('success');
      action.onPress();
    }
  };
  
  return (
    <Animated.View
      entering={ZoomIn.delay(index * 50).springify()}
    >
      <AnimatedPressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        disabled={action.disabled}
        style={[
          animatedStyle,
          {
            width: size,
            height: size,
            borderRadius: spacing.sm,
            backgroundColor: action.color || '#3b82f6', // primary color
            alignItems: 'center',
            justifyContent: 'center',
            opacity: action.disabled ? 0.5 : 1,
          },
        ]}
      >
        <View style={{ alignItems: 'center', gap: 2 }}>
          <View className={cn(
            action.color === 'primary' && "text-primary-foreground",
            action.color === 'secondary' && "text-secondary-foreground",
            action.color === 'destructive' && "text-destructive-foreground",
            action.color === 'success' && "text-background",
            action.color === 'warning' && "text-background",
            !action.color && "text-primary-foreground"
          )}>
            {action.icon}
          </View>
          <Text 
            size="xs" 
            style={{ 
              color: '#ffffff', // white for contrast
              textAlign: 'center',
              fontSize: 9,
            }}
            numberOfLines={1}
          >
            {action.label}
          </Text>
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}