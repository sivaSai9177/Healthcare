import React, { useState } from 'react';
import { Platform, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Symbol } from './Symbols';
import { Text } from './Text';
import { HStack } from './Stack';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "./DropdownMenu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "./Sidebar";
import { useNavigationTransition } from '@/hooks/useNavigationTransition';
import { useAnimationVariant } from '@/hooks/useAnimationVariant';
import { haptic } from '@/lib/ui/haptics';
import { useTheme } from '@/lib/theme/provider';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';

export interface Team {
  id: string;
  name: string;
  logo?: React.ComponentType<any>;
  icon?: string;
  plan: string;
}

export interface TeamSwitcherProps {
  teams: Team[];
  activeTeamId?: string;
  onTeamChange?: (team: Team) => void;
}

export function TeamSwitcher({ teams, activeTeamId, onTeamChange }: TeamSwitcherProps) {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const theme = useTheme();
  const navigationTransition = useNavigationTransition();
  const { config } = useAnimationVariant({ variant: 'moderate' });
  
  const [activeTeam, setActiveTeam] = useState(
    teams.find(t => t.id === activeTeamId) || teams[0]
  );

  // Animation for team switch
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleTeamSwitch = (team: Team) => {
    if (Platform.OS !== 'web') {
      haptic('selection');
    }

    // Animate the switch
    scale.value = withSpring(0.95, { duration: 100 }, () => {
      scale.value = withSpring(1, config.spring);
    });

    setActiveTeam(team);
    onTeamChange?.(team);
    
    // You can add navigation here if teams have different dashboards
    // startTransition(() => {
    //   router.push(`/team/${team.id}`);
    // });
  };

  const handleAddTeam = () => {
    if (Platform.OS !== 'web') {
      haptic('medium');
    }
    
    navigationTransition.startTransition(() => {
      router.push('/(home)/create-organization');
    });
  };

  if (!activeTeam) {
    return null;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
            >
              <Animated.View style={[animatedStyle, { width: 32, height: 32 }]}>
                <View className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary">
                  {activeTeam.logo ? (
                    <activeTeam.logo className="size-4" />
                  ) : activeTeam.icon ? (
                    <Symbol name={activeTeam.icon as any} size={16} color={theme.primaryForeground} />
                  ) : (
                    <Text style={{ color: theme.primaryForeground, fontSize: 14, fontWeight: '600' }}>
                      {activeTeam.name.charAt(0).toUpperCase()}
                    </Text>
                  )}
                </View>
              </Animated.View>
              <View style={{ flex: 1 }}>
                <Text weight="semibold" numberOfLines={1}>{activeTeam.name}</Text>
                <Text size="xs" numberOfLines={1}>{activeTeam.plan}</Text>
              </View>
              <Symbol name="chevron.up.chevron.down" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            sideOffset={4}
          >
            <DropdownMenuLabel>
              Teams
            </DropdownMenuLabel>
            {teams.map((team, index) => (
              <DropdownMenuItem
                key={team.id}
                onPress={() => handleTeamSwitch(team)}
              >
                <HStack spacing="sm" align="center" style={{ flex: 1 }}>
                  <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center', borderRadius: 4, borderWidth: 1, borderColor: theme.border }}>
                    {team.logo ? (
                      <team.logo />
                    ) : team.icon ? (
                      <Symbol name={team.icon as any} size={16} />
                    ) : (
                      <Text size="xs" weight="semibold">
                        {team.name.charAt(0).toUpperCase()}
                      </Text>
                    )}
                  </View>
                  <Text>{team.name}</Text>
                  {Platform.OS === 'web' && (
                    <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                  )}
                </HStack>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onPress={handleAddTeam}>
              <HStack spacing="sm" align="center">
                <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center', borderRadius: 6, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.background }}>
                  <Symbol name="plus" size={16} />
                </View>
                <Text weight="medium" color="muted">Add team</Text>
              </HStack>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}