import { useRequireRole } from "@/components/ProtectedRoute";
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
  ScrollContainer,
  Heading1,
  Heading2,
  HStack,
  Input,
  SimpleBreadcrumb,
  Skeleton,
  Separator,
  Sidebar07Trigger,
  Text,
  VStack,
} from "@/components/universal";
import { useAuth } from "@/hooks/useAuth";
import { SpacingScale } from "@/lib/design-system";
import { useTheme } from "@/lib/theme/theme-provider";
import { api } from "@/lib/trpc";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Alert, Platform, ScrollView, TouchableOpacity } from "react-native";


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

  // Loading state
  if (!hasHydrated || isLoading) {
    return (
      <ScrollContainer safe>
        <Box flex={1} justifyContent="center" alignItems="center" minHeight={400}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text mt={2 as SpacingScale} colorTheme="mutedForeground">
            Loading admin dashboard...
          </Text>
        </Box>
      </ScrollContainer>
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

  // Render admin page with category-style navigation like explore page
  return (
    <ScrollContainer safe>
      <VStack p={0} spacing={0}>
        {/* Header with Toggle and Breadcrumbs - Only on Web */}
        {Platform.OS === 'web' && (
          <Box px={4 as SpacingScale} py={3 as SpacingScale} borderBottomWidth={1} borderTheme="border">
            <HStack alignItems="center" spacing={2} mb={2 as SpacingScale}>
              <Sidebar07Trigger />
              <Separator orientation="vertical" style={{ height: 24 }} />
              <SimpleBreadcrumb
                items={[
                  { label: 'Admin', current: true }
                ]}
                showHome={true}
                homeLabel="Dashboard"
                homeHref="/(home)"
              />
            </HStack>
          </Box>
        )}

        <VStack p={4 as SpacingScale}>
          {/* Header */}
          <VStack mb={6 as SpacingScale}>
            <Heading1>Admin Dashboard</Heading1>
            <Text size="base" colorTheme="mutedForeground" mt={1 as SpacingScale}>
              Manage your application, users, and system settings
            </Text>
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
                    bgTheme={activeView === item.id ? 'primary' : 'secondary'}
                    px={4 as SpacingScale}
                    py={2 as SpacingScale}
                    rounded="full"
                    mr={2 as SpacingScale}
                  >
                    <HStack spacing={2} alignItems="center">
                      <Ionicons 
                        name={item.icon} 
                        size={16} 
                        color={activeView === item.id ? theme.primaryForeground : theme.secondaryForeground} 
                      />
                      <Text 
                        colorTheme={activeView === item.id ? 'primaryForeground' : 'secondaryForeground'}
                        weight="semibold"
                      >
                        {item.title}
                      </Text>
                      {item.badge && (
                        <Badge 
                          size="sm" 
                          variant={activeView === item.id ? "default" : "secondary"}
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
          <Box>
            {renderContent()}
          </Box>
        </VStack>
      </VStack>
    </ScrollContainer>
  );
}

// Overview Content Component
const OverviewContent: React.FC = () => {
  const theme = useTheme();
  
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
              <Text size="2xl" weight="bold" colorTheme="foreground">
                1,234
              </Text>
              <Text size="sm" colorTheme="mutedForeground" mt={1 as SpacingScale}>
                Total Users
              </Text>
            </CardContent>
          </Card>
        </Box>
        
        <Box flex={1} minWidth={150}>
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
                <Ionicons name="person-add-outline" size={16} color={theme.foreground} />
                <Text>Add User</Text>
              </HStack>
            </Button>
            <Button variant="outline" onPress={() => Alert.alert("Coming Soon", "This feature will be available soon.")}>
              <HStack spacing={2} alignItems="center">
                <Ionicons name="download-outline" size={16} color={theme.foreground} />
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
                <Card key={user.id}>
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
            <Ionicons name="analytics-outline" size={64} color={theme.mutedForeground} />
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
                <Card key={log.id}>
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
                          variant={log.outcome === "success" ? "default" : "warning"}
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
            <Ionicons name="settings-outline" size={64} color={theme.mutedForeground} />
            <Text size="lg" colorTheme="mutedForeground" mt={4 as SpacingScale}>
              Settings coming soon...
            </Text>
          </Box>
        </CardContent>
      </Card>
    </VStack>
  );
};