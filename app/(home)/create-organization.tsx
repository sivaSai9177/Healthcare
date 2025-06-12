import React from 'react';
import { Platform, View } from 'react-native';
import { 
  Container, 
  VStack, 
  HStack,
  Box,
  SimpleBreadcrumb,
  SidebarTrigger,
  Separator,
} from '@/components/universal';
import { OrganizationCreationWizard } from '@/components/organization/OrganizationCreationWizard';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useSpacing } from '@/lib/stores/spacing-store';
import { useRouter , Redirect } from 'expo-router';
import { useTheme } from '@/lib/theme/provider';
import { log } from '@/lib/core/debug/logger';

export default function CreateOrganization() {
  const { user } = useAuthStore();
  const router = useRouter();
  const theme = useTheme();
  const spacing = useSpacing();
  
  // Check if user has permission to create organization
  if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
    log.warn('Non-admin/manager tried to create organization', 'CREATE_ORG', { 
      userId: user?.id, 
      role: user?.role 
    });
    return <Redirect href="/(home)/" />;
  }
  
  const handleComplete = (organizationId: string) => {
    log.info('Organization created successfully', 'CREATE_ORG', { organizationId });
    router.replace('/(home)/organization-dashboard');
  };
  
  const handleCancel = () => {
    router.back();
  };
  
  const content = (
    <VStack alignItems="center" justifyContent="center" style={{ flex: 1 }}>
      <OrganizationCreationWizard
        onComplete={handleComplete}
        onCancel={handleCancel}
      />
    </VStack>
  );
  
  // Mobile view
  if (Platform.OS !== 'web') {
    const SafeAreaView = require('react-native-safe-area-context').SafeAreaView;
    
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <VStack p={spacing.lg} style={{ flex: 1 }}>
          {content}
        </VStack>
      </SafeAreaView>
    );
  }
  
  // Web view
  return (
    <Container>
      <VStack p={0} spacing={0} style={{ flex: 1 }}>
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
                { label: "Create New", current: true }
              ]}
              showHome={false}
            />
          </HStack>
        </Box>
        
        <View style={{ flex: 1 }}>
          {content}
        </View>
      </VStack>
    </Container>
  );
}