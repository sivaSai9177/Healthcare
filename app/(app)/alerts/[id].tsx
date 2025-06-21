import React from 'react';
import { ScrollView, Platform, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/lib/theme/provider';
import { api } from '@/lib/api/trpc';
import {
  Container,
  VStack,
  HStack,
  Text,
  Button,
  Card,
  Box,
  Badge,
  Skeleton,
} from '@/components/universal';
import { useSpacing } from '@/lib/stores/spacing-store';
import { useShadow } from '@/hooks/useShadow';
import { haptic } from '@/lib/ui/haptics';
import { showErrorAlert, showSuccessAlert } from '@/lib/core/alert';
import { format } from 'date-fns';
import { Symbol } from '@/components/universal/display/Symbols';

export default function AlertDetailScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const router = useRouter();
  const theme = useTheme();
  const { spacing } = useSpacing();
  const shadowMd = useShadow({ size: 'md' });
  
  const hospitalId = user?.organizationId || 'demo-hospital';
  const role = user?.role;
  
  const { data: alert, isLoading, refetch } = api.healthcare.getAlert.useQuery(
    { alertId: id as string },
    { enabled: !!id }
  );
  
  const acknowledgeMutation = api.healthcare.acknowledgeAlert.useMutation({
    onSuccess: () => {
      showSuccessAlert('Alert Acknowledged', 'You have acknowledged this alert');
      refetch();
    },
    onError: () => {
      showErrorAlert('Failed to acknowledge', 'Please try again');
    },
  });
  
  const resolveMutation = api.healthcare.resolveAlert.useMutation({
    onSuccess: () => {
      showSuccessAlert('Alert Resolved', 'The alert has been resolved');
      refetch();
    },
    onError: () => {
      showErrorAlert('Failed to resolve', 'Please try again');
    },
  });
  
  const handleAcknowledge = () => {
    haptic('medium');
    acknowledgeMutation.mutate({ alertId: id as string });
  };
  
  const handleResolve = () => {
    haptic('medium');
    resolveMutation.mutate({ 
      alertId: id as string,
      resolution: 'Resolved by healthcare staff',
    });
  };
  
  if (isLoading) {
    return (
      <Container>
        <VStack p={4} gap={4 as any}>
          <Skeleton height={200} />
          <Skeleton height={100} />
          <Skeleton height={100} />
        </VStack>
      </Container>
    );
  }
  
  if (!alert) {
    return (
      <Container>
        <VStack p={4} gap={4 as any} alignItems="center" justifyContent="center" style={{ flex: 1 }}>
          <Text size="base">Alert not found</Text>
          <Button onPress={() => router.back()}>Go Back</Button>
        </VStack>
      </Container>
    );
  }
  
  const urgencyColor = {
    1: 'secondary',
    2: 'warning', 
    3: 'destructive',
  }[alert.urgencyLevel] || 'secondary';
  
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
        <Text size="xl" weight="bold">Alert Details</Text>
      </HStack>
      
      {/* Alert Info */}
      <Card style={shadowMd}>
        <Box p={4 as any}>
          <VStack gap={3 as any}>
            <HStack justifyContent="space-between" alignItems="flex-start">
              <VStack gap={1 as any}>
                <Text size="base" weight="bold">Room {alert.roomNumber}</Text>
                <Text colorTheme="mutedForeground">{alert.department}</Text>
              </VStack>
              <Badge variant={urgencyColor as any} size="sm">
                Level {alert.urgencyLevel}
              </Badge>
            </HStack>
            
            <Text>{alert.message}</Text>
            
            <HStack gap={4 as any}>
              <HStack gap={1 as any} alignItems="center">
                <Symbol name="clock" size={16} color={theme.mutedForeground} />
                <Text size="sm" colorTheme="mutedForeground">
                  {format(new Date(alert.createdAt), 'MMM d, h:mm a')}
                </Text>
              </HStack>
              {alert.createdBy && (
                <HStack gap={1 as any} alignItems="center">
                  <Symbol name="person" size={16} color={theme.mutedForeground} />
                  <Text size="sm" colorTheme="mutedForeground">
                    {alert.createdBy}
                  </Text>
                </HStack>
              )}
            </HStack>
            
            {/* Status */}
            <HStack gap={2 as any}>
              {alert.acknowledged && (
                <Badge variant="outline">
                  Acknowledged by {alert.acknowledgedBy}
                </Badge>
              )}
              {alert.resolved && (
                <Badge variant="success">
                  Resolved by {alert.resolvedBy}
                </Badge>
              )}
              {!alert.acknowledged && !alert.resolved && (
                <Badge variant="error">
                  Active
                </Badge>
              )}
            </HStack>
          </VStack>
        </Box>
      </Card>
      
      {/* Patient Info */}
      <Card style={shadowMd}>
        <Box p={4 as any}>
          <VStack gap={3 as any}>
            <Text weight="semibold">Patient Information</Text>
            <VStack gap={2 as any}>
              <HStack justifyContent="space-between">
                <Text colorTheme="mutedForeground">Name</Text>
                <Text>{alert.patient?.name || 'Unknown'}</Text>
              </HStack>
              <HStack justifyContent="space-between">
                <Text colorTheme="mutedForeground">Condition</Text>
                <Text>{alert.patient?.condition || 'Not specified'}</Text>
              </HStack>
              {alert.patient?.notes && (
                <Box>
                  <Text colorTheme="mutedForeground">Notes</Text>
                  <Text>{alert.patient.notes}</Text>
                </Box>
              )}
            </VStack>
          </VStack>
        </Box>
      </Card>
      
      {/* Actions */}
      {!alert.resolved && (
        <VStack gap={2 as any}>
          {!alert.acknowledged && (role === 'doctor' || role === 'nurse' || role === 'head_doctor') && (
            <Button
              onPress={handleAcknowledge}
              variant="outline"
              fullWidth
              isLoading={acknowledgeMutation.isPending}
            >
              Acknowledge Alert
            </Button>
          )}
          {alert.acknowledged && (role === 'doctor' || role === 'head_doctor') && (
            <Button
              onPress={handleResolve}
              variant="default"
              fullWidth
              isLoading={resolveMutation.isPending}
            >
              Resolve Alert
            </Button>
          )}
        </VStack>
      )}
      
      {/* Escalation Info */}
      {alert.escalationStatus && (
        <Card style={shadowMd}>
          <Box p={4 as any}>
            <VStack gap={2 as any}>
              <HStack gap={2 as any} alignItems="center">
                <Symbol name="exclamationmark.circle" size={20} color={theme.destructive} />
                <Text weight="semibold">Escalation Status</Text>
              </HStack>
              <Text colorTheme="mutedForeground">
                This alert has been escalated to senior staff
              </Text>
            </VStack>
          </Box>
        </Card>
      )}
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