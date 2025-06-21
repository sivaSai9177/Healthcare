import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Platform, ScrollView, KeyboardAvoidingView, TextInput, Pressable, View } from 'react-native';
import { Card } from '@/components/universal/display';
import { VStack, HStack, Box } from '@/components/universal/layout';
import { Text } from '@/components/universal/typography';
import { Button } from '@/components/universal/interaction';
import { useSpacing } from '@/lib/stores/spacing-store';
import { useAnimationStore } from '@/lib/stores/animation-store';
import { useTheme } from '@/lib/theme';
import { api } from '@/lib/api/trpc';
import { showErrorAlert, showSuccessAlert } from '@/lib/core/alert';
import { haptic } from '@/lib/ui/haptics';
import { useRouter } from 'expo-router';
import { cn } from '@/lib/core/utils';
import { useResponsive } from '@/hooks/responsive';
import { logger } from '@/lib/core/debug/unified-logger';
import { useCreateAlertValidation } from '@/hooks/healthcare/useValidation';
import { alertValidation } from '@/lib/validations/healthcare';
import { useError } from '@/components/providers/ErrorProvider';
import { useAsyncError } from '@/hooks/useAsyncError';
import { useOfflineQueue } from '@/lib/error/offline-queue';
import { withRetry } from '@/lib/error/error-recovery';
import { ErrorRecovery } from '@/components/blocks/errors/ErrorRecovery';

// Import healthcare types
import { 
  AlertType, 
  CreateAlertInput,
  ALERT_TYPE_CONFIG,
  URGENCY_LEVEL_CONFIG,
  UrgencyLevel
} from '@/types/healthcare';

interface AlertCreationFormSimplifiedProps {
  hospitalId: string;
  onSuccess?: () => void;
  embedded?: boolean;
}

// Simple alert type button without complex animations
const AlertTypeButton = ({ 
  type, 
  selected, 
  onPress 
}: {
  type: keyof typeof ALERT_TYPE_CONFIG;
  selected: boolean;
  onPress: () => void;
}) => {
  const { spacing } = useSpacing();
  const theme = useTheme();
  const config = ALERT_TYPE_CONFIG[type];
  const { isMobile } = useResponsive();
  
  return (
    <Pressable 
      onPress={onPress}
      style={({ pressed }) => [
        {
          backgroundColor: selected ? `${config.color}20` : theme.card,
          borderColor: selected ? config.color : theme.border,
          borderWidth: 2,
          borderRadius: 12,
          padding: spacing[4],
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: isMobile ? 100 : 120,
          minHeight: isMobile ? 100 : 120,
          opacity: pressed ? 0.7 : 1,
        }
      ]}
    >
      <Text size="3xl" style={{ marginBottom: spacing[2] }}>
        {config.icon}
      </Text>
      <Text 
        size={isMobile ? "xs" : "sm"} 
        weight={selected ? "bold" : "medium"}
        style={{ 
          color: selected ? config.color : theme.foreground,
          textAlign: 'center',
        }}
        numberOfLines={2}
      >
        {type.replace(/_/g, ' ').toUpperCase()}
      </Text>
    </Pressable>
  );
};

// Simple urgency level button
const UrgencyButton = ({ 
  level, 
  selected, 
  onPress 
}: {
  level: UrgencyLevel;
  selected: boolean;
  onPress: () => void;
}) => {
  const { spacing } = useSpacing();
  const theme = useTheme();
  const config = URGENCY_LEVEL_CONFIG[level];
  const { isMobile } = useResponsive();
  
  return (
    <Pressable 
      onPress={onPress}
      style={({ pressed }) => [
        {
          backgroundColor: selected ? `${config.color}30` : theme.card,
          borderColor: selected ? config.color : theme.border,
          borderWidth: 2,
          borderRadius: 8,
          paddingVertical: spacing[3],
          paddingHorizontal: spacing[4],
          opacity: pressed ? 0.7 : 1,
          minWidth: isMobile ? 70 : 90,
        }
      ]}
    >
      <VStack gap={spacing[1]} align="center">
        <Text 
          size={isMobile ? "sm" : "base"}
          weight={selected ? "bold" : "medium"}
          style={{ color: selected ? config.color : theme.foreground }}
        >
          {level}
        </Text>
        <Text 
          size="xs" 
          style={{ color: selected ? config.color : theme.mutedForeground }}
        >
          {config.label}
        </Text>
      </VStack>
    </Pressable>
  );
};

export function AlertCreationFormSimplified({
  hospitalId,
  onSuccess,
  embedded = false,
}: AlertCreationFormSimplifiedProps) {
  const { spacing } = useSpacing();
  const theme = useTheme();
  const router = useRouter();
  const { isMobile, isTablet } = useResponsive();
  const { shouldAnimate } = useAnimationStore();
  const { validate, validateField, errors, clearErrors } = useCreateAlertValidation();
  const { isOnline, error: globalError } = useError();
  const { executeAsync } = useAsyncError({
    retries: 2,
    retryDelay: 1000,
  });
  const { enqueue } = useOfflineQueue();
  
  // Log component props
  React.useEffect(() => {
    logger.healthcare.info('AlertCreationFormSimplified mounted', {
      hospitalId,
      embedded,
      hasHospitalId: !!hospitalId
    });
  }, [hospitalId, embedded]);
  
  // Form state
  const [formData, setFormData] = useState<Partial<CreateAlertInput>>({
    hospitalId,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Create alert mutation
  const createAlertMutation = api.healthcare.createAlert.useMutation({
    onMutate: async (variables) => {
      logger.healthcare.info('Alert mutation starting', {
        variables,
        hospitalId,
        hasHospitalId: !!hospitalId
      });
    },
    onSuccess: (data) => {
      logger.healthcare.info('Alert created successfully', {
        alertId: data?.id,
        roomNumber: formData.roomNumber,
        alertType: formData.alertType,
        urgencyLevel: formData.urgencyLevel,
        responseData: data
      });
      haptic('success');
      setShowSuccess(true);
      
      // Reset form after brief delay
      setTimeout(() => {
        setFormData({ hospitalId });
        setShowSuccess(false);
        
        if (onSuccess) {
          onSuccess();
        } else if (!embedded) {
          router.back();
        }
      }, 1500);
    },
    onError: (error) => {
      logger.healthcare.error('Failed to create alert', {
        error: error.message,
        code: error.data?.code,
        httpStatus: error.data?.httpStatus,
        stack: error.data?.stack,
        formData,
        hospitalId,
        hasHospitalId: !!hospitalId,
        fullError: error
      });
      haptic('error');
      // Show specific validation errors if available
      if (error.data?.code === 'BAD_REQUEST' && error.message.includes('invalid_type')) {
        // Parse Zod errors from the message
        try {
          const zodErrors = JSON.parse(error.message);
          zodErrors.forEach((err: any) => {
            if (err.path && err.message) {
              errors[err.path.join('.')] = err.message;
            }
          });
        } catch {
          // If can't parse, show general error
          showErrorAlert('Validation Error', error.message);
        }
      } else {
        showErrorAlert('Failed to create alert', error.message || 'Please try again');
      }
      setIsSubmitting(false);
    },
  });
  
  // Validate and submit
  const handleSubmit = useCallback(async () => {
    clearErrors();
    
    // Log form submission attempt
    logger.healthcare.info('Alert creation form submitted', {
      formData,
      hospitalId,
      hasHospitalId: !!hospitalId,
      isOnline
    });
    
    // Validate form data
    const validation = validate(formData);
    
    if (!validation.isValid) {
      logger.healthcare.error('Alert validation failed', {
        errors: validation.errors,
        formData
      });
      haptic('light');
      return;
    }
    
    logger.healthcare.info('Alert validation passed, submitting to API', {
      endpoint: 'healthcare.createAlert',
      payload: validation.data
    });
    
    setIsSubmitting(true);

    // Check if offline and queue the alert
    if (!isOnline) {
      try {
        const queueId = await enqueue('alert', 'create', validation.data!, { hospitalId });
        logger.healthcare.info('Alert queued for offline processing', { queueId });
        haptic('success');
        showSuccessAlert('Alert queued', 'Your alert will be sent when connection is restored');
        setIsSubmitting(false);
        
        // Reset form
        setTimeout(() => {
          setFormData({ hospitalId });
          if (onSuccess) {
            onSuccess();
          } else if (!embedded) {
            router.back();
          }
        }, 1500);
        return;
      } catch (error) {
        logger.healthcare.error('Failed to queue alert', error);
        showErrorAlert('Failed to queue alert', 'Please try again');
        setIsSubmitting(false);
        return;
      }
    }

    // Online submission with retry
    await executeAsync(
      async () => {
        await withRetry(
          () => createAlertMutation.mutateAsync(validation.data!),
          {
            maxRetries: 2,
            shouldRetry: (error) => {
              const message = error.message.toLowerCase();
              return message.includes('network') || message.includes('timeout');
            },
          }
        );
      },
      'alert-creation'
    );
    
    setIsSubmitting(false);
  }, [formData, createAlertMutation, hospitalId, validate, clearErrors, isOnline, enqueue, executeAsync, onSuccess, embedded, router]);
  
  const isFormValid = formData.roomNumber && formData.alertType && formData.urgencyLevel;
  
  // Room number input ref for auto-focus
  const roomInputRef = React.useRef<TextInput>(null);
  
  React.useEffect(() => {
    if (!embedded && !isMobile && roomInputRef.current) {
      roomInputRef.current.focus();
    }
  }, [embedded, isMobile]);
  
  // Success overlay
  if (showSuccess) {
    return (
      <View style={{ 
        flex: 1, 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: theme.background,
        padding: spacing[6],
      }}>
        <Card style={{ padding: spacing[8], alignItems: 'center' }}>
          <Text size="5xl" style={{ marginBottom: spacing[4] }}>
            ✅
          </Text>
          <Text size="xl" weight="bold" style={{ marginBottom: spacing[2] }}>
            Alert Created Successfully
          </Text>
          <Text size="sm" colorTheme="mutedForeground">
            Medical staff have been notified
          </Text>
        </Card>
      </View>
    );
  }
  
  const content = (
    <VStack gap={spacing[6]} style={{ width: '100%', maxWidth: 600 }}>
      {/* Show offline indicator if not online */}
      {!isOnline && (
        <Card style={{ backgroundColor: theme.destructive + '20', borderColor: theme.destructive, borderWidth: 1 }}>
          <HStack gap={spacing[2]} p={spacing[3]} style={{ alignItems: 'center' }}>
            <Text size="lg">🔴</Text>
            <VStack style={{ flex: 1 }}>
              <Text weight="semibold" size="sm">You're Offline</Text>
              <Text size="xs" colorTheme="mutedForeground">
                Alerts will be queued and sent when connection is restored
              </Text>
            </VStack>
          </HStack>
        </Card>
      )}

      {/* Show global error if any */}
      {globalError && (
        <ErrorRecovery compact />
      )}

      {/* Room Number Input */}
      <Card style={{ backgroundColor: theme.card }}>
        <VStack gap={spacing[3]} p={spacing[4]}>
          <Text weight="semibold" size="lg">
            Room Number *
          </Text>
          <TextInput
            ref={roomInputRef}
            value={formData.roomNumber || ''}
            onChangeText={(value) => {
              setFormData({ ...formData, roomNumber: value });
              // Validate on change for immediate feedback
              if (value) validateField('roomNumber', value);
            }}
            placeholder="Enter room number (e.g., 302)"
            keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'default'}
            maxLength={10}
            style={{
              fontSize: 24,
              fontWeight: 'bold',
              textAlign: 'center',
              padding: spacing[3],
              borderWidth: 2,
              borderColor: errors.roomNumber ? theme.destructive : (formData.roomNumber ? theme.primary : theme.border),
              borderRadius: 8,
              backgroundColor: theme.background,
              color: theme.foreground,
            }}
          />
          {errors.roomNumber && (
            <Text size="xs" colorTheme="destructive" style={{ marginTop: spacing[1] }}>
              {errors.roomNumber}
            </Text>
          )}
        </VStack>
      </Card>
      
      {/* Alert Type Selection */}
      <Card style={{ backgroundColor: theme.card }}>
        <VStack gap={spacing[3]} p={spacing[4]}>
          <Text weight="semibold" size="lg">
            Alert Type *
          </Text>
          <ScrollView 
            horizontal={isMobile}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              flexDirection: isMobile ? 'row' : 'row',
              flexWrap: isMobile ? undefined : 'wrap',
              gap: spacing[3],
              paddingRight: isMobile ? spacing[4] : 0,
            }}
          >
            {(Object.keys(ALERT_TYPE_CONFIG) as AlertType[]).map((type) => (
              <AlertTypeButton
                key={type}
                type={type}
                selected={formData.alertType === type}
                onPress={() => {
                  haptic('light');
                  const urgency = alertValidation.getDefaultUrgencyForType(type);
                  setFormData({ 
                    ...formData, 
                    alertType: type,
                    urgencyLevel: urgency as UrgencyLevel,
                  });
                  // Clear any alert type errors
                  if (errors.alertType) clearErrors();
                }}
              />
            ))}
          </ScrollView>
        </VStack>
      </Card>
      
      {/* Urgency Level */}
      {formData.alertType && (
        <Card style={{ backgroundColor: theme.card }}>
          <VStack gap={spacing[3]} p={spacing[4]}>
            <Text weight="semibold" size="lg">
              Urgency Level *
            </Text>
            <HStack gap={spacing[2]} style={{ flexWrap: 'wrap' }}>
              {[1, 2, 3, 4, 5].map((level) => (
                <UrgencyButton
                  key={level}
                  level={level as UrgencyLevel}
                  selected={formData.urgencyLevel === level}
                  onPress={() => {
                    haptic('light');
                    setFormData({ ...formData, urgencyLevel: level as UrgencyLevel });
                  }}
                />
              ))}
            </HStack>
          </VStack>
        </Card>
      )}
      
      {/* Optional Description */}
      {formData.urgencyLevel && (
        <Card style={{ backgroundColor: theme.card }}>
          <VStack gap={spacing[3]} p={spacing[4]}>
            <Text weight="semibold" size="lg">
              Additional Details (Optional)
            </Text>
            <TextInput
              value={formData.description || ''}
              onChangeText={(value) => setFormData({ ...formData, description: value })}
              placeholder="Any additional information..."
              multiline
              numberOfLines={3}
              style={{
                padding: spacing[3],
                borderWidth: 1,
                borderColor: theme.border,
                borderRadius: 8,
                backgroundColor: theme.background,
                color: theme.foreground,
                minHeight: 80,
              }}
            />
          </VStack>
        </Card>
      )}
      
      {/* Error Message */}
      {Object.keys(errors).length > 0 && (
        <Card style={{ backgroundColor: theme.destructive + '10', borderColor: theme.destructive }}>
          <VStack gap={spacing[1]} p={spacing[3]}>
            <Text size="sm" weight="semibold" colorTheme="destructive">
              Please fix the following errors:
            </Text>
            {Object.entries(errors).map(([field, error]) => (
              <Text key={field} size="xs" colorTheme="destructive">• {error}</Text>
            ))}
          </VStack>
        </Card>
      )}
      
      {/* Submit Button */}
      <VStack gap={spacing[3]}>
        <Button
          onPress={handleSubmit}
          disabled={!isFormValid || isSubmitting}
          loading={isSubmitting}
          size="lg"
          style={{
            backgroundColor: isFormValid ? theme.destructive : theme.muted,
            opacity: isFormValid ? 1 : 0.5,
          }}
        >
          <HStack gap={spacing[2]} align="center">
            <Text size="lg" weight="bold" style={{ color: 'white' }}>
              {isSubmitting ? 'Creating Alert...' : 'Create Emergency Alert'}
            </Text>
            {!isSubmitting && <Text size="xl">🚨</Text>}
          </HStack>
        </Button>
        
        {!embedded && (
          <Button
            variant="outline"
            onPress={() => router.back()}
            size="lg"
          >
            Cancel
          </Button>
        )}
      </VStack>
    </VStack>
  );
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: spacing[4],
          paddingBottom: spacing[8],
        }}
        keyboardShouldPersistTaps="handled"
      >
        {content}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}