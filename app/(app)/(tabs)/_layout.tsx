import React from 'react';
import { Tabs, usePathname , Slot } from 'expo-router';
import { Platform, Dimensions , View } from 'react-native';
import { useTheme } from '@/lib/theme/provider';
import { useAuth } from '@/hooks/useAuth';
import { HapticTab } from '@/components/universal/interaction/HapticTab';
import TabBarBackground from '@/components/universal/navigation/TabBarBackground';
import { Symbol } from '@/components/universal/display/Symbols';
import { AnimatedTabs } from '@/components/navigation/AnimatedStack';
import { useLayoutTransition } from '@/hooks/useLayoutTransition';
import Animated from 'react-native-reanimated';
import { 
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarInset,
  SidebarRail,
} from '@/components/universal/navigation/Sidebar';
import { NavMain, NavUser, TeamSwitcher } from '@/components/blocks/navigation';
import { EnhancedSidebar } from '@/components/blocks/navigation/EnhancedSidebar';
import { FloatingAlertButton } from '@/components/blocks/healthcare';
import { useHealthcareAccess, usePermission, PERMISSIONS } from '@/hooks/usePermissions';
import { HealthcareErrorBoundary } from '@/components/blocks/errors/HealthcareErrorBoundary';
import { AppLoadingScreen } from '@/components/blocks/loading/AppLoadingScreen';

export default function TabsLayout() {
  const theme = useTheme();
  const { user } = useAuth();
  const pathname = usePathname();
  
  // Use permission hooks for access control
  const { canViewAlerts, canViewPatients, canCreateAlerts: canCreateAlertsFromHook, isLoading } = useHealthcareAccess();
  const { hasPermission: canCreateAlertsPermission } = usePermission(PERMISSIONS.CREATE_ALERTS);
  const canCreateAlerts = canCreateAlertsFromHook || canCreateAlertsPermission;
  
  // Memoize permission values to prevent unnecessary re-renders
  const permissions = React.useMemo(() => ({
    canViewAlerts,
    canViewPatients,
    canCreateAlerts
  }), [canViewAlerts, canViewPatients, canCreateAlerts]);
  
  // Desktop sidebar navigation
  const { width: screenWidth } = Dimensions.get('window');
  const isDesktop = Platform.OS === 'web' && screenWidth >= 1024;
  
  // Show loading screen while permissions are being determined
  if (isLoading) {
    return <AppLoadingScreen showProgress />;
  }
  
  if (isDesktop) {
    const sidebarItems = [
      {
        title: 'Home',
        url: '/home',
        icon: 'house.fill',
        isActive: pathname === '/home',
      },
      ...(permissions.canViewAlerts ? [{
        title: 'Alerts',
        url: '/alerts',
        icon: 'bell.badge',
        isActive: pathname === '/alerts' || pathname.startsWith('/alerts/'),
      }] : []),
      ...(permissions.canViewPatients ? [{
        title: 'Patients',
        url: '/patients',
        icon: 'person.2',
        isActive: pathname === '/patients' || pathname.startsWith('/patients/'),
      }] : []),
      {
        title: 'Settings',
        url: '/settings',
        icon: 'gearshape',
        isActive: pathname === '/settings' || pathname.startsWith('/settings/'),
      },
    ];

    return (
      <SidebarProvider defaultOpen={true}>
        <View style={{ flex: 1, flexDirection: 'row' }}>
          <EnhancedSidebar />
          <SidebarInset>
            <View style={{ flex: 1 }}>
              <Slot />
            </View>
          </SidebarInset>
        </View>
      </SidebarProvider>
    );
  }

  // Mobile tab navigation
  return (
    <HealthcareErrorBoundary>
      <Tabs
        screenOptions={{
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.mutedForeground,
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopColor: theme.border,
        },
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        animation: 'shift',
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <Symbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color }) => (
            <Symbol size={28} name="bell.fill" color={color} />
          ),
          href: permissions.canViewAlerts ? undefined : null,
        }}
      />
      
      <Tabs.Screen
        name="patients"
        options={{
          title: 'Patients',
          tabBarIcon: ({ color }) => (
            <Symbol size={28} name="person.2.fill" color={color} />
          ),
          href: permissions.canViewPatients ? undefined : null,
        }}
      />
      
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => (
            <Symbol size={28} name="gearshape.fill" color={color} />
          ),
        }}
      />
    </Tabs>
    {permissions.canCreateAlerts && <FloatingAlertButton />}
    </HealthcareErrorBoundary>
  );
}