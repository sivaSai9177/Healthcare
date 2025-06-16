import React from 'react';
import { Platform, ScrollView, View } from 'react-native';
import { 
  Container, 
  VStack, 
  HStack,
  Text, 
  Card, 
  Button,
  Box,
  Heading1,
  Badge,
  SimpleBreadcrumb,
  SidebarTrigger,
  Separator,
} from '@/components/universal';
import { 
  AlertCreationForm
} from '@/components/blocks/healthcare';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useRouter, Redirect } from 'expo-router';
import { useThemeStore } from '@/lib/stores/theme-store';
import { log } from '@/lib/core/debug/logger';
import { useSpacing } from '@/lib/stores/spacing-store';

export default function OperatorDashboardSimple() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { theme } = useThemeStore();
  const { spacing } = useSpacing();
  
  // Check if user is an operator
  if (!user || user.role !== 'operator') {
    log.warn('Non-operator tried to access operator dashboard', 'OPERATOR_DASHBOARD', { 
      userId: user?.id, 
      role: user?.role 
    });
    return <Redirect href="/(home)/" />;
  }
  
  // For demo, use a placeholder hospital ID
  const hospitalId = 'f155b026-01bd-4212-94f3-e7aedef2801d';
  
  const content = (
    <VStack gap={spacing[8]}>
      {/* Header */}
      <VStack gap={spacing[4]}>
        <HStack justifyContent="space-between" alignItems="center">
          <VStack gap={spacing[2]}>
            <Heading1>Emergency Alert Center</Heading1>
            <Text colorTheme="mutedForeground">
              Create and manage emergency alerts for medical staff
            </Text>
          </VStack>
          <Badge variant="error" size="large">
            <Text weight="semibold">OPERATOR MODE</Text>
          </Badge>
        </HStack>
      </VStack>
      
      {/* Quick Stats */}
      <HStack gap={spacing[4]}>
        <Card style={{ flex: 1 }} padding={spacing[6]}>
          <VStack alignItems="center" gap={spacing[3]}>
            <Text size="3xl" weight="bold" colorTheme="destructive">5</Text>
            <Text size="sm" colorTheme="mutedForeground">Active Alerts</Text>
          </VStack>
        </Card>
        <Card style={{ flex: 1 }} padding={spacing[6]}>
          <VStack alignItems="center" gap={spacing[3]}>
            <Text size="3xl" weight="bold" colorTheme="success">2.3m</Text>
            <Text size="sm" colorTheme="mutedForeground">Avg Response</Text>
          </VStack>
        </Card>
        <Card style={{ flex: 1 }} padding={spacing[6]}>
          <VStack alignItems="center" gap={spacing[3]}>
            <Text size="3xl" weight="bold" colorTheme="primary">24</Text>
            <Text size="sm" colorTheme="mutedForeground">Staff Online</Text>
          </VStack>
        </Card>
      </HStack>
      
      {/* Alert Creation Section */}
      <VStack gap={spacing[6]}>
        <Text size="xl" weight="bold">Create New Alert</Text>
        <AlertCreationForm hospitalId={hospitalId} />
      </VStack>
      
      {/* Quick Actions */}
      <VStack gap={spacing[4]}>
        <Text size="xl" weight="bold">Quick Actions</Text>
        <HStack gap={spacing[3]}>
          <Button
            variant="outline"
            onPress={() => router.push('/(healthcare)/alerts')}
            style={{ flex: 1 }}
          >
            View All Alerts
          </Button>
          <Button
            variant="outline"
            onPress={() => router.push('/(healthcare)/dashboard')}
            style={{ flex: 1 }}
          >
            Healthcare Dashboard
          </Button>
        </HStack>
      </VStack>
    </VStack>
  );
  
  // Mobile view
  if (Platform.OS !== 'web') {
    const SafeAreaView = require('react-native-safe-area-context').SafeAreaView;
    
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          <VStack p={spacing[6]} gap={spacing[6]}>
            {content}
          </VStack>
        </ScrollView>
      </SafeAreaView>
    );
  }
  
  // Web view
  return (
    <Container>
      <VStack p={0} spacing={0}>
        {/* Header with Toggle and Breadcrumbs */}
        <Box
          px={spacing[6]}
          py={spacing[4]}
          borderBottomWidth={1}
          borderTheme="border"
        >
          <HStack alignItems="center" spacing={spacing[3]} mb={spacing[3]}>
            <SidebarTrigger />
            <Separator orientation="vertical" style={{ height: 24 }} />
            <SimpleBreadcrumb
              items={[
                { label: "Healthcare", href: "/(home)/healthcare-dashboard" },
                { label: "Operator Dashboard", current: true }
              ]}
              showHome={false}
            />
          </HStack>
        </Box>
        
        <ScrollView>
          <VStack p={spacing[8]} gap={spacing[8]}>
            {content}
          </VStack>
        </ScrollView>
      </VStack>
    </Container>
  );
}