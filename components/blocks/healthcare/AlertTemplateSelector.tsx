import React, { useState } from 'react';
import { 
  View, 
  ScrollView, 
  Pressable, 
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { VStack, HStack } from '@/components/universal/layout';
import { Text } from '@/components/universal/typography';
import { Button, Input } from '@/components/universal/interaction';
import { Symbol, Badge, GlassCard } from '@/components/universal/display';
import { useSpacing } from '@/lib/stores/spacing-store';
import { useTheme } from '@/lib/theme/provider';
import { api } from '@/lib/api/trpc';
import { haptic } from '@/lib/ui/haptics';
import { showErrorAlert, showSuccessAlert } from '@/lib/core/alert';
import { useRouter } from 'expo-router';
import { 
  ALERT_TYPE_CONFIG, 
  URGENCY_LEVEL_CONFIG 
} from '@/types/healthcare';
import type { AlertTemplate } from '@/types/alert';
import { logger } from '@/lib/core/debug/unified-logger';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

interface AlertTemplateSelectorProps {
  hospitalId: string;
  onSelectTemplate: (template: AlertTemplate) => void;
  onCreateAlert: (template: AlertTemplate, roomNumber: string, description?: string) => void;
  embedded?: boolean;
}

export const AlertTemplateSelector: React.FC<AlertTemplateSelectorProps> = ({
  hospitalId,
  onSelectTemplate,
  onCreateAlert,
  embedded = false,
}) => {
  const { spacing } = useSpacing();
  const theme = useTheme();
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState<AlertTemplate | null>(null);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [roomNumber, setRoomNumber] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Fetch templates
  const { data, isLoading, error, refetch } = api.healthcare.getAlertTemplates.useQuery({
    hospitalId,
    includeGlobal: true,
    activeOnly: true,
  });

  // Create alert from template mutation
  const createFromTemplateMutation = api.healthcare.createAlertFromTemplate.useMutation({
    onSuccess: (result) => {
      haptic('success');
      showSuccessAlert('Alert Created', `Alert created for room ${roomNumber}`);
      setShowQuickCreate(false);
      setSelectedTemplate(null);
      setRoomNumber('');
      setDescription('');
      
      // Navigate to the alert
      if (!embedded) {
        router.push(`/alerts/${result.alert.id}`);
      }
    },
    onError: (error) => {
      haptic('error');
      showErrorAlert('Failed to create alert', error.message);
    },
  });

  const handleTemplateSelect = (template: AlertTemplate) => {
    haptic('light');
    setSelectedTemplate(template);
    onSelectTemplate(template);
    setShowQuickCreate(true);
  };

  const handleQuickCreate = async () => {
    if (!selectedTemplate || !roomNumber.trim()) {
      haptic('warning');
      showErrorAlert('Missing Information', 'Please enter a room number');
      return;
    }

    setIsCreating(true);
    try {
      await createFromTemplateMutation.mutateAsync({
        templateId: selectedTemplate.id,
        roomNumber: roomNumber.trim(),
        description: description.trim() || undefined,
      });
      
      onCreateAlert(selectedTemplate, roomNumber, description);
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <View style={{ padding: spacing[4] as any, alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text size="sm" colorTheme="mutedForeground" style={{ marginTop: spacing[2] as any }}>
          Loading templates...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <GlassCard style={{ margin: spacing[4] as any, padding: spacing[4] as any }}>
        <VStack gap={spacing[3] as any} alignItems="center">
          <Symbol name="exclamationmark.triangle" size="lg" color={theme.destructive} />
          <Text colorTheme="destructive">Failed to load templates</Text>
          <Button size="sm" variant="outline" onPress={() => refetch()}>
            Try Again
          </Button>
        </VStack>
      </GlassCard>
    );
  }

  const templates = data?.templates || [];
  const globalTemplates = templates.filter(t => t.isGlobal);
  const hospitalTemplates = templates.filter(t => !t.isGlobal);

  return (
    <>
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing[4] as any }}
        showsVerticalScrollIndicator={false}
      >
        <VStack gap={spacing[4] as any}>
          {/* Quick Templates Section */}
          <VStack gap={spacing[2] as any}>
            <Text size="lg" weight="semibold">Quick Alert Templates</Text>
            <Text size="sm" colorTheme="mutedForeground">
              Tap a template to quickly create an alert
            </Text>
          </VStack>

          {/* Global Templates */}
          {globalTemplates.length > 0 && (
            <VStack gap={spacing[3] as any}>
              <HStack alignItems="center" gap={spacing[2] as any}>
                <Symbol name="globe" size="sm" color={theme.primary} />
                <Text size="sm" weight="medium">Standard Templates</Text>
              </HStack>
              
              {globalTemplates.map((template, index) => (
                <Animated.View
                  key={template.id}
                  entering={FadeInDown.delay(index * 50)}
                >
                  <TemplateCard
                    template={template}
                    onPress={() => handleTemplateSelect(template)}
                    isSelected={selectedTemplate?.id === template.id}
                  />
                </Animated.View>
              ))}
            </VStack>
          )}

          {/* Hospital-specific Templates */}
          {hospitalTemplates.length > 0 && (
            <VStack gap={spacing[3] as any}>
              <HStack alignItems="center" gap={spacing[2] as any}>
                <Symbol name="building.2" size="sm" color={theme.primary} />
                <Text size="sm" weight="medium">Hospital Templates</Text>
              </HStack>
              
              {hospitalTemplates.map((template, index) => (
                <Animated.View
                  key={template.id}
                  entering={FadeInDown.delay((globalTemplates.length + index) * 50)}
                >
                  <TemplateCard
                    template={template}
                    onPress={() => handleTemplateSelect(template)}
                    isSelected={selectedTemplate?.id === template.id}
                  />
                </Animated.View>
              ))}
            </VStack>
          )}

          {templates.length === 0 && (
            <GlassCard style={{ padding: spacing[6] as any, alignItems: 'center' }}>
              <VStack gap={spacing[3] as any} alignItems="center">
                <Symbol name="doc.text" size="xl" color={theme.mutedForeground} />
                <Text colorTheme="mutedForeground" align="center">
                  No alert templates available
                </Text>
                <Text size="sm" colorTheme="mutedForeground" align="center">
                  Contact your administrator to create templates
                </Text>
              </VStack>
            </GlassCard>
          )}
        </VStack>
      </ScrollView>

      {/* Quick Create Modal */}
      <Modal
        visible={showQuickCreate}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowQuickCreate(false)}
      >
        <BlurView intensity={100} style={{ flex: 1 }}>
          <LinearGradient
            colors={[theme.background, theme.card]}
            style={{ flex: 1 }}
          >
            <VStack style={{ flex: 1, padding: spacing[4] as any }}>
              {/* Header */}
              <HStack justifyContent="space-between" alignItems="center">
                <Text size="xl" weight="bold">Create Alert</Text>
                <Pressable onPress={() => setShowQuickCreate(false)}>
                  <Symbol name="xmark.circle.fill" size="lg" color={theme.mutedForeground} />
                </Pressable>
              </HStack>

              {selectedTemplate && (
                <VStack gap={spacing[4] as any} style={{ marginTop: spacing[6] as any }}>
                  {/* Selected Template Info */}
                  <GlassCard style={{ padding: spacing[4] as any }}>
                    <VStack gap={spacing[3] as any}>
                      <HStack alignItems="center" gap={spacing[2] as any}>
                        <Text style={{ fontSize: 32 }}>
                          {selectedTemplate.icon || ALERT_TYPE_CONFIG[selectedTemplate.alertType]?.icon}
                        </Text>
                        <VStack style={{ flex: 1 }}>
                          <Text size="lg" weight="semibold">{selectedTemplate.name}</Text>
                          <Text size="sm" colorTheme="mutedForeground">
                            {ALERT_TYPE_CONFIG[selectedTemplate.alertType]?.label}
                          </Text>
                        </VStack>
                      </HStack>
                      
                      <Badge
                        style={{
                          backgroundColor: URGENCY_LEVEL_CONFIG[selectedTemplate.urgencyLevel]?.color,
                          alignSelf: 'flex-start',
                        }}
                      >
                        <Text size="xs" style={{ color: 'white' }}>
                          {URGENCY_LEVEL_CONFIG[selectedTemplate.urgencyLevel]?.label}
                        </Text>
                      </Badge>
                      
                      {selectedTemplate.defaultDescription && (
                        <Text size="sm" colorTheme="mutedForeground">
                          {selectedTemplate.defaultDescription}
                        </Text>
                      )}
                    </VStack>
                  </GlassCard>

                  {/* Form Fields */}
                  <VStack gap={spacing[3] as any}>
                    <VStack gap={spacing[2] as any}>
                      <Text size="sm" weight="medium">Room Number *</Text>
                      <TextInput
                        value={roomNumber}
                        onChangeText={setRoomNumber}
                        placeholder="e.g., 302, ICU-1"
                        style={{
                          backgroundColor: theme.card,
                          borderWidth: 1,
                          borderColor: theme.border,
                          borderRadius: 8,
                          padding: spacing[3] as any,
                          fontSize: 16,
                          color: theme.foreground,
                        }}
                        autoCapitalize="characters"
                        maxLength={10}
                      />
                    </VStack>

                    <VStack gap={spacing[2] as any}>
                      <Text size="sm" weight="medium">Additional Details (Optional)</Text>
                      <TextInput
                        value={description}
                        onChangeText={setDescription}
                        placeholder="Any additional information..."
                        multiline
                        numberOfLines={3}
                        style={{
                          backgroundColor: theme.card,
                          borderWidth: 1,
                          borderColor: theme.border,
                          borderRadius: 8,
                          padding: spacing[3] as any,
                          fontSize: 16,
                          color: theme.foreground,
                          minHeight: 80,
                          textAlignVertical: 'top',
                        }}
                        maxLength={500}
                      />
                    </VStack>
                  </VStack>

                  {/* Actions */}
                  <VStack gap={spacing[3] as any} style={{ marginTop: 'auto', paddingBottom: spacing[8] as any }}>
                    <Button
                      onPress={handleQuickCreate}
                      disabled={!roomNumber.trim() || isCreating}
                      size="lg"
                      style={{
                        backgroundColor: theme.destructive,
                      }}
                    >
                      {isCreating ? (
                        <ActivityIndicator color="white" />
                      ) : (
                        <HStack gap={spacing[2] as any} alignItems="center">
                          <Symbol name="bell.badge.fill" size="sm" color="white" />
                          <Text style={{ color: 'white' }}>Create Alert</Text>
                        </HStack>
                      )}
                    </Button>
                    
                    <Button
                      onPress={() => setShowQuickCreate(false)}
                      variant="outline"
                      size="lg"
                    >
                      Cancel
                    </Button>
                  </VStack>
                </VStack>
              )}
            </VStack>
          </LinearGradient>
        </BlurView>
      </Modal>
    </>
  );
};

// Template Card Component
const TemplateCard: React.FC<{
  template: AlertTemplate;
  onPress: () => void;
  isSelected?: boolean;
}> = ({ template, onPress, isSelected }) => {
  const { spacing } = useSpacing();
  const theme = useTheme();
  const alertConfig = ALERT_TYPE_CONFIG[template.alertType];
  const urgencyConfig = URGENCY_LEVEL_CONFIG[template.urgencyLevel];

  return (
    <Pressable onPress={onPress}>
      <GlassCard
        style={{
          padding: spacing[3] as any,
          borderWidth: isSelected ? 2 : 1,
          borderColor: isSelected ? theme.primary : theme.border,
          backgroundColor: isSelected ? theme.primary + '10' : theme.card,
        }}
      >
        <HStack justifyContent="space-between" alignItems="center">
          <HStack gap={spacing[3] as any} alignItems="center" style={{ flex: 1 }}>
            <Text style={{ fontSize: 28 }}>
              {template.icon || alertConfig?.icon || '🚨'}
            </Text>
            
            <VStack style={{ flex: 1 }} gap={spacing[1] as any}>
              <Text weight="medium">{template.name}</Text>
              <HStack gap={spacing[2] as any} alignItems="center">
                <Badge
                  size="sm"
                  style={{
                    backgroundColor: urgencyConfig?.color || '#666',
                  }}
                >
                  <Text size="xs" style={{ color: urgencyConfig?.textColor || 'white' }}>
                    {urgencyConfig?.label}
                  </Text>
                </Badge>
                <Text size="xs" colorTheme="mutedForeground">
                  {alertConfig?.label}
                </Text>
              </HStack>
            </VStack>
          </HStack>
          
          <Symbol 
            name="chevron.right" 
            size="sm" 
            color={isSelected ? theme.primary : theme.mutedForeground} 
          />
        </HStack>
      </GlassCard>
    </Pressable>
  );
};