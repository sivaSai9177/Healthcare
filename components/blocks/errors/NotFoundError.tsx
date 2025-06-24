import React, { useMemo } from 'react';
import { useRouter, usePathname } from 'expo-router';
import { ErrorPage } from './ErrorPage';
import { useAuth } from '@/hooks/useAuth';
import { Text } from '@/components/universal/typography';
import { VStack, HStack } from '@/components/universal/layout';
import { Card } from '@/components/universal/display';
import { Button } from '@/components/universal/interaction';
import { Symbol } from '@/components/universal/display/Symbols';
import { useTheme } from '@/lib/theme/provider';
import { logger } from '@/lib/core/debug/unified-logger';

interface NotFoundErrorProps {
  attemptedPath?: string;
}

export function NotFoundError({ attemptedPath }: NotFoundErrorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const { isAuthenticated, hasHydrated, user } = useAuth();
  
  const path = attemptedPath || pathname;
  
  // Smart suggestions based on the attempted path
  const suggestions = useMemo(() => {
    const pathLower = path.toLowerCase();
    const userRole = user?.role || 'user';
    const suggestions = [];
    
    // Auth-based suggestions
    if (!isAuthenticated) {
      if (pathLower.includes('login') || pathLower.includes('signin')) {
        suggestions.push({ 
          path: '/(public)/auth/login', 
          label: 'Sign In',
          icon: 'person.crop.circle',
        });
      }
      if (pathLower.includes('register') || pathLower.includes('signup')) {
        suggestions.push({ 
          path: '/(public)/auth/register', 
          label: 'Create Account',
          icon: 'person.badge.plus',
        });
      }
    } else {
      // Role-based suggestions
      if (pathLower.includes('alert') && ['doctor', 'nurse', 'operator'].includes(userRole)) {
        suggestions.push({ 
          path: '/alerts', 
          label: 'Alerts Dashboard',
          icon: 'bell.fill',
        });
      }
      if (pathLower.includes('patient') && ['doctor', 'nurse'].includes(userRole)) {
        suggestions.push({ 
          path: '/patients', 
          label: 'Patients',
          icon: 'person.2.fill',
        });
      }
      if (pathLower.includes('setting') || pathLower.includes('profile')) {
        suggestions.push({ 
          path: '/settings', 
          label: 'Settings',
          icon: 'gearshape.fill',
        });
      }
      if (pathLower.includes('admin') && userRole === 'admin') {
        suggestions.push({ 
          path: '/admin/organizations', 
          label: 'Admin Dashboard',
          icon: 'shield.fill',
        });
      }
    }
    
    // Always suggest home
    suggestions.push({ 
      path: isAuthenticated ? '/home' : '/', 
      label: 'Home',
      icon: 'house.fill',
    });
    
    return suggestions;
  }, [path, isAuthenticated, user?.role]);
  
  React.useEffect(() => {
    logger.router.screenNotFound(path, suggestions.map(s => s.path));
  }, [path, suggestions]);
  
  const handleGoHome = () => {
    if (!hasHydrated) {
      logger.router.navigate('+not-found', '/', { reason: 'not hydrated yet' });
      router.replace('/');
    } else if (isAuthenticated) {
      logger.router.recovered(path, '/home');
      router.replace('/home');
    } else {
      logger.router.recovered(path, '/(public)/auth/login');
      router.replace('/(public)/auth/login');
    }
  };
  
  return (
    <ErrorPage
      type="not-found"
      title="Page Not Found"
      message="The page you're looking for doesn't exist or has been moved."
      icon="questionmark.circle"
      primaryAction={{
        label: isAuthenticated ? 'Go to Home' : 'Go to Login',
        onPress: handleGoHome,
        variant: 'default',
      }}
      debugInfo={`Path: ${path}\nAuthenticated: ${isAuthenticated}\nUser Role: ${user?.role || 'none'}`}
    >
      <VStack gap={4} className="w-full">
        {/* Attempted Path */}
        <Card className="p-4 bg-muted/50">
          <VStack gap={2}>
            <HStack gap={2} align="center">
              <Symbol name="link" size={16} color={theme.mutedForeground} />
              <Text size="sm" weight="semibold" colorTheme="mutedForeground">
                Attempted Path
              </Text>
            </HStack>
            <Text 
              size="xs" 
              style={{ fontFamily: 'monospace' }}
              className="break-all"
            >
              {path}
            </Text>
          </VStack>
        </Card>
        
        {/* Smart Suggestions */}
        {suggestions.length > 0 && (
          <Card className="p-4">
            <VStack gap={3}>
              <Text size="sm" weight="semibold">
                Were you looking for?
              </Text>
              <VStack gap={2}>
                {suggestions.map((suggestion, index) => (
                  <Button
                    key={index}
                    size="sm"
                    variant="outline"
                    onPress={() => {
                      logger.router.recovered(path, suggestion.path);
                      router.replace(suggestion.path);
                    }}
                    className="w-full justify-start"
                  >
                    <HStack gap={2} align="center">
                      <Symbol 
                        name={suggestion.icon as any} 
                        size={18} 
                        color={theme.primary} 
                      />
                      <Text size="sm">{suggestion.label}</Text>
                    </HStack>
                  </Button>
                ))}
              </VStack>
            </VStack>
          </Card>
        )}
        
        {/* Help Text */}
        <Card className="p-3 bg-primary/10 border border-primary/20">
          <HStack gap={2} align="flex-start">
            <Symbol name="lightbulb" size={16} color={theme.primary} />
            <Text size="xs" className="flex-1">
              If you followed a link to get here, the link may be outdated or incorrect.
            </Text>
          </HStack>
        </Card>
      </VStack>
    </ErrorPage>
  );
}