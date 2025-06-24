import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'expo-router';
import { Text } from '@/components/universal/typography';
import { Card, Avatar, Badge } from '@/components/universal/display';
import { Button } from '@/components/universal/interaction';
import { HStack, VStack } from '@/components/universal/layout';
import { Bell, Settings, LogOut } from '@/components/universal/display/Symbols';
import { cn } from '@/lib/core/utils';
import { useResponsive } from '@/hooks/responsive';
import { haptic } from '@/lib/ui/haptics';

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
  const { isMobile } = useResponsive();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getRoleBadgeVariant = (role: string): any => {
    switch (role) {
      case 'admin':
        return 'error';
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
        return <Badge variant="error">Head Doctor</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card 
      className={cn(
        "p-6 mb-4",
        "animate-fade-in",
        "transition-all duration-200"
      )}
    >
      <HStack justify="between" align="center">
        <HStack gap={4} align="center">
          <Avatar
            source={user?.image ? { uri: user.image } : undefined}
            name={user?.name || 'User'}
            size={isMobile ? 'default' : 'lg'}
            className="animate-scale-in"
          />
          
          <VStack gap={1}>
            <Text size="xl" weight="semibold">
              {customGreeting || getGreeting()}, {user?.name || 'User'}
            </Text>
            <HStack gap={2} align="center">
              <Badge variant={getRoleBadgeVariant(user?.role || 'user')}>
                {user?.role || 'User'}
              </Badge>
              {getOrganizationRoleBadge()}
              {user?.organizationName && (
                <Text size="sm" className="text-muted-foreground">
                  {user.organizationName}
                </Text>
              )}
            </HStack>
          </VStack>
        </HStack>

        {showActions && (
          <HStack gap={2}>
            <Button
              variant="ghost"
              size="icon"
              onPress={() => {
                haptic('light');
                router.push('/notification-center' as any);
              }}
              className="animate-scale-in"
            >
              <Bell size={20} />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onPress={() => {
                haptic('light');
                router.push('/(home)/settings' as any);
              }}
              className="animate-scale-in delay-100"
            >
              <Settings size={20} />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onPress={() => {
                haptic('warning');
                logout();
              }}
              className="animate-scale-in delay-200"
            >
              <LogOut size={20} />
            </Button>
          </HStack>
        )}
      </HStack>
    </Card>
  );
}