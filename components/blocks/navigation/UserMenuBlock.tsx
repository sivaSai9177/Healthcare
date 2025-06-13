import React from 'react';
import { Platform, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from '@/components/universal/Avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/universal/DropdownMenu';
import { Text } from '@/components/universal/Text';
import { Symbol } from '@/components/universal/Symbols';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useThemeStore } from '@/lib/stores/theme-store';
import { haptic } from '@/lib/ui/haptics';
import { showSuccessAlert } from '@/lib/core/alert';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

export interface UserMenuBlockProps {
  variant?: 'compact' | 'expanded';
  showThemeToggle?: boolean;
  showOrganization?: boolean;
  customActions?: {
    label: string;
    icon: string;
    onPress: () => void;
    destructive?: boolean;
  }[];
}

/**
 * UserMenuBlock - A complete user menu solution with profile, settings, and actions
 * Can be used standalone or as part of navigation
 */
export function UserMenuBlock({
  variant = 'expanded',
  showThemeToggle = true,
  showOrganization = true,
  customActions = [],
}: UserMenuBlockProps) {
  const router = useRouter();
  const { user, signOut } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSpring(0.95, { duration: 100 }, () => {
      scale.value = withSpring(1);
    });
  };

  const handleSignOut = async () => {
    if (Platform.OS !== 'web') {
      haptic('warning');
    }
    
    await signOut();
    showSuccessAlert('Signed out successfully');
    router.replace('/(auth)/login');
  };

  const handleThemeToggle = () => {
    if (Platform.OS !== 'web') {
      haptics.toggle();
    }
    
    const themes = ['light', 'dark', 'midnight', 'dawn', 'aurora'] as const;
    const currentIndex = themes.indexOf(theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    setTheme(nextTheme);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!user) {
    return null;
  }

  const isCompact = variant === 'compact';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Pressable onPressIn={handlePress}>
          <Animated.View style={[animatedStyle, { flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
            <Avatar size={isCompact ? 32 : 40}>
              <AvatarImage source={{ uri: user.image }} />
              <AvatarFallback>{getInitials(user.name || 'U')}</AvatarFallback>
            </Avatar>
            {!isCompact && (
              <View style={{ flex: 1 }}>
                <Text weight="semibold" size="sm">{user.name}</Text>
                {showOrganization && user.organizationName && (
                  <Text size="xs" colorTheme="mutedForeground">{user.organizationName}</Text>
                )}
              </View>
            )}
            <Symbol name="chevron.down" size={isCompact ? 12 : 16} />
          </Animated.View>
        </Pressable>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        minWidth={240}
        animated
        animationType="scale"
        animationVariant="moderate"
      >
        <DropdownMenuLabel>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Avatar size={40}>
              <AvatarImage source={{ uri: user.image }} />
              <AvatarFallback>{getInitials(user.name || 'U')}</AvatarFallback>
            </Avatar>
            <View style={{ flex: 1 }}>
              <Text weight="semibold" size="sm">{user.name}</Text>
              <Text size="xs" colorTheme="mutedForeground">{user.email}</Text>
              {showOrganization && user.organizationName && (
                <Text size="xs" colorTheme="mutedForeground">{user.organizationName}</Text>
              )}
            </View>
          </View>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuGroup>
          <DropdownMenuItem onPress={() => router.push('/(home)/settings')}>
            <Symbol name="person.circle" size={16} />
            <Text>Account Settings</Text>
          </DropdownMenuItem>
          
          {showOrganization && (
            <DropdownMenuItem onPress={() => router.push('/(home)/organization-settings')}>
              <Symbol name="building.2" size={16} />
              <Text>Organization</Text>
            </DropdownMenuItem>
          )}
          
          {showThemeToggle && (
            <DropdownMenuItem onPress={handleThemeToggle}>
              <Symbol name={theme === 'dark' ? 'moon' : 'sun.max'} size={16} />
              <Text>Theme: {theme}</Text>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>

        {customActions.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {customActions.map((action, index) => (
                <DropdownMenuItem
                  key={index}
                  onPress={action.onPress}
                  destructive={action.destructive}
                >
                  <Symbol name={action.icon} size={16} />
                  <Text>{action.label}</Text>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </>
        )}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onPress={handleSignOut} destructive>
          <Symbol name="arrow.right.square" size={16} />
          <Text>Sign Out</Text>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}