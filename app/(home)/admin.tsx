import React, { useState } from "react";
import { View, ScrollView, ActivityIndicator, Platform, Dimensions, Alert, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/trpc";
import { useTheme } from "@/lib/theme/theme-provider";
import { SpacingScale } from "@/lib/design-system";
import { log } from "@/lib/core/logger";
import { useRequireRole } from "@/components/ProtectedRoute";
import { Ionicons } from "@expo/vector-icons";
import {
  Container,
  Box,
  VStack,
  HStack,
  Text,
  Heading1,
  Heading2,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Badge,
  Avatar,
  Separator,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Skeleton,
  Input,
  SimpleBreadcrumb,
  Sidebar07Trigger,
} from "@/components/universal";

// Get device dimensions
const { width: screenWidth } = Dimensions.get("window");
const isDesktop = Platform.OS === "web" && screenWidth >= 1024;
const isTablet = Platform.OS === "web" && screenWidth >= 768 && screenWidth < 1024;
const isMobile = !isDesktop && !isTablet;

// Navigation items
const navItems = [
  {
    id: "overview",
    title: "Overview",
    icon: "grid-outline" as keyof typeof Ionicons.glyphMap,
  },
  {
    id: "users",
    title: "Users",
    icon: "people-outline" as keyof typeof Ionicons.glyphMap,
    badge: "124",
  },
  {
    id: "analytics",
    title: "Analytics", 
    icon: "analytics-outline" as keyof typeof Ionicons.glyphMap,
  },
  {
    id: "audit",
    title: "Audit Logs",
    icon: "document-text-outline" as keyof typeof Ionicons.glyphMap,
  },
  {
    id: "settings",
    title: "Settings",
    icon: "settings-outline" as keyof typeof Ionicons.glyphMap,
  },
];

export default function AdminDashboard() {
  const theme = useTheme();
  const router = useRouter();
  const { hasAccess, isLoading } = useRequireRole(["admin"], "/(home)");
  const { user, hasHydrated } = useAuth();
  
  // State
  const [activeView, setActiveView] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Loading state
  if (!hasHydrated || isLoading) {
    return (
      <Container>
        <Box flex={1} justifyContent="center" alignItems="center">
          <ActivityIndicator size="large" color={theme.primary} />
          <Text mt={2 as SpacingScale} colorTheme="mutedForeground">
            Loading admin dashboard...
          </Text>
        </Box>
      </Container>
    );
  }

  // Authorization check
  if (!user || !hasAccess) {
    return null; // useRequireRole handles redirect
  }

  // Render content based on active view
  const renderContent = () => {
    switch (activeView) {
      case "overview":
        return <OverviewContent />;
      case "users":
        return <UsersContent searchQuery={searchQuery} setSearchQuery={setSearchQuery} />;
      case "analytics":
        return <AnalyticsContent />;
      case "audit":
        return <AuditContent />;
      default:
        return <SettingsContent />;
    }
  };

  // Desktop layout with sidebar
  if (Platform.OS === "web" && !isMobile) {
    return (
      <Box flex={1} flexDirection="row" bgTheme="background">
        {/* Sidebar */}
        <Box
          width={isSidebarOpen ? 240 : 60}
          bgTheme="card"
          borderRightWidth={1}
          borderTheme="border"
          style={{
            transition: 'width 0.2s ease',
          }}
        >
          {/* Sidebar Header */}
          <Box p={3 as SpacingScale} borderBottomWidth={1} borderTheme="border">
            <HStack justifyContent="space-between" alignItems="center">
              {isSidebarOpen ? (
                <Text weight="semibold" size="lg">Admin Portal</Text>
              ) : (
                <Ionicons name="shield-checkmark" size={24} color={theme.primary} />
              )}
              <Button
                variant="ghost"
                size="sm"
                onPress={() => setIsSidebarOpen(!isSidebarOpen)}
              >
                <Ionicons 
                  name={isSidebarOpen ? "chevron-back" : "chevron-forward"} 
                  size={20} 
                  color={theme.foreground} 
                />
              </Button>
            </HStack>
          </Box>

          {/* Navigation */}
          <ScrollView style={{ flex: 1 }}>
            <VStack p={2 as SpacingScale} spacing={1}>
              {navItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => setActiveView(item.id)}
                  style={{
                    backgroundColor: activeView === item.id ? theme.accent : 'transparent',
                    borderRadius: 8,
                    padding: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: isSidebarOpen ? 'flex-start' : 'center',
                  }}
                >
                  <Ionicons 
                    name={item.icon} 
                    size={20} 
                    color={activeView === item.id ? theme.accentForeground : theme.mutedForeground} 
                  />
                  {isSidebarOpen && (
                    <>
                      <Text 
                        ml={3 as SpacingScale}
                        color={activeView === item.id ? theme.accentForeground : theme.foreground}
                        weight={activeView === item.id ? "medium" : "normal"}
                      >
                        {item.title}
                      </Text>
                      {item.badge && (
                        <Badge size="sm" variant="secondary" ml="auto">
                          {item.badge}
                        </Badge>
                      )}
                    </>
                  )}
                </TouchableOpacity>
              ))}
            </VStack>
          </ScrollView>

          {/* Sidebar Footer */}
          <Box p={3 as SpacingScale} borderTopWidth={1} borderTheme="border">
            <HStack spacing={2} alignItems="center">
              <Avatar name={user?.name || user?.email} size="sm" />
              {isSidebarOpen && (
                <VStack flex={1} spacing={0}>
                  <Text size="sm" weight="medium" numberOfLines={1}>
                    {user?.name || 'Admin'}
                  </Text>
                  <Text size="xs" colorTheme="mutedForeground" numberOfLines={1}>
                    {user?.email}
                  </Text>
                </VStack>
              )}
            </HStack>
          </Box>
        </Box>

        {/* Main Content */}
        <Box flex={1}>
          {/* Header */}
          <Box
            bgTheme="background"
            borderBottomWidth={1}
            borderTheme="border"
            style={{
              height: 64,
              ...(Platform.OS === 'ios' && {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 3,
              }),
              ...(Platform.OS === 'android' && {
                elevation: 3,
              }),
              ...(Platform.OS === 'web' && {
                boxShadow: '0 2px 3px rgba(0,0,0,0.05)',
              } as any),
            }}
          >
            <HStack
              flex={1}
              px={4 as SpacingScale}
              alignItems="center"
              justifyContent="space-between"
            >
              {Platform.OS === 'web' && (
                <HStack alignItems="center" spacing={2}>
                  <Sidebar07Trigger />
                  <Separator orientation="vertical" style={{ height: 24 }} />
                  <SimpleBreadcrumb
                    items={[
                      { label: 'Admin', href: '/(home)/admin' },
                      { label: activeView.charAt(0).toUpperCase() + activeView.slice(1), current: true }
                    ]}
                    showHome={true}
                    homeLabel="Dashboard"
                    homeHref="/(home)"
                  />
                </HStack>
              )}

              {/* Right side */}
              <HStack spacing={2} alignItems="center">
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={() => router.push("/(home)")}
                >
                  <HStack spacing={2} alignItems="center">
                    <Ionicons name="home-outline" size={16} />
                    <Text>Back to App</Text>
                  </HStack>
                </Button>
              </HStack>
            </HStack>
          </Box>

          {/* Page Content */}
          <ScrollView style={{ flex: 1 }}>
            <Container>
              <Box p={4 as SpacingScale} pb={8 as SpacingScale}>
                {renderContent()}
              </Box>
            </Container>
          </ScrollView>
        </Box>
      </Box>
    );
  }

  // Mobile layout with tabs
  return (
    <Container>
      <Tabs value={activeView} onValueChange={setActiveView}>
        <Box
          bgTheme="background"
          borderBottomWidth={1}
          borderTheme="border"
          pt={2 as SpacingScale}
        >
          <Heading1 px={4 as SpacingScale} mb={2 as SpacingScale}>
            Admin Dashboard
          </Heading1>
          <TabsList scrollable>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="audit">Audit</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
        </Box>
        
        <ScrollView style={{ flex: 1 }}>
          <Box p={4 as SpacingScale}>
            <TabsContent value="overview">
              <OverviewContent />
            </TabsContent>
            <TabsContent value="users">
              <UsersContent searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
            </TabsContent>
            <TabsContent value="analytics">
              <AnalyticsContent />
            </TabsContent>
            <TabsContent value="audit">
              <AuditContent />
            </TabsContent>
            <TabsContent value="settings">
              <SettingsContent />
            </TabsContent>
          </Box>
        </ScrollView>
      </Tabs>
    </Container>
  );
}

// Overview Content Component
const OverviewContent: React.FC = () => {
  return (
    <VStack spacing={6}>
      <Box>
        <Heading2>Overview</Heading2>
        <Text colorTheme="mutedForeground" mt={1 as SpacingScale}>
          Welcome back! Here's your system overview.
        </Text>
      </Box>

      {/* Stats Cards */}
      <Box flexDirection="row" flexWrap="wrap" gap={4 as SpacingScale}>
        <Box flex={1} minWidth={200}>
          <Card>
            <CardContent p={4 as SpacingScale}>
              <Text size="2xl" weight="bold" colorTheme="foreground">
                1,234
              </Text>
              <Text size="sm" colorTheme="mutedForeground" mt={1 as SpacingScale}>
                Total Users
              </Text>
            </CardContent>
          </Card>
        </Box>
        
        <Box flex={1} minWidth={200}>
          <Card>
            <CardContent p={4 as SpacingScale}>
              <Text size="2xl" weight="bold" colorTheme="foreground">
                89
              </Text>
              <Text size="sm" colorTheme="mutedForeground" mt={1 as SpacingScale}>
                Active Sessions
              </Text>
            </CardContent>
          </Card>
        </Box>
        
        <Box flex={1} minWidth={200}>
          <Card>
            <CardContent p={4 as SpacingScale}>
              <Text size="2xl" weight="bold" colorTheme="foreground">
                98%
              </Text>
              <Text size="sm" colorTheme="mutedForeground" mt={1 as SpacingScale}>
                System Health
              </Text>
            </CardContent>
          </Card>
        </Box>
        
        <Box flex={1} minWidth={200}>
          <Card>
            <CardContent p={4 as SpacingScale}>
              <Text size="2xl" weight="bold" colorTheme="foreground">
                7
              </Text>
              <Text size="sm" colorTheme="mutedForeground" mt={1 as SpacingScale}>
                Failed Logins
              </Text>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <HStack spacing={2} flexWrap="wrap">
            <Button variant="outline" onPress={() => Alert.alert("Coming Soon", "This feature will be available soon.")}>
              <HStack spacing={2} alignItems="center">
                <Ionicons name="person-add-outline" size={16} />
                <Text>Add User</Text>
              </HStack>
            </Button>
            <Button variant="outline" onPress={() => Alert.alert("Coming Soon", "This feature will be available soon.")}>
              <HStack spacing={2} alignItems="center">
                <Ionicons name="download-outline" size={16} />
                <Text>Export Data</Text>
              </HStack>
            </Button>
          </HStack>
        </CardContent>
      </Card>
    </VStack>
  );
};

// Users Content Component
const UsersContent: React.FC<{
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}> = ({ searchQuery, setSearchQuery }) => {
  const theme = useTheme();
  const { user } = useAuth();
  
  // tRPC query
  const usersQuery = api.admin.listUsers.useQuery(
    {
      page: 1,
      limit: 10,
      search: searchQuery,
      role: "all",
      sortBy: "createdAt",
      sortOrder: "desc",
    },
    {
      enabled: !!user && user.role === "admin",
      retry: 1,
    }
  );

  const users = usersQuery.data?.users || [];

  return (
    <VStack spacing={4}>
      <Box>
        <Heading2>User Management</Heading2>
        <Text colorTheme="mutedForeground" mt={1 as SpacingScale}>
          Manage user accounts, roles, and permissions
        </Text>
      </Box>

      {/* Search */}
      <Card>
        <CardContent p={4 as SpacingScale}>
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            {users.length} users found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {usersQuery.isLoading ? (
            <VStack spacing={3}>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} height={60} />
              ))}
            </VStack>
          ) : users.length === 0 ? (
            <Box py={8 as SpacingScale} alignItems="center">
              <Ionicons name="people-outline" size={48} color={theme.mutedForeground} />
              <Text size="lg" colorTheme="mutedForeground" mt={2 as SpacingScale}>
                No users found
              </Text>
            </Box>
          ) : (
            <VStack spacing={3}>
              {users.map((user: any) => (
                <Card key={user.id} variant="outline">
                  <CardContent p={3 as SpacingScale}>
                    <HStack justifyContent="space-between" alignItems="center">
                      <HStack spacing={3} alignItems="center" flex={1}>
                        <Avatar name={user.name || user.email} size="md" />
                        <VStack spacing={0} flex={1}>
                          <Text size="base" weight="medium">
                            {user.name || "Unnamed"}
                          </Text>
                          <Text size="sm" colorTheme="mutedForeground" numberOfLines={1}>
                            {user.email}
                          </Text>
                          <HStack spacing={2} mt={1 as SpacingScale}>
                            <Badge
                              variant={
                                user.role === "admin"
                                  ? "destructive"
                                  : user.role === "manager"
                                  ? "default"
                                  : "outline"
                              }
                              size="sm"
                            >
                              {user.role || "pending"}
                            </Badge>
                          </HStack>
                        </VStack>
                      </HStack>
                    </HStack>
                  </CardContent>
                </Card>
              ))}
            </VStack>
          )}
        </CardContent>
      </Card>
    </VStack>
  );
};

// Analytics Content Component
const AnalyticsContent: React.FC = () => {
  return (
    <VStack spacing={6}>
      <Box>
        <Heading2>Analytics</Heading2>
        <Text colorTheme="mutedForeground" mt={1 as SpacingScale}>
          System performance and user insights
        </Text>
      </Box>

      <Card>
        <CardContent p={8 as SpacingScale}>
          <Box alignItems="center">
            <Ionicons name="analytics-outline" size={64} color="#666" />
            <Text size="lg" colorTheme="mutedForeground" mt={4 as SpacingScale}>
              Analytics coming soon...
            </Text>
          </Box>
        </CardContent>
      </Card>
    </VStack>
  );
};

// Audit Content Component
const AuditContent: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  
  // tRPC query
  const auditLogsQuery = api.admin.getAuditLogs.useQuery(
    {
      page: 1,
      limit: 20,
    },
    {
      enabled: !!user && user.role === "admin",
      retry: 1,
    }
  );

  const auditLogs = auditLogsQuery.data?.logs || [];

  return (
    <VStack spacing={4}>
      <Box>
        <Heading2>Audit Logs</Heading2>
        <Text colorTheme="mutedForeground" mt={1 as SpacingScale}>
          Track system activity and user actions
        </Text>
      </Box>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>System events and user actions</CardDescription>
        </CardHeader>
        <CardContent>
          {auditLogsQuery.isLoading ? (
            <VStack spacing={3}>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} height={80} />
              ))}
            </VStack>
          ) : auditLogs.length === 0 ? (
            <Box py={8 as SpacingScale} alignItems="center">
              <Ionicons
                name="document-text-outline"
                size={48}
                color={theme.mutedForeground}
              />
              <Text size="lg" colorTheme="mutedForeground" mt={2 as SpacingScale}>
                No audit logs found
              </Text>
            </Box>
          ) : (
            <VStack spacing={3}>
              {auditLogs.map((log: any) => (
                <Card key={log.id} variant="outline">
                  <CardContent p={3 as SpacingScale}>
                    <HStack justifyContent="space-between" mb={2 as SpacingScale}>
                      <VStack spacing={1} flex={1}>
                        <HStack spacing={2} alignItems="center">
                          <Ionicons
                            name={
                              log.outcome === "success"
                                ? "checkmark-circle"
                                : "close-circle"
                            }
                            size={20}
                            color={
                              log.outcome === "success"
                                ? theme.success
                                : theme.destructive
                            }
                          />
                          <Text weight="medium">{log.action}</Text>
                        </HStack>
                        <Text size="sm" colorTheme="mutedForeground">
                          {log.userName || log.userEmail || "System"}
                        </Text>
                      </VStack>
                      <VStack alignItems="flex-end" spacing={1}>
                        <Badge
                          variant={log.outcome === "success" ? "default" : "destructive"}
                          size="sm"
                        >
                          {log.outcome}
                        </Badge>
                        <Text size="xs" colorTheme="mutedForeground">
                          {new Date(log.timestamp).toLocaleString()}
                        </Text>
                      </VStack>
                    </HStack>
                  </CardContent>
                </Card>
              ))}
            </VStack>
          )}
        </CardContent>
      </Card>
    </VStack>
  );
};

// Settings Content Component
const SettingsContent: React.FC = () => {
  return (
    <VStack spacing={6}>
      <Box>
        <Heading2>Settings</Heading2>
        <Text colorTheme="mutedForeground" mt={1 as SpacingScale}>
          Configure system settings and preferences
        </Text>
      </Box>

      <Card>
        <CardContent p={8 as SpacingScale}>
          <Box alignItems="center">
            <Ionicons name="settings-outline" size={64} color="#666" />
            <Text size="lg" colorTheme="mutedForeground" mt={4 as SpacingScale}>
              Settings coming soon...
            </Text>
          </Box>
        </CardContent>
      </Card>
    </VStack>
  );
};