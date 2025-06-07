import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { useTheme } from "@/lib/theme/theme-provider";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, Slot, Redirect, usePathname } from "expo-router";
import React from "react";
import { Platform, View, ActivityIndicator, Dimensions } from "react-native";
import { 
  Sidebar07Provider,
  Sidebar07,
  Sidebar07Header,
  Sidebar07Content,
  Sidebar07Footer,
  Sidebar07Rail,
  Sidebar07Inset,
  Sidebar07Trigger,
  NavMain07,
  NavUser07,
  TeamSwitcher07,
  NavProjects07,
  Text,
  HStack,
} from "@/components/universal/Sidebar07";
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
  const theme = useTheme();
  const { user, isAuthenticated, hasHydrated } = useAuth();
  
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
  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';
  
  // Define navigation items
  const navItems = [
    {
      id: 'home',
      title: 'Home',
      href: '/(home)',
      icon: 'home' as keyof typeof Ionicons.glyphMap,
    },
    {
      id: 'explore',
      title: 'Explore',
      href: '/(home)/explore',
      icon: 'compass' as keyof typeof Ionicons.glyphMap,
    },
  ];
  
  // Add admin tab if user is admin
  if (isAdmin) {
    navItems.push({
      id: 'admin',
      title: 'Admin',
      href: '/(home)/admin',
      icon: 'shield-checkmark' as keyof typeof Ionicons.glyphMap,
      requiresRole: ['admin'],
    });
  }
  
  // Add manager tab if user is manager
  if (isManager || isAdmin) {
    navItems.push({
      id: 'team',
      title: 'Team',
      href: '/(home)/manager',
      icon: 'people' as keyof typeof Ionicons.glyphMap,
      requiresRole: ['manager', 'admin'],
    });
  }
  
  // Always add settings
  navItems.push({
    id: 'settings',
    title: 'Settings',
    href: '/(home)/settings',
    icon: 'settings' as keyof typeof Ionicons.glyphMap,
  });
  
  // Get current pathname for active state
  const pathname = usePathname();
  
  // Convert nav items to sidebar format for NavMain07
  const sidebarItems = [
    {
      title: 'Home',
      url: '/(home)',
      icon: 'home-outline' as keyof typeof Ionicons.glyphMap,
      isActive: pathname === '/(home)' || pathname === '/(home)/index',
    },
    {
      title: 'Explore',
      url: '/(home)/explore',
      icon: 'compass-outline' as keyof typeof Ionicons.glyphMap,
    },
  ];

  // Add role-based items
  if (isAdmin) {
    sidebarItems.push({
      title: 'Admin',
      url: '/(home)/admin',
      icon: 'shield-checkmark-outline' as keyof typeof Ionicons.glyphMap,
    });
  }
  
  if (isManager || isAdmin) {
    sidebarItems.push({
      title: 'Team',
      url: '/(home)/manager',
      icon: 'people-outline' as keyof typeof Ionicons.glyphMap,
    });
  }
  
  // Add settings with submenu
  sidebarItems.push({
    title: 'Settings',
    url: '/(home)/settings',
    icon: 'settings-outline' as keyof typeof Ionicons.glyphMap,
    items: [
      { title: 'General', url: '/(home)/settings' },
      { title: 'Theme', url: '/(home)/settings#theme' },
      { title: 'Account', url: '/(home)/settings#account' },
    ],
  });

  // Get window dimensions and track resize
  const [windowWidth, setWindowWidth] = React.useState(() => {
    return Dimensions.get('window').width;
  });
  
  // Update dimensions on resize
  React.useEffect(() => {
    if (Platform.OS !== 'web') return;
    
    const updateDimensions = () => {
      setWindowWidth(Dimensions.get('window').width);
    };
    
    const subscription = Dimensions.addEventListener('change', updateDimensions);
    
    return () => {
      subscription?.remove();
    };
  }, []);
  
  const isDesktop = Platform.OS === 'web' && windowWidth >= 1024;

  // Use Sidebar07 for desktop web, but switch to tabs on mobile web
  if (Platform.OS === 'web') {
    // Always use sidebar on web, it will handle responsive behavior internally
    // The sidebar component will show as a drawer on mobile
    return (
      <Sidebar07Provider defaultOpen={true}>
        <View style={{ flex: 1, flexDirection: 'row' }}>
          <Sidebar07 collapsible="icon">
            <Sidebar07Header>
              <TeamSwitcher07
                teams={[
                  {
                    name: 'Acme Inc',
                    plan: 'Enterprise',
                    logo: ({ size, color }) => (
                      <Ionicons name="business" size={size} color={color} />
                    ),
                  },
                  {
                    name: 'Acme Corp.',
                    plan: 'Startup',
                    logo: ({ size, color }) => (
                      <Ionicons name="rocket" size={size} color={color} />
                    ),
                  },
                  {
                    name: 'My Organization',
                    plan: 'Free',
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
                  name: user?.name || 'User',
                  email: user?.email || '',
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