import React, { useState, useTransition, useOptimistic } from 'react';
import { View } from 'react-native';
import { 
  Card, 
  VStack, 
  HStack, 
  Text, 
  Input, 
  Button, 
  Grid,
} from '@/components/universal';
import { cn } from '@/lib/core/utils';
import { useSpacing } from '@/lib/stores/spacing-store';
import { useShadow } from '@/hooks/useShadow';
import { useResponsive } from '@/hooks/responsive';
import { useAuthStore } from '@/lib/stores/auth-store';
import { api } from '@/lib/api/trpc';
import { z } from 'zod';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { showErrorAlert, showSuccessAlert } from '@/lib/core/alert';
import { haptic } from '@/lib/ui/haptics';

// Import healthcare types
import { 
  AlertType, 
  CreateAlertSchema, 
  CreateAlertInput,
  ALERT_TYPE_CONFIG,
  URGENCY_LEVEL_CONFIG 
} from '@/types/healthcare';
// Use semantic variants instead of hardcoded colors
const getUrgencyVariant = (urgency: number) => {
  if (urgency <= 2) return 'destructive'; // critical
  if (urgency === 3) return 'secondary'; // medium  
  return 'default'; // low
};

// Alert template type
interface AlertTemplate {
  id: string;
  type: AlertType;
  icon: string;
  label: string;
  color: string;
  defaultUrgency: number;
  defaultDescription?: string;
}

// Default alert templates based on ALERT_TYPE_CONFIG
const defaultTemplates: AlertTemplate[] = [
  { 
    id: 'cardiac_arrest', 
    type: 'cardiac_arrest', 
    icon: ALERT_TYPE_CONFIG.cardiac_arrest.icon, 
    label: 'Cardiac', 
    color: ALERT_TYPE_CONFIG.cardiac_arrest.color, 
    defaultUrgency: ALERT_TYPE_CONFIG.cardiac_arrest.defaultUrgency 
  },
  { 
    id: 'code_blue', 
    type: 'code_blue', 
    icon: ALERT_TYPE_CONFIG.code_blue.icon, 
    label: 'Code Blue', 
    color: ALERT_TYPE_CONFIG.code_blue.color, 
    defaultUrgency: ALERT_TYPE_CONFIG.code_blue.defaultUrgency 
  },
  { 
    id: 'fire', 
    type: 'fire', 
    icon: ALERT_TYPE_CONFIG.fire.icon, 
    label: 'Fire', 
    color: ALERT_TYPE_CONFIG.fire.color, 
    defaultUrgency: ALERT_TYPE_CONFIG.fire.defaultUrgency 
  },
  { 
    id: 'security', 
    type: 'security', 
    icon: ALERT_TYPE_CONFIG.security.icon, 
    label: 'Security', 
    color: ALERT_TYPE_CONFIG.security.color, 
    defaultUrgency: ALERT_TYPE_CONFIG.security.defaultUrgency 
  },
  { 
    id: 'medical_emergency', 
    type: 'medical_emergency', 
    icon: ALERT_TYPE_CONFIG.medical_emergency.icon, 
    label: 'Medical', 
    color: ALERT_TYPE_CONFIG.medical_emergency.color, 
    defaultUrgency: ALERT_TYPE_CONFIG.medical_emergency.defaultUrgency 
  },
];

// Zustand store for alert creation
interface AlertCreationState {
  formData: Partial<CreateAlertInput>;
  isVoiceRecording: boolean;
  templates: AlertTemplate[];
  updateFormData: (data: Partial<CreateAlertInput>) => void;
  resetForm: () => void;
  setVoiceRecording: (recording: boolean) => void;
  applyTemplate: (templateId: string) => void;
}

const useAlertCreationStore = create<AlertCreationState>()(
  devtools(
    persist(
      immer((set) => ({
        formData: {},
        isVoiceRecording: false,
        templates: defaultTemplates,
        
        updateFormData: (data) =>
          set((state) => {
            Object.assign(state.formData, data);
          }),
          
        resetForm: () =>
          set((state) => {
            state.formData = {};
          }),
          
        setVoiceRecording: (recording) =>
          set((state) => {
            state.isVoiceRecording = recording;
          }),
          
        applyTemplate: (templateId) =>
          set((state) => {
            const template = state.templates.find(t => t.id === templateId);
            if (template) {
              state.formData = {
                ...state.formData,
                alertType: template.type,
                urgencyLevel: template.defaultUrgency as 1 | 2 | 3 | 4 | 5,
                description: template.defaultDescription,
              };
            }
          }),
      })),
      {
        name: 'alert-creation',
        partialize: (state) => ({ formData: state.formData }),
      }
    )
  )
);

// Alert type button component
const AlertTypeButton = ({ icon, label, color, selected, onPress }: {
  icon: string;
  label: string;
  color: string;
  selected: boolean;
  onPress: () => void;
}) => {
  const { componentSizes } = useSpacing();
  const shadowSm = useShadow({ size: 'sm' });
  
  // Animation commented out - using Tailwind classes instead
  // Would use useScaleAnimation here if animation was enabled
  
  return (
    <View>
      <Button
        onPress={onPress}
        variant={selected ? "default" : "outline"}
        className={cn(
          "border-2",
          selected && color === '#ef4444' && "bg-destructive border-destructive",
          selected && color === '#f59e0b' && "bg-warning border-warning", 
          selected && color === '#3b82f6' && "bg-primary border-primary",
          !selected && color === '#ef4444' && "border-destructive",
          !selected && color === '#f59e0b' && "border-warning",
          !selected && color === '#3b82f6' && "border-primary"
        )}
        style={{
          height: componentSizes.button.md.height,
          ...(selected && shadowSm ? shadowSm[0] : {})
        }}
      >
        <VStack spacing={2} alignItems="center">
          <Text size="2xl">{icon}</Text>
          <Text size="sm" weight="medium" colorTheme={selected ? "inverse" : "foreground"}>
            {label}
          </Text>
        </VStack>
      </Button>
    </View>
  );
};

// Main alert creation block
export const AlertCreationForm = ({ hospitalId }: { hospitalId: string }) => {
  const { componentSizes } = useSpacing();
  const { isMobile, isTablet } = useResponsive();
  const shadowLg = useShadow({ size: 'lg' });
  const { user } = useAuthStore();
  const [isPending, startTransition] = useTransition();
  const queryClient = api.useUtils();
  
  // Animation removed - using Tailwind classes
  
  // Zustand store
  const { formData, updateFormData, resetForm, applyTemplate, templates } = useAlertCreationStore();
  
  // Room search state
  const [roomSearch, setRoomSearch] = useState('');
  
  // TanStack Query - Room suggestions (commented out as endpoint might not exist yet)
  // const { data: roomSuggestions } = api.rooms.search.useQuery(
  //   { query: deferredRoomSearch },
  //   { 
  //     enabled: deferredRoomSearch.length >= 2,
  //     staleTime: 30000,
  //   }
  // );
  
  // tRPC mutation with optimistic updates
  const createAlertMutation = api.healthcare.createAlert.useMutation({
    onMutate: async (newAlert) => {
      // Cancel queries
      await queryClient.healthcare.getActiveAlerts.cancel();
      
      // Snapshot previous value
      const previousAlerts = queryClient.healthcare.getActiveAlerts.getData();
      
      // Optimistically update
      queryClient.healthcare.getActiveAlerts.setData(undefined, (old) => {
        if (!old) return old;
        return {
          ...old,
          alerts: [
            {
              ...newAlert,
              id: 'temp-' + Date.now(),
              status: 'pending',
              createdAt: new Date(),
              createdBy: user?.id || '',
              createdByName: user?.name || 'Unknown',
              acknowledged: false,
              acknowledgedAt: null,
              acknowledgedBy: null,
              acknowledgedByName: null,
              resolved: false,
              resolvedAt: null,
              resolvedBy: null,
              resolvedByName: null,
            },
            ...old.alerts
          ]
        };
      });
      
      return { previousAlerts };
    },
    onError: (err, _, context) => {
      // Rollback on error
      if (context?.previousAlerts) {
        queryClient.healthcare.getActiveAlerts.setData(undefined, context.previousAlerts);
      }
      showErrorAlert('Failed to create alert', err.message);
    },
    onSuccess: () => {
      resetForm();
      showSuccessAlert('Alert created successfully');
      
      // Invalidate and refetch
      queryClient.healthcare.getActiveAlerts.invalidate();
    },
  });
  
  // Form validation with Zod
  const validateAndSubmit = () => {
    startTransition(() => {
      try {
        const validatedData = CreateAlertSchema.parse({
          ...formData,
          hospitalId,
        });
        
        createAlertMutation.mutate(validatedData);
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          const firstError = error.errors[0];
          showErrorAlert('Validation Error', firstError.message);
        }
      }
    });
  };
  
  // React 19 - Optimistic UI for template selection
  const [optimisticTemplate, setOptimisticTemplate] = useOptimistic(
    formData.alertType,
    (_, newTemplate: string) => newTemplate as AlertType
  );
  
  
  return (
    <View className="animate-fade-in">
    <Card
      className="bg-card"
      style={[
        {
          minHeight: isMobile ? 350 : 400,
          ...shadowLg[0]
        }
      ]}
    >
      {/* Room Number with Autocomplete */}
      <VStack gap={4}>
        <Input
          label="Room Number *"
          value={formData.roomNumber || ''}
          onChangeText={(value) => {
            setRoomSearch(value);
            updateFormData({ roomNumber: value });
          }}
          placeholder="302"
          keyboardType="numeric"
          maxLength={3}
          size="lg"
          autoFocus
          error={formData.roomNumber && !CreateAlertSchema.shape.roomNumber.safeParse(formData.roomNumber).success ? "Invalid room number" : undefined}
        />
        
        {/* Room suggestions placeholder */}
        {roomSearch.length >= 2 && (
          <Text size="sm" colorTheme="mutedForeground">
            Type full 3-digit room number
          </Text>
        )}
      </VStack>
      
      {/* Alert Type Selection with Optimistic Updates */}
      <VStack gap={4}>
        <Text weight="medium">Alert Type *</Text>
        <Grid columns={isMobile ? 2 : isTablet ? 3 : 5} gap={4}>
          {templates.map((template) => (
            <AlertTypeButton
              key={template.id}
              icon={template.icon}
              label={template.label}
              color={template.color}
              selected={optimisticTemplate === template.type}
              onPress={() => {
                haptic('light');
                setOptimisticTemplate(template.type);
                startTransition(() => {
                  applyTemplate(template.id);
                });
              }}
            />
          ))}
        </Grid>
      </VStack>
      
      {/* Additional Details */}
      <VStack gap={3}>
        <Text weight="medium">Additional Details</Text>
        <Input
          placeholder="Type additional information..."
          value={formData.description || ''}
          onChangeText={(value) => updateFormData({ description: value })}
          multiline
          numberOfLines={2}
          style={{ minHeight: componentSizes.input.lg.height * 2 }}
        />
      </VStack>
      
      {/* Urgency Level */}
      {formData.alertType && (
        <VStack gap={3}>
          <Text weight="medium">Urgency Level</Text>
          <HStack gap={4}>
            {[1, 2, 3, 4, 5].map((level) => {
              const urgencyConfig = URGENCY_LEVEL_CONFIG[level as keyof typeof URGENCY_LEVEL_CONFIG];
              return (
                <Button
                  key={level}
                  variant={formData.urgencyLevel === level ? "default" : "outline"}
                  size="sm"
                  onPress={() => {
                    haptic('light');
                    updateFormData({ urgencyLevel: level as 1 | 2 | 3 | 4 | 5 });
                  }}
                  className={cn(
                    "border-2",
                    formData.urgencyLevel === level && getUrgencyVariant(level) === 'destructive' && "bg-destructive border-destructive",
                    formData.urgencyLevel === level && getUrgencyVariant(level) === 'secondary' && "bg-secondary border-secondary",
                    formData.urgencyLevel === level && getUrgencyVariant(level) === 'default' && "bg-primary border-primary",
                    formData.urgencyLevel !== level && urgencyConfig.color === '#ef4444' && "border-destructive",
                    formData.urgencyLevel !== level && urgencyConfig.color === '#f59e0b' && "border-warning",
                    formData.urgencyLevel !== level && urgencyConfig.color === '#3b82f6' && "border-primary"
                  )}
                >
                  <Text 
                    size="xs" 
                    weight="medium"
                    className={cn(
                      formData.urgencyLevel === level ? "text-primary-foreground" : "",
                      formData.urgencyLevel !== level && urgencyConfig.color === '#ef4444' && "text-destructive",
                      formData.urgencyLevel !== level && urgencyConfig.color === '#f59e0b' && "text-warning",
                      formData.urgencyLevel !== level && urgencyConfig.color === '#3b82f6' && "text-primary"
                    )}
                  >
                    {urgencyConfig.label}
                  </Text>
                </Button>
              );
            })}
          </HStack>
        </VStack>
      )}
      
      {/* Submit with Loading State */}
      <HStack gap={4} className={cn(isMobile ? "flex-col" : "")} style={{ minHeight: componentSizes.button.lg.height }}>
        <Button
          size="lg"
          variant="default"
          className={cn(isMobile ? "w-full" : "flex-[1.618]")}
          onPress={() => {
            haptic('medium');
            validateAndSubmit();
          }}
          isLoading={isPending || createAlertMutation.isPending}
          disabled={!formData.roomNumber || !formData.alertType}
        >
          {isPending ? 'Creating Alert...' : 'Send Alert →'}
        </Button>
        <Button
          size="lg"
          variant="outline"
          className={cn(isMobile ? "w-full" : "flex-1")}
          onPress={() => {
            startTransition(() => {
              resetForm();
            });
          }}
        >
          Cancel
        </Button>
      </HStack>
    </Card>
    </View>
  );
};
