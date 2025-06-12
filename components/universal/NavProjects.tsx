import React from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./DropdownMenu";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "./Sidebar";
import { Symbol } from "./Symbols";
import { useNavigationTransition } from '@/hooks/useNavigationTransition';
import { haptic } from '@/lib/ui/haptics';
import { showSuccessAlert, showErrorAlert } from '@/lib/core/alert';
import { useResponsive } from '@/hooks/responsive';
export interface Project {
  id: string;
  name: string;
  url: string;
  icon: string;
}

export interface NavProjectsProps {
  projects: Project[];
  onProjectAction?: (action: 'view' | 'share' | 'delete', project: Project) => void;
}

export function NavProjects({ projects, onProjectAction }: NavProjectsProps) {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const { startTransition } = useNavigationTransition();

  const handleProjectNavigation = (project: Project) => {
    if (Platform.OS !== 'web') {
      haptics.tabSelect();
    }
    
    startTransition(() => {
      router.push(project.url as any);
    });
  };

  const handleProjectAction = (action: 'view' | 'share' | 'delete', project: Project) => {
    if (Platform.OS !== 'web') {
      haptic('impact');
    }

    switch (action) {
      case 'view':
        handleProjectNavigation(project);
        break;
      case 'share':
        // Implement share functionality
        showSuccessAlert('Share feature coming soon!');
        break;
      case 'delete':
        // Implement delete functionality with confirmation
        if (Platform.OS !== 'web') {
          haptic('warning');
        }
        showErrorAlert('Delete feature coming soon!');
        break;
    }

    onProjectAction?.(action, project);
  };

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Projects</SidebarGroupLabel>
      <SidebarMenu>
        {projects.map((item) => (
          <SidebarMenuItem key={item.id}>
            <SidebarMenuButton onPress={() => handleProjectNavigation(item)}>
              <Symbol name={item.icon} size="sm" />
              <span>{item.name}</span>
            </SidebarMenuButton>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuAction showOnHover>
                  <Symbol name="ellipsis" size={16} />
                  <span className="sr-only">More</span>
                </SidebarMenuAction>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-48 rounded-lg"
                side={isMobile ? "bottom" : "right"}
                align={isMobile ? "end" : "start"}
                // Enable animations
                animated={true}
                animationType="scale"
                animationVariant="subtle"
              >
                <DropdownMenuItem onPress={() => handleProjectAction('view', item)}>
                  <Symbol name="folder" size={16} className="text-muted-foreground" />
                  <span>View Project</span>
                </DropdownMenuItem>
                <DropdownMenuItem onPress={() => handleProjectAction('share', item)}>
                  <Symbol name="square.and.arrow.up" size={16} className="text-muted-foreground" />
                  <span>Share Project</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onPress={() => handleProjectAction('delete', item)}
                  destructive
                >
                  <Symbol name="trash" size={16} />
                  <span>Delete Project</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        ))}
        <SidebarMenuItem>
          <SidebarMenuButton onPress={() => handleProjectNavigation({ id: 'new', name: 'New Project', url: '/(home)/create-project', icon: 'plus' })}>
            <Symbol name="plus" size="sm" />
            <span>Add Project</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}