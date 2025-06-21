import React, { useState } from 'react';
import { View, Pressable, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { 
  useOrganizationStore, 
  useActiveOrganization, 
  useSwitchOrganization 
} from '@/lib/stores/organization-store';
import { useAuthStore } from '@/lib/stores/auth-store';
import { Text } from '@/components/universal/typography';
import { Card , Badge } from '@/components/universal/display';
import { Button } from '@/components/universal/interaction';
import { Symbol } from '@/components/universal/display/Symbols';
import { VStack, HStack } from '@/components/universal/layout';
import { Menu, MenuItem, MenuTrigger, MenuContent } from '@/components/universal/navigation';
import { useSpacing } from '@/lib/stores/spacing-store';
import { haptic } from '@/lib/ui/haptics';
import { cn } from '@/lib/core/utils';

interface OrganizationSwitcherProps {
  variant?: 'compact' | 'full';
  showCreateButton?: boolean;
  allowedRoles?: string[]; // Optional: restrict visibility to specific roles
}

export function OrganizationSwitcher({ 
  variant = 'compact',
  showCreateButton = true,
  allowedRoles
}: OrganizationSwitcherProps) {
  const router = useRouter();
  const { spacing } = useSpacing();
  const { organization: activeOrganization, isLoading } = useActiveOrganization();
  const organizations = useOrganizationStore(state => state.organizations);
  const isSwitching = useOrganizationStore(state => state.isSwitching);
  const switchOrgMutation = useSwitchOrganization();
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuthStore();
  
  // Check role restrictions if provided
  if (allowedRoles && user?.role && !allowedRoles.includes(user.role)) {
    return null;
  }

  const handleSwitch = async (organizationId: string) => {
    if (organizationId === activeOrganization?.id) {
      setIsOpen(false);
      return;
    }

    haptic('light');
    
    try {
      await switchOrgMutation.mutateAsync({ organizationId });
      setIsOpen(false);
    } catch (error) {
      // Error handled by the mutation
    }
  };

  const handleCreateOrg = () => {
    haptic('light');
    setIsOpen(false);
    router.push('/(app)/organization/create');
  };

  const handleJoinOrg = () => {
    haptic('light');
    setIsOpen(false);
    router.push('/(app)/organization/join');
  };

  if (isLoading) {
    return (
      <View className="h-10 w-48 bg-muted animate-pulse rounded-md" />
    );
  }

  if (!activeOrganization && organizations.length === 0) {
    return (
      <Button
        variant="outline"
        size="sm"
        onPress={handleCreateOrg}
        className="gap-2"
      >
        <Symbol name="plus" size={16} />
        <Text>Create Organization</Text>
      </Button>
    );
  }

  if (variant === 'full') {
    return (
      <Card className="p-4">
        <VStack gap={spacing[3]}>
          <HStack className="justify-between items-center">
            <Text size="sm" colorTheme="mutedForeground">Current Organization</Text>
            {organizations.length > 1 && (
              <Badge variant="secondary" size="xs">
                {organizations.length} organizations
              </Badge>
            )}
          </HStack>

          {activeOrganization ? (
            <HStack gap={spacing[3]} className="items-center">
              <View className="w-10 h-10 bg-primary/10 rounded-lg items-center justify-center">
                <Symbol name="building.2" size={20} color="primary" />
              </View>
              <VStack gap={spacing[1]} className="flex-1">
                <Text weight="semibold">{activeOrganization.name}</Text>
                {activeOrganization.role && (
                  <Text size="xs" colorTheme="mutedForeground">
                    {activeOrganization.role.charAt(0).toUpperCase() + activeOrganization.role.slice(1)}
                  </Text>
                )}
              </VStack>
            </HStack>
          ) : (
            <Text colorTheme="mutedForeground">No organization selected</Text>
          )}

          <VStack gap={spacing[2]}>
            {organizations.length > 1 && (
              <Menu>
                <MenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-between"
                    disabled={isSwitching}
                  >
                    <Text>Switch Organization</Text>
                    <Symbol name="chevron.down" size={16} />
                  </Button>
                </MenuTrigger>
                <MenuContent className="w-64">
                  {organizations.map((org) => (
                    <MenuItem
                      key={org.id}
                      onPress={() => handleSwitch(org.id)}
                      disabled={org.id === activeOrganization?.id}
                    >
                      <HStack className="flex-1 justify-between items-center">
                        <VStack gap={spacing[1]}>
                          <Text>{org.name}</Text>
                          {org.role && (
                            <Text size="xs" colorTheme="mutedForeground">
                              {org.role}
                            </Text>
                          )}
                        </VStack>
                        {org.id === activeOrganization?.id && (
                          <Symbol name="checkmark" size={16} color="primary" />
                        )}
                      </HStack>
                    </MenuItem>
                  ))}
                </MenuContent>
              </Menu>
            )}

            {showCreateButton && (
              <HStack gap={spacing[2]}>
                <Button
                  variant="outline"
                  size="sm"
                  onPress={handleCreateOrg}
                  className="flex-1"
                >
                  <Symbol name="plus" size={16} />
                  <Text>Create</Text>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onPress={handleJoinOrg}
                  className="flex-1"
                >
                  <Symbol name="person.badge.plus" size={16} />
                  <Text>Join</Text>
                </Button>
              </HStack>
            )}
          </VStack>
        </VStack>
      </Card>
    );
  }

  // Compact variant
  return (
    <Menu>
      <MenuTrigger asChild>
        <Pressable
          className={cn(
            "flex-row items-center gap-2 px-3 py-2 rounded-md",
            "hover:bg-accent active:bg-accent/80",
            isSwitching && "opacity-50"
          )}
          disabled={isSwitching}
        >
          <View className="w-8 h-8 bg-primary/10 rounded items-center justify-center">
            <Symbol name="building.2" size={16} color="primary" />
          </View>
          <VStack gap={0.5} className="flex-1">
            <Text size="sm" weight="medium" numberOfLines={1}>
              {activeOrganization?.name || 'No Organization'}
            </Text>
            {activeOrganization?.role && (
              <Text size="xs" colorTheme="mutedForeground">
                {activeOrganization.role}
              </Text>
            )}
          </VStack>
          <Symbol name="chevron.down" size={16} color="muted" />
        </Pressable>
      </MenuTrigger>

      <MenuContent className="w-64">
        {organizations.map((org) => (
          <MenuItem
            key={org.id}
            onPress={() => handleSwitch(org.id)}
            disabled={org.id === activeOrganization?.id}
          >
            <HStack className="flex-1 justify-between items-center">
              <HStack gap={spacing[2]} className="items-center flex-1">
                <View className="w-8 h-8 bg-primary/10 rounded items-center justify-center">
                  <Symbol name="building.2" size={16} color="primary" />
                </View>
                <VStack gap={0.5} className="flex-1">
                  <Text size="sm">{org.name}</Text>
                  {org.role && (
                    <Text size="xs" colorTheme="mutedForeground">
                      {org.role}
                    </Text>
                  )}
                </VStack>
              </HStack>
              {org.id === activeOrganization?.id && (
                <Symbol name="checkmark" size={16} color="primary" />
              )}
            </HStack>
          </MenuItem>
        ))}
        
        {showCreateButton && organizations.length > 0 && (
          <View className="border-t border-border my-1" />
        )}
        
        {showCreateButton && (
          <>
            <MenuItem onPress={handleCreateOrg}>
              <HStack gap={spacing[2]} className="items-center">
                <Symbol name="plus" size={16} />
                <Text size="sm">Create Organization</Text>
              </HStack>
            </MenuItem>
            <MenuItem onPress={handleJoinOrg}>
              <HStack gap={spacing[2]} className="items-center">
                <Symbol name="person.badge.plus" size={16} />
                <Text size="sm">Join Organization</Text>
              </HStack>
            </MenuItem>
          </>
        )}
      </MenuContent>
    </Menu>
  );
}