import React, { useState, useTransition, useDeferredValue, useOptimistic } from 'react';
import { Platform } from 'react-native';
import { 
  Card, 
  VStack, 
  HStack, 
  Text, 
  Input, 
  Button, 
  Grid,
  ScrollContainer,
  Box,
  Badge,
} from '@/components/universal';
import { goldenSpacing, goldenShadows, goldenAnimations, goldenDimensions, healthcareColors } from '@/lib/design-system/golden-ratio';
import { useTheme } from '@/lib/theme/theme-provider';
import { useAuthStore } from '@/lib/stores/auth-store';
import { api } from '@/lib/trpc';
import { z } from 'zod';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { log } from '@/lib/core/logger';
import { showErrorAlert, showSuccessAlert } from '@/lib/core/alert';

// Alert validation schemas
export const alertTypeSchema = z.enum([
  'cardiac',
  'code-blue',
  'fall',
  'fire',
  'security',
  'medical-emergency'
]);

export const createAlertSchema = z.object({
  roomNumber: z.string().regex(/^\d{3}$/, 'Room number must be 3 digits'),
  alertType: alertTypeSchema,
  urgency: z.number().min(1).max(5).default(3),
  description: z.string().optional(),
  departmentId: z.string().uuid(),
  hospitalId: z.string().uuid(),
});

export type CreateAlertInput = z.infer<typeof createAlertSchema>;

// Alert template type
interface AlertTemplate {
  id: string;
  type: z.infer<typeof alertTypeSchema>;
  icon: string;
  label: string;
  color: string;
  defaultUrgency: number;
  defaultDescription?: string;
}

// Default alert templates
const defaultTemplates: AlertTemplate[] = [
  { id: 'cardiac', type: 'cardiac', icon: '❤️', label: 'Cardiac', color: healthcareColors.emergency, defaultUrgency: 5 },
  { id: 'code-blue', type: 'code-blue', icon: '🔵', label: 'Code Blue', color: healthcareColors.emergency, defaultUrgency: 5 },
  { id: 'fall', type: 'fall', icon: '🚶', label: 'Fall', color: healthcareColors.warning, defaultUrgency: 3 },
  { id: 'fire', type: 'fire', icon: '🔥', label: 'Fire', color: healthcareColors.emergency, defaultUrgency: 5 },
  { id: 'security', type: 'security', icon: '🔒', label: 'Security', color: healthcareColors.warning, defaultUrgency: 4 },
  { id: 'medical-emergency', type: 'medical-emergency', icon: '🚨', label: 'Medical', color: healthcareColors.emergency, defaultUrgency: 4 },
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
                urgency: template.defaultUrgency,
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
const AlertTypeButton = ({ type, icon, label, color, selected, onPress }: {
  type: string;
  icon: string;
  label: string;
  color: string;
  selected: boolean;
  onPress: () => void;
}) => {
  const theme = useTheme();
  
  return (
    <Button
      onPress={onPress}
      variant={selected ? "default" : "outline"}
      style={{
        height: goldenDimensions.heights.medium,
        backgroundColor: selected ? color : 'transparent',
        borderColor: color,
        borderWidth: 2,
      }}
    >
      <VStack spacing={goldenSpacing.xs} alignItems="center">
        <Text size="2xl">{icon}</Text>
        <Text size="sm" weight="medium" colorTheme={selected ? "inverse" : "foreground"}>
          {label}
        </Text>
      </VStack>
    </Button>
  );
};

// Main alert creation block
export const AlertCreationBlock = ({ hospitalId }: { hospitalId: string }) => {
  const theme = useTheme();
  const { user } = useAuthStore();
  const [isPending, startTransition] = useTransition();
  const queryClient = api.useUtils();
  
  // Zustand store
  const { formData, updateFormData, resetForm, applyTemplate, templates } = useAlertCreationStore();
  
  // React 19 - Deferred search for room suggestions
  const [roomSearch, setRoomSearch] = useState('');
  const deferredRoomSearch = useDeferredValue(roomSearch);
  
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
    onError: (err, newAlert, context) => {
      // Rollback on error
      if (context?.previousAlerts) {
        queryClient.healthcare.getActiveAlerts.setData(undefined, context.previousAlerts);
      }
      showErrorAlert('Failed to create alert', err.message);
    },
    onSuccess: (data) => {
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
        const validatedData = createAlertSchema.parse({
          ...formData,
          hospitalId,
          departmentId: user?.departmentId || 'a47ac10b-58cc-4372-a567-0e02b2c3d479', // Default UUID
        });
        
        createAlertMutation.mutate(validatedData);
      } catch (error) {
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
    (_, newTemplate: string) => newTemplate as z.infer<typeof alertTypeSchema>
  );
  
  return (
    <Card
      padding={goldenSpacing.xl}
      gap={goldenSpacing.xxl}
      shadow={goldenShadows.lg}
      style={{
        minHeight: goldenDimensions.heights.huge,
        backgroundColor: theme.card,
      }}
    >
      {/* Room Number with Autocomplete */}
      <VStack gap={goldenSpacing.md}>
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
          size="large"
          autoFocus
          error={formData.roomNumber && !createAlertSchema.shape.roomNumber.safeParse(formData.roomNumber).success}
        />
        
        {/* Room suggestions placeholder */}
        {roomSearch.length >= 2 && (
          <Text size="sm" colorTheme="mutedForeground">
            Type full 3-digit room number
          </Text>
        )}
      </VStack>
      
      {/* Alert Type Selection with Optimistic Updates */}
      <VStack gap={goldenSpacing.md}>
        <Text weight="medium">Alert Type *</Text>
        <Grid columns={Platform.OS === 'web' ? 3 : 2} gap={goldenSpacing.md}>
          {templates.map((template) => (
            <AlertTypeButton
              key={template.id}
              type={template.id}
              icon={template.icon}
              label={template.label}
              color={template.color}
              selected={optimisticTemplate === template.type}
              onPress={() => {
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
      <VStack gap={goldenSpacing.sm}>
        <Text weight="medium">Additional Details</Text>
        <Input
          placeholder="Type additional information..."
          value={formData.description || ''}
          onChangeText={(value) => updateFormData({ description: value })}
          multiline
          numberOfLines={2}
          style={{ minHeight: goldenDimensions.heights.medium }}
        />
      </VStack>
      
      {/* Urgency Level */}
      {formData.alertType && (
        <VStack gap={goldenSpacing.sm}>
          <Text weight="medium">Urgency Level</Text>
          <HStack gap={goldenSpacing.md}>
            {[1, 2, 3, 4, 5].map((level) => (
              <Button
                key={level}
                variant={formData.urgency === level ? "default" : "outline"}
                size="small"
                onPress={() => updateFormData({ urgency: level })}
                style={{
                  backgroundColor: formData.urgency === level 
                    ? level >= 4 ? healthcareColors.emergency : level >= 3 ? healthcareColors.warning : healthcareColors.info
                    : 'transparent',
                  borderColor: level >= 4 ? healthcareColors.emergency : level >= 3 ? healthcareColors.warning : healthcareColors.info,
                }}
              >
                {level}
              </Button>
            ))}
          </HStack>
        </VStack>
      )}
      
      {/* Submit with Loading State */}
      <HStack gap={goldenSpacing.md} style={{ height: goldenDimensions.heights.medium }}>
        <Button
          size="large"
          variant="destructive"
          style={{ flex: PHI }}
          onPress={validateAndSubmit}
          loading={isPending || createAlertMutation.isPending}
          disabled={!formData.roomNumber || !formData.alertType}
        >
          {isPending ? 'Creating Alert...' : 'Send Alert →'}
        </Button>
        <Button
          size="large"
          variant="outline"
          style={{ flex: 1 }}
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
  );
};

// Re-export PHI constant
const PHI = 1.618;