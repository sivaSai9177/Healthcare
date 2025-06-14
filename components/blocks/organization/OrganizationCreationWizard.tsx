import React, { useState } from 'react';
import { View, Platform } from 'react-native';
import { 
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Text, 
  Button, 
  Input, 
  Select, 
  Stepper, 
  Form,
  FormItem,
} from '@/components/universal';
import { useSpacing } from '@/lib/stores/spacing-store';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/api/trpc';
import { haptic } from '@/lib/ui/haptics';
import { 
  Building2, 
  Globe, 
  ArrowLeft,
  CheckIcon,
} from '@/components/universal/display/Symbols';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

// Validation schemas for each step
const basicInfoSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters'),
  slug: z.string()
    .min(3, 'Slug must be at least 3 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens')
    .optional(),
  type: z.enum(['business', 'nonprofit', 'education', 'personal'], {
    required_error: 'Please select an organization type',
  }),
});

const settingsSchema = z.object({
  website: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  size: z.enum(['solo', 'small', 'medium', 'large', 'enterprise'], {
    required_error: 'Please select organization size',
  }),
  industry: z.string().optional(),
  timezone: z.string().min(1, 'Please select a timezone'),
});

// Combined schema
const organizationSchema = z.object({
  ...basicInfoSchema.shape,
  ...settingsSchema.shape,
});

type OrganizationFormData = z.infer<typeof organizationSchema>;

export interface OrganizationCreationWizardProps {
  onComplete?: (organizationId: string) => void;
  onCancel?: () => void;
}

const organizationTypes = [
  { label: 'Business', value: 'business' },
  { label: 'Non-profit', value: 'nonprofit' },
  { label: 'Education', value: 'education' },
  { label: 'Personal', value: 'personal' },
];

const industries = [
  { label: 'Technology', value: 'technology' },
  { label: 'Healthcare', value: 'healthcare' },
  { label: 'Finance', value: 'finance' },
  { label: 'Education', value: 'education' },
  { label: 'Retail', value: 'retail' },
  { label: 'Manufacturing', value: 'manufacturing' },
  { label: 'Services', value: 'services' },
  { label: 'Non-profit', value: 'nonprofit' },
  { label: 'Government', value: 'government' },
  { label: 'Other', value: 'other' },
];

const companySizes = [
  { label: 'Solo (Just me)', value: 'solo' },
  { label: 'Small (2-10)', value: 'small' },
  { label: 'Medium (11-50)', value: 'medium' },
  { label: 'Large (51-200)', value: 'large' },
  { label: 'Enterprise (201+)', value: 'enterprise' },
];

// Common timezones
const timezones = [
  { label: 'Pacific Time (US)', value: 'America/Los_Angeles' },
  { label: 'Mountain Time (US)', value: 'America/Denver' },
  { label: 'Central Time (US)', value: 'America/Chicago' },
  { label: 'Eastern Time (US)', value: 'America/New_York' },
  { label: 'UTC', value: 'UTC' },
  { label: 'London', value: 'Europe/London' },
  { label: 'Paris', value: 'Europe/Paris' },
  { label: 'Tokyo', value: 'Asia/Tokyo' },
  { label: 'Sydney', value: 'Australia/Sydney' },
];

export function OrganizationCreationWizard({
  onComplete,
  onCancel,
}: OrganizationCreationWizardProps) {
  const { spacing } = useSpacing();
  const [currentStep, setCurrentStep] = useState(0);
  
  const form = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      slug: '',
      type: undefined,
      industry: '',
      website: '',
      description: '',
      size: undefined,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    },
  });
  
  const createOrganization = api.organization.create.useMutation({
    onSuccess: (data: { id: string }) => {
      haptic('success');
      onComplete?.(data.id);
    },
    onError: (error) => {
      haptic('error');
      form.setError('root', {
        message: error.message || 'Failed to create organization',
      });
    },
  });
  
  const steps = [
    { 
      id: 'basic-info',
      title: 'Basic Info',
      description: 'Organization details',
      icon: 'building.2' as any,
      schema: basicInfoSchema,
    },
    { 
      id: 'settings',
      title: 'Settings',
      description: 'Additional information', 
      icon: 'briefcase' as any,
      schema: settingsSchema,
    },
  ];
  
  const validateStep = async (stepIndex: number): Promise<boolean> => {
    const schema = steps[stepIndex].schema;
    const formData = form.getValues();
    
    try {
      await schema.parseAsync(formData);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
          form.setError(err.path[0] as any, {
            message: err.message,
          });
        });
      }
      return false;
    }
  };
  
  const handleNext = async () => {
    const isValid = await validateStep(currentStep);
    if (isValid) {
      haptic('light');
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSubmit();
      }
    }
  };
  
  const handlePrevious = () => {
    haptic('light');
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      onCancel?.();
    }
  };
  
  const handleSubmit = async () => {
    const formData = form.getValues();
    createOrganization.mutate({
      name: formData.name,
      slug: formData.slug || undefined,
      type: formData.type,
      size: formData.size,
      industry: formData.industry || undefined,
      website: formData.website || undefined,
      description: formData.description || undefined,
      timezone: formData.timezone,
    });
  };
  
  // Generate slug from name
  const handleNameChange = (name: string) => {
    form.setValue('name', name);
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    form.setValue('slug', slug);
  };
  
  return (
    <Card
      shadow="lg"
      className="animate-fade-in"
      style={{
        width: '100%',
        maxWidth: 610,
      }}
    >
      <CardHeader>
        <CardTitle>Create New Organization</CardTitle>
        <CardDescription>
          Set up your organization in just a few steps
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <View style={{ marginBottom: spacing[6] }}>
          <Stepper 
            steps={steps.map((step, index) => ({
              id: step.id,
              title: step.title,
              description: step.description,
              icon: step.icon,
              completed: index < currentStep,
            }))}
            activeStep={currentStep}
            orientation={Platform.OS === 'web' ? 'horizontal' : 'vertical'}
          />
        </View>
        
        <Form form={form} onSubmit={handleSubmit}>
          <Animated.View
            key={currentStep}
            entering={FadeIn}
            exiting={FadeOut}
            style={{ minHeight: 300 }}
          >
            {/* Step 1: Basic Info */}
            {currentStep === 0 && (
              <View style={{ gap: spacing[4] }}>
                <FormItem
                  name="name"
                  label="Organization Name*"
                  hint="This will be your organization's display name"
                >
                  {(field) => (
                    <Input
                      placeholder="Acme Corporation"
                      leftIcon={<Building2 size={16} />}
                      value={field.value}
                      onChangeText={handleNameChange}
                      autoFocus
                    />
                  )}
                </FormItem>
                
                <FormItem
                  name="slug"
                  label="Organization Slug*"
                  hint={`Used in URLs: myapp.com/org/${form.watch('slug') || 'your-slug'}`}
                >
                  {(field) => (
                    <Input
                      placeholder="acme-corp"
                      leftIcon={<Globe size={16} />}
                      {...field}
                      onChangeText={field.onChange}
                    />
                  )}
                </FormItem>
                
                <FormItem
                  name="type"
                  label="Organization Type*"
                >
                  {(field) => (
                    <Select
                      placeholder="Select type"
                      value={field.value}
                      onValueChange={field.onChange}
                      options={organizationTypes}
                    />
                  )}
                </FormItem>
              </View>
            )}
            
            {/* Step 2: Settings */}
            {currentStep === 1 && (
              <View style={{ gap: spacing[4] }}>
                <FormItem
                  name="size"
                  label="Organization Size*"
                >
                  {(field) => (
                    <Select
                      placeholder="Select size"
                      value={field.value}
                      onValueChange={field.onChange}
                      options={companySizes}
                    />
                  )}
                </FormItem>
                
                <FormItem
                  name="timezone"
                  label="Timezone*"
                >
                  {(field) => (
                    <Select
                      placeholder="Select timezone"
                      value={field.value}
                      onValueChange={field.onChange}
                      options={timezones}
                    />
                  )}
                </FormItem>
                
                <FormItem
                  name="industry"
                  label="Industry"
                >
                  {(field) => (
                    <Select
                      placeholder="Select industry (optional)"
                      value={field.value}
                      onValueChange={field.onChange}
                      options={industries}
                    />
                  )}
                </FormItem>
                
                <FormItem
                  name="website"
                  label="Website"
                >
                  {(field) => (
                    <Input
                      placeholder="https://example.com"
                      leftIcon={<Globe size={16} />}
                      keyboardType="url"
                      autoCapitalize="none"
                      {...field}
                      onChangeText={field.onChange}
                    />
                  )}
                </FormItem>
                
                <FormItem
                  name="description"
                  label="Description"
                  hint="Max 500 characters"
                >
                  {(field) => (
                    <Input
                      placeholder="Brief description of your organization..."
                      multiline
                      numberOfLines={3}
                      {...field}
                      onChangeText={field.onChange}
                    />
                  )}
                </FormItem>
              </View>
            )}
          </Animated.View>
        </Form>
        
        {form.formState.errors.root && (
          <Text colorTheme="destructive" size="sm" style={{ marginTop: spacing[3] }}>
            {form.formState.errors.root.message}
          </Text>
        )}
      </CardContent>
      
      <CardFooter>
        <View style={{ flexDirection: 'row', gap: spacing[2], justifyContent: 'space-between' }}>
          <Button
            variant="outline"
            onPress={handlePrevious}
            leftIcon={<ArrowLeft size={16} />}
          >
            {currentStep === 0 ? 'Cancel' : 'Previous'}
          </Button>
          
          <Button
            onPress={handleNext}
            isLoading={createOrganization.isPending}
            rightIcon={currentStep === steps.length - 1 ? <CheckIcon size={16} /> : undefined}
          >
            {currentStep === steps.length - 1 ? 'Create Organization' : 'Next'}
          </Button>
        </View>
      </CardFooter>
    </Card>
  );
}