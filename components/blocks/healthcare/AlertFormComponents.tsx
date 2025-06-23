import React from 'react';
import { View, Pressable, Animated } from 'react-native';
import { Text } from '@/components/universal/typography';
import { VStack, HStack } from '@/components/universal/layout';
import { useSpacing } from '@/lib/stores/spacing-store';
import { useTheme } from '@/lib/theme';
import { useResponsive } from '@/hooks/responsive';
import { useShadow } from '@/hooks/useShadow';
import { 
  AlertType, 
  ALERT_TYPE_CONFIG,
  URGENCY_LEVEL_CONFIG,
  UrgencyLevel
} from '@/types/healthcare';

// Enhanced alert type button with animations
export const AlertTypeButton = ({ 
  type, 
  selected, 
  onPress 
}: {
  type: keyof typeof ALERT_TYPE_CONFIG;
  selected: boolean;
  onPress: () => void;
}) => {
  const { spacing } = useSpacing();
  const theme = useTheme();
  const config = ALERT_TYPE_CONFIG[type];
  const { isMobile } = useResponsive();
  const shadowSm = useShadow({ size: 'sm' });
  const shadowMd = useShadow({ size: 'md' });
  const scale = React.useRef(new Animated.Value(1)).current;
  
  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.95,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();
    onPress();
  };
  
  const [isHovered, setIsHovered] = React.useState(false);
  
  return (
    <Pressable 
      onPress={handlePress}
      onPressIn={() => setIsHovered(true)}
      onPressOut={() => setIsHovered(false)}
      style={({ pressed }) => [
        {
          backgroundColor: theme.card,
          borderColor: selected ? config.color : isHovered ? theme.primary : theme.border,
          borderWidth: selected ? 2 : 1,
          borderRadius: 12,
          padding: spacing[3],
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          aspectRatio: 1,
          opacity: pressed ? 0.9 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
          position: 'relative',
          overflow: 'hidden',
        },
        (selected || isHovered) ? shadowMd : shadowSm,
      ]}
    >
      {/* Selection indicator */}
      {selected && (
        <View style={{
          position: 'absolute',
          top: spacing[1],
          right: spacing[1],
          backgroundColor: config.color,
          borderRadius: 10,
          width: 20,
          height: 20,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Text size="xs" style={{ color: 'white' }}>✓</Text>
        </View>
      )}
      
      {/* Hover/Selected background overlay */}
      {(selected || isHovered) && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: selected ? config.color + '10' : theme.primary + '05',
          borderRadius: 12,
        }} />
      )}
      
      <VStack gap={spacing[1]} alignItems="center" style={{ flex: 1, justifyContent: 'center' }}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <Text size={isMobile ? "xl" : "2xl"}>
            {config.icon}
          </Text>
        </Animated.View>
        <Text 
          size="xs" 
          weight={selected ? "semibold" : "medium"}
          style={{ 
            color: selected ? config.color : theme.foreground,
            textAlign: 'center',
            lineHeight: 14,
          }}
          numberOfLines={2}
        >
          {String(type).charAt(0).toUpperCase() + String(type).slice(1).replace(/_/g, ' ')}
        </Text>
      </VStack>
    </Pressable>
  );
};

// Enhanced urgency level button with card-like selection
export const UrgencyButton = ({ 
  level, 
  selected, 
  onPress 
}: {
  level: UrgencyLevel;
  selected: boolean;
  onPress: () => void;
}) => {
  const { spacing } = useSpacing();
  const theme = useTheme();
  const config = URGENCY_LEVEL_CONFIG[level];
  const { isMobile } = useResponsive();
  const shadowSm = useShadow({ size: 'sm' });
  const shadowMd = useShadow({ size: 'md' });
  const [isHovered, setIsHovered] = React.useState(false);
  
  return (
    <Pressable 
      onPress={onPress}
      onPressIn={() => setIsHovered(true)}
      onPressOut={() => setIsHovered(false)}
      style={({ pressed }) => [
        {
          backgroundColor: theme.card,
          borderColor: selected ? config.color : isHovered ? theme.primary : theme.border,
          borderWidth: selected ? 2 : 1,
          borderRadius: 12,
          paddingVertical: spacing[3],
          paddingHorizontal: spacing[3],
          opacity: pressed ? 0.9 : 1,
          width: '100%',
          transform: [{ scale: pressed ? 0.98 : 1 }],
          position: 'relative',
          overflow: 'hidden',
        },
        (selected || isHovered) ? shadowMd : shadowSm,
      ]}
    >
      {/* Selection indicator */}
      {selected && (
        <View style={{
          position: 'absolute',
          top: spacing[1],
          right: spacing[1],
          backgroundColor: config.color,
          borderRadius: 10,
          width: 20,
          height: 20,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Text size="xs" style={{ color: 'white' }}>✓</Text>
        </View>
      )}
      
      {/* Hover/Selected background overlay */}
      {(selected || isHovered) && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: selected ? config.color + '10' : theme.primary + '05',
          borderRadius: 12,
        }} />
      )}
      
      <VStack gap={1} align="center">
        <Text 
          size="base"
          weight={selected ? "bold" : "semibold"}
          style={{ color: selected ? config.color : theme.foreground }}
        >
          {level}
        </Text>
        <Text 
          size="xs" 
          style={{ 
            color: selected ? config.color + 'CC' : theme.mutedForeground,
            fontSize: 10,
          }}
        >
          {config.label}
        </Text>
      </VStack>
    </Pressable>
  );
};