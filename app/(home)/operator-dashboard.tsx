import React from 'react';
import { Container, VStack, Text, Card, Button } from '@/components/universal';
import { AlertCreationForm } from '@/components/healthcare/AlertCreationForm';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useRouter } from 'expo-router';
import { Redirect } from 'expo-router';

export default function OperatorDashboard() {
  const { user } = useAuthStore();
  const router = useRouter();
  
  // Check if user is an operator
  if (!user || user.role !== 'operator') {
    return <Redirect href="/(home)/" />;
  }
  
  // For demo, use a placeholder hospital ID
  const hospitalId = 'f155b026-01bd-4212-94f3-e7aedef2801d';
  
  return (
    <Container>
      <VStack spacing={4} p={4}>
        <Card>
          <VStack spacing={2}>
            <Text size="2xl" weight="bold">Create Alert</Text>
            <Text colorTheme="mutedForeground">
              Create emergency alerts to notify medical staff
            </Text>
          </VStack>
        </Card>
        
        <AlertCreationForm hospitalId={hospitalId} />
        
        <Button
          onPress={() => router.push('/(home)/')}
          variant="outline"
        >
          View Alert Dashboard
        </Button>
      </VStack>
    </Container>
  );
}