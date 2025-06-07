import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import {
  NavMain07,
  NavUser07,
  Sidebar07,
  Sidebar07Content,
  Sidebar07Footer,
  Sidebar07Header,
  Sidebar07Inset,
  Sidebar07Provider,
  Sidebar07Rail,
  TeamSwitcher07,
} from "@/components/universal";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/lib/theme/theme-provider";
import { Ionicons } from "@expo/vector-icons";
import { Redirect, Slot, Tabs, usePathname } from "expo-router";
import React from "react";
import { ActivityIndicator, Dimensions, Platform, View } from "react-native";

export default function TabLayout() {
  const theme = useTheme();
  const { user, isAuthenticated, hasHydrated } = useAuth();
  const pathname = usePathname();

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

  // Check if user has admin/manager role
  const isAdmin = user?.role === "admin";
  const isManager = user?.role === "manager";

  // Define navigation items
  const navItems = [
    {
      id: "home",
      title: "Home",
      href: "/(home)",
      icon: "home" as keyof typeof Ionicons.glyphMap,
    },
    {
      id: "explore",
      title: "Explore",
      href: "/(home)/explore",
      icon: "compass" as keyof typeof Ionicons.glyphMap,
    },
  ];

  // Add admin tab if user is admin
  if (isAdmin) {
    navItems.push({
      id: "admin",
      title: "Admin",
      href: "/(home)/admin",
      icon: "shield-checkmark" as keyof typeof Ionicons.glyphMap,
    });
  }

  // Add manager tab if user is manager
  if (isManager || isAdmin) {
    navItems.push({
      id: "team",
      title: "Team",
      href: "/(home)/manager",
      icon: "people" as keyof typeof Ionicons.glyphMap,
    });
  }

  // Always add settings
  navItems.push({
    id: "settings",
    title: "Settings",
    href: "/(home)/settings",
    icon: "settings" as keyof typeof Ionicons.glyphMap,
  });

  // Get current pathname for active state

  // Convert nav items to sidebar format for NavMain07
  const sidebarItems = [
    {
      title: "Dashboard",
      url: "/(home)",
      icon: "home" as keyof typeof Ionicons.glyphMap,
      isActive: pathname === "/(home)" || pathname === "/(home)/index",
    },
    {
      title: "Explore",
      url: "/(home)/explore",
      icon: "compass" as keyof typeof Ionicons.glyphMap,
    },
  ];

  // Add admin-specific items
  if (isAdmin) {
    sidebarItems.push({
      title: "Admin",
      url: "/(home)/admin",
      icon: "shield-checkmark" as keyof typeof Ionicons.glyphMap,
    });
  }

  // Add manager items
  if (isManager || isAdmin) {
    sidebarItems.push({
      title: "Team",
      url: "/(home)/manager",
      icon: "people" as keyof typeof Ionicons.glyphMap,
    });
  }

  // Settings at the end
  sidebarItems.push({
    title: "Settings",
    url: "/(home)/settings",
    icon: "settings-outline" as keyof typeof Ionicons.glyphMap,
  });

  // Get window dimensions
  const { width: screenWidth } = Dimensions.get("window");
  const isDesktop = Platform.OS === "web" && screenWidth >= 1024;

  // Use Sidebar07 for desktop web
  if (Platform.OS === "web" && isDesktop) {
    return (
      <Sidebar07Provider defaultOpen={true}>
        <View style={{ flex: 1, flexDirection: "row" }}>
          <Sidebar07 collapsible="icon">
            <Sidebar07Header>
              <TeamSwitcher07
                teams={[
                  {
                    name: "Acme Inc",
                    plan: "Enterprise",
                    logo: ({ size, color }) => (
                      <Ionicons name="business" size={size} color={color} />
                    ),
                  },
                  {
                    name: "Acme Corp.",
                    plan: "Startup",
                    logo: ({ size, color }) => (
                      <Ionicons name="rocket" size={size} color={color} />
                    ),
                  },
                  {
                    name: "My Organization",
                    plan: "Free",
                  },
                ]}
              />
            </Sidebar07Header>
            <Sidebar07Content>
              <NavMain07 items={sidebarItems} />
            </Sidebar07Content>
            <Sidebar07Footer>
              <NavUser07
                user={{
                  name: user?.name || "User",
                  email: user?.email || "",
                  avatar: user?.image,
                }}
              />
            </Sidebar07Footer>
            <Sidebar07Rail />
          </Sidebar07>
          <Sidebar07Inset>
            <View style={{ flex: 1 }}>
              <Slot />
            </View>
          </Sidebar07Inset>
        </View>
      </Sidebar07Provider>
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
      }}
    >
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
      {/* Admin Dashboard - Only visible for admin users */}
      <Tabs.Screen
        name="admin"
        options={{
          title: "Admin",
          tabBarIcon: ({ color }) => (
            <Ionicons size={24} name="shield-checkmark" color={color} />
          ),
          // Hide tab for non-admin users
          href: isAdmin ? undefined : null,
        }}
      />
      {/* Keep old route for compatibility */}
      <Tabs.Screen
        name="admin-dashboard"
        options={{
          href: null, // Always hidden
        }}
      />
      {/* Manager Dashboard - Only visible for manager users */}
      {isManager && (
        <Tabs.Screen
          name="manager"
          options={{
            title: "Team",
            tabBarIcon: ({ color }) => (
              <Ionicons size={24} name="people" color={color} />
            ),
            // Hide if not manager
            href: isManager ? undefined : null,
          }}
        />
      )}
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="gearshape.fill" color={color} />
          ),
        }}
      />
      {/* Hidden screens */}
      <Tabs.Screen
        name="demo-universal"
        options={{
          href: null, // Always hidden from tab bar
        }}
      />
      <Tabs.Screen
        name="sidebar-test"
        options={{
          href: null, // Always hidden from tab bar
        }}
      />
    </Tabs>
  );
}
