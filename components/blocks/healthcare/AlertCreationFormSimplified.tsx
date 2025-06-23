import React, { useState, useCallback } from 'react';
import { Platform, ScrollView, KeyboardAvoidingView, TextInput, Pressable, View, Animated, ActivityIndicator } from 'react-native';
import { GlassCard } from '@/components/universal/display';
import { VStack, HStack } from '@/components/universal/layout';
import { Text } from '@/components/universal/typography';
import { Button } from '@/components/universal/interaction';
import { useSpacing } from '@/lib/stores/spacing-store';
import { useTheme } from '@/lib/theme';
import { api } from '@/lib/api/trpc';
import { showErrorAlert, showSuccessAlert } from '@/lib/core/alert';
import { haptic } from '@/lib/ui/haptics';
import { useRouter } from 'expo-router';
import { useResponsive } from '@/hooks/responsive';
import { logger } from '@/lib/core/debug/unified-logger';
import { useCreateAlertValidation } from '@/hooks/healthcare/useValidation';
import { alertValidation } from '@/lib/validations/healthcare';
import { useError } from '@/components/providers/ErrorProvider';
import { useAsyncError } from '@/hooks/useAsyncError';
import { useOfflineQueue } from '@/lib/error/offline-queue';
import { withRetry } from '@/lib/error/error-recovery';
import { ErrorRecovery } from '@/components/blocks/errors/ErrorRecovery';
import { useShadow } from '@/hooks/useShadow';
import { useFormDraft } from '@/hooks/useFormDraft';

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
  onSuccess?: (alertData?: any) => void;
  embedded?: boolean;
}

// Enhanced alert type button with animations
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
  const shadowSm = useShadow({ size: 'sm' });
  const shadowMd = useShadow({ size: 'md' });
  const scale = React.useRef(new Animated.Value(1)).current;
  
  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.95,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();
    onPress();
  };
  
  const [isHovered, setIsHovered] = React.useState(false);
  
  return (
    <Pressable 
      onPress={handlePress}
      onPressIn={() => setIsHovered(true)}
      onPressOut={() => setIsHovered(false)}
      style={({ pressed }) => [
        {
          backgroundColor: theme.card,
          borderColor: selected ? config.color : isHovered ? theme.primary : theme.border,
          borderWidth: selected ? 2 : 1,
          borderRadius: 12,
          padding: spacing[3],
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          aspectRatio: 1,
          opacity: pressed ? 0.9 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
          position: 'relative',
          overflow: 'hidden',
        },
        (selected || isHovered) ? shadowMd : shadowSm,
      ]}
    >
      {/* Selection indicator */}
      {selected && (
        <View style={{
          position: 'absolute',
          top: spacing[1],
          right: spacing[1],
          backgroundColor: config.color,
          borderRadius: 10,
          width: 20,
          height: 20,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Text size="xs" style={{ color: 'white' }}>✓</Text>
        </View>
      )}
      
      {/* Hover/Selected background overlay */}
      {(selected || isHovered) && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: selected ? config.color + '10' : theme.primary + '05',
          borderRadius: 12,
        }} />
      )}
      
      <VStack gap={1} alignItems="center" style={{ flex: 1, justifyContent: 'center' }}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <Text size={isMobile ? "xl" : "2xl"}>
            {config.icon}
          </Text>
        </Animated.View>
        <Text 
          size="xs" 
          weight={selected ? "semibold" : "medium"}
          style={{ 
            color: selected ? config.color : theme.foreground,
            textAlign: 'center',
            lineHeight: 14,
          }}
          numberOfLines={2}
        >
          {type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ')}
        </Text>
      </VStack>
    </Pressable>
  );
};

// Enhanced urgency level button with card-like selection
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
  const shadowSm = useShadow({ size: 'sm' });
  const shadowMd = useShadow({ size: 'md' });
  const [isHovered, setIsHovered] = React.useState(false);
  
  return (
    <Pressable 
      onPress={onPress}
      onPressIn={() => setIsHovered(true)}
      onPressOut={() => setIsHovered(false)}
      style={({ pressed }) => [
        {
          backgroundColor: theme.card,
          borderColor: selected ? config.color : isHovered ? theme.primary : theme.border,
          borderWidth: selected ? 2 : 1,
          borderRadius: 12,
          paddingVertical: spacing[3],
          paddingHorizontal: spacing[3],
          opacity: pressed ? 0.9 : 1,
          width: '100%',
          transform: [{ scale: pressed ? 0.98 : 1 }],
          position: 'relative',
          overflow: 'hidden',
        },
        (selected || isHovered) ? shadowMd : shadowSm,
      ]}
    >
      {/* Selection indicator */}
      {selected && (
        <View style={{
          position: 'absolute',
          top: spacing[1],
          right: spacing[1],
          backgroundColor: config.color,
          borderRadius: 10,
          width: 20,
          height: 20,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Text size="xs" style={{ color: 'white' }}>✓</Text>
        </View>
      )}
      
      {/* Hover/Selected background overlay */}
      {(selected || isHovered) && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: selected ? config.color + '10' : theme.primary + '05',
          borderRadius: 12,
        }} />
      )}
      
      <VStack gap={1} align="center">
        <Text 
          size="base"
          weight={selected ? "bold" : "semibold"}
          style={{ color: selected ? config.color : theme.foreground }}
        >
          {level}
        </Text>
        <Text 
          size="xs" 
          style={{ 
            color: selected ? config.color + 'CC' : theme.mutedForeground,
            fontSize: 10,
          }}
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
  const { isMobile, isDesktop } = useResponsive();
  const { validate, validateField, errors, clearErrors } = useCreateAlertValidation();
  const { isOnline, error: globalError } = useError();
  const { executeAsync } = useAsyncError({
    retries: 2,
    retryDelay: 1000,
  });
  const { enqueue } = useOfflineQueue();
  const shadowMd = useShadow({ size: 'md' });
  
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
  
  // Create a mock watch function for draft persistence that matches UseFormWatch type
  const watch = useCallback(((name?: any) => {
    if (name === undefined) {
      return formData;
    }
    if (Array.isArray(name)) {
      return name.map(field => formData[field as keyof typeof formData]);
    }
    return formData[name as keyof typeof formData];
  }) as any, [formData]);
  const reset = useCallback((data: Partial<CreateAlertInput>) => {
    setFormData(data);
  }, []);
  
  // Add draft persistence
  const { saveDraft, clearDraft, draftAge, isRestoring } = useFormDraft({
    formKey: 'alert-creation',
    watch,
    reset,
    autoSaveDelay: 1000, // Save every second
    showRestoreNotification: true,
    excludeFields: [], // Save all fields
    onDraftRestored: (data) => {
      logger.healthcare.info('Alert creation draft restored', { 
        hasRoomNumber: !!data.roomNumber,
        hasAlertType: !!data.alertType,
        hasUrgencyLevel: !!data.urgencyLevel,
      });
    },
  });
  
  // Create alert mutation
  const createAlertMutation = api.healthcare.createAlert.useMutation({
    onMutate: async (variables) => {
      logger.healthcare.info('Alert mutation starting', {
        variables,
        hospitalId,
        hasHospitalId: !!hospitalId
      });
    },
    onSuccess: async (data) => {
      logger.healthcare.info('Alert created successfully', {
        alertId: data?.alert?.id,
        roomNumber: formData.roomNumber,
        alertType: formData.alertType,
        urgencyLevel: formData.urgencyLevel,
        responseData: data
      });
      haptic('success');
      
      // Pass alert data to onSuccess
      if (onSuccess) {
        onSuccess({ ...formData, id: data?.alert?.id });
      }
      
      // Clear draft after successful creation
      await clearDraft();
      
      // Reset form after brief delay
      setTimeout(() => {
        setFormData({ hospitalId });
        
        if (!onSuccess && !embedded) {
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
        
        // Pass queue data to onSuccess
        if (onSuccess) {
          onSuccess({ ...validation.data, queued: true });
        }
        
        // Clear draft after successful queue
        await clearDraft();
        
        // Reset form
        setTimeout(() => {
          setFormData({ hospitalId });
          if (!onSuccess && !embedded) {
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
  }, [formData, createAlertMutation, hospitalId, validate, clearErrors, isOnline, enqueue, executeAsync, onSuccess, embedded, router, clearDraft]);
  
  const isFormValid = formData.roomNumber && formData.alertType && formData.urgencyLevel;
  
  // Room number input ref for auto-focus
  const roomInputRef = React.useRef<TextInput>(null);
  
  React.useEffect(() => {
    if (!embedded && !isMobile && roomInputRef.current) {
      roomInputRef.current.focus();
    }
  }, [embedded, isMobile]);
  
  // Remove internal success state - let parent handle it
  
  const content = (
    <VStack gap={1} style={{ width: '100%', maxWidth: isDesktop ? 600 : '100%' }}>
      {/* Loading indicator for draft restoration */}
      {isRestoring && (
        <GlassCard style={[{ backgroundColor: theme.muted }, shadowMd]}>
          <HStack gap={2} p={3} style={{ alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="small" color={theme.primary} />
            <Text size="sm" colorTheme="mutedForeground">Restoring draft...</Text>
          </HStack>
        </GlassCard>
      )}
      
      {/* Show offline indicator if not online */}
      {!isOnline && (
        <GlassCard style={[{ backgroundColor: theme.destructive + '20', borderColor: theme.destructive }, shadowMd]}>
          <HStack gap={2} p={3} style={{ alignItems: 'center' }}>
            <Text size="lg">🔴</Text>
            <VStack style={{ flex: 1 }}>
              <Text weight="semibold" size="sm">You&apos;re Offline</Text>
              <Text size="xs" colorTheme="mutedForeground">
                Alerts will be queued and sent when connection is restored
              </Text>
            </VStack>
          </HStack>
        </GlassCard>
      )}

      {/* Show global error if any */}
      {globalError && (
        <ErrorRecovery compact />
      )}

      {/* Room Number Input */}
      <GlassCard style={shadowMd}>
        <VStack gap={2} p={3}>
          <HStack gap={1} alignItems="center">
            <Text weight="semibold" size="lg">
              Room Number
            </Text>
            <Text size="sm" style={{ color: theme.destructive }}>*</Text>
          </HStack>
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
              fontSize: isMobile ? 20 : 24,
              fontWeight: 'bold',
              textAlign: 'center',
              padding: spacing[3],
              borderWidth: 1,
              borderColor: errors.roomNumber ? theme.destructive : (formData.roomNumber ? theme.primary : theme.border),
              borderRadius: 8,
              backgroundColor: theme.background,
              color: theme.foreground,
            }}
          />
          {errors.roomNumber && (
            <HStack justifyContent="space-between" alignItems="center" style={{ marginTop: spacing[1] }}>
              <Text size="xs" colorTheme="destructive">
                {errors.roomNumber}
              </Text>
              {draftAge !== null && !errors.roomNumber && (
                <Text size="xs" colorTheme="mutedForeground">
                  Draft saved
                </Text>
              )}
            </HStack>
          )}
        </VStack>
      </GlassCard>
      
      {/* Alert Type Selection */}
      <GlassCard style={shadowMd}>
        <VStack gap={2} p={3}>
          <HStack gap={1} alignItems="center">
            <Text weight="semibold" size="lg">
              Alert Type
            </Text>
            <Text size="sm" style={{ color: theme.destructive }}>*</Text>
          </HStack>
          <HStack gap={1} style={{ justifyContent: 'space-evenly' }}>
            {(Object.keys(ALERT_TYPE_CONFIG) as AlertType[]).map((type) => (
              <View key={type} style={{ flex: 1, maxWidth: 80 }}>
                <AlertTypeButton
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
              </View>
            ))}
          </HStack>
        </VStack>
      </GlassCard>
      
      {/* Urgency Level */}
      {formData.alertType && (
        <GlassCard style={shadowMd}>
          <VStack gap={2} p={3}>
            <HStack gap={1} alignItems="center">
              <Text weight="semibold" size="lg">
                Urgency Level
              </Text>
              <Text size="sm" style={{ color: theme.destructive }}>*</Text>
            </HStack>
            <HStack gap={1} style={{ justifyContent: 'space-between' }}>
              {[1, 2, 3, 4, 5].map((level) => (
                <View key={level} style={{ flex: 1, maxWidth: 70 }}>
                  <UrgencyButton
                    level={level as UrgencyLevel}
                    selected={formData.urgencyLevel === level}
                    onPress={() => {
                      haptic('light');
                      setFormData({ ...formData, urgencyLevel: level as UrgencyLevel });
                    }}
                  />
                </View>
              ))}
            </HStack>
          </VStack>
        </GlassCard>
      )}
      
      {/* Optional Description */}
      {formData.urgencyLevel && (
        <GlassCard style={shadowMd}>
          <VStack gap={2} p={3}>
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
        </GlassCard>
      )}
      
      {/* Error Message */}
      {Object.keys(errors).length > 0 && (
        <GlassCard style={[{ backgroundColor: theme.destructive + '10', borderColor: theme.destructive }, shadowMd]}>
          <VStack gap={1} p={3}>
            <Text size="sm" weight="semibold" colorTheme="destructive">
              Please fix the following errors:
            </Text>
            {Object.entries(errors).map(([field, error]) => (
              <Text key={field} size="xs" colorTheme="destructive">• {error}</Text>
            ))}
          </VStack>
        </GlassCard>
      )}
      
      {/* Submit Button */}
      <VStack gap={1} style={{ marginTop: spacing[1] }}>
        <Button
          onPress={handleSubmit}
          disabled={!isFormValid || isSubmitting}
          isLoading={isSubmitting}
          size={isMobile ? "default" : "lg"}
          fullWidth
          style={{
            backgroundColor: isFormValid && !isSubmitting ? theme.destructive : theme.muted,
            borderColor: isFormValid && !isSubmitting ? theme.destructive : theme.border,
            opacity: isFormValid && !isSubmitting ? 1 : 0.6,
          }}
        >
          <HStack gap={2} align="center">
            <Text 
              size={isMobile ? "base" : "lg"} 
              weight="bold" 
              style={{ 
                color: isFormValid && !isSubmitting ? 'white' : theme.mutedForeground 
              }}
            >
              {isSubmitting ? 'Creating Alert...' : 'Create Emergency Alert'}
            </Text>
            {!isSubmitting && (
              <Text size={isMobile ? "lg" : "xl"}>
                {isFormValid ? '🚨' : '⚠️'}
              </Text>
            )}
          </HStack>
        </Button>
        
        {!embedded && (
          <Button
            variant="outline"
            onPress={async () => {
              // Save draft before leaving
              await saveDraft();
              router.back();
            }}
            size={isMobile ? "default" : "lg"}
            fullWidth
          >
            Cancel
          </Button>
        )}
      </VStack>
    </VStack>
  );
  
  // Don't wrap in ScrollView if embedded
  if (embedded) {
    return content;
  }
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: isMobile ? spacing[2] : spacing[3],
          paddingBottom: isMobile ? spacing[6] : spacing[8],
        }}
        keyboardShouldPersistTaps="handled"
      >
        {content}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}