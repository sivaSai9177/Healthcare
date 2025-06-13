import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Container,
  Stack,
  Card,
  Text,
  Button,
  Input,
  Label,
  RadioGroup,
  Badge,
  HStack,
  VStack,
  Separator,
  Symbol,
  Skeleton,
} from '@/components/universal';
import { useTheme } from '@/lib/theme/provider';
import { useSpacing } from '@/lib/stores/spacing-store';
import { useAuth } from '@/hooks/useAuth';
import { haptic } from '@/lib/ui/haptics';
import { api } from '@/lib/api/trpc';
import { UrgencyAssessment, ResponseAction } from '@/types/healthcare';

export default function AcknowledgeAlertModal() {
  const { alertId } = useLocalSearchParams<{ alertId: string }>();
  const theme = useTheme();
  const spacing = useSpacing();
  const { user } = useAuth();
  const utils = api.useUtils();
  
  const [urgencyAssessment, setUrgencyAssessment] = React.useState<UrgencyAssessment>('maintain');
  const [responseAction, setResponseAction] = React.useState<ResponseAction>('responding');
  const [estimatedTime, setEstimatedTime] = React.useState('5');
  const [notes, setNotes] = React.useState('');
  const [delegateTo, setDelegateTo] = React.useState<string>('');

  // Fetch alert details
  const { data: alert, isLoading: isLoadingAlert } = api.healthcare.getAlert.useQuery(
    { alertId: alertId! },
    { enabled: !!alertId }
  );

  // Fetch available staff for delegation
  const { data: availableStaff } = api.healthcare.getOnDutyStaff.useQuery(
    { hospitalId: user?.organizationId || user?.hospitalId || '' },
    { enabled: !!user && responseAction === 'delegating' }
  );

  // Acknowledge mutation
  const acknowledgeMutation = api.healthcare.acknowledgeAlert.useMutation({
    onSuccess: () => {
      haptic('success');
      // Invalidate queries to refresh data
      utils.healthcare.getActiveAlerts.invalidate();
      utils.healthcare.getAlert.invalidate({ alertId: alertId! });
      router.back();
    },
    onError: (error) => {
      haptic('error');
      Alert.alert(
        'Error',
        error.message || 'Failed to acknowledge alert. Please try again.',
        [{ text: 'OK' }]
      );
    },
  });

  const handleSubmit = async () => {
    if (!responseAction || !alertId) return;
    
    // Validate based on response action
    if ((responseAction === 'responding' || responseAction === 'delayed') && !estimatedTime) {
      Alert.alert('Error', 'Please enter estimated response time');
      return;
    }
    
    if (responseAction === 'delegating' && !delegateTo) {
      Alert.alert('Error', 'Please select a staff member to delegate to');
      return;
    }
    
    haptic('medium');
    
    acknowledgeMutation.mutate({
      alertId,
      urgencyAssessment,
      responseAction,
      estimatedResponseTime: (responseAction === 'responding' || responseAction === 'delayed') 
        ? parseInt(estimatedTime) 
        : undefined,
      delegateTo: responseAction === 'delegating' ? delegateTo : undefined,
      notes: notes.trim() || undefined,
    });
  };

  const handleCancel = () => {
    router.back();
  };

  if (isLoadingAlert) {
    return (
      <Container style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: spacing.md }}>
          <Stack spacing="lg">
            <Card>
              <Stack spacing="sm">
                <Skeleton width="60%" height={20} />
                <Skeleton width="80%" height={16} />
                <Skeleton width="70%" height={16} />
              </Stack>
            </Card>
            <Card>
              <Skeleton width="100%" height={150} />
            </Card>
          </Stack>
        </ScrollView>
      </Container>
    );
  }

  if (!alert) {
    return (
      <Container style={{ flex: 1 }}>
        <Card style={{ margin: spacing.md }}>
          <Stack spacing="md" align="center">
            <Symbol name="exclamationmark.triangle.fill" size={48} color={theme.destructive} />
            <Text size="lg" weight="medium">Alert not found</Text>
            <Button variant="outline" onPress={handleCancel}>
              Go Back
            </Button>
          </Stack>
        </Card>
      </Container>
    );
  }

  const getUrgencyBadgeVariant = (level: number) => {
    if (level <= 2) return 'destructive';
    if (level === 3) return 'warning';
    return 'secondary';
  };

  return (
    <Container style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ padding: spacing.md }}>
          <Stack spacing="lg">
            {/* Alert Summary */}
            <Card>
              <Stack spacing="sm">
                <HStack justify="between" align="center">
                  <Badge variant={getUrgencyBadgeVariant(alert.urgencyLevel)}>
                    Level {alert.urgencyLevel} - {alert.alertType.replace('_', ' ')}
                  </Badge>
                  <Text size="sm" color="muted">Alert #{alert.id.slice(0, 8)}</Text>
                </HStack>
                
                <VStack spacing="xs">
                  {alert.patientName && (
                    <HStack spacing="sm">
                      <Symbol name="person.fill" size={16} color={theme.muted} />
                      <Text size="sm">{alert.patientName} • Room {alert.roomNumber}</Text>
                    </HStack>
                  )}
                  {!alert.patientName && (
                    <HStack spacing="sm">
                      <Symbol name="bed.double.fill" size={16} color={theme.muted} />
                      <Text size="sm">Room {alert.roomNumber}</Text>
                    </HStack>
                  )}
                  {alert.description && (
                    <Text size="sm" color="muted" style={{ marginTop: spacing.xs }}>
                      {alert.description}
                    </Text>
                  )}
                </VStack>
              </Stack>
            </Card>

            {/* Urgency Assessment */}
            <Card>
              <Stack spacing="md">
                <Label>Urgency Assessment</Label>
                <RadioGroup
                  value={urgencyAssessment}
                  onValueChange={setUrgencyAssessment}
                >
                  <RadioGroup.Item value="maintain" label="Maintain current level" />
                  <RadioGroup.Item value="increase" label="Increase urgency level" />
                  <RadioGroup.Item value="decrease" label="Decrease urgency level" />
                </RadioGroup>
              </Stack>
            </Card>

            {/* Response Action */}
            <Card>
              <Stack spacing="md">
                <Label>Response Action *</Label>
                <RadioGroup
                  value={responseAction}
                  onValueChange={setResponseAction}
                >
                  <RadioGroup.Item value="responding" label="Responding immediately" />
                  <RadioGroup.Item value="delayed" label="Responding with delay" />
                  <RadioGroup.Item value="delegating" label="Delegating to another staff" />
                  <RadioGroup.Item value="monitoring" label="Monitoring remotely" />
                </RadioGroup>
              </Stack>
            </Card>

            {/* Estimated Response Time */}
            {(responseAction === 'responding' || responseAction === 'delayed') && (
              <Card>
                <Stack spacing="md">
                  <Label>Estimated Response Time (minutes) *</Label>
                  <Input
                    value={estimatedTime}
                    onChangeText={setEstimatedTime}
                    placeholder="5"
                    keyboardType="numeric"
                    style={{ fontSize: 16 }}
                  />
                  <HStack spacing="sm">
                    <Button
                      size="sm"
                      variant="outline"
                      onPress={() => setEstimatedTime('2')}
                    >
                      2 min
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onPress={() => setEstimatedTime('5')}
                    >
                      5 min
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onPress={() => setEstimatedTime('10')}
                    >
                      10 min
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onPress={() => setEstimatedTime('15')}
                    >
                      15 min
                    </Button>
                  </HStack>
                </Stack>
              </Card>
            )}

            {/* Delegate To - when delegating */}
            {responseAction === 'delegating' && (
              <Card>
                <Stack spacing="md">
                  <Label>Delegate To *</Label>
                  {availableStaff && availableStaff.staff.length > 0 ? (
                    <RadioGroup
                      value={delegateTo}
                      onValueChange={setDelegateTo}
                    >
                      {availableStaff.staff
                        .filter(s => s.userId !== user?.id)
                        .map(staff => (
                          <RadioGroup.Item 
                            key={staff.userId}
                            value={staff.userId} 
                            label={`${staff.name} - ${staff.role.replace('_', ' ')}`} 
                          />
                        ))}
                    </RadioGroup>
                  ) : (
                    <Text size="sm" color="muted">No available staff to delegate to</Text>
                  )}
                </Stack>
              </Card>
            )}

            {/* Additional Notes */}
            <Card>
              <Stack spacing="md">
                <Label>Additional Notes (Optional)</Label>
                <Input
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Add any relevant information..."
                  multiline
                  numberOfLines={3}
                  style={{ 
                    minHeight: 80,
                    textAlignVertical: 'top',
                    fontSize: 14,
                  }}
                />
              </Stack>
            </Card>

            {/* Quick Response Templates */}
            <Card>
              <Stack spacing="md">
                <Text size="sm" weight="medium">Quick Response Templates</Text>
                <Stack spacing="sm">
                  <Button
                    size="sm"
                    variant="outline"
                    onPress={() => setNotes('En route to patient location')}
                  >
                    En route
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onPress={() => setNotes('Gathering necessary equipment')}
                  >
                    Preparing equipment
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onPress={() => setNotes('Coordinating with team members')}
                  >
                    Coordinating team
                  </Button>
                </Stack>
              </Stack>
            </Card>

            <Separator />

            {/* Actions */}
            <HStack spacing="md">
              <Button
                variant="outline"
                onPress={handleCancel}
                style={{ flex: 1 }}
                disabled={acknowledgeMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onPress={handleSubmit}
                style={{ flex: 1 }}
                loading={acknowledgeMutation.isPending}
                disabled={!responseAction || acknowledgeMutation.isPending}
              >
                Acknowledge Alert
              </Button>
            </HStack>

            {/* Info */}
            <Card variant="secondary">
              <HStack spacing="sm" align="start">
                <Symbol name="info.circle.fill" size={16} color={theme.primary} />
                <Text size="xs" color="muted" style={{ flex: 1 }}>
                  By acknowledging this alert, you confirm that you are taking responsibility 
                  for responding to this emergency. Your response will be logged and tracked.
                </Text>
              </HStack>
            </Card>
          </Stack>
        </ScrollView>
      </KeyboardAvoidingView>
    </Container>
  );
}