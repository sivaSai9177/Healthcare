import React, { ReactNode, useEffect } from 'react';
import { View } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useHospitalContext } from '@/hooks/healthcare';
// ProfileIncompletePrompt removed - hospital selection is now optional
import { Text, VStack, Button, Container } from '@/components/universal';
import { logger } from '@/lib/core/debug/unified-logger';
import { ROUTES } from '@/lib/navigation/routes';
import { haptic } from '@/lib/ui/haptics';

interface HealthcareProviderProps {
  children: ReactNode;
  requireHospital?: boolean;
  showProfilePrompt?: boolean;
  onProfileIncomplete?: () => void;
}

/**
 * Provider component that ensures healthcare context is valid
 * Wraps healthcare screens to handle common error cases
 */
export function HealthcareProvider({
  children,
  requireHospital = true,
  showProfilePrompt = true,
  onProfileIncomplete,
}: HealthcareProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();
  const hospitalContext = useHospitalContext();
  
  useEffect(() => {
    logger.debug('HealthcareProvider mounted', 'HEALTHCARE', {
      requireHospital,
      hasUser: !!user,
      hospitalId: hospitalContext.hospitalId,
      error: hospitalContext.error,
    });
  }, [requireHospital, user, hospitalContext]);
  
  // Not authenticated
  if (!isAuthenticated || !user) {
    logger.warn('HealthcareProvider: User not authenticated', 'HEALTHCARE');
    return null;
  }
  
  // Loading hospital data
  if (hospitalContext.isLoading) {
    return (
      <Container>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Loading healthcare data...</Text>
        </View>
      </Container>
    );
  }
  
  // Hospital required but not available
  if (requireHospital && !hospitalContext.hasValidHospital) {
    logger.info('HealthcareProvider: Hospital required but not available', 'HEALTHCARE', {
      error: hospitalContext.error,
      hasHospital: !!hospitalContext.hospitalId,
    });
    
    // Show non-blocking message
    return (
      <Container>
        <VStack 
          p={4} 
          gap={4} 
          alignItems="center" 
          justifyContent="center" 
          style={{ flex: 1 }}
        >
          <Text size="lg" weight="semibold">No Hospital Selected</Text>
          <Text colorTheme="mutedForeground" align="center">
            Please select a hospital from settings to access healthcare features.
          </Text>
          <VStack gap={2}>
            <Button 
              onPress={() => {
                haptic('light');
                router.push('/(tabs)/settings' as any);
              }} 
              variant="default"
            >
              Go to Settings
            </Button>
            <Button 
              onPress={() => {
                haptic('light');
                router.push(ROUTES.APP.home);
              }} 
              variant="outline"
            >
              Return to Home
            </Button>
          </VStack>
        </VStack>
      </Container>
    );
  }
  
  // All checks passed, render children
  return <>{children}</>;
}

/**
 * HOC to wrap a component with healthcare provider
 */
export function withHealthcareProvider<P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<HealthcareProviderProps, 'children'>
) {
  return function WrappedComponent(props: P) {
    return (
      <HealthcareProvider {...options}>
        <Component {...props} />
      </HealthcareProvider>
    );
  };
}