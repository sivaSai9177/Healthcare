import React, { useState } from 'react';
import { Platform, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Symbol } from '@/components/universal/display/Symbols';
import { Text } from '@/components/universal/typography/Text';
import { HStack } from '@/components/universal/layout/Stack';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/universal/overlay/DropdownMenu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/universal/navigation";
import { useNavigationTransition } from '@/hooks/useNavigationTransition';
import { useAnimationVariant } from '@/hooks/useAnimationVariant';
import { haptic } from '@/lib/ui/haptics';
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
                    <Symbol name={activeTeam.icon as any} size={16} className="text-primary-foreground" />
                  ) : (
                    <Text className="text-primary-foreground text-sm font-semibold">
                      {activeTeam.name.charAt(0).toUpperCase()}
                    </Text>
                  )}
                </View>
              </Animated.View>
              <View className="flex-1">
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
                <HStack gap={2} align="center" className="flex-1">
                  <View className="w-6 h-6 items-center justify-center rounded border border-border">
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
              <HStack gap={2} align="center">
                <View className="w-6 h-6 items-center justify-center rounded-md border border-border bg-background">
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