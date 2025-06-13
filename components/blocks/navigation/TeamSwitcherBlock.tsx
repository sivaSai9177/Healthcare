import React from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { TeamSwitcher } from '@/components/universal/TeamSwitcher';
import { useOrganization } from '@/hooks/organization/useOrganization';
import { useNavigationTransition } from '@/hooks/useNavigationTransition';

import { showSuccessAlert } from '@/lib/core/alert';

export interface TeamSwitcherBlockProps {
  showCreateOption?: boolean;
  onTeamChange?: (teamId: string) => void;
}

/**
 * TeamSwitcherBlock - Organization/Team switcher with navigation integration
 * Handles organization context switching and page transitions
 */
export function TeamSwitcherBlock({
  showCreateOption = true,
  onTeamChange,
}: TeamSwitcherBlockProps) {
  const router = useRouter();
  const { currentOrganization, organizations, setCurrentOrganization } = useOrganization();
  const { startTransition } = useNavigationTransition();

  const teams = React.useMemo(() => {
    if (!organizations || organizations.length === 0) {
      return [{
        id: 'default',
        name: 'Personal',
        icon: 'person.circle',
        plan: 'Free',
      }];
    }

    return organizations.map(org => ({
      id: org.id,
      name: org.name,
      icon: org.icon || 'building.2',
      plan: org.plan || 'Free',
    }));
  }, [organizations]);

  const handleTeamChange = (team: any) => {
    if (Platform.OS !== 'web') {
      haptics.tabSelect();
    }

    const org = organizations?.find(o => o.id === team.id);
    if (org) {
      // Animate the transition
      startTransition(() => {
        setCurrentOrganization(org);
        onTeamChange?.(org.id);
        
        // Show success message
        showSuccessAlert(`Switched to ${org.name}`);
        
        // Navigate to organization dashboard
        router.push('/(home)/organization-dashboard');
      });
    } else if (team.id === 'new') {
      // Handle create new organization
      startTransition(() => {
        router.push('/(home)/create-organization');
      });
    }
  };

  // Add create option if enabled
  const teamsWithCreate = React.useMemo(() => {
    if (!showCreateOption) return teams;
    
    return [
      ...teams,
      {
        id: 'new',
        name: 'Create Organization',
        icon: 'plus.circle',
        plan: '',
      },
    ];
  }, [teams, showCreateOption]);

  return (
    <TeamSwitcher
      teams={teamsWithCreate}
      activeTeamId={currentOrganization?.id || 'default'}
      onTeamChange={handleTeamChange}
    />
  );
}