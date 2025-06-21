import React, { useState, useTransition, useCallback } from 'react';
import { Platform, Pressable, ScrollView, KeyboardAvoidingView, Dimensions } from 'react-native';
import { Card, Badge } from '@/components/universal/display';
import { VStack, HStack, Box } from '@/components/universal/layout';
import { Alert as AlertComponent } from '@/components/universal/feedback';
import { Text } from '@/components/universal/typography';
import { Input } from '@/components/universal/form';
import { Button } from '@/components/universal/interaction';
import { useSpacingStore } from '@/lib/stores/spacing-store';
import { useAnimationStore } from '@/lib/stores/animation-store';
import { useThemeStore } from '@/lib/stores/theme-store';
import { useShadow } from '@/hooks/useShadow';
import { SpacingScale } from '@/lib/design/spacing';
import { api } from '@/lib/api/trpc';
import { showErrorAlert, showSuccessAlert } from '@/lib/core/alert';
import { haptic } from '@/lib/ui/haptics';
import { useRouter } from 'expo-router';
import Animated, { 
  FadeIn, 
  FadeOut, 
  SlideInDown,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useResponsive, useResponsiveValue } from '@/hooks/responsive';
import { cn } from '@/lib/core/utils';

// Import healthcare types and validation
import { 
  AlertType, 
  CreateAlertInput,
  ALERT_TYPE_CONFIG,
  URGENCY_LEVEL_CONFIG,
  UrgencyLevel
} from '@/types/healthcare';
import { 
  useCreateAlertValidation, 
  getFirstError 
} from '@/hooks/healthcare';

interface AlertCreationFormEnhancedProps {
  hospitalId: string;
  onSuccess?: () => void;
  embedded?: boolean;
}

// Alert type card component with proper design tokens
const AlertTypeCard = ({ 
  type, 
  selected, 
  onPress 
}: {
  type: keyof typeof ALERT_TYPE_CONFIG;
  selected: boolean;
  onPress: () => void;
}) => {
  const { spacing, componentSpacing } = useSpacingStore();
  const { theme } = useThemeStore();
  const { shouldAnimate } = useAnimationStore();
  const animationsEnabled = shouldAnimate();
  const config = ALERT_TYPE_CONFIG[type];
  const shadowSm = useShadow({ size: 'sm' });
  const shadowMd = useShadow({ size: 'md' });
  const { isMobile } = useResponsive();
  
  // Responsive card dimensions using design tokens
  const cardDimensions = useResponsiveValue({
    xs: { width: spacing[28], height: spacing[32] }, // 112px x 128px
    sm: { width: spacing[32], height: spacing[36] }, // 128px x 144px
    md: { width: spacing[36], height: spacing[40] }, // 144px x 160px
    lg: { width: spacing[40], height: spacing[44] }, // 160px x 176px
  });
  
  // Responsive icon size from typography scale
  const iconSize = useResponsiveValue({
    xs: '2xl',
    sm: '3xl',
    md: '4xl',
    lg: '5xl',
  });
  
  // Animation styles - capture shouldAnimate value outside worklet
  const animatedStyle = useAnimatedStyle(() => {
    if (!animationsEnabled) return {};
    
    return {
      transform: [
        {
          scale: withSpring(selected ? 1.05 : 1, {
            damping: 15,
            stiffness: 300,
          }),
        },
      ],
    };
  });
  
  return (
    <Pressable onPress={onPress}>
      <Animated.View 
        entering={animationsEnabled ? FadeIn.delay(100).springify() : undefined}
        style={animatedStyle}
      >
        <Card
          className={cn(
            "transition-all duration-200",
            selected && "ring-2 ring-offset-2"
          )}
          style={[
            {
              padding: componentSpacing.cardPadding,
              width: cardDimensions.width,
              height: cardDimensions.height,
              borderWidth: 2,
              borderColor: selected ? config.color : theme.border,
              backgroundColor: selected ? `${config.color}15` : theme.card,
            },
            selected ? shadowMd : shadowSm,
          ]}
        >
          <VStack 
            gap={componentSpacing.stackGap} 
            align="center" 
            justify="center" 
            style={{ flex: 1 }}
          >
            <Text size={iconSize as any}>{config.icon}</Text>
            <Text 
              size={isMobile ? "xs" : "sm"} 
              weight={selected ? "bold" : "medium"}
              style={{ 
                color: selected ? config.color : theme.foreground,
                textAlign: 'center' 
              }}
              numberOfLines={2}
              adjustsFontSizeToFit
            >
              {type.replace(/_/g, ' ').toUpperCase()}
            </Text>
            {selected && (
              <Animated.View
                entering={animationsEnabled ? FadeIn.springify() : undefined}
              >
                <Badge 
                  variant="default" 
                  size={isMobile ? "xs" : "sm"}
                  style={{ backgroundColor: config.color }}
                >
                  <Text size="xs" style={{ color: theme.background }}>
                    Selected
                  </Text>
                </Badge>
              </Animated.View>
            )}
          </VStack>
        </Card>
      </Animated.View>
    </Pressable>
  );
};

// Urgency level selector with design tokens
const UrgencySelector = ({ 
  selected, 
  onChange 
}: {
  selected?: UrgencyLevel;
  onChange: (level: UrgencyLevel) => void;
}) => {
  const { spacing, componentSpacing } = useSpacingStore();
  const { theme } = useThemeStore();
  const { shouldAnimate } = useAnimationStore();
  const animationsEnabled = shouldAnimate();
  const { isMobile, isDesktop } = useResponsive();
  
  // Responsive layout - grid on larger screens
  const shouldWrap = isDesktop;
  
  const levelButtonDimensions = useResponsiveValue({
    xs: { width: spacing[24], paddingH: spacing[3] },
    sm: { width: spacing[28], paddingH: spacing[3] },
    md: { width: spacing[32], paddingH: spacing[4] },
    lg: { width: spacing[36], paddingH: spacing[5] },
  });
  
  const content = (
    <HStack 
      gap={componentSpacing.stackGap} 
      wrap={shouldWrap} 
      style={shouldWrap ? { maxWidth: spacing[96] * 2 } : undefined}
    >
      {([1, 2, 3, 4, 5] as UrgencyLevel[]).map((level) => {
        const config = URGENCY_LEVEL_CONFIG[level];
        const isSelected = selected === level;
        
        return (
          <Pressable 
            key={level} 
            onPress={() => {
              haptic('light');
              onChange(level);
            }}
          >
            <Animated.View
              entering={animationsEnabled ? FadeIn.delay(level * 50) : undefined}
            >
              <Box
                p={spacing[3]}
                px={levelButtonDimensions.paddingH}
                borderRadius={componentSpacing.borderRadius}
                borderWidth={2}
                style={{
                  borderColor: isSelected ? config.color : theme.border,
                  backgroundColor: isSelected ? `${config.color}20` : theme.card,
                  minWidth: levelButtonDimensions.width,
                }}
              >
                <VStack gap={1} align="center">
                  <Text 
                    size={isMobile ? "sm" : "base"}
                    weight={isSelected ? "bold" : "medium"}
                    style={{ color: isSelected ? config.color : theme.foreground }}
                  >
                    Level {level}
                  </Text>
                  <Text 
                    size="xs" 
                    style={{ color: isSelected ? config.color : theme.mutedForeground }}
                  >
                    {config.label}
                  </Text>
                </VStack>
              </Box>
            </Animated.View>
          </Pressable>
        );
      })}
    </HStack>
  );
  
  return (
    <VStack gap={componentSpacing.stackGap}>
      <Text 
        weight="semibold" 
        size={isMobile ? 'base' : 'lg'}
      >
        Urgency Level *
      </Text>
      {shouldWrap ? (
        content
      ) : (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: spacing[4] }}
        >
          {content}
        </ScrollView>
      )}
    </VStack>
  );
};

export function AlertCreationFormEnhanced({ 
  hospitalId, 
  onSuccess,
  embedded = false 
}: AlertCreationFormEnhancedProps) {
  const { spacing, componentSpacing, componentSizes } = useSpacingStore();
  const { theme } = useThemeStore();
  const { shouldAnimate } = useAnimationStore();
  const router = useRouter();
  const shadowMd = useShadow({ size: 'md' });
  const [isPending, startTransition] = useTransition();
  const { isMobile, isDesktop } = useResponsive();
  
  // Capture animation state to avoid accessing in render
  const animationsEnabled = shouldAnimate();
  
  // Use validation hook
  const {
    validateWithContext,
    validateField,
    errors: validationErrors,
    clearErrors,
    getFieldError,
  } = useCreateAlertValidation();
  
  // Form state
  const [formData, setFormData] = useState<Partial<CreateAlertInput>>({
    hospitalId,
  });
  const [showPreview, setShowPreview] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  // Responsive layout calculations
  const screenWidth = Dimensions.get('window').width;
  const maxFormWidth = useResponsiveValue({
    xs: screenWidth - (spacing[4] * 2),
    sm: screenWidth - (spacing[6] * 2),
    md: spacing[96] * 1.5, // 576px
    lg: spacing[96] * 2,   // 768px
    xl: spacing[96] * 2.5, // 960px
  });
  
  // Create alert mutation with better feedback
  const createAlertMutation = api.healthcare.createAlert.useMutation({
    onMutate: () => {
      haptic('medium');
    },
    onSuccess: () => {
      haptic('success');
      showSuccessAlert(
        'Alert Created Successfully', 
        `Alert for Room ${formData.roomNumber} has been dispatched to all medical staff.`
      );
      
      // Reset form
      setFormData({ hospitalId });
      setShowPreview(false);
      clearErrors();
      setCurrentStep(0);
      
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
    // Get user's organization ID for context validation
    const userOrgId = hospitalId; // This should come from user context in a real app
    
    const isFormValid = validateWithContext(formData, userOrgId);
    
    if (!isFormValid) {
      // Show first error
      const firstError = getFirstError(validationErrors);
      if (firstError) {
        showErrorAlert('Validation Error', firstError);
      }
    }
    
    return isFormValid;
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
  
  // Step management
  const updateStep = useCallback(() => {
    if (formData.roomNumber && currentStep === 0) setCurrentStep(1);
    if (formData.alertType && currentStep === 1) setCurrentStep(2);
    if (formData.urgencyLevel && currentStep === 2) setCurrentStep(3);
  }, [formData, currentStep]);
  
  React.useEffect(() => {
    updateStep();
  }, [formData, updateStep]);
  
  // Render alert type grid for desktop
  const renderAlertTypeGrid = () => {
    const types = Object.keys(ALERT_TYPE_CONFIG) as AlertType[];
    
    if (isDesktop) {
      // Grid layout for desktop
      return (
        <Box 
          style={{ 
            flexDirection: 'row', 
            flexWrap: 'wrap',
            gap: componentSpacing.stackGap,
            justifyContent: 'center',
          }}
        >
          {types.map((type) => (
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
                  urgencyLevel: config.defaultUrgency as UrgencyLevel,
                });
              }}
            />
          ))}
        </Box>
      );
    }
    
    // Horizontal scroll for mobile/tablet
    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ 
          paddingRight: spacing[4],
          gap: componentSpacing.stackGap,
        }}
      >
        <HStack gap={componentSpacing.stackGap}>
          {types.map((type) => (
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
                  urgencyLevel: config.defaultUrgency as UrgencyLevel,
                });
              }}
            />
          ))}
        </HStack>
      </ScrollView>
    );
  };
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          alignItems: 'center',
          paddingBottom: spacing[16],
        }}
      >
        <VStack 
          gap={componentSpacing.sectionMargin} 
          style={{ 
            width: '100%',
            maxWidth: maxFormWidth,
          }}
        >
          {/* Progress Indicator */}
          {!embedded && (
            <Animated.View
              entering={animationsEnabled ? FadeIn : undefined}
              style={{ paddingHorizontal: spacing[4 as SpacingScale] }}
            >
              <HStack gap={2} justify="center">
                {[0, 1, 2, 3].map((step) => (
                  <Box
                    key={step}
                    style={{
                      height: spacing[1],
                      flex: 1,
                      maxWidth: spacing[24],
                      borderRadius: spacing[1],
                      backgroundColor: currentStep >= step ? theme.primary : theme.border,
                    }}
                  />
                ))}
              </HStack>
            </Animated.View>
          )}
          
          {/* Step 1: Room Number */}
          <Animated.View 
            entering={animationsEnabled ? SlideInDown.delay(100) : undefined} 
            style={{ width: '100%' }}
          >
            <Card style={[shadowMd, { backgroundColor: theme.card }]}>
              <VStack gap={componentSpacing.formGap} p={componentSpacing.cardPadding}>
                <HStack gap={componentSpacing.stackGap} align="center">
                  <Badge 
                    variant="default" 
                    size={isMobile ? "xs" : "sm"}
                    style={{ backgroundColor: theme.primary }}
                  >
                    <Text size="xs" weight="bold" style={{ color: theme.background }}>
                      STEP 1
                    </Text>
                  </Badge>
                  <Text weight="semibold" size={isMobile ? 'base' : 'lg'}>
                    Room Number
                  </Text>
                </HStack>
                
                <Input
                  value={formData.roomNumber || ''}
                  onChangeText={(value) => {
                    setFormData({ ...formData, roomNumber: value });
                    // Validate field on change
                    validateField('roomNumber', value);
                  }}
                  placeholder="Enter room number (e.g., 302, ICU-1)"
                  keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'default'}
                  maxLength={10}
                  size="lg"
                  autoFocus={!embedded && !isMobile}
                  error={getFieldError('roomNumber')}
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
            <Animated.View 
              entering={animationsEnabled ? SlideInDown.delay(200) : undefined}
              style={{ width: '100%' }}
            >
              <Card style={[shadowMd, { backgroundColor: theme.card }]}>
                <VStack gap={componentSpacing.formGap} p={componentSpacing.cardPadding}>
                  <HStack gap={componentSpacing.stackGap} align="center">
                    <Badge 
                      variant="default" 
                      size={isMobile ? "xs" : "sm"}
                      style={{ backgroundColor: theme.primary }}
                    >
                      <Text size="xs" weight="bold" style={{ color: theme.background }}>
                        STEP 2
                      </Text>
                    </Badge>
                    <Text weight="semibold" size={isMobile ? 'base' : 'lg'}>
                      Alert Type
                    </Text>
                  </HStack>
                  
                  <Box style={{ marginHorizontal: -componentSpacing.stackGap }}>
                    {renderAlertTypeGrid()}
                  </Box>
                  
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
            <Animated.View 
              entering={animationsEnabled ? SlideInDown.delay(300) : undefined}
              style={{ width: '100%' }}
            >
              <Card style={[shadowMd, { backgroundColor: theme.card }]}>
                <VStack gap={componentSpacing.formGap} p={componentSpacing.cardPadding}>
                  <HStack gap={componentSpacing.stackGap} align="center">
                    <Badge 
                      variant="default" 
                      size={isMobile ? "xs" : "sm"}
                      style={{ backgroundColor: theme.primary }}
                    >
                      <Text size="xs" weight="bold" style={{ color: theme.background }}>
                        STEP 3
                      </Text>
                    </Badge>
                    <Text weight="semibold" size={isMobile ? 'base' : 'lg'}>
                      Urgency Level
                    </Text>
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
            <Animated.View 
              entering={animationsEnabled ? SlideInDown.delay(400) : undefined}
              style={{ width: '100%' }}
            >
              <Card style={[shadowMd, { backgroundColor: theme.card }]}>
                <VStack gap={componentSpacing.formGap} p={componentSpacing.cardPadding}>
                  <HStack gap={componentSpacing.stackGap} align="center">
                    <Badge 
                      variant="outline" 
                      size={isMobile ? "xs" : "sm"}
                    >
                      <Text size="xs" weight="bold">OPTIONAL</Text>
                    </Badge>
                    <Text weight="semibold" size={isMobile ? 'base' : 'lg'}>
                      Additional Details
                    </Text>
                  </HStack>
                  
                  <Input
                    value={formData.description || ''}
                    onChangeText={(value) => setFormData({ ...formData, description: value })}
                    placeholder="Provide any additional context..."
                    multiline
                    numberOfLines={3}
                    maxLength={500}
                    style={{
                      minHeight: spacing[20],
                      textAlignVertical: 'top',
                      fontSize: 16,
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
            <Animated.View 
              entering={animationsEnabled ? FadeIn.delay(500) : undefined}
              style={{ width: '100%' }}
            >
              <AlertComponent 
                variant={formData.urgencyLevel && formData.urgencyLevel <= 2 ? "error" : "default"}
              >
                <VStack gap={componentSpacing.stackGap}>
                  <HStack gap={componentSpacing.stackGap} align="center">
                    <Text size="2xl">
                      {formData.alertType && ALERT_TYPE_CONFIG[formData.alertType]?.icon || '⚠️'}
                    </Text>
                    <Text weight="bold" size="lg">
                      Alert Preview
                    </Text>
                  </HStack>
                  <Text size="base">
                    {formData.alertType?.replace(/_/g, ' ').toUpperCase()} - Room {formData.roomNumber}
                  </Text>
                  <Text size="xs" colorTheme="mutedForeground">
                    Urgency: {formData.urgencyLevel && URGENCY_LEVEL_CONFIG[formData.urgencyLevel].label}
                  </Text>
                  {formData.description && (
                    <Text size="sm">{formData.description}</Text>
                  )}
                </VStack>
              </AlertComponent>
            </Animated.View>
          )}
          
          {/* Submit Button */}
          {isFormValid && (
            <Animated.View 
              entering={animationsEnabled ? SlideInDown.delay(600) : undefined}
              style={{ width: '100%' }}
            >
              <VStack gap={componentSpacing.stackGap}>
                <Button
                  size="lg"
                  variant="destructive"
                  onPress={handleSubmit}
                  isLoading={isPending || createAlertMutation.isPending}
                  disabled={!isFormValid}
                  fullWidth
                  style={{
                    minHeight: componentSizes.button.lg.height,
                  }}
                >
                  <HStack gap={componentSpacing.stackGap} align="center">
                    <Text 
                      size="lg" 
                      weight="bold" 
                      style={{ color: theme.background }}
                    >
                      {showPreview ? 'CONFIRM & SEND ALERT' : 'SEND EMERGENCY ALERT'}
                    </Text>
                    <Text size="2xl">🚨</Text>
                  </HStack>
                </Button>
                
                {showPreview && (
                  <Button
                    size="lg"
                    variant="outline"
                    onPress={() => setShowPreview(false)}
                    fullWidth
                  >
                    Cancel
                  </Button>
                )}
              </VStack>
            </Animated.View>
          )}
          
          {/* Loading/Success Feedback */}
          {createAlertMutation.isPending && (
            <Animated.View 
              entering={animationsEnabled ? FadeIn : undefined} 
              exiting={animationsEnabled ? FadeOut : undefined}
              style={{ width: '100%' }}
            >
              <Card style={{ backgroundColor: theme.muted }}>
                <VStack gap={componentSpacing.stackGap} p={componentSpacing.cardPadding} align="center">
                  <Text size="lg" weight="bold">
                    Sending Alert...
                  </Text>
                  <Text size="base" colorTheme="mutedForeground">
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