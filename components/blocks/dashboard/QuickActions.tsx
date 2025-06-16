import React from 'react';
import { View, Pressable } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'expo-router';
import {
  Text,
  Card,
  Grid,
  VStack,
  HStack,
  Badge,
} from '@/components/universal';
import { Symbol } from '@/components/universal/display/Symbols';
import { cn } from '@/lib/core/utils';
import { haptic } from '@/lib/ui/haptics';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  route: string;
  badge?: string;
  color?: string;
  roles?: string[];
  organizationRoles?: string[];
}

interface QuickActionsBlockProps {
  columns?: 2 | 3 | 4;
  customActions?: QuickAction[];
}

export function QuickActionsBlock({ 
  columns = 3,
  customActions 
}: QuickActionsBlockProps) {
  const { user } = useAuth();
  const router = useRouter();

  // Default quick actions based on role
  const defaultActions: QuickAction[] = [
    // Common actions
    {
      id: 'profile',
      title: 'My Profile',
      description: 'View and edit profile',
      icon: <Symbol name="person.2" size={24} />,
      route: '/(modals)/profile-edit',
      color: 'primary',
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'View all alerts',
      icon: <Symbol name="exclamationmark.circle" size={24} />,
      route: '/(modals)/notification-center',
      badge: '3',
      color: 'destructive',
    },
    
    // Admin actions
    {
      id: 'admin-users',
      title: 'Manage Users',
      description: 'User administration',
      icon: <Symbol name="shield" size={24} />,
      route: '/(admin)/users',
      color: 'secondary',
      roles: ['admin'],
    },
    {
      id: 'admin-system',
      title: 'System Settings',
      description: 'Configure system',
      icon: <Symbol name="gearshape" size={24} />,
      route: '/(admin)/system',
      color: 'muted',
      roles: ['admin'],
    },
    
    // Manager actions
    {
      id: 'manager-team',
      title: 'My Team',
      description: 'View team members',
      icon: <Symbol name="person.2" size={24} />,
      route: '/(manager)/team',
      color: 'primary',
      roles: ['manager', 'admin'],
    },
    {
      id: 'manager-tasks',
      title: 'Tasks',
      description: 'Manage team tasks',
      icon: <Symbol name="doc.text" size={24} />,
      route: '/(manager)/tasks',
      badge: '5',
      color: 'secondary',
      roles: ['manager', 'admin'],
    },
    {
      id: 'manager-reports',
      title: 'Reports',
      description: 'View analytics',
      icon: <Symbol name="shield" size={24} />,  // Changed from BarChart
      route: '/(manager)/reports',
      color: 'accent',
      roles: ['manager', 'admin'],
    },
    
    // Healthcare actions
    {
      id: 'healthcare-alerts',
      title: 'Active Alerts',
      description: 'View all alerts',
      icon: <Symbol name="exclamationmark.circle" size={24} />,
      route: '/(healthcare)/alerts',
      badge: '2',
      color: 'destructive',
      organizationRoles: ['doctor', 'nurse', 'head_doctor'],
    },
    {
      id: 'healthcare-patients',
      title: 'Patients',
      description: 'Patient list',
      icon: <Symbol name="heart" size={24} />,
      route: '/(healthcare)/patients',
      color: 'primary',
      organizationRoles: ['doctor', 'nurse', 'head_doctor'],
    },
    {
      id: 'operator-create',
      title: 'Create Alert',
      description: 'New emergency',
      icon: <Symbol name="exclamationmark.circle" size={24} />,  // Changed from Plus
      route: '/(modals)/create-alert',
      color: 'destructive',
      organizationRoles: ['operator'],
    },
    
    // Organization actions
    {
      id: 'org-members',
      title: 'Members',
      description: 'Team members',
      icon: <Symbol name="person.2" size={24} />,
      route: '/(organization)/members',
      color: 'primary',
      roles: ['manager', 'admin'],
    },
    {
      id: 'org-settings',
      title: 'Organization',
      description: 'Org settings',
      icon: <Symbol name="building.2" size={24} />,
      route: '/(home)/organization-settings',
      color: 'secondary',
      roles: ['manager', 'admin'],
    },
  ];

  // Filter actions based on user role
  const actions = (customActions || defaultActions).filter(action => {
    // Check role-based access
    if (action.roles && !action.roles.includes(user?.role || '')) {
      return false;
    }
    
    // Check organization role-based access
    if (action.organizationRoles && !action.organizationRoles.includes(user?.organizationRole || '')) {
      return false;
    }
    
    return true;
  });

  const handleActionPress = (route: string) => {
    haptic('light');
    router.push(route as any);
  };

  return (
    <VStack spacing={4}>
      <Text size="xl" weight="semibold">Quick Actions</Text>
      
      <Grid columns={columns} gap={4} className="animate-stagger-in">
        {actions.slice(0, columns * 2).map((action) => (
          <Pressable
            key={action.id}
            onPress={() => handleActionPress(action.route)}
          >
            <Card 
              className={cn(
                "p-4 h-full transition-all duration-200",
                "hover:scale-[1.02] hover:shadow-lg",
                "active:scale-95",
                "animate-fade-in"
              )}
            >
              <VStack spacing={3} align="center" className="h-full">
                <View 
                  className={cn(
                    "w-12 h-12 rounded-full items-center justify-center",
                    action.color === 'primary' && "bg-primary/10",
                    action.color === 'secondary' && "bg-secondary/10",
                    action.color === 'destructive' && "bg-destructive/10",
                    action.color === 'success' && "bg-success/10",
                    action.color === 'warning' && "bg-warning/10",
                    action.color === 'muted' && "bg-muted",
                    action.color === 'accent' && "bg-accent/10"
                  )}
                >
                  <View className={cn(
                    action.color === 'primary' && "text-primary",
                    action.color === 'secondary' && "text-secondary",
                    action.color === 'destructive' && "text-destructive",
                    action.color === 'success' && "text-success",
                    action.color === 'warning' && "text-warning",
                    action.color === 'muted' && "text-muted-foreground",
                    action.color === 'accent' && "text-accent-foreground"
                  )}>
                    {action.icon}
                  </View>
                </View>
                
                <VStack spacing={1} align="center" className="flex-1">
                  <HStack spacing={1} align="center">
                    <Text size="sm" weight="semibold" className="text-center">
                      {action.title}
                    </Text>
                    {action.badge && (
                      <Badge size="sm" variant="error">
                        {action.badge}
                      </Badge>
                    )}
                  </HStack>
                  <Text 
                    size="xs" 
                    className="text-muted-foreground text-center"
                    numberOfLines={2}
                  >
                    {action.description}
                  </Text>
                </VStack>
              </VStack>
            </Card>
          </Pressable>
        ))}
      </Grid>
    </VStack>
  );
}