import { Platform } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { useAuth, useAuthStore } from '@/hooks/useAuth';
import React from 'react';

// Hook to get current user role for tab visibility
const useUserRole = () => {
  return useAuthStore((state) => state.user?.role || 'guest');
};

// Memoize screen options to prevent recreation
const screenOptions = {
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
  lazy: true,
  tabBarAllowFontScaling: false,
} as const;

export default React.memo(function TabLayout() {
  const { hasHydrated, isAuthenticated } = useAuth();
  const router = useRouter();
  const userRole = useUserRole();
  
  // Only redirect on auth state change - minimal dependencies
  React.useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.replace('/(auth)/login');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHydrated, isAuthenticated]); // Intentionally exclude router to prevent re-runs

  // Check role-based access
  const canAccessManager = userRole === 'manager' || userRole === 'admin';
  const canAccessAdmin = userRole === 'admin';

  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size = 28 }) => (
            <IconSymbol size={size} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          tabBarIcon: ({ color, size = 28 }) => (
            <IconSymbol size={size} name="paperplane.fill" color={color} />
          ),
        }}
      />
      {canAccessManager && (
        <Tabs.Screen
          name="manager"
          options={{
            title: "Manager",
            tabBarIcon: ({ color, size = 28 }) => (
              <IconSymbol size={size} name="person.2.fill" color={color} />
            ),
          }}
        />
      )}
      {canAccessAdmin && (
        <Tabs.Screen
          name="admin"
          options={{
            title: "Admin", 
            tabBarIcon: ({ color, size = 28 }) => (
              <IconSymbol size={size} name="gear" color={color} />
            ),
          }}
        />
      )}
    </Tabs>
  );
});