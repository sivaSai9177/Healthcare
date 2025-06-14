import React from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/universal/overlay/DropdownMenu";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/universal/navigation";
import { Symbol } from "@/components/universal/display/Symbols";
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
      haptic('selection');
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
              <Symbol name={item.icon} size={16} />
              {item.name}
            </SidebarMenuButton>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="sm">
                  <Symbol name="ellipsis" size={16} />
                </SidebarMenuButton>
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
                  View Project
                </DropdownMenuItem>
                <DropdownMenuItem onPress={() => handleProjectAction('share', item)}>
                  <Symbol name="square.and.arrow.up" size={16} className="text-muted-foreground" />
                  Share Project
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onPress={() => handleProjectAction('delete', item)}
                  destructive
                >
                  <Symbol name="trash" size={16} />
                  Delete Project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        ))}
        <SidebarMenuItem>
          <SidebarMenuButton onPress={() => handleProjectNavigation({ id: 'new', name: 'New Project', url: '/(home)/create-project', icon: 'plus' })}>
            <Symbol name="plus" size={16} />
            Add Project
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}