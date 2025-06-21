import React, { useState, useEffect } from 'react';
import {
  View,
  Pressable,
  Platform,
  Dimensions,
  ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  FadeIn,
  FadeOut,
  SlideInLeft,
} from 'react-native-reanimated';
import { useRouter, usePathname } from 'expo-router';
import { useSpacing } from '@/lib/stores/spacing-store';
import { Box } from '@/components/universal/layout/Box';
import { HStack, VStack } from '@/components/universal/layout/Stack';
import { Text } from '@/components/universal/typography/Text';
import { Button } from '@/components/universal/interaction/Button';
import { Avatar } from '@/components/universal/display/Avatar';
import { Badge } from '@/components/universal/display/Badge';
import { Symbol } from '@/components/universal/display/Symbols';
import { SpacingScale } from '@/lib/design';
import { useAnimationStore } from '@/lib/stores/animation-store';
import { haptic } from '@/lib/ui/haptics';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/universal/overlay/DropdownMenu';
import { useBreakpoint } from '@/hooks/responsive';
import { cn } from '@/lib/core/utils';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedView = Animated.View;
const AnimatedBox = Animated.createAnimatedComponent(Box);
// AnimatedIcon is handled internally by Symbol component

export type NavbarAnimationType = 'slide' | 'fade' | 'scale' | 'none';

// Types
export interface NavItem {
  id: string;
  title: string;
  href: string;
  icon?: string;
  badge?: string | number;
  requiresRole?: string[];
  children?: NavItem[];
}

export interface NavbarProps {
  variant?: 'tabs' | 'sidebar' | 'header';
  items: NavItem[];
  user?: {
    name?: string;
    email?: string;
    image?: string;
    role?: string;
  };
  logo?: React.ReactNode;
  onItemPress?: (item: NavItem) => void;
  className?: string;
  
  // Animation props
  animated?: boolean;
  animationType?: NavbarAnimationType;
  animationDuration?: number;
  useHaptics?: boolean;
}

// Device info helper functions  
const getDeviceInfo = (breakpoint: string) => {
  const screenWidth = Dimensions.get('window').width;
  const isDesktop = Platform.OS === 'web' && ['lg', 'xl', '2xl'].includes(breakpoint);
  const isTablet = Platform.OS === 'web' && ['md', 'lg', 'xl', '2xl'].includes(breakpoint) && screenWidth < 1024;
  const isMobile = !isDesktop && !isTablet;
  return { isDesktop, isTablet, isMobile };
};

// WebTabBar variant for web
const WebTabBarVariant: React.FC<NavbarProps> = ({ 
  items, 
  user, 
  onItemPress,
  className,
  animated = true,
  animationType = 'slide',
  animationDuration = 300,
  useHaptics = true,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  // Removed unused spacing destructuring
  const { shouldAnimate } = useAnimationStore();

  const handleNavigation = (item: NavItem) => {
    // Haptic feedback
    if (useHaptics && Platform.OS !== 'web') {
      haptic('selection');
    }
    
    if (onItemPress) {
      onItemPress(item);
    } else {
      router.push(item.href as any);
    }
  };

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  // Animated Nav Item Component
  const AnimatedNavItem = ({ item, index }: { item: NavItem; index: number }) => {
    const active = isActive(item.href);
    const scale = useSharedValue(1);
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(-10);
    
    // Spring config
    const springConfig = {
      damping: 20,
      stiffness: 300,
    };

    // Stagger animation on mount
    useEffect(() => {
      if (animated && shouldAnimate() && animationType !== 'none') {
        const delay = index * 50; // 50ms stagger
        
        if (animationType === 'fade') {
          opacity.value = withDelay(delay, withTiming(1, { duration: animationDuration }));
        } else if (animationType === 'slide') {
          opacity.value = withDelay(delay, withTiming(1, { duration: animationDuration }));
          translateY.value = withDelay(delay, withSpring(0, springConfig));
        } else {
          opacity.value = 1;
        }
      } else {
        opacity.value = 1;
        translateY.value = 0;
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, animationType, animationDuration]);
    
    const handlePressIn = () => {
      if (animated && shouldAnimate() && animationType === 'scale') {
        scale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
      }
    };
    
    const handlePressOut = () => {
      if (animated && shouldAnimate() && animationType === 'scale') {
        scale.value = withSpring(1, springConfig);
      }
    };
    
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [
        { scale: scale.value } as any,
        { translateY: translateY.value } as any,
      ],
      opacity: opacity.value,
    }));
    
    return (
      <AnimatedPressable
        key={item.id}
        onPress={() => handleNavigation(item)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        className={cn(
          "px-3 py-2 rounded-lg transition-colors",
          active && "bg-accent",
          !active && "hover:bg-accent/10"
        )}
        style={[
          animated && shouldAnimate() && animationType !== 'none' ? animatedStyle : {},
          Platform.OS === 'web' && animated && shouldAnimate() && {
            transition: 'all 0.2s ease',
          } as any,
        ]}
      >
        <HStack spacing={2} alignItems="center">
          {item.icon && (
            <Symbol
              name={item.icon as any}
              size={20}
              className={active ? 'text-accent-foreground' : 'text-muted-foreground'}
            />
          )}
          <Text
            size="sm"
            weight={active ? 'medium' : 'normal'}
            className={active ? 'text-accent-foreground' : 'text-foreground'}
          >
            {item.title}
          </Text>
          {item.badge && (
            <Badge size="sm" variant="secondary">
              {item.badge}
            </Badge>
          )}
        </HStack>
      </AnimatedPressable>
    );
  };

  return (
    <AnimatedView
      entering={Platform.OS !== 'web' && animated && shouldAnimate() && animationType === 'slide' 
        ? SlideInLeft.duration(animationDuration) 
        : undefined}
      className={cn(
        "h-16 bg-background border-b border-border shadow-sm",
        className
      )}
    >
      <HStack flex={1} px={4 as SpacingScale} alignItems="center" justifyContent="space-between">
        {/* Left side - Navigation */}
        <HStack spacing={2} alignItems="center" flex={1}>
          {items.map((item, index) => (
            <AnimatedNavItem key={item.id} item={item} index={index} />
          ))}
        </HStack>

        {/* Right side - User menu */}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <HStack spacing={2} alignItems="center">
                  <Avatar 
                    source={user.image ? { uri: user.image } : undefined}
                    name={user.name || user.email}
                    size="sm"
                  />
                  <Text size="sm" weight="medium">
                    {user.name || 'User'}
                  </Text>
                </HStack>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <Box p={2 as SpacingScale}>
                <Text weight="medium">{user.name}</Text>
                <Text size="xs" className="text-muted-foreground">{user.email}</Text>
              </Box>
              <DropdownMenuSeparator />
              <DropdownMenuItem onPress={() => router.push('/(tabs)/settings' as any)}>
                <HStack spacing={2} alignItems="center">
                  <Symbol name="gearshape" size={16} />
                  <Text>Settings</Text>
                </HStack>
              </DropdownMenuItem>
              <DropdownMenuItem onPress={() => router.push('/(tabs)/home' as any)}>
                <HStack spacing={2} alignItems="center">
                  <Symbol name="house" size={16} />
                  <Text>Home</Text>
                </HStack>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </HStack>
    </AnimatedView>
  );
};

// Sidebar variant (sidebar-07 pattern)
const SidebarVariant: React.FC<NavbarProps & { isOpen?: boolean; onToggle?: () => void }> = ({ 
  items, 
  user, 
  logo,
  className,
  isOpen = true,
  onToggle,
  onItemPress,
  animated = true,
  animationType = 'slide',
  animationDuration = 300,
  useHaptics = true,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { spacing } = useSpacing();
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const { shouldAnimate } = useAnimationStore();
  
  // Animation values
  const sidebarWidth = useSharedValue(isOpen ? 240 : 60);
  const contentOpacity = useSharedValue(isOpen ? 1 : 0);

  // Spring config
  const springConfig = {
    damping: 20,
    stiffness: 300,
  };

  // Update animations when sidebar state changes
  useEffect(() => {
    if (animated && shouldAnimate()) {
      sidebarWidth.value = withSpring(isOpen ? 240 : 60, springConfig);
      contentOpacity.value = withTiming(isOpen ? 1 : 0, { duration: animationDuration });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, animationDuration]);
  
  const contentAnimatedStyle = useAnimatedStyle(() => ({ 
    opacity: contentOpacity.value 
  }));
  
  const handleNavigation = (item: NavItem) => {
    // Haptic feedback
    if (useHaptics && Platform.OS !== 'web') {
      haptic('selection');
    }
    
    if (item.children) {
      setExpandedGroups(prev => 
        prev.includes(item.id) 
          ? prev.filter(id => id !== item.id)
          : [...prev, item.id]
      );
    } else if (onItemPress) {
      onItemPress(item);
    } else {
      router.push(item.href as any);
    }
  };

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  const NavItem = ({ item, level = 0, index = 0 }: { item: NavItem; level?: number; index?: number }) => {
    const active = isActive(item.href);
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedGroups.includes(item.id);
    
    // Animation values
    const scale = useSharedValue(1);
    const opacity = useSharedValue(0);
    const translateX = useSharedValue(-20);
    const chevronRotation = useSharedValue(isExpanded ? 90 : 0);
    
    // Animation config
    const animationConfig = {
      duration: {
        normal: 300,
        fast: 150,
      },
      spring: {
        damping: 20,
        stiffness: 300,
      },
    };
    
    // Stagger animation on mount
    useEffect(() => {
      if (animated && shouldAnimate() && animationType !== 'none') {
        const delay = index * 50;
        
        opacity.value = withDelay(delay, withTiming(1, { duration: animationConfig.duration.normal }));
        translateX.value = withDelay(delay, withSpring(0, animationConfig.spring));
      } else {
        opacity.value = 1;
        translateX.value = 0;
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [index, animationType]);
    
    // Update chevron rotation
    useEffect(() => {
      if (animated && shouldAnimate()) {
        chevronRotation.value = withSpring(isExpanded ? 90 : 0, animationConfig.spring);
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isExpanded]);
    
    const handlePressIn = () => {
      if (animated && shouldAnimate() && animationType === 'scale') {
        scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
      }
    };
    
    const handlePressOut = () => {
      if (animated && shouldAnimate() && animationType === 'scale') {
        scale.value = withSpring(1, animationConfig.spring);
      }
    };
    
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [
        { scale: scale.value } as any,
        { translateX: translateX.value } as any
      ],
      opacity: opacity.value,
    }));
    
    const chevronStyle = useAnimatedStyle(() => ({
      transform: [{ rotate: `${chevronRotation.value}deg` }],
    }));
    
    const contentAnimatedStyle = useAnimatedStyle(() => ({ 
      opacity: contentOpacity.value 
    }));

    return (
      <View key={item.id}>
        <AnimatedPressable
          onPress={() => handleNavigation(item)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          className={cn(
            "rounded-lg my-0.5 transition-colors",
            active && "bg-accent",
            !active && "hover:bg-accent/10"
          )}
          style={[
            {
              paddingHorizontal: spacing[3] + (level * spacing[4]),
              paddingVertical: spacing[2],
            },
            animated && shouldAnimate() && animationType !== 'none' ? animatedStyle : {},
            Platform.OS === 'web' && animated && shouldAnimate() && {
              transition: 'all 0.2s ease',
            } as any,
          ]}
        >
          <HStack alignItems="center" justifyContent="space-between">
            <HStack spacing={3} alignItems="center" flex={1}>
              {item.icon && (
                <Symbol
                  name={item.icon as any}
                  size={20}
                  className={active ? 'text-accent-foreground' : 'text-muted-foreground'}
                />
              )}
              {isOpen && (
                <Animated.View style={contentAnimatedStyle}>
                  <Text
                    size="sm"
                    weight={active ? 'medium' : 'normal'}
                    className={active ? 'text-accent-foreground' : 'text-foreground'}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                </Animated.View>
              )}
              {item.badge && isOpen && (
                <Animated.View style={contentAnimatedStyle}>
                  <Badge size="sm" variant="secondary">
                    {item.badge}
                  </Badge>
                </Animated.View>
              )}
            </HStack>
            {hasChildren && isOpen && (
              <Symbol
                name="chevron.forward"
                size={16}
                className="text-muted-foreground"
                style={Platform.OS !== 'web' && animated && shouldAnimate() ? chevronStyle : undefined}
              />
            )}
          </HStack>
        </AnimatedPressable>
        
        {hasChildren && isExpanded && isOpen && (
          <AnimatedView
            entering={Platform.OS !== 'web' && animated && shouldAnimate() 
              ? FadeIn.duration(animationDuration * 0.7) 
              : undefined}
            exiting={Platform.OS !== 'web' && animated && shouldAnimate() 
              ? FadeOut.duration(animationDuration * 0.7) 
              : undefined}
          >
            <VStack>
              {item.children!.map((child, childIndex) => (
                <NavItem key={child.id} item={child} level={level + 1} index={childIndex} />
              ))}
            </VStack>
          </AnimatedView>
        )}
      </View>
    );
  };

  const animatedSidebarStyle = useAnimatedStyle(() => ({
    width: animated && shouldAnimate() ? sidebarWidth.value : (isOpen ? 240 : 60),
  }));

  return (
    <AnimatedBox
      className={cn(
        "bg-card border-r border-border h-full",
        className
      )}
      style={[
        {
          width: isOpen ? 240 : 60,
        },
        Platform.OS !== 'web' && animated && shouldAnimate() ? animatedSidebarStyle : {},
        Platform.OS === 'web' && animated && shouldAnimate() && {
          transition: 'width 0.3s ease',
        } as any,
      ]}
    >
      {/* Header */}
      <Box p={3 as SpacingScale} className="border-b border-border">
        <HStack justifyContent="space-between" alignItems="center">
          {isOpen ? (
            <Animated.View style={contentAnimatedStyle}>
              {logo || <Text weight="semibold" size="lg">App Name</Text>}
            </Animated.View>
          ) : (
            <Symbol name="app" size={24} className="text-primary" />
          )}
          {onToggle && (
            <Button
              variant="ghost"
              size="sm"
              onPress={() => {
                if (useHaptics && Platform.OS !== 'web') {
                  haptic('medium');
                }
                onToggle();
              }}
            >
              <Symbol 
                name={isOpen ? 'chevron.left' : 'chevron.right'} 
                size={20} 
                className="text-foreground"
              />
            </Button>
          )}
        </HStack>
      </Box>

      {/* Navigation Items */}
      <ScrollView style={{ flex: 1 }}>
        <VStack p={2 as SpacingScale}>
          {items.map((item, index) => (
            <NavItem key={item.id} item={item} level={0} index={index} />
          ))}
        </VStack>
      </ScrollView>

      {/* Footer with user info */}
      {user && (
        <Box p={3 as SpacingScale} className="border-t border-border">
          <HStack spacing={2} alignItems="center">
            <Avatar 
              source={user.image ? { uri: user.image } : undefined}
              name={user.name || user.email}
              size="sm"
            />
            {isOpen && (
              <Animated.View 
                style={[
                  { flex: 1 },
                  contentAnimatedStyle
                ]}
              >
                <VStack flex={1} spacing={0}>
                  <Text size="sm" weight="medium" numberOfLines={1}>
                    {user.name || 'User'}
                  </Text>
                  <Text size="xs" className="text-muted-foreground" numberOfLines={1}>
                    {user.email}
                  </Text>
                </VStack>
              </Animated.View>
            )}
          </HStack>
        </Box>
      )}
    </AnimatedBox>
  );
};

// Main Navbar component
export const Navbar: React.FC<NavbarProps> = (props) => {
  const { variant = 'tabs', ...rest } = props;
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const breakpoint = useBreakpoint();
  const { isMobile } = getDeviceInfo(breakpoint);

  // Use tabs for mobile, specified variant for web/tablet
  const actualVariant = Platform.OS !== 'web' || isMobile ? 'tabs' : variant;

  switch (actualVariant) {
    case 'sidebar':
      return (
        <SidebarVariant 
          {...rest} 
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />
      );
    case 'tabs':
    case 'header':
    default:
      return <WebTabBarVariant {...rest} />;
  }
};

// Export variants for direct use
export const NavbarTabs = WebTabBarVariant;
export const NavbarSidebar = SidebarVariant;