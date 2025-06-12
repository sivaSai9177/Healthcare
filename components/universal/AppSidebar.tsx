import React from 'react';
import { Platform } from 'react-native';
import { NavMain } from "./NavMain";
import { NavProjects } from "./NavProjects";
import { NavUser } from "./NavUser";
import { TeamSwitcher } from "./TeamSwitcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "./Sidebar";
import { useAuthStore } from '@/lib/stores/auth-store';
import { useAnimationVariant } from '@/hooks/useAnimationVariant';
import Animated, {
  FadeIn,
  SlideInLeft,
} from 'react-native-reanimated';

export interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
  teams?: {
    id: string;
    name: string;
    logo?: React.ComponentType<any>;
    icon?: string;
    plan: string;
  }[];
  navMain?: {
    title: string;
    url: string;
    icon?: string;
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
  projects?: {
    id: string;
    name: string;
    url: string;
    icon: string;
  }[];
  activeTeamId?: string;
  onTeamChange?: (team: any) => void;
}

// Default navigation data
const defaultNavMain = [
  {
    title: "Dashboard",
    url: "/(home)",
    icon: "house",
    isActive: true,
  },
  {
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
  },
  {
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
  },
  {
    title: "Settings",
    url: "/(home)/settings",
    icon: "gear",
  },
];

const defaultProjects = [
  {
    id: "1",
    name: "Design System",
    url: "/(home)/project/design-system",
    icon: "paintbrush",
  },
  {
    id: "2",
    name: "Mobile App",
    url: "/(home)/project/mobile-app",
    icon: "iphone",
  },
  {
    id: "3",
    name: "Marketing Site",
    url: "/(home)/project/marketing",
    icon: "globe",
  },
];

const defaultTeams = [
  {
    id: "1",
    name: "Acme Inc",
    icon: "square.grid.3x3",
    plan: "Enterprise",
  },
  {
    id: "2",
    name: "Startup Co",
    icon: "waveform",
    plan: "Startup",
  },
];

export function AppSidebar({ 
  user: propUser,
  teams = defaultTeams,
  navMain = defaultNavMain,
  projects = defaultProjects,
  activeTeamId,
  onTeamChange,
  ...props 
}: AppSidebarProps) {
  const { user: authUser } = useAuthStore();
  const { config, isAnimated } = useAnimationVariant({ variant: 'moderate' });
  
  // Use prop user or auth user
  const user = propUser || (authUser ? {
    name: authUser.name || 'User',
    email: authUser.email || '',
    avatar: authUser.image,
  } : {
    name: 'Guest User',
    email: 'guest@example.com',
  });

  // Animate sidebar on mount
  const entering = Platform.OS !== 'web' 
    ? SlideInLeft.duration(config.duration.normal).springify()
    : FadeIn.duration(config.duration.fast);

  return (
    <Animated.View 
      entering={isAnimated ? entering : undefined}
      style={{ flex: 1 }}
    >
      <Sidebar {...props}>
        <SidebarHeader>
          <TeamSwitcher 
            teams={teams} 
            activeTeamId={activeTeamId}
            onTeamChange={onTeamChange}
          />
        </SidebarHeader>
        <SidebarContent>
          <NavMain items={navMain} />
          <NavProjects projects={projects} />
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={user} />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
    </Animated.View>
  );
}