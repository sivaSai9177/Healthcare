import React from 'react';
import { View, TextInput, ActivityIndicator } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  VStack,
  HStack,
  Text,
  Button,
  Card,
  GlassCard,
  Symbol,
  Badge,
} from '@/components/universal';
import { useSpacing } from '@/lib/stores/spacing-store';
import { useTheme } from '@/lib/theme/provider';
import { useShadow } from '@/hooks/useShadow';
import { haptic } from '@/lib/ui/haptics';
import { enhancedSchemas } from '@/lib/validations/healthcare';
import { logger } from '@/lib/core/debug/unified-logger';
import { useFormDraft } from '@/hooks/useFormDraft';
import type { z } from 'zod';

type HandoverFormData = z.infer<typeof enhancedSchemas.shiftHandover>;

interface ShiftHandoverFormProps {
  activeAlerts: number;
  onSubmit: (notes: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ShiftHandoverForm({
  activeAlerts,
  onSubmit,
  onCancel,
  isLoading,
}: ShiftHandoverFormProps) {
  const { spacing } = useSpacing();
  const theme = useTheme();
  const shadowMd = useShadow({ size: 'md' });
  
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    reset,
  } = useForm<HandoverFormData>({
    resolver: zodResolver(enhancedSchemas.shiftHandover),
    defaultValues: {
      notes: '',
      handoverTo: undefined,
    },
    mode: 'onChange',
  });
  
  // Add draft persistence
  const { saveDraft, clearDraft, draftAge, isRestoring } = useFormDraft({
    formKey: 'shift-handover',
    watch,
    reset,
    autoSaveDelay: 1500, // Save every 1.5 seconds
    showRestoreNotification: true,
    onDraftRestored: (data) => {
      logger.healthcare.info('Shift handover draft restored', { 
        hasNotes: !!data.notes,
        notesLength: data.notes?.length 
      });
    },
  });
  
  const notesValue = watch('notes');
  const notesLength = notesValue?.length || 0;
  
  const onFormSubmit = async (data: HandoverFormData) => {
    logger.healthcare.info('Shift handover form submitted', {
      notesLength: data.notes.length,
      hasHandoverTo: !!data.handoverTo,
    });
    
    haptic('success');
    
    // Clear draft on successful submission
    await clearDraft();
    
    // Pass only the notes string to match expected signature
    onSubmit(data.notes);
  };
  
  const handleCancel = async () => {
    haptic('light');
    
    // Save current draft before canceling
    await saveDraft();
    
    onCancel();
  };
  
  return (
    <VStack gap={3}>
      {/* Loading indicator for draft restoration */}
      {isRestoring && (
        <Card style={{ backgroundColor: theme.muted }}>
          <HStack gap={2} p={spacing[3]} alignItems="center" justifyContent="center">
            <ActivityIndicator size="small" color={theme.primary} />
            <Text size="sm" colorTheme="mutedForeground">Restoring draft...</Text>
          </HStack>
        </Card>
      )}
      {/* Alert Warning */}
      <Card 
        style={[
          { 
            backgroundColor: theme.destructive + '20', 
            borderColor: theme.destructive 
          }, 
          shadowMd
        ]}
      >
        <HStack gap={3} p={spacing[3]} alignItems="center">
          <View style={{
            backgroundColor: theme.destructive,
            borderRadius: 12,
            padding: spacing[2],
          }}>
            <Symbol name="exclamationmark.triangle.fill" size="md" color="white" />
          </View>
          <VStack gap={1} style={{ flex: 1 }}>
            <Text weight="semibold">
              {activeAlerts} Active Alert{activeAlerts !== 1 ? 's' : ''}
            </Text>
            <Text size="sm" colorTheme="mutedForeground">
              Please provide handover notes for the incoming shift
            </Text>
          </VStack>
        </HStack>
      </Card>

      {/* Handover Form */}
      <GlassCard style={shadowMd}>
        <VStack gap={4} p={spacing[4]}>
          {/* Notes Field */}
          <VStack gap={2}>
            <VStack gap={1}>
              <HStack gap={1} alignItems="center">
                <Text weight="semibold" size="lg">Handover Notes</Text>
                <Text size="sm" style={{ color: theme.destructive }}>*</Text>
              </HStack>
              <Text size="sm" colorTheme="mutedForeground">
                Summarize current status and important information
              </Text>
            </VStack>
            
            <Controller
              control={control}
              name="notes"
              render={({ field: { onChange, onBlur, value } }) => (
                <VStack gap={1}>
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="e.g., Room 302 patient requires hourly monitoring..."
                    multiline
                    numberOfLines={6}
                    maxLength={500}
                    style={{
                      backgroundColor: theme.muted,
                      borderRadius: 8,
                      padding: spacing[3],
                      borderWidth: errors.notes ? 2 : 1,
                      borderColor: errors.notes ? theme.destructive : theme.border,
                      color: theme.foreground,
                      fontSize: 14,
                      minHeight: 120,
                      textAlignVertical: 'top',
                    }}
                    placeholderTextColor={theme.mutedForeground}
                  />
                  
                  <HStack justifyContent="space-between" alignItems="center">
                    {errors.notes ? (
                      <Text size="xs" style={{ color: theme.destructive }}>
                        {errors.notes.message}
                      </Text>
                    ) : (
                      <Text size="xs" colorTheme="mutedForeground">
                        Minimum 10 characters required
                      </Text>
                    )}
                    <VStack alignItems="flex-end" gap={0.5}>
                      <Text size="xs" colorTheme="mutedForeground">
                        {notesLength}/500
                      </Text>
                      {draftAge !== null && (
                        <Text size="xs" colorTheme="mutedForeground">
                          Draft saved
                        </Text>
                      )}
                    </VStack>
                  </HStack>
                </VStack>
              )}
            />
          </VStack>

          {/* Example prompts */}
          <VStack gap={2}>
            <Text size="sm" weight="medium" colorTheme="mutedForeground">
              Include information about:
            </Text>
            <VStack gap={1}>
              {[
                'Current alert statuses and patient conditions',
                'Any pending procedures or medications',
                'Special care instructions or concerns',
                'Equipment issues or maintenance needs',
              ].map((prompt, index) => (
                <HStack key={index} gap={2} alignItems="flex-start">
                  <Text size="xs" colorTheme="mutedForeground">•</Text>
                  <Text size="xs" colorTheme="mutedForeground" style={{ flex: 1 }}>
                    {prompt}
                  </Text>
                </HStack>
              ))}
            </VStack>
          </VStack>

          {/* Action Buttons */}
          <HStack gap={2} style={{ marginTop: spacing[2] }}>
            <Button
              variant="outline"
              onPress={handleCancel}
              disabled={isLoading}
              style={{ flex: 1 }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onPress={handleSubmit(onFormSubmit)}
              disabled={!isValid || isLoading}
              style={{ flex: 1 }}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                'End Shift'
              )}
            </Button>
          </HStack>
        </VStack>
      </GlassCard>
    </VStack>
  );
}