import React from 'react';
import { Pressable, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Symbol as IconSymbol, Box, Text } from '@/components/universal';
import { useTheme } from '@/lib/theme/provider';
import { useSpacing } from '@/lib/stores/spacing-store';
import { useAuth } from '@/hooks/useAuth';
import { haptic } from '@/lib/ui/haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { SpacingScale } from '@/lib/design';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
interface TabConfig {
  name: string;
  href: string;
  icon: string;
  label: string;
  requiresRole?: string;
  IconComponent?: React.ComponentType<any>;
}

const baseTabs: TabConfig[] = [
  { name: 'index', href: '/(home)', icon: 'house.fill', label: 'Home' },
  { name: 'explore', href: '/(home)/explore', icon: 'paperplane.fill', label: 'Explore' },
];

const roleTabs: TabConfig[] = [
  { 
    name: 'admin', 
    href: '/(home)/admin', 
    icon: 'shield.lefthalf.filled', 
    label: 'Admin',
    requiresRole: 'admin',
  },
  { 
    name: 'manager', 
    href: '/(home)/manager', 
    icon: 'person.3.fill', 
    label: 'Team',
    requiresRole: 'manager',
  },
];

const settingsTab: TabConfig = { 
  name: 'settings', 
  href: '/(home)/settings', 
  icon: 'gearshape.fill', 
  label: 'Settings' 
};

export function WebTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const { spacing } = useSpacing();
  const { user } = useAuth();
  const activeColor = theme.primary;
  const inactiveColor = theme.mutedForeground;
  const [hoveredTab, setHoveredTab] = React.useState<string | null>(null);
  const [pressedTab, setPressedTab] = React.useState<string | null>(null);

  // Build tabs based on user role
  const tabs = React.useMemo(() => {
    const userTabs = [...baseTabs];
    
    // Add role-specific tabs
    roleTabs.forEach(tab => {
      if (tab.requiresRole && user?.role === tab.requiresRole) {
        userTabs.push(tab);
      }
    });
    
    // Always add settings at the end
    userTabs.push(settingsTab);
    
    return userTabs;
  }, [user?.role]);

  const handleTabPress = (e: any, href: string) => {
    // Prevent default browser navigation
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    
    // Use haptic feedback
    haptic('selection');
    
    // Use replace for tab navigation to avoid history buildup
    if (pathname !== href) {
      router.replace(href as any);
    }
  };

  const isActive = (href: string, name: string) => {
    if (href === '/(home)' && (pathname === '/(home)' || pathname === '/(home)/index')) return true;
    if (pathname === href) return true;
    return false;
  };

  return (
    <Box 
      flexDirection="row"
      bgTheme="background"
      borderTopWidth={1}
      borderTheme="border"
      pb={3}
      pt={2}
      px={2 as SpacingScale}
      style={{
        ...(Platform.OS === 'web' && {
          boxShadow: `0 -2px 10px ${theme.mutedForeground}10`,
        }),
      }}
    >
      {tabs.map((tab, index) => {
        const active = isActive(tab.href, tab.name);
        const isHovered = hoveredTab === tab.name;
        const isPressed = pressedTab === tab.name;
        
        return (
          <TabItem
            key={tab.name}
            tab={tab}
            active={active}
            isHovered={isHovered}
            isPressed={isPressed}
            index={index}
            onPress={(e) => handleTabPress(e, tab.href)}
            onHoverIn={() => setHoveredTab(tab.name)}
            onHoverOut={() => setHoveredTab(null)}
            onPressIn={() => setPressedTab(tab.name)}
            onPressOut={() => setPressedTab(null)}
            theme={theme}
            spacing={spacing}
          />
        );
      })}
    </Box>
  );
}

interface TabItemProps {
  tab: TabConfig;
  active: boolean;
  isHovered: boolean;
  isPressed: boolean;
  index: number;
  onPress: (e: any) => void;
  onHoverIn: () => void;
  onHoverOut: () => void;
  onPressIn: () => void;
  onPressOut: () => void;
  theme: any;
  spacing: any;
}

function TabItem({ 
  tab, 
  active, 
  isHovered, 
  isPressed,
  index,
  onPress, 
  onHoverIn, 
  onHoverOut,
  onPressIn,
  onPressOut,
  theme,
  spacing 
}: TabItemProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  
  React.useEffect(() => {
    if (isPressed) {
      scale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
    } else if (isHovered) {
      scale.value = withSpring(1.05, { damping: 15, stiffness: 400 });
    } else {
      scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    }
  }, [isPressed, isHovered]);
  
  React.useEffect(() => {
    opacity.value = withSpring(active ? 1 : 0.8, { damping: 15, stiffness: 400 });
  }, [active]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));
  
  const activeColor = theme.primary;
  const inactiveColor = theme.mutedForeground;
  const color = active ? activeColor : (isHovered ? theme.primary : inactiveColor);
  
  return (
    <AnimatedPressable
      style={[
        {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: spacing[2],
          paddingHorizontal: spacing[2],
          marginHorizontal: spacing[1],
          borderRadius: spacing[2],
          backgroundColor: active ? theme.primary + '15' : (isHovered ? theme.muted : 'transparent'),
        },
        animatedStyle,
      ]}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      {...(Platform.OS === 'web' && {
        onMouseEnter: onHoverIn,
        onMouseLeave: onHoverOut,
        style: [
          {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: spacing[2],
            paddingHorizontal: spacing[2],
            marginHorizontal: spacing[1],
            borderRadius: spacing[2],
            backgroundColor: active ? theme.primary + '15' : (isHovered ? theme.muted : 'transparent'),
            cursor: 'pointer',
            transition: 'background-color 0.2s ease',
          },
          animatedStyle,
        ],
      })}
          >
            <Box alignItems="center" position="relative">
              <IconSymbol 
                size={28} 
                name={tab.icon as any} 
                color={color} 
                style={Platform.OS === 'web' ? {
                  transition: 'color 0.2s ease',
                } as any : undefined}
              />
              <Text 
                size="xs" 
                weight={active ? 'semibold' : 'normal'}
                style={{ 
                  marginTop: spacing[1], 
                  color,
                  ...(Platform.OS === 'web' && {
                    transition: 'all 0.2s ease',
                  } as any),
                }}
              >
                {tab.label}
              </Text>
              {active && (
                <Box
                  position="absolute"
                  bottom={-spacing[2]}
                  width="80%"
                  height={2}
                  bgTheme="primary"
                  rounded="full"
                  style={Platform.OS === 'web' ? {
                    transition: 'all 0.3s ease',
                  } as any : undefined}
                />
              )}
            </Box>
          </AnimatedPressable>
  );
}