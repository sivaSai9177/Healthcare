import { HapticTab } from "@/components/universal/interaction/HapticTab";
import { Symbol as IconSymbol } from '@/components/universal';
import { 
  NavMain,
  NavUser,
  TeamSwitcher,
} from '@/components/blocks/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarRail,
} from '@/components/universal/navigation/Sidebar';
import TabBarBackground from "@/components/universal/navigation/TabBarBackground";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/lib/theme/provider";
import { Redirect, Slot, Tabs, usePathname } from "expo-router";
import React from "react";
import { logger } from "@/lib/core/debug/unified-logger";
import { ActivityIndicator, Dimensions, Platform, View } from "react-native";
import { Symbol } from '@/components/universal/display/Symbols';
import { tabAnimationConfig } from "@/lib/navigation/transitions";

export default function TabLayout() {
  const theme = useTheme();
  const { user, isAuthenticated, hasHydrated } = useAuth();
  const pathname = usePathname();
  
  // Check if user has admin/manager role
  const isAdmin = user?.role === "admin";
  const isManager = user?.role === "manager";
  const isHealthcareStaff = user?.role === "doctor" || 
                           user?.role === "nurse" || 
                           user?.role === "operator" ||
                           user?.role === "head_doctor";
  
  // Log authentication state and tab visibility
  React.useEffect(() => {
    logger.auth.debug('TabLayout auth state', {
      hasHydrated,
      isAuthenticated,
      userId: user?.id,
      userRole: user?.role,
      pathname,
      isAdmin,
      isManager,
      isHealthcareStaff,
      platform: Platform.OS
    });
    
    // Count visible tabs
    let visibleTabs = ['home', 'explore', 'settings']; // Always visible
    if (isAdmin) visibleTabs.push('admin');
    if (isManager || isAdmin) visibleTabs.push('manager');
    if (user?.role === "operator") visibleTabs.push('operator');
    logger.auth.debug('[TabLayout] Visible tabs', { count: visibleTabs.length, tabs: visibleTabs });
  }, [hasHydrated, isAuthenticated, user, pathname, isAdmin, isManager, isHealthcareStaff]);

  // Wait for auth state to be loaded
  if (!hasHydrated) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  // Define navigation items
  const navItems = [
    {
      id: "home",
      title: "Home",
      href: "/(home)",
      icon: "house.fill",
    },
    {
      id: "explore",
      title: "Explore",
      href: "/(home)/explore",
      icon: "safari",
    },
  ];

  // Add admin tab if user is admin
  if (isAdmin) {
    navItems.push({
      id: "admin",
      title: "Admin",
      href: "/(home)/admin",
      icon: "shield.checkered",
    });
  }

  // Add manager tab if user is manager or admin
  if (isManager || isAdmin) {
    navItems.push({
      id: "manager",
      title: "Manager",
      href: "/(home)/manager",
      icon: "people-circle",
    });
    
    // Add organization dashboard tab
    navItems.push({
      id: "organization",
      title: "Organization",
      href: "/(organization)/dashboard",
      icon: "building.2",
    });
  }
  
  // Add healthcare tabs if user is healthcare staff
  if (isHealthcareStaff) {
    navItems.push({
      id: "healthcare",
      title: "Healthcare",
      href: "/(healthcare)/dashboard",
      icon: "stethoscope",
    });
    
    // Add operator dashboard for operators
    if (user?.role === "operator") {
      navItems.push({
        id: "operator",
        title: "Alerts",
        href: "/(home)/operator-dashboard",
        icon: "exclamationmark.circle",
      });
    }
  }

  // Always add settings
  navItems.push({
    id: "settings",
    title: "Settings",
    href: "/(home)/settings",
    icon: "settings",
  });

  // Get current pathname for active state

  // Convert nav items to sidebar format for NavMain
  const sidebarItems = [
    {
      title: "Dashboard",
      url: "/(home)",
      icon: "house.fill",
      isActive: pathname === "/(home)" || pathname === "/(home)/index",
    },
    {
      title: "Explore",
      url: "/(home)/explore",
      icon: "safari",
    },
  ];

  // Add admin-specific items
  if (isAdmin) {
    sidebarItems.push({
      title: "Admin",
      url: "/(home)/admin",
      icon: "shield.checkered",
    });
  }

  // Add manager items
  if (isManager || isAdmin) {
    sidebarItems.push({
      title: "Team",
      url: "/(home)/manager",
      icon: "person.2",
    });
    
    // Add organization dashboard
    sidebarItems.push({
      title: "Organization",
      url: "/(organization)/dashboard",
      icon: "building.2",
    });
  }
  
  // Add healthcare items
  if (isHealthcareStaff) {
    sidebarItems.push({
      title: "Healthcare",
      url: "/(healthcare)/dashboard",
      icon: "stethoscope",
    });
    
    if (user?.role === "operator") {
      sidebarItems.push({
        title: "Alert Center",
        url: "/(home)/operator-dashboard",
        icon: "bell.badge",
      });
    }
  }

  // Settings at the end
  sidebarItems.push({
    title: "Settings",
    url: "/(home)/settings",
    icon: "gearshape",
  });

  // Get window dimensions
  const { width: screenWidth } = Dimensions.get("window");
  const breakpoint = screenWidth >= 1024 ? 'lg' : screenWidth >= 768 ? 'md' : 'sm';
  const isDesktop = Platform.OS === "web" && ['lg', 'xl', '2xl'].includes(breakpoint);

  // Use Sidebar for desktop web
  if (Platform.OS === "web" && isDesktop) {
    return (
      <SidebarProvider defaultOpen={true}>
        <View style={{ flex: 1, flexDirection: "row" }}>
          <Sidebar collapsible="icon">
            <SidebarHeader>
              <TeamSwitcher
                teams={[
                  {
                    id: "1",
                    name: "Acme Inc",
                    plan: "Enterprise",
                    logo: ({ size, color }) => (
                      <Symbol name="building.2" size={size} color={color} />
                    ),
                  },
                  {
                    id: "2",
                    name: "Acme Corp.",
                    plan: "Startup",
                    logo: ({ size, color }) => (
                      <Symbol name="airplane" size={size} color={color} />
                    ),
                  },
                  {
                    id: "3",
                    name: "My Organization",
                    plan: "Free",
                  },
                ]}
              />
            </SidebarHeader>
            <SidebarContent>
              <NavMain items={sidebarItems} />
            </SidebarContent>
            <SidebarFooter>
              <NavUser
                user={{
                  name: user?.name || "User",
                  email: user?.email || "",
                  avatar: user?.image,
                }}
              />
            </SidebarFooter>
            <SidebarRail />
          </Sidebar>
          <SidebarInset>
            <View style={{ flex: 1 }}>
              <Slot />
            </View>
          </SidebarInset>
        </View>
      </SidebarProvider>
    );
  }

  // Use native tabs on mobile
  return (
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
      {/* Always visible tabs first */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="paperplane.fill" color={color} />
          ),
        }}
      />
      
      {/* Conditionally visible tabs */}
      <Tabs.Screen
        name="admin"
        options={{
          title: "Admin",
          tabBarIcon: ({ color }) => (
            <Symbol size={24} name="shield.fill" color={color} />
          ),
          href: isAdmin ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="manager"
        options={{
          title: "Manager",
          tabBarIcon: ({ color }) => (
            <Symbol size={24} name="person.2.circle" color={color} />
          ),
          href: (isManager || isAdmin) ? undefined : null,
        }}
      />
      
      {/* Healthcare tab - visible for healthcare staff */}
      <Tabs.Screen
        name="healthcare-dashboard"
        options={{
          title: "Healthcare",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="stethoscope" color={color} />
          ),
          href: isHealthcareStaff ? undefined : null,
        }}
      />
      
      {/* Settings - always visible */}
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="gearshape.fill" color={color} />
          ),
        }}
      />
      
      {/* Hidden screens - grouped at the end */}
      <Tabs.Screen
        name="organization-dashboard"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="operator-dashboard"
        options={{
          href: null,
        }}
      />
      {/* Hidden screens */}
      <Tabs.Screen
        name="create-organization"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="organization-settings"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
