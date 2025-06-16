import React from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import {
  Text,
  Container,
  VStack,
  HStack,
  Button,
} from '@/components/universal';
import { AlertCreationFormEnhanced } from '@/components/blocks/healthcare';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useSpacing } from '@/lib/stores/spacing-store';
import { useShadow } from '@/hooks/useShadow';

export default function CreateAlertModal() {
  const { spacing } = useSpacing();
  const { user } = useAuthStore();
  const shadowLg = useShadow({ size: 'lg' });
  
  // For demo, use a placeholder hospital ID
  const hospitalId = 'f155b026-01bd-4212-94f3-e7aedef2801d';
  
  const handleClose = () => {
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Container className="flex-1 bg-background">
        <ScrollView
          contentContainerStyle={{
            padding: spacing[6],
            paddingBottom: spacing[8],
          }}
          showsVerticalScrollIndicator={false}
        >
          <VStack gap={spacing[6]}>
            {/* Header */}
            <VStack gap={spacing[3]} alignItems="center">
              <Text size="2xl" weight="bold">
                Create Emergency Alert
              </Text>
              <Text size="sm" colorTheme="mutedForeground" style={{ textAlign: 'center' }}>
                Send an alert to medical staff for immediate response
              </Text>
            </VStack>

            {/* Alert Creation Form */}
            <AlertCreationFormEnhanced 
              hospitalId={hospitalId} 
              onSuccess={handleClose}
            />

            {/* Close Button */}
            <HStack justifyContent="center">
              <Button
                variant="outline"
                onPress={handleClose}
                size="lg"
                style={{ minWidth: 120 }}
              >
                Close
              </Button>
            </HStack>
          </VStack>
        </ScrollView>
      </Container>
    </KeyboardAvoidingView>
  );
}