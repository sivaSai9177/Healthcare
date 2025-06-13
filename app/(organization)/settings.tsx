import React from 'react';
import { Platform, ScrollView } from 'react-native';
import { 
  Container, 
  VStack, 
  HStack,
  Box,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  SimpleBreadcrumb,
  SidebarTrigger,
  Separator,
  Grid,
} from '@/components/universal';
import { 
  GeneralSettingsBlock,
} from '@/components/blocks/organization';
import { useSpacing } from '@/lib/stores/spacing-store';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useRouter , Redirect } from 'expo-router';
import { useTheme } from '@/lib/theme/provider';
import { useResponsive } from '@/hooks/responsive';
import { log } from '@/lib/core/debug/logger';

export default function OrganizationSettings() {
  const { user } = useAuthStore();
  const router = useRouter();
  const theme = useTheme();
  const { isMobile } = useResponsive();
  const spacing = useSpacing();
  
  // Check if user has organization access
  if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
    log.warn('Non-admin/manager tried to access organization settings', 'ORG_SETTINGS', { 
      userId: user?.id, 
      role: user?.role 
    });
    return <Redirect href="/(home)/" />;
  }
  
  // For demo, use a placeholder organization ID
  const organizationId = user.organizationId || 'org-123';
  
  const content = (
    <VStack gap={spacing.xl}>
      <Tabs defaultValue="general" orientation={isMobile ? 'horizontal' : 'vertical'}>
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <GeneralSettingsBlock organizationId={organizationId} />
        </TabsContent>
      </Tabs>
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
          <VStack p={spacing.lg} gap={spacing.lg}>
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
          px={spacing.lg}
          py={spacing.md}
          borderBottomWidth={1}
          borderTheme="border"
        >
          <HStack alignItems="center" spacing={spacing.sm} mb={spacing.sm}>
            <SidebarTrigger />
            <Separator orientation="vertical" style={{ height: 24 }} />
            <SimpleBreadcrumb
              items={[
                { label: "Home", href: "/(home)/" },
                { label: "Organization", href: "/(home)/organization-dashboard" },
                { label: "Settings", current: true }
              ]}
              showHome={false}
            />
          </HStack>
        </Box>
        
        <ScrollView>
          <VStack p={spacing.xl} gap={spacing.xl}>
            {content}
          </VStack>
        </ScrollView>
      </VStack>
    </Container>
  );
}