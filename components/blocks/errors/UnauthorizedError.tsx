import React from 'react';
import { useRouter } from 'expo-router';
import { ErrorPage } from './ErrorPage';
import { useAuth } from '@/hooks/useAuth';
import { Text } from '@/components/universal/typography';
import { VStack, HStack } from '@/components/universal/layout';
import { Card } from '@/components/universal/display';
import { Symbol } from '@/components/universal/display/Symbols';
import { useTheme } from '@/lib/theme/provider';
import { logger } from '@/lib/core/debug/unified-logger';

interface UnauthorizedErrorProps {
  requiredRole?: string;
  requiredPermission?: string;
  resource?: string;
}

export function UnauthorizedError({ 
  requiredRole, 
  requiredPermission,
  resource = 'this resource'
}: UnauthorizedErrorProps) {
  const router = useRouter();
  const theme = useTheme();
  const { user, isAuthenticated } = useAuth();
  
  React.useEffect(() => {
    logger.auth.unauthorized('Unauthorized access attempt', {
      userId: user?.id,
      userRole: user?.role,
      requiredRole,
      requiredPermission,
      resource,
    });
  }, [user, requiredRole, requiredPermission, resource]);
  
  const handleGoHome = () => {
    logger.router.navigate('unauthorized-error', '/home');
    router.replace('/home');
  };
  
  const handleSignIn = () => {
    logger.router.navigate('unauthorized-error', '/(public)/auth/login');
    router.replace('/(public)/auth/login');
  };
  
  const handleRequestAccess = () => {
    logger.auth.info('User requesting access', { resource, requiredRole });
    // TODO: Implement access request flow
    router.push('/support');
  };
  
  return (
    <ErrorPage
      type="unauthorized"
      title="Access Denied"
      message={`You don't have permission to access ${resource}.`}
      icon="lock.shield"
      primaryAction={isAuthenticated ? {
        label: 'Go to Home',
        onPress: handleGoHome,
        variant: 'default',
      } : {
        label: 'Sign In',
        onPress: handleSignIn,
        variant: 'default',
      }}
      secondaryAction={{
        label: 'Request Access',
        onPress: handleRequestAccess,
        variant: 'outline',
      }}
      debugInfo={`User Role: ${user?.role || 'none'}\nRequired Role: ${requiredRole || 'none'}\nRequired Permission: ${requiredPermission || 'none'}\nAuthenticated: ${isAuthenticated}`}
    >
      <VStack gap={4} className="w-full">
        {/* Current Access Level */}
        {isAuthenticated && user && (
          <Card className="p-4">
            <VStack gap={3}>
              <HStack gap={2} align="center">
                <Symbol name="person.circle" size={20} color={theme.primary} />
                <Text size="sm" weight="semibold">Your Current Access</Text>
              </HStack>
              
              <VStack gap={2}>
                <HStack gap={2} align="center">
                  <Text size="xs" colorTheme="mutedForeground">Role:</Text>
                  <Text size="xs" weight="medium">{user.role || 'User'}</Text>
                </HStack>
                <HStack gap={2} align="center">
                  <Text size="xs" colorTheme="mutedForeground">Organization:</Text>
                  <Text size="xs" weight="medium">{user.organizationName || 'None'}</Text>
                </HStack>
              </VStack>
            </VStack>
          </Card>
        )}
        
        {/* Required Access */}
        {(requiredRole || requiredPermission) && (
          <Card className="p-4 bg-destructive/10">
            <VStack gap={3}>
              <HStack gap={2} align="center">
                <Symbol name="shield.lefthalf.filled" size={20} color={theme.destructive} />
                <Text size="sm" weight="semibold" className="text-destructive">Required Access</Text>
              </HStack>
              
              <VStack gap={2}>
                {requiredRole && (
                  <HStack gap={2} align="center">
                    <Symbol name="checkmark.circle" size={16} color={theme.destructive} />
                    <Text size="xs">Role: {requiredRole}</Text>
                  </HStack>
                )}
                {requiredPermission && (
                  <HStack gap={2} align="center">
                    <Symbol name="checkmark.circle" size={16} color={theme.destructive} />
                    <Text size="xs">Permission: {requiredPermission}</Text>
                  </HStack>
                )}
              </VStack>
            </VStack>
          </Card>
        )}
        
        {/* Help Text */}
        <Card className="p-4 bg-muted/50">
          <VStack gap={2}>
            <Text size="sm" weight="semibold">Need Access?</Text>
            <Text size="xs" colorTheme="mutedForeground">
              If you believe you should have access to this resource, please contact your administrator or request access through the support channel.
            </Text>
          </VStack>
        </Card>
      </VStack>
    </ErrorPage>
  );
}