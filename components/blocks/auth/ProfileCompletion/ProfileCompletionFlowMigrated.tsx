import React, { useState, useCallback, useRef, useEffect, useTransition } from 'react';
import { View, ScrollView, Alert, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api/trpc';
import { Button } from '@/components/universal/interaction';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/universal/display';
import { Input, Checkbox } from '@/components/universal/form';
import { Text } from '@/components/universal/typography';
import { VStack, HStack } from '@/components/universal/layout';
import { Progress } from '@/components/universal/feedback';
import { HealthcareRoleSelector } from '@/components/blocks/forms/RoleSelector/HealthcareRoleSelector';
import { OrganizationField } from '@/components/blocks/forms/OrganizationField/OrganizationField';
import { CompleteProfileInputSchema } from '@/lib/validations/profile';
import { z } from 'zod';
import { log } from '@/lib/core/debug/logger';
import { cn } from '@/lib/core/utils';
import { useSpacing } from '@/lib/stores/spacing-store';
import { useShadow } from '@/hooks/useShadow';
import { useResponsive } from '@/hooks/responsive';
import { haptic } from '@/lib/ui/haptics';
import Animated, { 
  FadeIn, 
  FadeOut, 
  SlideInRight, 
  SlideOutLeft,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming
} from 'react-native-reanimated';
import { Symbol } from '@/components/universal/display/Symbols';
import { HospitalSelector } from '@/components/blocks/forms/HospitalSelector/HospitalSelector';
import { isHealthcareRole } from '@/lib/auth/permissions';

const logger = log;

interface ProfileCompletionFlowProps {
  onComplete?: () => void;
  showSkip?: boolean;
}

// Use server validation schema for consistency
type ProfileCompletionData = z.infer<typeof CompleteProfileInputSchema>;

const AnimatedView = Animated.View;
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ProfileCompletionFlowMigrated({ onComplete, showSkip = false }: ProfileCompletionFlowProps) {
  const router = useRouter();
  const { user, updateUserData, isAuthenticated } = useAuth();
  const utils = api.useUtils();
  const { spacing } = useSpacing();
  const { isMobile } = useResponsive();
  const shadowMd = useShadow({ size: 'md' });
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isPending, startTransition] = useTransition();
  
  // Use refs to prevent infinite loops
  const isSubmittingRef = useRef(false);
  const hasCompletedRef = useRef(false);
  
  const [formData, setFormData] = useState<ProfileCompletionData>({
    name: user?.name || '',
    role: user?.role || 'user',
    organizationId: user?.organizationId || undefined,
    organizationCode: undefined,
    organizationName: undefined,
    acceptTerms: true,
    acceptPrivacy: true,
    phoneNumber: undefined,
    department: undefined,
    jobTitle: undefined,
    bio: undefined,
    defaultHospitalId: undefined,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Calculate total steps based on role
  const isHealthcare = isHealthcareRole(formData.role as any);
  const totalSteps = isHealthcare ? 5 : 4;
  
  // Progress animation
  const progressValue = useSharedValue(33.33);
  
  useEffect(() => {
    progressValue.value = withSpring((currentStep / totalSteps) * 100, {
      damping: 15,
      stiffness: 100,
    });
  }, [currentStep]);
  
  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressValue.value}%`,
  }));

  // Stabilized mutation to prevent re-creation on every render
  const completeProfileMutation = api.auth.completeProfile.useMutation({
    onSuccess: useCallback((data: { success: true; user: any; organizationId?: string }) => {
      if (hasCompletedRef.current) {
        logger.warn('Profile completion already processed, ignoring duplicate success', 'PROFILE_COMPLETION');
        return;
      }
      
      hasCompletedRef.current = true;
      logger.info('Profile completed successfully', 'PROFILE_COMPLETION', data);
      
      if (data.user) {
        updateUserData({
          ...data.user,
          needsProfileCompletion: false,
        } as any);
        
        if (onComplete) {
          onComplete();
        }
        
        haptic('success');
        
        setTimeout(async () => {
          try {
            await utils.auth.getSession.invalidate();
            const updatedSession = await utils.auth.getSession.fetch();
            
            if (updatedSession && !(updatedSession as any).user?.needsProfileCompletion) {
              router.replace('/');
            } else {
              router.replace('/');
            }
          } catch (error) {
            logger.error('Error refreshing session', 'PROFILE_COMPLETION', error);
            router.replace('/');
          }
        }, 100);
      }
      
      if (Platform.OS === 'web') {
        log.info('Profile Complete! 🎉 Welcome! Your profile has been set up successfully.', 'COMPONENT');
      } else {
        setTimeout(() => {
          Alert.alert(
            'Profile Complete! 🎉',
            'Welcome! Your profile has been set up successfully. You now have access to all features.',
            [{ text: 'OK' }]
          );
        }, 100);
      }
    }, [updateUserData, router, onComplete, utils]),
    onError: useCallback((error) => {
      isSubmittingRef.current = false;
      hasCompletedRef.current = false;
      haptic('error');
      logger.error('Failed to update profile', 'PROFILE_COMPLETION', error);
      Alert.alert('Error', error.message || 'Failed to update profile');
    }, []),
  });

  const validateCurrentStep = () => {
    const stepErrors: Record<string, string> = {};
    
    switch (currentStep) {
      case 1:
        if (!formData.name.trim()) {
          stepErrors.name = 'Name is required';
        }
        break;
      case 2:
        if (!formData.role) {
          stepErrors.role = 'Please select a role';
        }
        break;
      case 3:
        // Organization step validation
        const healthcareRoles = ['doctor', 'nurse', 'operator', 'head_doctor'];
        if (formData.role === 'admin' && !formData.organizationName?.trim()) {
          stepErrors.organizationName = 'Organization name is required for admin role';
        }
        // Healthcare roles require organization
        if (healthcareRoles.includes(formData.role)) {
          if (!formData.organizationId && !formData.organizationCode && !formData.organizationName) {
            stepErrors.organizationId = 'Healthcare roles require an organization. Please join an existing organization or create a new one.';
          }
        }
        break;
      case 4:
        // Hospital step for healthcare roles
        if (isHealthcare && !formData.defaultHospitalId) {
          stepErrors.defaultHospitalId = 'Please select a hospital';
        }
        break;
      case 5:
        // Terms step
        if (!formData.acceptTerms) {
          stepErrors.acceptTerms = 'You must accept the terms';
        }
        if (!formData.acceptPrivacy) {
          stepErrors.acceptPrivacy = 'You must accept the privacy policy';
        }
        break;
    }
    
    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      haptic('light');
      
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSubmit();
      }
    } else {
      haptic('error');
    }
  };

  const handlePrevious = () => {
    haptic('light');
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = useCallback(async () => {
    if (isSubmittingRef.current || hasCompletedRef.current) {
      logger.warn('Profile completion already in progress or completed', 'PROFILE_COMPLETION');
      return;
    }
    
    // Ensure user is authenticated before submitting
    if (!isAuthenticated || !user) {
      logger.error('Cannot submit profile - user not authenticated', 'PROFILE_COMPLETION');
      Alert.alert('Error', 'Please sign in to complete your profile');
      router.replace('/(public)/auth/login');
      return;
    }
    
    isSubmittingRef.current = true;
    
    try {
      const cleanedFormData = Object.entries(formData).reduce((acc, [key, value]) => {
        if (value === '' || value === null) {
          if (['organizationCode', 'organizationName', 'organizationId', 'phoneNumber', 'department', 'jobTitle', 'bio'].includes(key)) {
            acc[key] = undefined;
          } else {
            acc[key] = value;
          }
        } else {
          acc[key] = value;
        }
        return acc;
      }, {} as any);
      
      logger.info('Submitting profile data', 'PROFILE_COMPLETION', cleanedFormData);
      await completeProfileMutation.mutateAsync(cleanedFormData);
    } catch (error) {
      logger.error('Profile submission error', 'PROFILE_COMPLETION', error);
      isSubmittingRef.current = false;
      if (error instanceof z.ZodError) {
        const formErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            formErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(formErrors);
      }
    }
  }, [formData, completeProfileMutation, isAuthenticated, user, router]);

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <AnimatedView 
            entering={SlideInRight.springify()} 
            exiting={SlideOutLeft.springify()}
            className="space-y-4"
          >
            <VStack gap={spacing[4] as any}>
              <VStack gap={spacing[2] as any} className="items-center">
                <AnimatedView entering={FadeIn.delay(200).springify()}>
                  <Symbol name="person" size={48} style={{ marginBottom: 8 }} />
                </AnimatedView>
                <Text size="lg" weight="semibold">What should we call you?</Text>
                <Text size="sm" colorTheme="mutedForeground" className="text-center">
                  This is how you'll appear to others
                </Text>
              </VStack>
              
              <Input
                placeholder="Enter your name"
                value={formData.name}
                onChangeText={(text) => {
                  setFormData({ ...formData, name: text });
                  if (errors.name) setErrors({ ...errors, name: '' });
                }}
                error={errors.name}
                autoFocus
                className="animate-fade-in"
              />
              
              <Input
                placeholder="Phone number (optional)"
                value={formData.phoneNumber}
                onChangeText={(text) => setFormData({ ...formData, phoneNumber: text })}
                keyboardType="phone-pad"
                className="animate-fade-in delay-100"
              />
            </VStack>
          </AnimatedView>
        );

      case 2:
        return (
          <AnimatedView 
            entering={SlideInRight.springify()} 
            exiting={SlideOutLeft.springify()}
            className="space-y-4"
          >
            <VStack gap={spacing[4] as any}>
              <VStack gap={spacing[2] as any} className="items-center">
                <AnimatedView entering={FadeIn.delay(200).springify()}>
                  <Symbol name="building.2" size={48} style={{ marginBottom: 8 }} />
                </AnimatedView>
                <Text size="lg" weight="semibold">Select your role</Text>
                <Text size="sm" colorTheme="mutedForeground" className="text-center">
                  This helps us personalize your experience
                </Text>
              </VStack>
              
              <HealthcareRoleSelector
                selectedRole={formData.role as any}
                onRoleSelect={(role) => {
                  setFormData({ ...formData, role });
                  if (errors.role) setErrors({ ...errors, role: '' });
                }}
                className="animate-fade-in"
              />
              
              <Input
                placeholder="Department (optional)"
                value={formData.department}
                onChangeText={(text) => setFormData({ ...formData, department: text })}
                className="animate-fade-in delay-100"
              />
              
              <Input
                placeholder="Job title (optional)"
                value={formData.jobTitle}
                onChangeText={(text) => setFormData({ ...formData, jobTitle: text })}
                className="animate-fade-in delay-150"
              />
            </VStack>
          </AnimatedView>
        );

      case 3:
        // Organization step for all healthcare roles
        return (
          <AnimatedView 
            entering={SlideInRight.springify()} 
            exiting={SlideOutLeft.springify()}
            className="space-y-4"
          >
            <VStack gap={spacing[4] as any}>
              <VStack gap={spacing[2] as any} className="items-center">
                <AnimatedView entering={FadeIn.delay(200).springify()}>
                  <Symbol name="building.2" size={48} style={{ marginBottom: 8 }} />
                </AnimatedView>
                <Text size="lg" weight="semibold">Organization Details</Text>
                <Text size="sm" colorTheme="mutedForeground" className="text-center">
                  {formData.role === 'admin' 
                    ? 'Create your hospital organization' 
                    : 'Join your hospital organization (optional)'}
                </Text>
              </VStack>
              
              <OrganizationField
                form={{
                  watch: (field: string) => formData[field as keyof typeof formData],
                  setValue: (field: string, value: any) => {
                    setFormData({ ...formData, [field]: value });
                    if (errors[field]) setErrors({ ...errors, [field]: '' });
                  },
                  formState: { errors }
                } as any}
                role={formData.role as any}
              />
            </VStack>
          </AnimatedView>
        );

      case 4:
        // Hospital selection for healthcare roles
        if (isHealthcare && formData.organizationId) {
          return (
            <AnimatedView 
              entering={SlideInRight.springify()} 
              exiting={SlideOutLeft.springify()}
              className="space-y-4"
            >
              <VStack gap={spacing[4] as any}>
                <VStack gap={spacing[2] as any} className="items-center">
                  <AnimatedView entering={FadeIn.delay(200).springify()}>
                    <Symbol name="building.2" size={48} style={{ marginBottom: 8 }} />
                  </AnimatedView>
                  <Text size="lg" weight="semibold">Select Your Hospital</Text>
                  <Text size="sm" colorTheme="mutedForeground" className="text-center">
                    Choose the hospital where you work
                  </Text>
                </VStack>
                
                <HospitalSelector
                  organizationId={formData.organizationId}
                  value={formData.defaultHospitalId}
                  onChange={(hospitalId) => {
                    setFormData({ ...formData, defaultHospitalId: hospitalId });
                    if (errors.defaultHospitalId) setErrors({ ...errors, defaultHospitalId: '' });
                  }}
                  error={errors.defaultHospitalId}
                />
              </VStack>
            </AnimatedView>
          );
        }
        // Fall through to terms step if not healthcare role
        // Terms & Privacy for all roles
        return (
          <AnimatedView 
            entering={SlideInRight.springify()} 
            exiting={SlideOutLeft.springify()}
            className="space-y-4"
          >
            <VStack gap={spacing[4] as any}>
              <VStack gap={spacing[2] as any} className="items-center">
                <AnimatedView entering={FadeIn.delay(200).springify()}>
                  <Symbol name="shield" size={48} style={{ marginBottom: 8 }} />
                </AnimatedView>
                <Text size="lg" weight="semibold">Terms & Privacy</Text>
                <Text size="sm" colorTheme="mutedForeground" className="text-center">
                  Please review and accept our terms
                </Text>
              </VStack>
              
              <VStack gap={spacing[3]}>
                <Checkbox
                  checked={formData.acceptTerms}
                  onCheckedChange={(checked) => {
                    setFormData({ ...formData, acceptTerms: checked as boolean });
                    if (errors.acceptTerms) setErrors({ ...errors, acceptTerms: '' });
                  }}
                  label={
                    <Text size="sm">
                      I accept the{' '}
                      <Text size="sm" className="text-primary underline">
                        Terms and Conditions
                      </Text>
                    </Text>
                  }
                  error={errors.acceptTerms}
                  className="animate-fade-in"
                />
                
                <Checkbox
                  checked={formData.acceptPrivacy}
                  onCheckedChange={(checked) => {
                    setFormData({ ...formData, acceptPrivacy: checked as boolean });
                    if (errors.acceptPrivacy) setErrors({ ...errors, acceptPrivacy: '' });
                  }}
                  label={
                    <Text size="sm">
                      I accept the{' '}
                      <Text size="sm" className="text-primary underline">
                        Privacy Policy
                      </Text>
                    </Text>
                  }
                  error={errors.acceptPrivacy}
                  className="animate-fade-in delay-100"
                />
              </VStack>
            </VStack>
          </AnimatedView>
        );

      case 5:
        // Terms & Privacy for healthcare roles (step 5)
        if (isHealthcare) {
          return (
            <AnimatedView 
              entering={SlideInRight.springify()} 
              exiting={SlideOutLeft.springify()}
              className="space-y-4"
            >
              <VStack gap={spacing[4] as any}>
                <VStack gap={spacing[2] as any} className="items-center">
                  <AnimatedView entering={FadeIn.delay(200).springify()}>
                    <Symbol name="shield" size={48} style={{ marginBottom: 8 }} />
                  </AnimatedView>
                  <Text size="lg" weight="semibold">Terms & Privacy</Text>
                  <Text size="sm" colorTheme="mutedForeground" className="text-center">
                    Please review and accept our terms
                  </Text>
                </VStack>
                
                <VStack gap={spacing[3]}>
                  <Checkbox
                    checked={formData.acceptTerms}
                    onCheckedChange={(checked) => {
                      setFormData({ ...formData, acceptTerms: checked as boolean });
                      if (errors.acceptTerms) setErrors({ ...errors, acceptTerms: '' });
                    }}
                    label={
                      <Text size="sm">
                        I accept the{' '}
                        <Text size="sm" className="text-primary underline">
                          Terms and Conditions
                        </Text>
                      </Text>
                    }
                    error={errors.acceptTerms}
                    className="animate-fade-in"
                  />
                  
                  <Checkbox
                    checked={formData.acceptPrivacy}
                    onCheckedChange={(checked) => {
                      setFormData({ ...formData, acceptPrivacy: checked as boolean });
                      if (errors.acceptPrivacy) setErrors({ ...errors, acceptPrivacy: '' });
                    }}
                    label={
                      <Text size="sm">
                        I accept the{' '}
                        <Text size="sm" className="text-primary underline">
                          Privacy Policy
                        </Text>
                      </Text>
                    }
                    error={errors.acceptPrivacy}
                    className="animate-fade-in delay-100"
                  />
                </VStack>
              </VStack>
            </AnimatedView>
          );
        }
        return null;

      default:
        return null;
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView className="flex-1 bg-background" contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 justify-center items-center p-4">
          <Card 
            className={cn(
              "w-full max-w-md",
              "animate-fade-in"
            )}
            style={shadowMd}
          >
            <CardHeader>
              <CardTitle>Complete Your Profile</CardTitle>
              <CardDescription>
                {user?.email ? `Welcome, ${user.email}!` : 'Welcome!'} Let's set up your profile.
              </CardDescription>
              
              {/* Progress bar */}
              <View className="mt-4">
                <View className="h-2 bg-muted rounded-full overflow-hidden">
                  <AnimatedView 
                    style={[progressStyle]} 
                    className="h-full bg-primary rounded-full"
                  />
                </View>
                <Text size="sm" colorTheme="mutedForeground" className="text-center mt-2">
                  Step {currentStep} of {totalSteps}
                </Text>
              </View>
            </CardHeader>
            
            <CardContent>
              <VStack gap={spacing[4] as any}>
                {renderStep()}
                
                <VStack gap={spacing[2] as any} className="pt-4">
                  <HStack gap={spacing[2] as any}>
                    {currentStep > 1 && (
                      <Button
                        variant="outline"
                        onPress={handlePrevious}
                        leftIcon={<Symbol name="chevron.left" size={16} />}
                        className="flex-1"
                      >
                        Previous
                      </Button>
                    )}
                    
                    <Button
                      onPress={handleNext}
                      isLoading={completeProfileMutation.isPending}
                      rightIcon={
                        currentStep === totalSteps ? (
                          <Symbol name="checkmark" size={16} />
                        ) : (
                          <Symbol name="chevron.right" size={16} />
                        )
                      }
                      className="flex-1"
                    >
                      {currentStep === totalSteps ? 'Complete' : 'Next'}
                    </Button>
                  </HStack>
                
                  {showSkip && currentStep === 1 && (
                    <Button
                      variant="ghost"
                      onPress={() => {
                        haptic('light');
                        router.replace('/');
                      }}
                      fullWidth
                      className="animate-fade-in"
                    >
                      Skip for now
                    </Button>
                  )}
                </VStack>
              </VStack>
            </CardContent>
          </Card>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}