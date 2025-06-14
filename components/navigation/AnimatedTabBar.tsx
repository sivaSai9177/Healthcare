import React from 'react';
import { Platform, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { Box } from '@/components/universal/layout/Box';
import { HStack } from '@/components/universal/layout/Stack';
import { Text } from '@/components/universal/typography/Text';
import { Symbol as IconSymbol } from '@/components/universal';
import { DURATIONS } from '@/lib/ui/animations/constants';
import { getSpringConfig } from '@/lib/ui/animations/utils';
import { SpacingScale } from '@/lib/design';
import { cn } from '@/lib/core/utils';
import { haptic } from '@/lib/ui/haptics';

interface TabItem {
  key: string;
  title: string;
  icon: string;
  badge?: number;
}

interface AnimatedTabBarProps {
  tabs: TabItem[];
  activeTab: string;
  onTabPress: (key: string) => void;
  style?: any;
}

export function AnimatedTabBar({
  tabs,
  activeTab,
  onTabPress,
  style,
}: AnimatedTabBarProps) {
  const activeIndex = tabs.findIndex(tab => tab.key === activeTab);
  const indicatorPosition = useSharedValue(activeIndex);
  
  React.useEffect(() => {
    indicatorPosition.value = withSpring(activeIndex, getSpringConfig('gentle'));
  }, [activeIndex, indicatorPosition]);
  
  const indicatorStyle = useAnimatedStyle(() => {
    const tabWidth = 100 / tabs.length;
    return {
      transform: [
        {
          translateX: interpolate(
            indicatorPosition.value,
            [0, tabs.length - 1],
            [0, (tabs.length - 1) * tabWidth],
            'clamp'
          ),
        },
      ],
      width: `${tabWidth}%`,
    };
  });
  
  return (
    <Box 
      className="bg-card border-t border-border"
      style={style}
    >
      <HStack spacing={0} height={56} position="relative">
        {/* Animated indicator */}
        <Animated.View
          className="absolute bottom-0 h-[3px] bg-primary rounded-t-[3px]"
          style={indicatorStyle}
        />
        
        {/* Tab items */}
        {tabs.map((tab, index) => (
          <TabItem
            key={tab.key}
            tab={tab}
            isActive={tab.key === activeTab}
            onPress={() => {
              haptic('selection');
              onTabPress(tab.key);
            }}
            index={index}
            totalTabs={tabs.length}
          />
        ))}
      </HStack>
    </Box>
  );
}

interface TabItemProps {
  tab: TabItem;
  isActive: boolean;
  onPress: () => void;
  index: number;
  totalTabs: number;
}

function TabItem({ tab, isActive, onPress, index, totalTabs }: TabItemProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(isActive ? 1 : 0.7);
  
  React.useEffect(() => {
    opacity.value = withTiming(isActive ? 1 : 0.7, { duration: DURATIONS.fast });
  }, [isActive, opacity]);
  
  const handlePressIn = () => {
    scale.value = withSpring(0.9, getSpringConfig('stiff'));
  };
  
  const handlePressOut = () => {
    scale.value = withSpring(1, getSpringConfig('wobbly'));
  };
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));
  
  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={{ flex: 1 }}
    >
      <Animated.View
        style={[
          {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 8,
          },
          animatedStyle,
        ]}
      >
        <Box alignItems="center" position="relative">
          <IconSymbol
            name={tab.icon as any}
            size={24}
            className={isActive ? 'text-primary' : 'text-muted-foreground'}
          />
          {tab.badge && tab.badge > 0 && (
            <Box
              position="absolute"
              top={-4}
              right={-8}
              className="bg-destructive rounded-full min-w-[20px] h-5 justify-center items-center px-1"
            >
              <Text size="xs" className="text-destructive-foreground" weight="bold">
                {tab.badge > 99 ? '99+' : tab.badge}
              </Text>
            </Box>
          )}
        </Box>
        <Text
          size="xs"
          className={isActive ? 'text-primary' : 'text-muted-foreground'}
          weight={isActive ? 'medium' : 'normal'}
          style={{ marginTop: 4 }}
        >
          {tab.title}
        </Text>
      </Animated.View>
    </Pressable>
  );
}