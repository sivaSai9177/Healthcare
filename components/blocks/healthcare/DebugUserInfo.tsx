import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api/trpc';
import { VStack, Text, Card, Button, Alert } from '@/components/universal';
import { useSpacing } from '@/lib/stores/spacing-store';

export function DebugUserInfo() {
  const { user } = useAuth();
  const { spacing } = useSpacing();
  
  // Call debug endpoint
  const { data: debugData, refetch } = api.auth.debugUserData.useQuery(undefined, {
    enabled: !!user,
  });
  
  return (
    <Card>
      <VStack gap={spacing[3] as any}>
        <Text size="lg" weight="bold">Debug: User Information</Text>
        
        <Alert variant="info">
          <VStack gap={spacing[2] as any}>
            <Text size="sm" weight="semibold">Auth Store User:</Text>
            <Text size="xs">ID: {user?.id}</Text>
            <Text size="xs">Email: {user?.email}</Text>
            <Text size="xs">Role: {user?.role}</Text>
            <Text size="xs">Org ID: {user?.organizationId || 'undefined'}</Text>
            <Text size="xs">Org Name: {user?.organizationName || 'undefined'}</Text>
            <Text size="xs">Type of orgId: {typeof user?.organizationId}</Text>
          </VStack>
        </Alert>
        
        {debugData && (
          <>
            <Alert variant="warning">
              <VStack gap={spacing[2] as any}>
                <Text size="sm" weight="semibold">Context User:</Text>
                <Text size="xs">Org ID: {debugData.comparison.contextOrgId || 'undefined'}</Text>
                <Text size="xs">Type: {debugData.comparison.contextOrgIdType}</Text>
              </VStack>
            </Alert>
            
            <Alert variant="success">
              <VStack gap={spacing[2] as any}>
                <Text size="sm" weight="semibold">Database User:</Text>
                <Text size="xs">Org ID: {debugData.comparison.dbOrgId || 'undefined'}</Text>
                <Text size="xs">Type: {debugData.comparison.dbOrgIdType}</Text>
                <Text size="xs">Match: {debugData.comparison.organizationIdMatch ? 'YES' : 'NO'}</Text>
              </VStack>
            </Alert>
          </>
        )}
        
        <Button onPress={() => refetch()} size="sm" variant="outline">
          Refresh Debug Data
        </Button>
      </VStack>
    </Card>
  );
}