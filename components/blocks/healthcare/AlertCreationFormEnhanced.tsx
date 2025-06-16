import React, { useState, useTransition } from 'react';
import { View, Platform, Pressable, ScrollView, KeyboardAvoidingView } from 'react-native';
import { Card, Badge } from '@/components/universal/display';
import { VStack, HStack, Box } from '@/components/universal/layout';
import { Alert as AlertComponent } from '@/components/universal/feedback';
import { Text } from '@/components/universal/typography';
import { Input } from '@/components/universal/form';
import { Button } from '@/components/universal/interaction';
import { useSpacing } from '@/lib/stores/spacing-store';
import { useShadow } from '@/hooks/useShadow';
import { useAuthStore } from '@/lib/stores/auth-store';
import { api } from '@/lib/trpc';
import { z } from 'zod';
import { showErrorAlert, showSuccessAlert } from '@/lib/core/alert';
import { haptic } from '@/lib/ui/haptics';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeOut, SlideInDown } from 'react-native-reanimated';

// Import healthcare types
import { 
  AlertType, 
  CreateAlertSchema, 
  CreateAlertInput,
  ALERT_TYPE_CONFIG,
  URGENCY_LEVEL_CONFIG,
  UrgencyLevel
} from '@/types/healthcare';

interface AlertCreationFormEnhancedProps {
  hospitalId: string;
  onSuccess?: () => void;
  embedded?: boolean;
}

// Alert type card component
const AlertTypeCard = ({ 
  type, 
  selected, 
  onPress 
}: {
  type: keyof typeof ALERT_TYPE_CONFIG;
  selected: boolean;
  onPress: () => void;
}) => {
  const { spacing } = useSpacing();
  const config = ALERT_TYPE_CONFIG[type];
  const shadowSm = useShadow({ size: 'sm' });
  
  return (
    <Pressable onPress={onPress}>
      <Animated.View entering={FadeIn.delay(100)}>
        <Card
          style={[
            {
              padding: spacing[4],
              minHeight: 100,
              borderWidth: 2,
              borderColor: selected ? config.color : 'transparent',
              backgroundColor: selected ? `${config.color}10` : undefined,
            },
            selected ? shadowSm : {},
          ]}
        >
          <VStack gap={spacing[2]} align="center">
            <Text size="3xl">{config.icon}</Text>
            <Text 
              size="sm" 
              weight={selected ? "bold" : "medium"}
              style={{ 
                color: selected ? config.color : undefined,
                textAlign: 'center' 
              }}
            >
              {type.replace(/_/g, ' ').toUpperCase()}
            </Text>
            {selected && (
              <Badge 
                variant="default" 
                size="sm"
                style={{ backgroundColor: config.color }}
              >
                <Text size="xs" style={{ color: '#ffffff' }}>Selected</Text>
              </Badge>
            )}
          </VStack>
        </Card>
      </Animated.View>
    </Pressable>
  );
};

// Urgency level selector
const UrgencySelector = ({ 
  selected, 
  onChange 
}: {
  selected?: UrgencyLevel;
  onChange: (level: UrgencyLevel) => void;
}) => {
  const { spacing } = useSpacing();
  
  return (
    <VStack gap={spacing[3]}>
      <Text weight="semibold">Urgency Level *</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <HStack gap={spacing[3]}>
          {([1, 2, 3, 4, 5] as UrgencyLevel[]).map((level) => {
            const config = URGENCY_LEVEL_CONFIG[level];
            const isSelected = selected === level;
            
            return (
              <Pressable key={level} onPress={() => onChange(level)}>
                <Box
                  p={spacing[3]}
                  px={spacing[4]}
                  borderRadius={8}
                  borderWidth={2}
                  borderColor={isSelected ? config.color : '#e5e5e5'}
                  style={{
                    backgroundColor: isSelected ? `${config.color}20` : undefined,
                    minWidth: 100,
                  }}
                >
                  <VStack gap={spacing[1]} align="center">
                    <Text 
                      weight={isSelected ? "bold" : "medium"}
                      style={{ color: isSelected ? config.color : undefined }}
                    >
                      Level {level}
                    </Text>
                    <Text 
                      size="xs" 
                      style={{ color: isSelected ? config.color : '#666' }}
                    >
                      {config.label}
                    </Text>
                  </VStack>
                </Box>
              </Pressable>
            );
          })}
        </HStack>
      </ScrollView>
    </VStack>
  );
};

export function AlertCreationFormEnhanced({ 
  hospitalId, 
  onSuccess,
  embedded = false 
}: AlertCreationFormEnhancedProps) {
  const { spacing } = useSpacing();
  const { user } = useAuthStore();
  const router = useRouter();
  const shadowLg = useShadow({ size: 'lg' });
  const [isPending, startTransition] = useTransition();
  
  // Form state
  const [formData, setFormData] = useState<Partial<CreateAlertInput>>({
    hospitalId,
  });
  const [showPreview, setShowPreview] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // Create alert mutation with better feedback
  const createAlertMutation = api.healthcare.createAlert.useMutation({
    onMutate: () => {
      haptic('medium');
    },
    onSuccess: (data) => {
      haptic('success');
      showSuccessAlert(
        'Alert Created Successfully', 
        `Alert for Room ${formData.roomNumber} has been dispatched to all medical staff.`
      );
      
      // Reset form
      setFormData({ hospitalId });
      setShowPreview(false);
      setValidationErrors({});
      
      // Call onSuccess callback or navigate
      if (onSuccess) {
        onSuccess();
      } else if (!embedded) {
        router.back();
      }
    },
    onError: (error) => {
      haptic('error');
      showErrorAlert(
        'Failed to Create Alert',
        error.message || 'Please check your connection and try again.'
      );
    },
  });
  
  // Validate form
  const validateForm = (): boolean => {
    try {
      CreateAlertSchema.parse(formData);
      setValidationErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0] as string] = err.message;
          }
        });
        setValidationErrors(errors);
        
        // Show first error
        const firstError = error.errors[0];
        showErrorAlert('Validation Error', firstError.message);
      }
      return false;
    }
  };
  
  // Handle form submission
  const handleSubmit = () => {
    if (!validateForm()) return;
    
    // Show preview for critical alerts
    const config = formData.alertType ? ALERT_TYPE_CONFIG[formData.alertType] : null;
    if (config?.requiresConfirmation && !showPreview) {
      setShowPreview(true);
      return;
    }
    
    startTransition(() => {
      createAlertMutation.mutate(formData as CreateAlertInput);
    });
  };
  
  const isFormValid = formData.roomNumber && formData.alertType && formData.urgencyLevel;
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <VStack gap={spacing[6]}>
          {/* Step 1: Room Number */}
          <Animated.View entering={SlideInDown.delay(100)}>
            <Card style={shadowLg}>
              <VStack gap={spacing[4]} p={spacing[5]}>
                <HStack gap={spacing[2]} align="center">
                  <Badge variant="default" size="sm">
                    <Text size="xs" weight="bold">STEP 1</Text>
                  </Badge>
                  <Text weight="semibold" size="lg">Room Number</Text>
                </HStack>
                
                <Input
                  value={formData.roomNumber || ''}
                  onChangeText={(value) => setFormData({ ...formData, roomNumber: value })}
                  placeholder="Enter room number (e.g., 302, ICU-1)"
                  keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'default'}
                  maxLength={10}
                  size="lg"
                  autoFocus={!embedded}
                  error={validationErrors.roomNumber}
                  style={{
                    fontSize: 24,
                    fontWeight: 'bold',
                    textAlign: 'center',
                    letterSpacing: 2,
                  }}
                />
              </VStack>
            </Card>
          </Animated.View>
          
          {/* Step 2: Alert Type */}
          {formData.roomNumber && (
            <Animated.View entering={SlideInDown.delay(200)}>
              <Card style={shadowLg}>
                <VStack gap={spacing[4]} p={spacing[5]}>
                  <HStack gap={spacing[2]} align="center">
                    <Badge variant="default" size="sm">
                      <Text size="xs" weight="bold">STEP 2</Text>
                    </Badge>
                    <Text weight="semibold" size="lg">Alert Type</Text>
                  </HStack>
                  
                  <View style={{ marginHorizontal: -spacing[2] }}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <HStack gap={spacing[3]} px={spacing[2]}>
                        {(Object.keys(ALERT_TYPE_CONFIG) as AlertType[]).map((type) => (
                          <AlertTypeCard
                            key={type}
                            type={type}
                            selected={formData.alertType === type}
                            onPress={() => {
                              haptic('light');
                              const config = ALERT_TYPE_CONFIG[type];
                              setFormData({ 
                                ...formData, 
                                alertType: type,
                                urgencyLevel: config.defaultUrgency,
                              });
                            }}
                          />
                        ))}
                      </HStack>
                    </ScrollView>
                  </View>
                  
                  {validationErrors.alertType && (
                    <Text size="sm" colorTheme="destructive">
                      {validationErrors.alertType}
                    </Text>
                  )}
                </VStack>
              </Card>
            </Animated.View>
          )}
          
          {/* Step 3: Urgency Level */}
          {formData.alertType && (
            <Animated.View entering={SlideInDown.delay(300)}>
              <Card style={shadowLg}>
                <VStack gap={spacing[4]} p={spacing[5]}>
                  <HStack gap={spacing[2]} align="center">
                    <Badge variant="default" size="sm">
                      <Text size="xs" weight="bold">STEP 3</Text>
                    </Badge>
                    <Text weight="semibold" size="lg">Urgency Level</Text>
                  </HStack>
                  
                  <UrgencySelector
                    selected={formData.urgencyLevel}
                    onChange={(level) => setFormData({ ...formData, urgencyLevel: level })}
                  />
                </VStack>
              </Card>
            </Animated.View>
          )}
          
          {/* Step 4: Additional Details (Optional) */}
          {formData.urgencyLevel && (
            <Animated.View entering={SlideInDown.delay(400)}>
              <Card style={shadowLg}>
                <VStack gap={spacing[4]} p={spacing[5]}>
                  <HStack gap={spacing[2]} align="center">
                    <Badge variant="outline" size="sm">
                      <Text size="xs" weight="bold">OPTIONAL</Text>
                    </Badge>
                    <Text weight="semibold" size="lg">Additional Details</Text>
                  </HStack>
                  
                  <Input
                    value={formData.description || ''}
                    onChangeText={(value) => setFormData({ ...formData, description: value })}
                    placeholder="Provide any additional context..."
                    multiline
                    numberOfLines={3}
                    maxLength={500}
                    style={{
                      minHeight: 80,
                      textAlignVertical: 'top',
                    }}
                  />
                  
                  <Text size="xs" colorTheme="mutedForeground" style={{ textAlign: 'right' }}>
                    {(formData.description?.length || 0)}/500 characters
                  </Text>
                </VStack>
              </Card>
            </Animated.View>
          )}
          
          {/* Preview Alert */}
          {isFormValid && (
            <Animated.View entering={FadeIn.delay(500)}>
              <AlertComponent 
                variant={formData.urgencyLevel && formData.urgencyLevel <= 2 ? "error" : "default"}
              >
                <VStack gap={spacing[2]}>
                  <HStack gap={spacing[2]} align="center">
                    <Text size="lg">
                      {formData.alertType && ALERT_TYPE_CONFIG[formData.alertType]?.icon || '⚠️'}
                    </Text>
                    <Text weight="bold">Alert Preview</Text>
                  </HStack>
                  <Text size="sm">
                    {formData.alertType?.replace(/_/g, ' ').toUpperCase()} - Room {formData.roomNumber}
                  </Text>
                  <Text size="xs" colorTheme="mutedForeground">
                    Urgency: {formData.urgencyLevel && URGENCY_LEVEL_CONFIG[formData.urgencyLevel].label}
                  </Text>
                  {formData.description && (
                    <Text size="xs">{formData.description}</Text>
                  )}
                </VStack>
              </AlertComponent>
            </Animated.View>
          )}
          
          {/* Submit Button */}
          {isFormValid && (
            <Animated.View entering={SlideInDown.delay(600)}>
              <Button
                size="lg"
                variant="destructive"
                onPress={handleSubmit}
                isLoading={isPending || createAlertMutation.isPending}
                disabled={!isFormValid}
                style={{
                  minHeight: 56,
                }}
              >
                <HStack gap={spacing[2]} align="center">
                  <Text size="lg" weight="bold" style={{ color: '#ffffff' }}>
                    {showPreview ? 'CONFIRM & SEND ALERT' : 'SEND EMERGENCY ALERT'}
                  </Text>
                  <Text size="xl">🚨</Text>
                </HStack>
              </Button>
              
              {showPreview && (
                <Button
                  variant="outline"
                  onPress={() => setShowPreview(false)}
                  style={{ marginTop: spacing[3] }}
                >
                  Cancel
                </Button>
              )}
            </Animated.View>
          )}
          
          {/* Loading/Success Feedback */}
          {createAlertMutation.isPending && (
            <Animated.View entering={FadeIn} exiting={FadeOut}>
              <Card style={{ backgroundColor: '#f0f0f0' }}>
                <VStack gap={spacing[3]} p={spacing[5]} align="center">
                  <Text size="lg" weight="bold">Sending Alert...</Text>
                  <Text size="sm" colorTheme="mutedForeground">
                    Notifying all available medical staff
                  </Text>
                </VStack>
              </Card>
            </Animated.View>
          )}
        </VStack>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}