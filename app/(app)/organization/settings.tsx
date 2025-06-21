import React, { useState } from 'react';
import { ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/lib/theme/provider';
import {
  Container,
  VStack,
  HStack,
  Text,
  Button,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/universal';
import { useSpacing } from '@/lib/stores/spacing-store';
import { 
  GeneralSettingsBlock,
  MemberManagementBlock,
  BillingBlock,
  EmailSettingsBlock,
  AnalyticsBlock,
} from '@/components/blocks/organization';
import { Symbol } from '@/components/universal/display/Symbols';

export default function OrganizationSettings() {
  const { user } = useAuth();
  const router = useRouter();
  const theme = useTheme();
  const { spacing } = useSpacing();
  const [activeTab, setActiveTab] = useState('general');
  
  // Check if user has organization access
  if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
    return (
      <Container>
        <VStack p={4} gap={4 as any} alignItems="center" justifyContent="center" style={{ flex: 1 }}>
          <Text size="base">Access Restricted</Text>
          <Text colorTheme="mutedForeground">
            This section is only available to administrators and managers
          </Text>
          <Button onPress={() => router.replace('/(tabs)/explore' as any)}>Go Back</Button>
        </VStack>
      </Container>
    );
  }
  
  const organizationId = user.organizationId || 'org-123';
  
  const content = (
    <VStack gap={4 as any}>
      {/* Header */}
      <HStack alignItems="center" gap={2 as any}>
        <Button
          onPress={() => router.back()}
          variant="ghost"
          size="icon"
        >
          <Symbol name="chevron.left" size={24} />
        </Button>
        <Text size="xl" weight="bold">Organization Settings</Text>
      </HStack>
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 lg:grid-cols-5 w-full">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <GeneralSettingsBlock 
            organizationId={organizationId}
          />
        </TabsContent>
        
        <TabsContent value="members">
          <MemberManagementBlock 
            organizationId={organizationId}
            canManageMembers={user.role === 'admin' || user.role === 'manager'}
            onInviteMember={() => {}}
          />
        </TabsContent>
        
        <TabsContent value="billing">
          <BillingBlock 
            organizationId={organizationId}
          />
        </TabsContent>
        
        <TabsContent value="email">
          <EmailSettingsBlock 
            organizationId={organizationId}
          />
        </TabsContent>
        
        <TabsContent value="analytics">
          <AnalyticsBlock 
            organizationId={organizationId}
          />
        </TabsContent>
      </Tabs>
    </VStack>
  );
  
  if (Platform.OS !== 'web') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <ScrollView
          contentContainerStyle={{ padding: spacing[4] as any, paddingBottom: spacing[6] as any }}
          showsVerticalScrollIndicator={false}
        >
          {content}
        </ScrollView>
      </SafeAreaView>
    );
  }
  
  return (
    <Container>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <VStack p={4} gap={4 as any}>
          {content}
        </VStack>
      </ScrollView>
    </Container>
  );
}