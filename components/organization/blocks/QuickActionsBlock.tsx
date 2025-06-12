import React from 'react';
import { View, Pressable } from 'react-native';
import { Card } from '@/components/universal/Card';
import { Text } from '@/components/universal/Text';
import { useTheme } from '@/lib/theme/provider';
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

interface QuickActionsBlockProps {
  actions: QuickAction[];
  columns?: 2 | 3;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function QuickActionsBlock({
  actions,
  columns = 2,
}: QuickActionsBlockProps) {
  const { colors } = useTheme();
  const spacing = useSpacing();
  
  // Golden ratio dimensions: 144x89px
  const goldenWidth = 144;
  const goldenHeight = 89;
  
  return (
    <Card
      animated
      animationType="lift"
      style={{
        width: '100%',
        maxWidth: goldenWidth,
        minHeight: goldenHeight,
      }}
    >
      <Card.Content style={{ padding: spacing.sm }}>
        <View 
          style={{ 
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: spacing.xs,
            justifyContent: 'center',
          }}
        >
          {actions.slice(0, columns * 2).map((action, index) => (
            <QuickActionButton
              key={action.id}
              action={action}
              index={index}
              colors={colors}
              spacing={spacing}
              size={columns === 2 ? 56 : 40}
            />
          ))}
        </View>
      </Card.Content>
    </Card>
  );
}

function QuickActionButton({
  action,
  index,
  colors,
  spacing,
  size,
}: {
  action: QuickAction;
  index: number;
  colors: any;
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
    haptic.light();
  };
  
  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    opacity.value = withSpring(1);
  };
  
  const handlePress = () => {
    if (!action.disabled) {
      haptic.success();
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
            backgroundColor: action.color || colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: action.disabled ? 0.5 : 1,
          },
        ]}
      >
        <View style={{ alignItems: 'center', gap: 2 }}>
          {action.icon}
          <Text 
            size="xs" 
            style={{ 
              color: colors.primaryForeground,
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