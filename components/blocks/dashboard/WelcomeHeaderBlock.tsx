import React from 'react';
import { View } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'expo-router';
import {
  Text,
  Card,
  Button,
  Avatar,
  HStack,
  VStack,
  Badge,
} from '@/components/universal';
import { Bell, Settings, LogOut } from '@/components/universal/Symbols';
import { useSpacing } from '@/lib/stores/spacing-store';

interface WelcomeHeaderBlockProps {
  showActions?: boolean;
  customGreeting?: string;
}

export function WelcomeHeaderBlock({ 
  showActions = true,
  customGreeting 
}: WelcomeHeaderBlockProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { spacing } = useSpacing();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getRoleBadgeVariant = (role: string): any => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'manager':
        return 'secondary';
      case 'user':
        return 'default';
      default:
        return 'outline';
    }
  };

  const getOrganizationRoleBadge = () => {
    if (!user?.organizationRole) return null;
    
    switch (user.organizationRole) {
      case 'doctor':
        return <Badge variant="success">Doctor</Badge>;
      case 'nurse':
        return <Badge variant="default">Nurse</Badge>;
      case 'operator':
        return <Badge variant="secondary">Operator</Badge>;
      case 'head_doctor':
        return <Badge variant="destructive">Head Doctor</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card padding="lg" className="mb-4">
      <HStack justify="between" align="center">
        <HStack spacing="md" align="center">
          <Avatar
            src={user?.image}
            alt={user?.name || 'User'}
            size="lg"
            fallback={user?.name?.charAt(0) || 'U'}
          />
          
          <VStack spacing="xs">
            <Text variant="h4" weight="semibold">
              {customGreeting || getGreeting()}, {user?.name || 'User'}
            </Text>
            <HStack spacing="sm" align="center">
              <Badge variant={getRoleBadgeVariant(user?.role || 'user')}>
                {user?.role || 'User'}
              </Badge>
              {getOrganizationRoleBadge()}
              {user?.organizationName && (
                <Text variant="body2" className="text-muted-foreground">
                  {user.organizationName}
                </Text>
              )}
            </HStack>
          </VStack>
        </HStack>

        {showActions && (
          <HStack spacing="sm">
            <Button
              variant="ghost"
              size="icon"
              onPress={() => router.push('/(modals)/notification-center')}
            >
              <Bell size={20} />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onPress={() => router.push('/(home)/settings')}
            >
              <Settings size={20} />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onPress={() => logout()}
            >
              <LogOut size={20} />
            </Button>
          </HStack>
        )}
      </HStack>
    </Card>
  );
}