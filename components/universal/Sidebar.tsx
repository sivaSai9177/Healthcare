import React, { useState, useContext, createContext, useEffect } from 'react';
import {
  View,
  ViewStyle,
  Pressable,
  Platform,
  Dimensions,
  LayoutAnimation,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useTheme } from '@/lib/theme/provider';
import { useSpacing } from '@/lib/stores/spacing-store';
import { Box } from './Box';
import { VStack, HStack } from './Stack';
import { Text } from './Text';
import { Button } from './Button';

import { ScrollContainer } from './ScrollContainer';
import { Avatar } from './Avatar';
import { Badge } from './Badge';
import { Tooltip } from './Tooltip';
import { Symbol } from './Symbols';
import { 
  SpacingScale,
  AnimationVariant,
  AnimationVariantConfig,
  getAnimationConfig,
} from '@/lib/design';
import { useAnimationVariant } from '@/hooks/useAnimationVariant';
import { useAnimationStore } from '@/lib/stores/animation-store';
import { haptic } from '@/lib/ui/haptics';
import { useBreakpoint } from '@/hooks/responsive';

const AnimatedBox = Animated.createAnimatedComponent(Box);
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type SidebarAnimationType = 'slide' | 'fade' | 'none';

// Sidebar Context
interface SidebarContextValue {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  openGroups: string[];
  toggleGroup: (groupId: string) => void;
  isMobile: boolean;
  animated: boolean;
  animationVariant: AnimationVariant;
  animationType: SidebarAnimationType;
  animationDuration?: number;
  useHaptics: boolean;
  animationConfig?: Partial<AnimationVariantConfig>;
}

const SidebarContext = createContext<SidebarContextValue | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within SidebarProvider');
  }
  return context;
};

// Types
export interface SidebarNavItem {
  id: string;
  title: string;
  icon?: string;
  href?: string;
  badge?: string | number;
  items?: SidebarNavItem[];
  isActive?: boolean;
  onPress?: () => void;
}

export interface SidebarProps {
  children: React.ReactNode;
  collapsible?: 'icon' | 'none';
  defaultCollapsed?: boolean;
  style?: ViewStyle;
}

export interface SidebarProviderProps {
  children: React.ReactNode;
  defaultOpen?: boolean;
  style?: ViewStyle;
  
  // Animation props
  animated?: boolean;
  animationVariant?: AnimationVariant;
  animationType?: SidebarAnimationType;
  animationDuration?: number;
  useHaptics?: boolean;
  animationConfig?: {
    duration?: number;
    spring?: { damping: number; stiffness: number };
  };
}

// Sidebar Provider
export const SidebarProvider: React.FC<SidebarProviderProps> = ({
  children,
  defaultOpen = true,
  style,
  animated = true,
  animationVariant = 'moderate',
  animationType = 'slide',
  animationDuration,
  useHaptics = true,
  animationConfig,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(!defaultOpen);
  const [openGroups, setOpenGroups] = useState<string[]>([]);
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });
    return () => subscription?.remove();
  }, []);

  const isMobile = dimensions.width < 768;

  const toggleGroup = (groupId: string) => {
    if (animated && Platform.OS !== 'web') {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    
    // Haptic feedback
    if (useHaptics && Platform.OS !== 'web') {
      haptic('selection');
    }
    
    setOpenGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  return (
    <SidebarContext.Provider
      value={{
        isCollapsed,
        setIsCollapsed,
        openGroups,
        toggleGroup,
        isMobile,
        animated,
        animationVariant,
        animationType,
        animationDuration,
        useHaptics,
        animationConfig: animationConfig as Partial<AnimationVariantConfig>,
      }}
    >
      <View style={[{ flex: 1, flexDirection: 'row' }, style]}>
        {children}
      </View>
    </SidebarContext.Provider>
  );
};

// Main Sidebar Component
export const Sidebar: React.FC<SidebarProps> = ({
  children,
  collapsible = 'icon',
  defaultCollapsed = false,
  style,
}) => {
  const theme = useTheme();
  const { spacing } = useSpacing();
  const { isCollapsed, isMobile, animated, animationVariant, animationType, animationConfig } = useSidebar();
  const { shouldAnimate } = useAnimationStore();
  const baseConfig = getAnimationConfig(animationVariant);
  const { config, isAnimated } = useAnimationVariant({
    variant: animationVariant,
    overrides: animationConfig ? {
      ...baseConfig,
      scale: animationConfig.scale ? { ...baseConfig.scale, ...animationConfig.scale } : baseConfig.scale,
      duration: animationConfig.duration ? { ...baseConfig.duration, normal: animationConfig.duration } : baseConfig.duration,
      spring: animationConfig.spring ? { ...baseConfig.spring, ...animationConfig.spring } : baseConfig.spring,
    } as Partial<AnimationVariantConfig> : undefined,
  });
  
  const duration = animationDuration ?? config.duration.normal;
  const sidebarWidth = isCollapsed ? 60 : 280;
  
  // Animation values
  const width = useSharedValue(defaultCollapsed ? 60 : 280);
  const contentOpacity = useSharedValue(defaultCollapsed ? 0 : 1);
  
  useEffect(() => {
    if (animated && isAnimated && shouldAnimate()) {
      if (animationType === 'slide') {
        width.value = withSpring(isCollapsed ? 60 : 280, config.spring);
      }
      if (animationType === 'fade') {
        contentOpacity.value = withTiming(isCollapsed ? 0 : 1, { duration });
      }
    }
  }, [isCollapsed, animated, isAnimated, shouldAnimate, animationType, config.spring, duration]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    width: animationType === 'slide' ? width.value : sidebarWidth,
  }));
  
  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: animationType === 'fade' ? contentOpacity.value : 1,
  }));

  if (isMobile) {
    return null; // Use drawer on mobile
  }

  return (
    <AnimatedBox
      bgTheme="card"
      borderRightWidth={1}
      borderTheme="border"
      style={[
        {
          width: sidebarWidth,
          height: '100%',
          overflow: 'hidden',
          ...(Platform.OS === 'web' && {
            transition: animated && isAnimated && shouldAnimate() 
              ? animationType === 'slide' 
                ? 'width 0.3s ease' 
                : 'none'
              : 'none',
          }),
        },
        Platform.OS !== 'web' && animated && isAnimated && shouldAnimate() && animationType === 'slide'
          ? animatedStyle
          : {},
        style,
      ]}
    >
      <Animated.View 
        style={[
          { flex: 1 },
          animated && isAnimated && shouldAnimate() && animationType === 'fade'
            ? contentAnimatedStyle
            : {}
        ]}
      >
        {children}
      </Animated.View>
    </AnimatedBox>
  );
};

// Sidebar Header
export const SidebarHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { spacing } = useSpacing();
  return (
    <Box p={4 as SpacingScale} borderBottomWidth={1} borderTheme="border">
      {children}
    </Box>
  );
};

// Sidebar Content
export const SidebarContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ScrollContainer flex={1}>
      <VStack spacing={2} p={2 as SpacingScale}>
        {children}
      </VStack>
    </ScrollContainer>
  );
};

// Sidebar Footer
export const SidebarFooter: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { spacing } = useSpacing();
  return (
    <Box p={4 as SpacingScale} borderTopWidth={1} borderTheme="border">
      {children}
    </Box>
  );
};

// Sidebar Rail (collapse button)
export const SidebarRail: React.FC = () => {
  const theme = useTheme();
  const { isCollapsed, setIsCollapsed, animated, animationVariant, useHaptics, animationConfig } = useSidebar();
  const { shouldAnimate } = useAnimationStore();
  const baseConfig = getAnimationConfig(animationVariant);
  const { config, isAnimated } = useAnimationVariant({
    variant: animationVariant,
    overrides: animationConfig ? {
      ...baseConfig,
      scale: animationConfig.scale ? { ...baseConfig.scale, ...animationConfig.scale } : baseConfig.scale,
      duration: animationConfig.duration ? { ...baseConfig.duration, normal: animationConfig.duration } : baseConfig.duration,
      spring: animationConfig.spring ? { ...baseConfig.spring, ...animationConfig.spring } : baseConfig.spring,
    } as Partial<AnimationVariantConfig> : undefined,
  });
  
  // Animation value for rotation
  const rotation = useSharedValue(isCollapsed ? 0 : 180);
  
  useEffect(() => {
    if (animated && isAnimated && shouldAnimate()) {
      rotation.value = withSpring(isCollapsed ? 0 : 180, config.spring);
    }
  }, [isCollapsed, animated, isAnimated, shouldAnimate, config.spring]);
  
  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Box
      position="absolute"
      right={-12}
      top="50%"
      style={{ transform: [{ translateY: -12 }] }}
    >
      <Pressable
        onPress={() => {
          if (animated && Platform.OS !== 'web') {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          }
          
          // Haptic feedback
          if (useHaptics && Platform.OS !== 'web') {
            haptic('impact');
          }
          
          setIsCollapsed(!isCollapsed);
        }}
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: theme.background,
          borderWidth: 1,
          borderColor: theme.border,
          alignItems: 'center',
          justifyContent: 'center',
          ...(Platform.OS === 'web' && {
            cursor: 'pointer',
          }),
        }}
      >
        <Animated.View
          style={[
            Platform.OS !== 'web' && animated && isAnimated && shouldAnimate()
              ? animatedIconStyle
              : {},
            Platform.OS === 'web' && animated && isAnimated && shouldAnimate()
              ? { transform: [{ rotate: isCollapsed ? '0deg' : '180deg' }], transition: 'transform 0.3s ease' } as any
              : {},
          ]}
        >
          <Symbol name="chevron.right" size={16} color={theme.foreground} />
        </Animated.View>
      </Pressable>
    </Box>
  );
};


// Sidebar Trigger (for mobile/header)
export const SidebarTrigger: React.FC<{ onPress?: () => void }> = ({ onPress }) => {
  const theme = useTheme();
  const { isCollapsed, setIsCollapsed, useHaptics } = useSidebar();
  
  const handlePress = () => {
    if (useHaptics && Platform.OS !== 'web') {
      haptic('impact');
    }
    
    if (onPress) {
      onPress();
    } else {
      setIsCollapsed(!isCollapsed);
    }
  };
  
  return (
    <Button variant="ghost" size="sm" onPress={handlePress}>
      <Symbol name="line.3.horizontal" size={20} color={theme.foreground} />
    </Button>
  );
};

// Sidebar Inset (main content area)
export const SidebarInset: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Box flex={1} bgTheme="background">
      {children}
    </Box>
  );
};

// Animated Chevron Component
const AnimatedChevron: React.FC<{ isOpen: boolean }> = ({ isOpen }) => {
  const theme = useTheme();
  const rotation = useSharedValue(isOpen ? 90 : 0);
  const { animated, animationVariant } = useSidebar();
  const { shouldAnimate } = useAnimationStore();
  const { config, isAnimated } = useAnimationVariant({
    variant: animationVariant,
  });
  
  useEffect(() => {
    if (animated && isAnimated && shouldAnimate()) {
      rotation.value = withSpring(isOpen ? 90 : 0, config.spring);
    } else {
      rotation.value = isOpen ? 90 : 0;
    }
  }, [isOpen, animated, isAnimated, shouldAnimate, config.spring]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));
  
  return (
    <Animated.View
      style={[
        Platform.OS !== 'web' && animated && isAnimated && shouldAnimate()
          ? animatedStyle
          : {},
        Platform.OS === 'web' && animated && isAnimated && shouldAnimate()
          ? { transform: [{ rotate: isOpen ? '90deg' : '0deg' }], transition: 'transform 0.2s ease' } as any
          : {},
      ]}
    >
      <Symbol name="chevron.right" size={16} color={theme.mutedForeground} />
    </Animated.View>
  );
};

// Nav Main Component
interface NavMainProps {
  items: SidebarNavItem[];
}

export const NavMain: React.FC<NavMainProps> = ({ items }) => {
  const router = useRouter();
  const theme = useTheme();
  const { spacing } = useSpacing();
  const { isCollapsed, openGroups, toggleGroup, useHaptics: useHapticsContext } = useSidebar();

  const handlePress = (item: SidebarNavItem) => {
    // Haptic feedback for navigation
    if (useHapticsContext && Platform.OS !== 'web') {
      haptic('impact');
    }
    
    if (item.onPress) {
      item.onPress();
    } else if (item.href) {
      router.push(item.href as any);
    } else if (item.items) {
      toggleGroup(item.id);
    }
  };

  const NavItem: React.FC<{ item: SidebarNavItem; level?: number; index?: number }> = ({ item, level = 0, index = 0 }) => {
    const isOpen = openGroups.includes(item.id);
    const hasChildren = item.items && item.items.length > 0;
    const { animated, animationVariant, animationType, useHaptics: contextUseHaptics, animationConfig } = useSidebar();
    const { shouldAnimate } = useAnimationStore();
    const { config, isAnimated } = useAnimationVariant({
      variant: animationVariant,
      overrides: animationConfig,
    });
    
    // Animation values for item
    const scale = useSharedValue(1);
    const opacity = useSharedValue(0);
    const translateX = useSharedValue(-20);
    
    // Stagger animation on mount
    useEffect(() => {
      if (animated && isAnimated && shouldAnimate() && animationType !== 'none') {
        const delay = index * 50; // 50ms stagger delay
        
        opacity.value = withDelay(
          delay,
          withTiming(1, { duration: config.duration.normal })
        );
        
        translateX.value = withDelay(
          delay,
          withSpring(0, config.spring)
        );
      } else {
        opacity.value = 1;
        translateX.value = 0;
      }
    }, [index, animated, isAnimated, shouldAnimate, animationType, config]);
    
    // Hover/press animation
    const handlePressIn = () => {
      if (animated && isAnimated && shouldAnimate()) {
        scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
      }
    };
    
    const handlePressOut = () => {
      if (animated && isAnimated && shouldAnimate()) {
        scale.value = withSpring(1, config.spring);
      }
    };
    
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [
        { scale: scale.value },
        { translateX: translateX.value }
      ] as const,
      opacity: opacity.value,
    }));

    const itemContent = (
      <AnimatedPressable
        onPress={() => handlePress(item)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          ({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: spacing[3],
            paddingVertical: spacing[2],
            marginLeft: level * spacing[4],
            borderRadius: spacing[2],
            backgroundColor: item.isActive
              ? theme.accent
              : pressed
              ? theme.muted
              : 'transparent',
            ...(Platform.OS === 'web' && {
              cursor: 'pointer',
              transition: 'background-color 0.2s ease',
            }),
          }),
          animated && isAnimated && shouldAnimate() && animationType !== 'none'
            ? animatedStyle
            : {},
        ]}
      >
        {item.icon && (
          <Symbol
            name={item.icon as any}
            size={20}
            color={item.isActive ? theme.accentForeground : theme.foreground}
            style={{ marginRight: isCollapsed ? 0 : spacing[3] }}
          />
        )}
        {!isCollapsed && (
          <>
            <Box flex={1}>
              <Text
                size="sm"
                weight={item.isActive ? 'medium' : 'normal'}
                style={{
                  color: item.isActive ? theme.accentForeground : theme.foreground,
                }}
              >
                {item.title}
              </Text>
            </Box>
            {item.badge && (
              <Badge variant="secondary" size="sm">
                {item.badge}
              </Badge>
            )}
            {hasChildren && (
              <AnimatedChevron isOpen={isOpen} />
            )}
          </>
        )}
      </AnimatedPressable>
    );

    return (
      <View key={item.id}>
        {isCollapsed && item.icon ? (
          <Tooltip content={item.title}>
            {itemContent}
          </Tooltip>
        ) : (
          itemContent
        )}
        {!isCollapsed && hasChildren && isOpen && (
          <Animated.View
            entering={Platform.OS !== 'web' ? FadeIn.duration(200) : undefined}
            exiting={Platform.OS !== 'web' ? FadeOut.duration(200) : undefined}
          >
            <VStack spacing={1} mt={1 as SpacingScale}>
              {item.items!.map((subItem, subIndex) => <NavItem key={subItem.id} item={subItem} level={level + 1} index={subIndex} />)}
            </VStack>
          </Animated.View>
        )}
      </View>
    );
  };

  return (
    <VStack spacing={1}>
      {items.map((item, index) => <NavItem key={item.id} item={item} level={0} index={index} />)}
    </VStack>
  );
};

// Nav User Component
interface NavUserProps {
  user: {
    name: string;
    email: string;
    avatar?: string;
  };
}

export const NavUser: React.FC<NavUserProps> = ({ user }) => {
  const { spacing } = useSpacing();
  const { isCollapsed } = useSidebar();
  const router = useRouter();

  if (isCollapsed) {
    return (
      <Tooltip content={user.name}>
        <Pressable
          onPress={() => router.push('/(home)/settings' as any)}
          style={{
            padding: spacing[2],
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Avatar name={user.name} size="sm" source={user.avatar ? { uri: user.avatar } : undefined} />
        </Pressable>
      </Tooltip>
    );
  }

  return (
    <Button
      variant="ghost"
      fullWidth
      onPress={() => router.push('/(home)/settings' as any)}
    >
      <HStack spacing={3} alignItems="center" flex={1}>
        <Avatar name={user.name} size="sm" source={user.avatar ? { uri: user.avatar } : undefined} />
        <VStack spacing={0} flex={1}>
          <Text size="sm" weight="medium" numberOfLines={1}>
            {user.name}
          </Text>
          <Text size="xs" colorTheme="mutedForeground" numberOfLines={1}>
            {user.email}
          </Text>
        </VStack>
      </HStack>
    </Button>
  );
};

// Team Switcher Component
interface Team {
  name: string;
  logo?: React.ReactNode;
  plan?: string;
}

interface TeamSwitcherProps {
  teams: Team[];
  activeTeam?: string;
  onTeamChange?: (team: string) => void;
}

export const TeamSwitcher: React.FC<TeamSwitcherProps> = ({
  teams,
  activeTeam,
}) => {
  const theme = useTheme();
  const { isCollapsed } = useSidebar();
  const selectedTeam = activeTeam || teams[0]?.name;

  const currentTeam = teams.find(t => t.name === selectedTeam) || teams[0];

  if (isCollapsed) {
    return (
      <Tooltip content={currentTeam.name}>
        <Box p={2 as SpacingScale} alignItems="center">
          <Box
            style={{ width: 32, height: 32 }}
            rounded="md"
            bgTheme="primary"
            alignItems="center"
            justifyContent="center"
          >
            <Text size="sm" weight="bold" style={{ color: theme.primaryForeground }}>
              {currentTeam.name.charAt(0)}
            </Text>
          </Box>
        </Box>
      </Tooltip>
    );
  }

  return (
    <VStack spacing={2}>
      <HStack spacing={3} alignItems="center">
        <Box
          style={{ width: 32, height: 32 }}
          rounded="md"
          bgTheme="primary"
          alignItems="center"
          justifyContent="center"
        >
          <Text size="sm" weight="bold" style={{ color: theme.primaryForeground }}>
            {currentTeam.name.charAt(0)}
          </Text>
        </Box>
        <VStack spacing={0} flex={1}>
          <Text size="sm" weight="medium">
            {currentTeam.name}
          </Text>
          {currentTeam.plan && (
            <Text size="xs" colorTheme="mutedForeground">
              {currentTeam.plan}
            </Text>
          )}
        </VStack>
      </HStack>
    </VStack>
  );
};