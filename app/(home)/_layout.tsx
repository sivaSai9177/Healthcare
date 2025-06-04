import React from 'react';
import { z } from 'zod';
import { Platform, ActivityIndicator, View } from 'react-native';
import { Tabs, useRouter } from 'expo-router';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/trpc';
import { log } from '@/lib/core/logger';
import { UserRoleSchema, type UserRole } from '@/lib/validations/server';
import '@/app/global.css';

// Tab configuration schema for validation
const TabConfigSchema = z.object({
  name: z.string(),
  title: z.string(),
  iconName: z.string(),
  requiredRole: UserRoleSchema.optional(),
  requiresAuth: z.boolean().default(true),
});

type TabConfig = z.infer<typeof TabConfigSchema>;

// Role hierarchy for access control with Zod validation
const RoleHierarchySchema = z.record(
  UserRoleSchema,
  z.array(UserRoleSchema)
);

const ROLE_HIERARCHY = RoleHierarchySchema.parse({
  admin: ['admin', 'manager', 'user', 'guest'],
  manager: ['manager', 'user', 'guest'], 
  user: ['user', 'guest'],
  guest: ['guest'],
} as const);

const TabLayout = React.memo(function TabLayout() {
  const { user, hasHydrated, isAuthenticated } = useAuth();
  const router = useRouter();
  
  // Use tRPC for comprehensive session validation with TanStack Query
  const sessionQuery = api.auth.getSession.useQuery(undefined, {
    enabled: hasHydrated && isAuthenticated && !!user,
    retry: (failureCount, error) => {
      // Don't retry on auth errors, but retry on network errors
      const errorCode = error?.data?.code;
      if (errorCode === 'UNAUTHORIZED' || errorCode === 'FORBIDDEN') return false;
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 2 * 60 * 1000, // 2 minutes - balance between freshness and performance
    cacheTime: 5 * 60 * 1000, // 5 minutes cache
    refetchOnWindowFocus: false, // Disable to prevent excessive calls
    refetchOnReconnect: true,
    // Background refetch for security - but less frequent
    refetchInterval: 15 * 60 * 1000, // 15 minutes
    // Graceful error handling
    onError: (error) => {
      log.warn('Session query failed', 'TAB_LAYOUT', {
        error: error.message,
        code: error.data?.code,
      });
    },
  });
  
  // Validate user role with comprehensive Zod validation
  const userRole = React.useMemo((): UserRole => {
    try {
      // Prioritize session data over user object for accuracy
      const role = sessionQuery.data?.user?.role || user?.role || 'guest';
      const validatedRole = UserRoleSchema.parse(role);
      
      log.auth.debug('User role validated', {
        role: validatedRole,
        source: sessionQuery.data?.user?.role ? 'session' : 'userObject'
      });
      
      return validatedRole;
    } catch (error) {
      log.warn('Invalid user role detected, defaulting to guest', 'TAB_LAYOUT', {
        userRole: user?.role,
        sessionRole: sessionQuery.data?.user?.role,
        error: error instanceof Error ? error.message : String(error)
      });
      return 'guest';
    }
  }, [user?.role, sessionQuery.data?.user?.role]);
  
  // Calculate tab access using role hierarchy with comprehensive validation
  const tabAccess = React.useMemo(() => {
    const allowedRoles = ROLE_HIERARCHY[userRole] || ['guest'];
    
    return {
      canAccessManager: allowedRoles.includes('manager'),
      canAccessAdmin: allowedRoles.includes('admin'),
      userRole,
      allowedRoles
    };
  }, [userRole]);
  
  // Enhanced tab button factory with analytics and validation
  const createRoleBasedTabButton = React.useCallback((requiredRole?: UserRole) => {
    return (props: any) => {
      const canAccess = !requiredRole || tabAccess.allowedRoles.includes(requiredRole);
      
      if (!canAccess) {
        return null;
      }
      
      // Analytics tracking for tab access
      if (props.accessibilityState?.selected) {
        log.auth.debug('Tab accessed', {
          requiredRole,
          userRole: tabAccess.userRole,
          timestamp: new Date().toISOString()
        });
      }
      
      return <HapticTab {...props} />;
    };
  }, [tabAccess]);
  
  // Memoized tab buttons for performance
  const managerTabButton = React.useMemo(() => createRoleBasedTabButton('manager'), [createRoleBasedTabButton]);
  const adminTabButton = React.useMemo(() => createRoleBasedTabButton('admin'), [createRoleBasedTabButton]);
  
  // Enhanced screen options with performance optimization
  const screenOptions = React.useMemo(() => ({
    tabBarActiveTintColor: '#007AFF',
    tabBarInactiveTintColor: '#8E8E93',
    headerShown: false,
    tabBarButton: HapticTab,
    tabBarBackground: TabBarBackground,
    tabBarStyle: Platform.select({
      ios: {
        position: 'absolute' as const,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderTopColor: 'rgba(0, 0, 0, 0.1)',
      },
      default: {
        backgroundColor: '#ffffff',
        borderTopColor: '#e0e0e0',
        borderTopWidth: 1,
      },
    }),
    tabBarHideOnKeyboard: true,
    lazy: true, // Enable lazy loading for better performance
    tabBarAllowFontScaling: false, // Prevent accessibility font scaling issues
  }), []);
  
  // Performance monitoring with enhanced metrics
  const renderCountRef = React.useRef(0);
  const startTimeRef = React.useRef(Date.now());
  renderCountRef.current++;
  
  React.useEffect(() => {
    const renderTime = Date.now() - startTimeRef.current;
    
    // Log performance metrics
    if (renderCountRef.current > 3) {
      log.warn('Excessive tab layout re-renders detected', 'PERFORMANCE', {
        renderCount: renderCountRef.current,
        renderTime,
        userRole: tabAccess.userRole,
        hasHydrated,
        isAuthenticated,
        sessionValid: sessionQuery.isSuccess,
      });
    }
    
    // Reset timer for next render cycle
    startTimeRef.current = Date.now();
  }, [tabAccess.userRole, hasHydrated, isAuthenticated, sessionQuery.isSuccess]);
  
  // Enhanced auth check with session validation
  React.useLayoutEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      log.auth.debug('Redirecting unauthenticated user from tabs');
      router.replace('/(auth)/login');
    } else if (hasHydrated && isAuthenticated && sessionQuery.isError) {
      const error = sessionQuery.error;
      if (error?.data?.code === 'UNAUTHORIZED') {
        log.auth.debug('Session validation failed, redirecting to login', {
          error: error.message
        });
        router.replace('/(auth)/login');
      }
    }
  }, [hasHydrated, isAuthenticated, sessionQuery.isError, sessionQuery.error, router]);
  
  // Wait for auth to be ready
  if (!hasHydrated || !isAuthenticated) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: '#f8f9fa'
      }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }
  
  // Show loading during session validation
  if (sessionQuery.isLoading) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: '#f8f9fa'
      }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }
  
  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size = 28 }) => (
            <IconSymbol size={size} name="house.fill" color={color} />
          ),
          tabBarAccessibilityLabel: "Home tab",
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          tabBarIcon: ({ color, size = 28 }) => (
            <IconSymbol size={size} name="paperplane.fill" color={color} />
          ),
          tabBarAccessibilityLabel: "Explore tab",
        }}
      />
      <Tabs.Screen
        name="manager"
        options={{
          title: "Manager",
          tabBarIcon: ({ color, size = 28 }) => (
            <IconSymbol size={size} name="person.2.fill" color={color} />
          ),
          tabBarButton: tabAccess.canAccessManager ? managerTabButton : () => null,
          tabBarAccessibilityLabel: "Manager tab",
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: "Admin",
          tabBarIcon: ({ color, size = 28 }) => (
            <IconSymbol size={size} name="gear" color={color} />
          ),
          tabBarButton: tabAccess.canAccessAdmin ? adminTabButton : () => null,
          tabBarAccessibilityLabel: "Admin tab",
        }}
      />
    </Tabs>
  );
});

export default TabLayout;