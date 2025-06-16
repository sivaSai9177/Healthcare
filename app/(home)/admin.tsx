import { useRequireRole } from "@/components/blocks/auth/ProtectedRoute";
import {
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Heading1,
  Heading2,
  HStack,
  Input,
  ScrollContainer,
  Separator,
  SidebarTrigger,
  SimpleBreadcrumb,
  Skeleton,
  Text,
  VStack,
} from "@/components/universal";
import { useAuth } from "@/hooks/useAuth";
import { SpacingScale } from "@/lib/design";
import { useTheme } from "@/lib/theme/provider";
import { api } from "@/lib/api/trpc";
// import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Symbol } from '@/components/universal/display/Symbols';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  TouchableOpacity,
  View,
  Text as RNText,
} from "react-native";

export default function AdminDashboard() {
  const theme = useTheme();
  // const router = useRouter();
  const { user, hasHydrated, isAuthenticated } = useAuth();
  
  // Manual role check instead of useRequireRole
  const hasAccess = user?.role === 'admin';
  const isLoading = !hasHydrated;
  
  // Debug logging
  React.useEffect(() => {
    console.log('[AdminDashboard] Mounted and rendering');
    console.log('[AdminDashboard] Auth state:', {
      user: user?.email,
      role: user?.role,
      hasAccess,
      isLoading,
      hasHydrated,
      isAuthenticated
    });
    
    // Log visibility every second to debug
    const interval = setInterval(() => {
      console.log('[AdminDashboard] Still visible, user role:', user?.role);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [user, hasAccess, isLoading, hasHydrated, isAuthenticated]);

  // State
  const [activeView, setActiveView] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch user count
  const userCountQuery = api.admin.listUsers.useQuery(
    {
      page: 1,
      limit: 1, // We only need the count, not the actual users
    },
    {
      enabled: !!user && user.role === "admin" && hasHydrated,
      staleTime: 60 * 1000, // Cache for 1 minute
      retry: false, // Don't retry on auth errors
    }
  );

  // Fetch analytics data for error checking
  const { data: analyticsData } = api.admin.getAnalytics.useQuery(
    { timeRange: "month" },
    {
      enabled: !!user && user.role === "admin" && hasHydrated,
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
      retry: false, // Don't retry on auth errors
    }
  );

  // Safely access totalUsers with proper type checking
  const totalUsers = userCountQuery.data?.total;



  // Navigation items with dynamic user count
  const navItems = [
    {
      id: "overview",
      title: "Overview",
      icon: "grid-outline",
    },
    {
      id: "users",
      title: "Users",
      icon: "people-outline",
      badge: totalUsers?.toString(),
    },
    {
      id: "analytics",
      title: "Analytics",
      icon: "analytics-outline",
    },
    {
      id: "audit",
      title: "Audit Logs",
      icon: "document-text-outline",
    },
    {
      id: "settings",
      title: "Settings",
      icon: "settings-outline",
    },
  ];

  // Loading state
  if (!hasHydrated || isLoading) {
    return (
      <ScrollContainer safe>
        <Box
          flex={1}
          justifyContent="center"
          alignItems="center"
          minHeight={400}
        >
          <ActivityIndicator size="large" />
          <Text mt={2 as SpacingScale} colorTheme="mutedForeground">
            Loading admin dashboard...
          </Text>
        </Box>
      </ScrollContainer>
    );
  }

  // Authorization check - show access denied message if needed
  if (!user || !hasAccess) {
    return (
      <ScrollContainer safe>
        <Box
          flex={1}
          justifyContent="center"
          alignItems="center"
          minHeight={400}
        >
          <Text size="lg" colorTheme="mutedForeground">
            {!user ? 'Not authenticated' : 'Access denied - admin role required'}
          </Text>
          <Text size="sm" colorTheme="mutedForeground" mt={2}>
            Current role: {user?.role || 'none'}
          </Text>
          <Text size="sm" colorTheme="mutedForeground" mt={2}>
            Required role: admin
          </Text>
        </Box>
      </ScrollContainer>
    );
  }

  // Render content based on active view
  const renderContent = () => {
    switch (activeView) {
      case "overview":
        return <OverviewContent />;
      case "users":
        return (
          <UsersContent
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        );
      case "analytics":
        return <AnalyticsContent />;
      case "audit":
        return <AuditContent />;
      default:
        return <SettingsContent />;
    }
  };

  // Render admin page with category-style navigation like explore page
  return (
    <ScrollContainer safe>
      <VStack p={0} spacing={0}>
        {/* Header with Toggle and Breadcrumbs - Only on Web */}
        {Platform.OS === "web" && (
          <Box
            px={4 as SpacingScale}
            py={3 as SpacingScale}
            borderBottomWidth={1}
            borderTheme="border"
          >
            <HStack alignItems="center" spacing={2} mb={2 as SpacingScale}>
              <SidebarTrigger />
              <Separator orientation="vertical" style={{ height: 24 }} />
              <SimpleBreadcrumb
                items={[{ label: "Admin", current: true }]}
                showHome={true}
                homeLabel="Dashboard"
                homeHref="/(home)"
              />
            </HStack>
          </Box>
        )}

        <VStack p={4 as SpacingScale} style={{ backgroundColor: 'transparent', minHeight: '100%' }}>
          {/* Header */}
          <VStack mb={6 as SpacingScale}>
            <HStack justifyContent="space-between" alignItems="center">
              <VStack flex={1}>
                <Heading1>Admin Dashboard</Heading1>
                <Text
                  size="base"
                  colorTheme="mutedForeground"
                  mt={1 as SpacingScale}
                >
                  Manage your application, users, and system settings
                </Text>
              </VStack>
            </HStack>
          </VStack>

          {/* Categories */}
          <Box mb={4 as SpacingScale}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginHorizontal: -16 }}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
            >
              {navItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => setActiveView(item.id)}
                >
                  <Box
                    bgTheme={activeView === item.id ? "primary" : "secondary"}
                    px={4 as SpacingScale}
                    py={2 as SpacingScale}
                    rounded="full"
                    mr={2 as SpacingScale}
                    style={{ minWidth: 80 }}
                  >
                    <HStack spacing={2} alignItems="center">
                      <Symbol
                        name={item.icon as any}
                        size={16}
                        color={
                          activeView === item.id
                            ? theme.primaryForeground
                            : theme.secondaryForeground
                        }
                      />
                      <Text
                        colorTheme={
                          activeView === item.id
                            ? "primaryForeground"
                            : "secondaryForeground"
                        }
                        weight="semibold"
                        numberOfLines={1}
                      >
                        {item.title}
                      </Text>
                      {item.badge && (
                        <Badge
                          size="sm"
                          variant={
                            activeView === item.id ? "default" : "secondary"
                          }
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </HStack>
                  </Box>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Box>

          {/* Content */}
          <Box>{renderContent()}</Box>
        </VStack>
      </VStack>
    </ScrollContainer>
  );
}

// Overview Content Component
const OverviewContent: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();

  // Fetch analytics data
  const analyticsQuery = api.admin.getAnalytics.useQuery(
    { timeRange: "month" },
    {
      enabled: !!user && user.role === "admin",
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
      retry: false, // Don't retry on auth errors
    }
  );

  // Safely access analytics data with proper type checking
  const userStats = analyticsQuery.data && 'userStats' in analyticsQuery.data 
    ? analyticsQuery.data.userStats 
    : undefined;
  const systemStats = analyticsQuery.data && 'systemStats' in analyticsQuery.data 
    ? analyticsQuery.data.systemStats 
    : undefined;

  return (
    <VStack spacing={6}>
      <Box>
        <Heading2>Overview</Heading2>
        <Text colorTheme="mutedForeground" mt={1 as SpacingScale}>
          Welcome back! Here&apos;s your system overview.
        </Text>
      </Box>

      {/* Stats Cards */}
      <Box flexDirection="row" flexWrap="wrap" gap={3 as SpacingScale}>
        <Box flex={1} minWidth={150}>
          <Card>
            <CardContent p={4 as SpacingScale}>
              {analyticsQuery.isLoading ? (
                <Skeleton height={32} width={60} />
              ) : analyticsQuery.error ? (
                <Text size="2xl" weight="bold" colorTheme="mutedForeground">
                  -
                </Text>
              ) : (
                <Text size="2xl" weight="bold" colorTheme="foreground">
                  {userStats?.total?.toLocaleString() || "0"}
                </Text>
              )}
              <Text
                size="sm"
                colorTheme="mutedForeground"
                mt={1 as SpacingScale}
              >
                Total Users
              </Text>
            </CardContent>
          </Card>
        </Box>

        <Box flex={1} minWidth={150}>
          <Card>
            <CardContent p={4 as SpacingScale}>
              {analyticsQuery.isLoading ? (
                <Skeleton height={32} width={40} />
              ) : analyticsQuery.error ? (
                <Text size="2xl" weight="bold" colorTheme="mutedForeground">
                  -
                </Text>
              ) : (
                <Text size="2xl" weight="bold" colorTheme="foreground">
                  {systemStats?.totalSessions || "0"}
                </Text>
              )}
              <Text
                size="sm"
                colorTheme="mutedForeground"
                mt={1 as SpacingScale}
              >
                Active Sessions
              </Text>
            </CardContent>
          </Card>
        </Box>

        <Box flex={1} minWidth={200}>
          <Card>
            <CardContent p={4 as SpacingScale}>
              {analyticsQuery.isLoading ? (
                <Skeleton height={32} width={50} />
              ) : analyticsQuery.error ? (
                <Text size="2xl" weight="bold" colorTheme="mutedForeground">
                  -
                </Text>
              ) : (
                <Text size="2xl" weight="bold" colorTheme="foreground">
                  {systemStats?.systemHealth || "0"}%
                </Text>
              )}
              <Text
                size="sm"
                colorTheme="mutedForeground"
                mt={1 as SpacingScale}
              >
                System Health
              </Text>
            </CardContent>
          </Card>
        </Box>

        <Box flex={1} minWidth={200}>
          <Card>
            <CardContent p={4 as SpacingScale}>
              {analyticsQuery.isLoading ? (
                <Skeleton height={32} width={30} />
              ) : analyticsQuery.error ? (
                <Text size="2xl" weight="bold" colorTheme="mutedForeground">
                  -
                </Text>
              ) : (
                <Text size="2xl" weight="bold" colorTheme="foreground">
                  {systemStats?.failedLogins || "0"}
                </Text>
              )}
              <Text
                size="sm"
                colorTheme="mutedForeground"
                mt={1 as SpacingScale}
              >
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
            <Button
              variant="outline"
              onPress={() =>
                Alert.alert(
                  "Coming Soon",
                  "This feature will be available soon."
                )
              }
            >
              <HStack spacing={2} alignItems="center">
                <Symbol
                  name="person.badge.plus"
                  size={16}
                  color={theme.foreground}
                />
                <Text>Add User</Text>
              </HStack>
            </Button>
            <Button
              variant="outline"
              onPress={() =>
                Alert.alert(
                  "Coming Soon",
                  "This feature will be available soon."
                )
              }
            >
              <HStack spacing={2} alignItems="center">
                <Symbol
                  name="arrow.down.circle"
                  size={16}
                  color={theme.foreground}
                />
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

  // Safely access users data with proper type checking
  const users = (usersQuery.data as any)?.users || [];

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
          <CardDescription>{(users as any[]).length} users found</CardDescription>
        </CardHeader>
        <CardContent>
          {usersQuery.isLoading ? (
            <VStack spacing={3}>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} height={60} />
              ))}
            </VStack>
          ) : (users as any[]).length === 0 ? (
            <Box py={8 as SpacingScale} alignItems="center">
              <Symbol
                name="person.2"
                size={48}
                color={theme.mutedForeground}
              />
              <Text
                size="lg"
                colorTheme="mutedForeground"
                mt={2 as SpacingScale}
              >
                No users found
              </Text>
            </Box>
          ) : (
            <VStack spacing={3}>
              {(users as any[]).map((user: any) => (
                <Card key={user.id}>
                  <CardContent p={3 as SpacingScale}>
                    <HStack justifyContent="space-between" alignItems="center">
                      <HStack spacing={3} alignItems="center" flex={1}>
                        <Avatar name={user.name || user.email} size="md" />
                        <VStack spacing={0} flex={1}>
                          <Text size="base" weight="medium">
                            {user.name || "Unnamed"}
                          </Text>
                          <Text
                            size="sm"
                            colorTheme="mutedForeground"
                            numberOfLines={1}
                          >
                            {user.email}
                          </Text>
                          <HStack spacing={2} mt={1 as SpacingScale}>
                            <Badge
                              variant={
                                user.role === "admin"
                                  ? "warning"
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
  const theme = useTheme();

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
            <Symbol
              name="chart.bar" as any
              size={64}
              color={theme.mutedForeground}
            />
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

  // Safely access audit logs with proper type checking
  const auditLogs = auditLogsQuery.data && 'logs' in auditLogsQuery.data 
    ? auditLogsQuery.data.logs 
    : [];

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
              <Symbol
                name="doc.text" as any
                size={48}
                color={theme.mutedForeground}
              />
              <Text
                size="lg"
                colorTheme="mutedForeground"
                mt={2 as SpacingScale}
              >
                No audit logs found
              </Text>
            </Box>
          ) : (
            <VStack spacing={3}>
              {auditLogs.map((log: any) => (
                <Card key={log.id}>
                  <CardContent p={3 as SpacingScale}>
                    <HStack
                      justifyContent="space-between"
                      mb={2 as SpacingScale}
                    >
                      <VStack spacing={1} flex={1}>
                        <HStack spacing={2} alignItems="center">
                          <Symbol
                            name={
                              log.outcome === "success"
                                ? "checkmark.circle"
                                : "xmark.circle"
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
                          variant={
                            log.outcome === "success" ? "default" : "warning"
                          }
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
  const theme = useTheme();

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
            <Symbol
              name="gearshape"
              size={64}
              color={theme.mutedForeground}
            />
            <Text size="lg" colorTheme="mutedForeground" mt={4 as SpacingScale}>
              Settings coming soon...
            </Text>
          </Box>
        </CardContent>
      </Card>
    </VStack>
  );
};
