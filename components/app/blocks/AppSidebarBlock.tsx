import React from 'react';
import { AppSidebar } from '@/components/universal/AppSidebar';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useOrganization } from '@/hooks/organization/useOrganization';
import { api } from '@/lib/api/trpc';

export interface AppSidebarBlockProps {
  variant?: 'default' | 'minimal' | 'expanded';
  showProjects?: boolean;
  showTeams?: boolean;
  customNavigation?: any[];
}

/**
 * AppSidebarBlock - A complete sidebar solution with navigation, teams, and user menu
 * Integrates with auth, organization context, and page animations
 */
export function AppSidebarBlock({ 
  variant = 'default',
  showProjects = true,
  showTeams = true,
  customNavigation,
}: AppSidebarBlockProps) {
  const { user } = useAuthStore();
  const { currentOrganization, organizations, setCurrentOrganization } = useOrganization();
  
  // Get user's teams/organizations
  const teams = React.useMemo(() => {
    if (!showTeams || !organizations) return [];
    
    return organizations.map(org => ({
      id: org.id,
      name: org.name,
      icon: 'building.2',
      plan: org.plan || 'Free',
    }));
  }, [organizations, showTeams]);

  // Get user's projects
  const { data: projectsData } = api.projects.list.useQuery(
    { organizationId: currentOrganization?.id },
    { enabled: showProjects && !!currentOrganization }
  );

  const projects = React.useMemo(() => {
    if (!showProjects || !projectsData) return [];
    
    return projectsData.map(project => ({
      id: project.id,
      name: project.name,
      url: `/(home)/project/${project.id}`,
      icon: project.icon || 'folder',
    }));
  }, [projectsData, showProjects]);

  // Build navigation based on user role and permissions
  const navigation = React.useMemo(() => {
    if (customNavigation) return customNavigation;

    const baseNav = [
      {
        title: "Dashboard",
        url: "/(home)",
        icon: "house",
        isActive: true,
      },
    ];

    // Add healthcare navigation if user has healthcare role
    if (user?.role && ['nurse', 'doctor', 'head_doctor', 'operator'].includes(user.role)) {
      baseNav.push({
        title: "Healthcare",
        url: "/(home)/healthcare-dashboard",
        icon: "heart.pulse",
        items: [
          {
            title: "Alerts",
            url: "/(home)/healthcare-dashboard",
          },
          {
            title: "Patients",
            url: "/(home)/patients",
          },
          {
            title: "Analytics",
            url: "/(home)/healthcare-analytics",
          },
        ],
      });
    }

    // Add organization navigation if user has organization
    if (currentOrganization) {
      baseNav.push({
        title: "Organization",
        url: "/(home)/organization-dashboard",
        icon: "building.2",
        items: [
          {
            title: "Overview",
            url: "/(home)/organization-dashboard",
          },
          {
            title: "Settings",
            url: "/(home)/organization-settings",
          },
          {
            title: "Members",
            url: "/(home)/organization-members",
          },
        ],
      });
    }

    // Add admin navigation if user is admin
    if (user?.role === 'admin') {
      baseNav.push({
        title: "Admin",
        url: "/(home)/admin",
        icon: "shield",
        items: [
          {
            title: "Users",
            url: "/(home)/admin/users",
          },
          {
            title: "Organizations",
            url: "/(home)/admin/organizations",
          },
          {
            title: "System",
            url: "/(home)/admin/system",
          },
        ],
      });
    }

    // Always add settings
    baseNav.push({
      title: "Settings",
      url: "/(home)/settings",
      icon: "gear",
    });

    return baseNav;
  }, [user, currentOrganization, customNavigation]);

  const handleTeamChange = (team: any) => {
    const org = organizations?.find(o => o.id === team.id);
    if (org) {
      setCurrentOrganization(org);
    }
  };

  return (
    <AppSidebar
      user={user ? {
        name: user.name || 'User',
        email: user.email || '',
        avatar: user.image,
      } : undefined}
      teams={teams}
      navMain={navigation}
      projects={projects}
      activeTeamId={currentOrganization?.id}
      onTeamChange={handleTeamChange}
      variant={variant}
    />
  );
}