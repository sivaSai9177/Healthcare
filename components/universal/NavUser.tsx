import React from 'react';
import { useRouter } from 'expo-router';
import { Platform } from 'react-native';
import { Symbol } from './Symbols';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "./Avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./DropdownMenu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "./Sidebar";
import { useAuthStore } from '@/lib/stores/auth-store';
import { useNavigationTransition } from '@/hooks/useNavigationTransition';
import { haptic } from '@/lib/ui/haptics';
import { showSuccessAlert } from '@/lib/core/alert';
import { useResponsive } from '@/hooks/responsive';

export interface NavUserProps {
  user: {
    name: string;
    email: string;
    avatar?: string;
  };
}

export function NavUser({ user }: NavUserProps) {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const { signOut } = useAuthStore();
  const { startTransition } = useNavigationTransition();

  const handleNavigation = (path: string) => {
    if (Platform.OS !== 'web') {
      haptics.tabSelect();
    }
    
    startTransition(() => {
      router.push(path as any);
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

  // Generate initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user.name}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <Symbol name="chevron.up.chevron.down" className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
            // Enable animations
            animated={true}
            animationType="scale"
            animationVariant="moderate"
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onPress={() => handleNavigation('/(home)/settings')}>
                <Symbol name="person.circle" className="mr-2 h-4 w-4" />
                Account Settings
              </DropdownMenuItem>
              <DropdownMenuItem onPress={() => handleNavigation('/(home)/organization-settings')}>
                <Symbol name="building.2" className="mr-2 h-4 w-4" />
                Organization
              </DropdownMenuItem>
              <DropdownMenuItem onPress={() => handleNavigation('/(home)/settings')}>
                <Symbol name="bell" className="mr-2 h-4 w-4" />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onPress={handleSignOut} destructive>
              <Symbol name="arrow.right.square" className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}