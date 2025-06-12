import React from 'react';
import { Platform, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { Box } from '@/components/universal/Box';
import { HStack } from '@/components/universal/Stack';
import { Text } from '@/components/universal/Text';
import { Symbol as IconSymbol } from '@/components/universal';
import { useTheme } from '@/lib/theme/provider';

import { DURATIONS } from '@/lib/ui/animations/constants';
import { getSpringConfig } from '@/lib/ui/animations/utils';
import { SpacingScale } from '@/lib/design';

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
  const theme = useTheme();
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
      bgTheme="card" 
      borderTopWidth={1} 
      borderTheme="border"
      style={style}
    >
      <HStack spacing={0} height={56} position="relative">
        {/* Animated indicator */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              bottom: 0,
              height: 3,
              backgroundColor: theme.primary,
              borderTopLeftRadius: 3,
              borderTopRightRadius: 3,
            },
            indicatorStyle,
          ]}
        />
        
        {/* Tab items */}
        {tabs.map((tab, index) => (
          <TabItem
            key={tab.key}
            tab={tab}
            isActive={tab.key === activeTab}
            onPress={() => {
              haptics.tabSelect();
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
  const theme = useTheme();
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
            color={isActive ? theme.primary : theme.mutedForeground}
          />
          {tab.badge && tab.badge > 0 && (
            <Box
              position="absolute"
              top={-4}
              right={-8}
              bgColor={theme.destructive}
              borderRadius={10}
              minWidth={20}
              height={20}
              justifyContent="center"
              alignItems="center"
              px={1 as SpacingScale}
            >
              <Text size="xs" colorTheme="destructiveForeground" weight="bold">
                {tab.badge > 99 ? '99+' : tab.badge}
              </Text>
            </Box>
          )}
        </Box>
        <Text
          size="xs"
          colorTheme={isActive ? 'primary' : 'mutedForeground'}
          weight={isActive ? 'medium' : 'normal'}
          style={{ marginTop: 4 }}
        >
          {tab.title}
        </Text>
      </Animated.View>
    </Pressable>
  );
}