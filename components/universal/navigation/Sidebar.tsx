import React, { useState, useEffect } from 'react';
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
import { useSidebarStore } from '@/lib/stores/sidebar-store';
import { Box } from '@/components/universal/layout/Box';
import { VStack, HStack } from '@/components/universal/layout/Stack';
import { Text } from '@/components/universal/typography/Text';
import { Button } from '@/components/universal/interaction/Button';
import { ScrollContainer } from '@/components/universal/layout/ScrollContainer';
import { Avatar } from '@/components/universal/display/Avatar';
import { Badge } from '@/components/universal/display/Badge';
import { Tooltip } from '@/components/universal/overlay/Tooltip';
import { Symbol } from '@/components/universal/display/Symbols';
import { SpacingScale } from '@/lib/design';
import { useAnimationStore } from '@/lib/stores/animation-store';
import { haptic } from '@/lib/ui/haptics';
import { cn } from '@/lib/core/utils';
import { useTheme } from '@/lib/theme/provider';

const AnimatedBox = Animated.createAnimatedComponent(Box);
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type SidebarAnimationType = 'slide' | 'fade' | 'none';

// Helper hook to use sidebar state
export const useSidebar = () => {
  const {
    isOpen,
    expandedGroups,
    setOpen,
    toggleGroup,
  } = useSidebarStore();
  
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });
    return () => subscription?.remove();
  }, []);
  
  const isMobile = dimensions.width < 768;
  const isCollapsed = !isOpen;
  
  return {
    isCollapsed,
    setIsCollapsed: (collapsed: boolean) => setOpen(!collapsed),
    openGroups: expandedGroups,
    toggleGroup,
    isMobile,
    // Animation settings - can be moved to a separate store if needed
    animated: true,
    animationType: 'slide' as SidebarAnimationType,
    animationDuration: 300,
    useHaptics: true,
  };
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
  className?: string;
  style?: ViewStyle;
  
  // Animation props
  animated?: boolean;
  animationType?: SidebarAnimationType;
  animationDuration?: number;
  useHaptics?: boolean;
}

// Sidebar Provider - now just a wrapper for compatibility
export const SidebarProvider: React.FC<SidebarProviderProps> = ({
  children,
  defaultOpen = true,
  className,
  style,
}) => {
  const { setOpen } = useSidebarStore();
  
  // Initialize the sidebar state on mount
  useEffect(() => {
    setOpen(defaultOpen);
  }, [defaultOpen, setOpen]);

  return (
    <View className={cn("flex-1 flex-row", className) as string} style={style}>
      {children}
    </View>
  );
};

// Main Sidebar Component
export const Sidebar: React.FC<SidebarProps> = ({
  children,
  collapsible = 'icon',
  defaultCollapsed = false,
  style,
}) => {
  const { isCollapsed, isMobile, animated, animationType, animationDuration } = useSidebar();
  const { shouldAnimate } = useAnimationStore();
  const sidebarWidth = isCollapsed ? 60 : 280;
  
  // Animation values
  const width = useSharedValue(defaultCollapsed ? 60 : 280);
  const contentOpacity = useSharedValue(defaultCollapsed ? 0 : 1);
  
  // Spring config
  const springConfig = React.useMemo(() => ({
    damping: 20,
    stiffness: 300,
  }), []);

  useEffect(() => {
    if (animated && shouldAnimate()) {
      if (animationType === 'slide') {
        width.value = withSpring(isCollapsed ? 60 : 280, springConfig);
      }
      if (animationType === 'fade') {
        contentOpacity.value = withTiming(isCollapsed ? 0 : 1, { duration: animationDuration });
      }
    }
  }, [isCollapsed, animated, shouldAnimate, animationType, animationDuration, width, contentOpacity, springConfig]);
  
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
      className="bg-card border-r border-border h-full overflow-hidden"
      style={[
        {
          width: sidebarWidth,
          ...(Platform.OS === 'web' && {
            transition: animated && shouldAnimate() 
              ? animationType === 'slide' 
                ? 'width 0.3s ease' 
                : 'none'
              : 'none',
          }),
        },
        Platform.OS !== 'web' && animated && shouldAnimate() && animationType === 'slide'
          ? animatedStyle
          : {},
        style,
      ]}
    >
      <Animated.View 
        style={[
          { flex: 1 },
          animated && shouldAnimate() && animationType === 'fade'
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
  return (
    <Box p={4 as SpacingScale} className="border-b border-border">
      {children}
    </Box>
  );
};

// Sidebar Content
export const SidebarContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ScrollContainer flex={1}>
      <VStack gap={2} p={2 as SpacingScale}>
        {children}
      </VStack>
    </ScrollContainer>
  );
};

// Sidebar Footer
export const SidebarFooter: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Box p={4 as SpacingScale} className="border-t border-border">
      {children}
    </Box>
  );
};

// Sidebar Rail (collapse button)
export const SidebarRail: React.FC = () => {
  const { isCollapsed, setIsCollapsed, animated, useHaptics } = useSidebar();
  const { shouldAnimate } = useAnimationStore();
  
  // Animation value for rotation
  const rotation = useSharedValue(isCollapsed ? 0 : 180);
  
  // Spring config
  const springConfig = React.useMemo(() => ({
    damping: 20,
    stiffness: 300,
  }), []);
  
  useEffect(() => {
    if (animated && shouldAnimate()) {
      rotation.value = withSpring(isCollapsed ? 0 : 180, springConfig);
    }
  }, [isCollapsed, animated, shouldAnimate, rotation, springConfig]);
  
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
            haptic('medium');
          }
          
          setIsCollapsed(!isCollapsed);
        }}
        className="w-6 h-6 rounded-full bg-background border border-border items-center justify-center"
        style={Platform.OS === 'web' ? { cursor: 'pointer' } : {}}
      >
        <Animated.View
          style={[
            Platform.OS !== 'web' && animated && shouldAnimate()
              ? animatedIconStyle
              : {},
            Platform.OS === 'web' && animated && shouldAnimate()
              ? { transform: [{ rotate: isCollapsed ? '0deg' : '180deg' }], transition: 'transform 0.3s ease' } as any
              : {},
          ]}
        >
          <Symbol name="chevron.right" size={16} className="text-foreground" />
        </Animated.View>
      </Pressable>
    </Box>
  );
};


// Sidebar Trigger (for mobile/header)
export const SidebarTrigger: React.FC<{ onPress?: () => void }> = ({ onPress }) => {
  const { isCollapsed, setIsCollapsed, useHaptics } = useSidebar();
  
  const handlePress = () => {
    if (useHaptics && Platform.OS !== 'web') {
      haptic('medium');
    }
    
    if (onPress) {
      onPress();
    } else {
      setIsCollapsed(!isCollapsed);
    }
  };
  
  return (
    <Button variant="ghost" size="sm" onPress={handlePress}>
      <Symbol name="line.3.horizontal" size={20} className="text-foreground" />
    </Button>
  );
};

// Sidebar Inset (main content area)
export const SidebarInset: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Box flex={1} className="bg-background">
      {children}
    </Box>
  );
};


// Animated Chevron Component
const AnimatedChevron: React.FC<{ isOpen: boolean }> = ({ isOpen }) => {
  const rotation = useSharedValue(isOpen ? 90 : 0);
  const { animated } = useSidebar();
  const { shouldAnimate } = useAnimationStore();
  
  // Spring config
  const springConfig = React.useMemo(() => ({
    damping: 20,
    stiffness: 300,
  }), []);

  useEffect(() => {
    if (animated && shouldAnimate()) {
      rotation.value = withSpring(isOpen ? 90 : 0, springConfig);
    } else {
      rotation.value = isOpen ? 90 : 0;
    }
  }, [isOpen, animated, shouldAnimate, rotation, springConfig]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));
  
  return (
    <Animated.View
      style={[
        Platform.OS !== 'web' && animated && shouldAnimate()
          ? animatedStyle
          : {},
        Platform.OS === 'web' && animated && shouldAnimate()
          ? { transform: [{ rotate: isOpen ? '90deg' : '0deg' }], transition: 'transform 0.2s ease' } as any
          : {},
      ]}
    >
      <Symbol name="chevron.right" size={16} className="text-muted-foreground" />
    </Animated.View>
  );
};

// Nav Main Component
interface NavMainProps {
  items: SidebarNavItem[];
}

export const NavMain: React.FC<NavMainProps> = ({ items }) => {
  const router = useRouter();
  const { isCollapsed, openGroups, toggleGroup, useHaptics: useHapticsContext } = useSidebar();

  const handlePress = (item: SidebarNavItem) => {
    // Haptic feedback for navigation
    if (useHapticsContext && Platform.OS !== 'web') {
      haptic('medium');
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
    const { animated, animationType, animationDuration } = useSidebar();
    const { shouldAnimate } = useAnimationStore();
    
    // Animation values for item
    const scale = useSharedValue(1);
    const opacity = useSharedValue(0);
    const translateX = useSharedValue(-20);
    
    // Spring config
    const springConfig = React.useMemo(() => ({
      damping: 20,
      stiffness: 300,
    }), []);

    // Stagger animation on mount
    useEffect(() => {
      if (animated && shouldAnimate() && animationType !== 'none') {
        const delay = index * 50; // 50ms stagger delay
        
        opacity.value = withDelay(
          delay,
          withTiming(1, { duration: animationDuration })
        );
        
        translateX.value = withDelay(
          delay,
          withSpring(0, springConfig)
        );
      } else {
        opacity.value = 1;
        translateX.value = 0;
      }
    }, [index, animated, shouldAnimate, animationType, animationDuration, opacity, translateX, springConfig]);
    
    // Hover/press animation
    const handlePressIn = () => {
      if (animated && shouldAnimate()) {
        scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
      }
    };
    
    const handlePressOut = () => {
      if (animated && shouldAnimate()) {
        scale.value = withSpring(1, springConfig);
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
        className={cn(
          "flex-row items-center px-3 py-2 rounded-lg transition-colors",
          item.isActive && "bg-accent",
          !item.isActive && "hover:bg-accent/10"
        )}
        style={[
          {
            marginLeft: level * 16,
            ...(Platform.OS === 'web' && {
              cursor: 'pointer',
            }),
          },
          animated && shouldAnimate() && animationType !== 'none'
            ? animatedStyle
            : {},
        ]}
      >
        {item.icon && (
          <Symbol
            name={item.icon as any}
            size={20}
            className={item.isActive ? 'text-accent-foreground' : 'text-foreground'}
            style={{ marginRight: isCollapsed ? 0 : 12 }}
          />
        )}
        {!isCollapsed && (
          <>
            <Box flex={1}>
              <Text
                size="sm"
                weight={item.isActive ? 'medium' : 'normal'}
                className={item.isActive ? 'text-accent-foreground' : 'text-foreground'}
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
  const { isCollapsed } = useSidebar();
  const router = useRouter();

  if (isCollapsed) {
    return (
      <Tooltip content={user.name}>
        <Pressable
          onPress={() => router.push('/(home)/settings' as any)}
          style={{
            padding: 8,
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
      <HStack gap={3} align="center" className="flex-1">
        <Avatar name={user.name} size="sm" source={user.avatar ? { uri: user.avatar } : undefined} />
        <VStack gap={0} className="flex-1">
          <Text size="sm" weight="medium" numberOfLines={1}>
            {user.name}
          </Text>
          <Text size="xs" className="text-muted-foreground" numberOfLines={1}>
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
  const { isCollapsed } = useSidebar();
  const selectedTeam = activeTeam || teams[0]?.name;

  const currentTeam = teams.find(t => t.name === selectedTeam) || teams[0];

  if (isCollapsed) {
    return (
      <Tooltip content={currentTeam.name}>
        <Box p={2 as SpacingScale} alignItems="center">
          <Box
            className="w-8 h-8 rounded-md bg-primary items-center justify-center"
          >
            <Text size="sm" weight="bold" className="text-primary-foreground">
              {currentTeam.name.charAt(0)}
            </Text>
          </Box>
        </Box>
      </Tooltip>
    );
  }

  return (
    <VStack gap={2}>
      <HStack gap={3} align="center">
        <Box
          className="w-8 h-8 rounded-md bg-primary items-center justify-center"
        >
          <Text size="sm" weight="bold" className="text-primary-foreground">
            {currentTeam.name.charAt(0)}
          </Text>
        </Box>
        <VStack gap={0} className="flex-1">
          <Text size="sm" weight="medium">
            {currentTeam.name}
          </Text>
          {currentTeam.plan && (
            <Text size="xs" className="text-muted-foreground">
              {currentTeam.plan}
            </Text>
          )}
        </VStack>
      </HStack>
    </VStack>
  );
};

// Sidebar Menu Components
export const SidebarMenu: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <VStack gap={1}>
      {children}
    </VStack>
  );
};

export interface SidebarMenuButtonProps {
  children: React.ReactNode;
  tooltip?: string;
  size?: 'sm' | 'md' | 'lg';
  onPress?: () => void;
  isActive?: boolean;
  disabled?: boolean;
}

export const SidebarMenuButton: React.FC<SidebarMenuButtonProps> = ({
  children,
  tooltip,
  size = 'md',
  onPress,
  isActive = false,
  disabled = false,
}) => {
  const { isCollapsed, useHaptics } = useSidebar();
  const [isHovered, setIsHovered] = useState(false);
  const theme = useTheme();

  const handlePress = () => {
    if (!disabled && onPress) {
      if (useHaptics && Platform.OS !== 'web') {
        haptic('selection');
      }
      onPress();
    }
  };

  const buttonContent = (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      onPointerEnter={Platform.OS === 'web' && !disabled ? () => setIsHovered(true) : undefined}
      onPointerLeave={Platform.OS === 'web' && !disabled ? () => setIsHovered(false) : undefined}
      className={cn(
        "flex-row items-center px-3 py-2 rounded-lg transition-colors",
        isActive && "bg-accent",
        !isActive && "hover:bg-accent/10",
        disabled && "opacity-50"
      )}
      style={[
        Platform.OS === 'web' ? {
          cursor: disabled ? 'not-allowed' : 'pointer',
        } as any : {},
        (isHovered || isActive) && !disabled && {
          backgroundColor: theme.accent + '10', // 10% opacity
        },
      ]}
    >
      {children}
    </Pressable>
  );

  if (isCollapsed && tooltip) {
    return (
      <Tooltip content={tooltip}>
        {buttonContent}
      </Tooltip>
    );
  }

  return buttonContent;
};

export const SidebarMenuItem: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Box>
      {children}
    </Box>
  );
};

// Sub menu components
export const SidebarMenuSub: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <VStack gap={1} className="ml-4">
      {children}
    </VStack>
  );
};

export const SidebarMenuSubItem: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Box>
      {children}
    </Box>
  );
};

export const SidebarGroup: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <VStack gap={2} className="p-2">
      {children}
    </VStack>
  );
};

export const SidebarGroupLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isCollapsed } = useSidebar();
  
  if (isCollapsed) {
    return null;
  }
  
  return (
    <Text size="xs" weight="semibold" className="text-muted-foreground px-2 py-1">
      {children}
    </Text>
  );
};


export interface SidebarMenuSubButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  asChild?: boolean;
  isActive?: boolean;
  disabled?: boolean;
}

export const SidebarMenuSubButton: React.FC<SidebarMenuSubButtonProps> = ({
  children,
  onPress,
  asChild = false,
  isActive = false,
  disabled = false,
}) => {
  const { useHaptics } = useSidebar();
  const [isHovered, setIsHovered] = useState(false);
  const theme = useTheme();

  const handlePress = () => {
    if (!disabled && onPress) {
      if (useHaptics && Platform.OS !== 'web') {
        haptic('light');
      }
      onPress();
    }
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onPress: handlePress,
      disabled,
      style: [
        (children as any).props.style,
        {
          paddingVertical: 6,
          paddingHorizontal: 12,
          borderRadius: 6 as any,
          backgroundColor: isActive ? theme.accent + '20' : 'transparent', // 20% opacity
          opacity: disabled ? 0.5 : 1,
        },
      ],
    } as any);
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      onPointerEnter={Platform.OS === 'web' && !disabled ? () => setIsHovered(true) : undefined}
      onPointerLeave={Platform.OS === 'web' && !disabled ? () => setIsHovered(false) : undefined}
      className={cn(
        "flex-row items-center px-3 py-1.5 rounded-md transition-colors",
        isActive && "bg-accent/50",
        !isActive && "hover:bg-accent/20",
        disabled && "opacity-50"
      )}
      style={[
        Platform.OS === 'web' ? {
          cursor: disabled ? 'not-allowed' : 'pointer',
        } as any : {},
        (isHovered || isActive) && !disabled && {
          backgroundColor: theme.accent + '10', // 10% opacity
        },
      ]}
    >
      <Text size="sm" className={isActive ? 'text-accent-foreground' : 'text-muted-foreground'}>
        {children}
      </Text>
    </Pressable>
  );
};