import React from 'react';
import { View, Pressable } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'expo-router';
import {
  Text,
  Card,
  Grid,
  VStack,
  Badge,
} from '@/components/universal';
import { 
  Plus, 
  Users, 
  FileText, 
  AlertCircle,
  Activity,
  Settings,
  Building,
  Calendar,
  BarChart,
  Shield,
  Heart,
  UserPlus,
} from '@/components/universal/Symbols';
import { useSpacing } from '@/lib/stores/spacing-store';
import { useTheme } from '@/lib/theme/provider';

// Import HStack since it's used but not imported
import { HStack } from '@/components/universal';

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
  const { spacing } = useSpacing();
  const theme = useTheme();

  // Default quick actions based on role
  const defaultActions: QuickAction[] = [
    // Common actions
    {
      id: 'profile',
      title: 'My Profile',
      description: 'View and edit profile',
      icon: <Users size={24} />,
      route: '/(modals)/profile-edit',
      color: theme.primary,
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'View all alerts',
      icon: <AlertCircle size={24} />,
      route: '/(modals)/notification-center',
      badge: '3',
      color: theme.destructive,
    },
    
    // Admin actions
    {
      id: 'admin-users',
      title: 'Manage Users',
      description: 'User administration',
      icon: <Shield size={24} />,
      route: '/(admin)/users',
      color: theme.secondary,
      roles: ['admin'],
    },
    {
      id: 'admin-system',
      title: 'System Settings',
      description: 'Configure system',
      icon: <Settings size={24} />,
      route: '/(admin)/system',
      color: theme.muted,
      roles: ['admin'],
    },
    
    // Manager actions
    {
      id: 'manager-team',
      title: 'My Team',
      description: 'View team members',
      icon: <Users size={24} />,
      route: '/(manager)/team',
      color: theme.primary,
      roles: ['manager', 'admin'],
    },
    {
      id: 'manager-tasks',
      title: 'Tasks',
      description: 'Manage team tasks',
      icon: <FileText size={24} />,
      route: '/(manager)/tasks',
      badge: '5',
      color: theme.secondary,
      roles: ['manager', 'admin'],
    },
    {
      id: 'manager-reports',
      title: 'Reports',
      description: 'View analytics',
      icon: <BarChart size={24} />,
      route: '/(manager)/reports',
      color: theme.accent,
      roles: ['manager', 'admin'],
    },
    
    // Healthcare actions
    {
      id: 'healthcare-alerts',
      title: 'Active Alerts',
      description: 'View all alerts',
      icon: <AlertCircle size={24} />,
      route: '/(healthcare)/alerts',
      badge: '2',
      color: theme.destructive,
      organizationRoles: ['doctor', 'nurse', 'head_doctor'],
    },
    {
      id: 'healthcare-patients',
      title: 'Patients',
      description: 'Patient list',
      icon: <Heart size={24} />,
      route: '/(healthcare)/patients',
      color: theme.primary,
      organizationRoles: ['doctor', 'nurse', 'head_doctor'],
    },
    {
      id: 'operator-create',
      title: 'Create Alert',
      description: 'New emergency',
      icon: <Plus size={24} />,
      route: '/(modals)/create-alert',
      color: theme.destructive,
      organizationRoles: ['operator'],
    },
    
    // Organization actions
    {
      id: 'org-members',
      title: 'Members',
      description: 'Team members',
      icon: <Users size={24} />,
      route: '/(organization)/members',
      color: theme.primary,
      roles: ['manager', 'admin'],
    },
    {
      id: 'org-settings',
      title: 'Organization',
      description: 'Org settings',
      icon: <Building size={24} />,
      route: '/(home)/organization-settings',
      color: theme.secondary,
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
    router.push(route as any);
  };

  return (
    <VStack spacing="md">
      <Text variant="h5" weight="semibold">Quick Actions</Text>
      
      <Grid cols={columns} spacing="md">
        {actions.slice(0, columns * 2).map((action) => (
          <Pressable
            key={action.id}
            onPress={() => handleActionPress(action.route)}
          >
            <Card 
              padding="md" 
              className="h-full active:scale-95 transition-transform"
            >
              <VStack spacing="sm" align="center" className="h-full">
                <View 
                  className="w-12 h-12 rounded-full items-center justify-center"
                  style={{ backgroundColor: action.color + '20' }}
                >
                  {React.cloneElement(action.icon as React.ReactElement, {
                    color: action.color || theme.primary,
                  })}
                </View>
                
                <VStack spacing="xs" align="center" className="flex-1">
                  <HStack spacing="xs" align="center">
                    <Text variant="body1" weight="semibold" className="text-center">
                      {action.title}
                    </Text>
                    {action.badge && (
                      <Badge size="sm" variant="destructive">
                        {action.badge}
                      </Badge>
                    )}
                  </HStack>
                  <Text 
                    variant="caption" 
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