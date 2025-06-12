import React, { useState } from 'react';
import { View, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '@/components/universal/Card';
import { Text } from '@/components/universal/Text';
import { Button } from '@/components/universal/Button';
import { Input } from '@/components/universal/Input';
import { Badge } from '@/components/universal/Badge';
import { Select } from '@/components/universal/Select';
import { Stepper } from '@/components/universal/Stepper';
import { Form } from '@/components/universal/Form';
import { useTheme } from '@/lib/theme/provider';
import { useSpacing } from '@/lib/stores/spacing-store';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/api/trpc';
import { useAuthStore } from '@/lib/stores/auth-store';
import { haptic } from '@/lib/ui/haptics';
import { 
  Building2, 
  Globe, 
  Briefcase, 
  Users, 
  Shield,
  ArrowRight,
  ArrowLeft,
  Check,
} from '@/components/universal/Symbols';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

// Validation schemas for each step
const basicInfoSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters'),
  slug: z.string()
    .min(3, 'Slug must be at least 3 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  industry: z.string().min(1, 'Please select an industry'),
});

const settingsSchema = z.object({
  website: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  size: z.enum(['1-10', '11-50', '51-200', '201-500', '500+']).optional(),
});

const planSchema = z.object({
  plan: z.enum(['free', 'pro', 'enterprise']),
  billingEmail: z.string().email('Please enter a valid email').optional(),
});

// Combined schema
const organizationSchema = z.object({
  ...basicInfoSchema.shape,
  ...settingsSchema.shape,
  ...planSchema.shape,
});

type OrganizationFormData = z.infer<typeof organizationSchema>;

interface OrganizationCreationWizardProps {
  onComplete?: (organizationId: string) => void;
  onCancel?: () => void;
}

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
  { label: '1-10 employees', value: '1-10' },
  { label: '11-50 employees', value: '11-50' },
  { label: '51-200 employees', value: '51-200' },
  { label: '201-500 employees', value: '201-500' },
  { label: '500+ employees', value: '500+' },
];

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    description: 'Perfect for small teams',
    features: ['Up to 5 members', 'Basic features', 'Community support'],
    color: 'muted' as const,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$29/month',
    description: 'For growing teams',
    features: ['Up to 50 members', 'Advanced features', 'Priority support', 'API access'],
    color: 'primary' as const,
    recommended: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    description: 'For large organizations',
    features: ['Unlimited members', 'Custom features', 'Dedicated support', 'SLA'],
    color: 'accent' as const,
  },
];

export function OrganizationCreationWizard({
  onComplete,
  onCancel,
}: OrganizationCreationWizardProps) {
  const { colors } = useTheme();
  const spacing = useSpacing();
  const router = useRouter();
  const { user } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(0);
  
  const form = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      slug: '',
      industry: '',
      website: '',
      description: '',
      size: undefined,
      plan: 'free',
      billingEmail: user?.email || '',
    },
  });
  
  const createOrganization = api.organization.create.useMutation({
    onSuccess: (data) => {
      haptic.success();
      onComplete?.(data.id);
    },
    onError: (error) => {
      haptic.error();
      form.setError('root', {
        message: error.message || 'Failed to create organization',
      });
    },
  });
  
  const steps = [
    { 
      label: 'Basic Info', 
      icon: <Building2 size={20} />,
      schema: basicInfoSchema,
    },
    { 
      label: 'Settings', 
      icon: <Briefcase size={20} />,
      schema: settingsSchema,
    },
    { 
      label: 'Choose Plan', 
      icon: <Shield size={20} />,
      schema: planSchema,
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
      haptic.light();
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSubmit();
      }
    }
  };
  
  const handlePrevious = () => {
    haptic.light();
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
      slug: formData.slug,
      industry: formData.industry,
      website: formData.website || undefined,
      description: formData.description || undefined,
      size: formData.size || undefined,
      plan: formData.plan,
      billingEmail: formData.billingEmail || undefined,
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
      animated
      animationType="lift"
      style={{
        width: '100%',
        maxWidth: 610,
      }}
    >
      <Card.Header>
        <Card.Title>Create New Organization</Card.Title>
        <Card.Description>
          Set up your organization in just a few steps
        </Card.Description>
      </Card.Header>
      
      <Card.Content>
        <View style={{ marginBottom: spacing.xl }}>
          <Stepper 
            steps={steps.map((step, index) => ({
              ...step,
              status: index < currentStep ? 'completed' : 
                      index === currentStep ? 'current' : 'upcoming',
            }))}
            orientation={Platform.OS === 'web' ? 'horizontal' : 'vertical'}
          />
        </View>
        
        <Form {...form}>
          <Animated.View
            key={currentStep}
            entering={FadeIn}
            exiting={FadeOut}
            style={{ minHeight: 300 }}
          >
            {/* Step 1: Basic Info */}
            {currentStep === 0 && (
              <View style={{ gap: spacing.lg }}>
                <Form.Field
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>Organization Name*</Form.Label>
                      <Form.Control>
                        <Input
                          placeholder="Acme Corporation"
                          leftIcon={<Building2 size={16} />}
                          value={field.value}
                          onChangeText={handleNameChange}
                          autoFocus
                        />
                      </Form.Control>
                      <Form.Description>
                        This will be your organization&apos;s display name
                      </Form.Description>
                      <Form.Message />
                    </Form.Item>
                  )}
                />
                
                <Form.Field
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>Organization Slug*</Form.Label>
                      <Form.Control>
                        <Input
                          placeholder="acme-corp"
                          leftIcon={<Globe size={16} />}
                          {...field}
                          onChangeText={field.onChange}
                        />
                      </Form.Control>
                      <Form.Description>
                        Used in URLs: myapp.com/org/{field.value || 'your-slug'}
                      </Form.Description>
                      <Form.Message />
                    </Form.Item>
                  )}
                />
                
                <Form.Field
                  control={form.control}
                  name="industry"
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>Industry*</Form.Label>
                      <Form.Control>
                        <Select
                          placeholder="Select industry"
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <Select.Trigger leftIcon={<Briefcase size={16} />}>
                            <Select.Value placeholder="Select industry" />
                          </Select.Trigger>
                          <Select.Content>
                            {industries.map((industry) => (
                              <Select.Item
                                key={industry.value}
                                value={industry.value}
                                label={industry.label}
                              />
                            ))}
                          </Select.Content>
                        </Select>
                      </Form.Control>
                      <Form.Message />
                    </Form.Item>
                  )}
                />
              </View>
            )}
            
            {/* Step 2: Settings */}
            {currentStep === 1 && (
              <View style={{ gap: spacing.lg }}>
                <Form.Field
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>Website</Form.Label>
                      <Form.Control>
                        <Input
                          placeholder="https://example.com"
                          leftIcon={<Globe size={16} />}
                          keyboardType="url"
                          autoCapitalize="none"
                          {...field}
                          onChangeText={field.onChange}
                        />
                      </Form.Control>
                      <Form.Message />
                    </Form.Item>
                  )}
                />
                
                <Form.Field
                  control={form.control}
                  name="size"
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>Company Size</Form.Label>
                      <Form.Control>
                        <Select
                          placeholder="Select size"
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <Select.Trigger leftIcon={<Users size={16} />}>
                            <Select.Value placeholder="Select company size" />
                          </Select.Trigger>
                          <Select.Content>
                            {companySizes.map((size) => (
                              <Select.Item
                                key={size.value}
                                value={size.value}
                                label={size.label}
                              />
                            ))}
                          </Select.Content>
                        </Select>
                      </Form.Control>
                      <Form.Message />
                    </Form.Item>
                  )}
                />
                
                <Form.Field
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>Description</Form.Label>
                      <Form.Control>
                        <Input
                          placeholder="Brief description of your organization..."
                          multiline
                          numberOfLines={3}
                          {...field}
                          onChangeText={field.onChange}
                        />
                      </Form.Control>
                      <Form.Description>
                        Max 500 characters
                      </Form.Description>
                      <Form.Message />
                    </Form.Item>
                  )}
                />
              </View>
            )}
            
            {/* Step 3: Choose Plan */}
            {currentStep === 2 && (
              <View style={{ gap: spacing.lg }}>
                <View style={{ gap: spacing.md }}>
                  {plans.map((plan) => (
                    <PlanCard
                      key={plan.id}
                      plan={plan}
                      isSelected={form.watch('plan') === plan.id}
                      onSelect={() => form.setValue('plan', plan.id as any)}
                      colors={colors}
                      spacing={spacing}
                    />
                  ))}
                </View>
                
                {form.watch('plan') !== 'free' && (
                  <Form.Field
                    control={form.control}
                    name="billingEmail"
                    render={({ field }) => (
                      <Form.Item>
                        <Form.Label>Billing Email</Form.Label>
                        <Form.Control>
                          <Input
                            placeholder="billing@example.com"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            {...field}
                            onChangeText={field.onChange}
                          />
                        </Form.Control>
                        <Form.Description>
                          We&apos;ll send billing information to this email
                        </Form.Description>
                        <Form.Message />
                      </Form.Item>
                    )}
                  />
                )}
              </View>
            )}
          </Animated.View>
        </Form>
        
        {form.formState.errors.root && (
          <Text variant="destructive" size="sm" style={{ marginTop: spacing.md }}>
            {form.formState.errors.root.message}
          </Text>
        )}
      </Card.Content>
      
      <Card.Footer>
        <View style={{ flexDirection: 'row', gap: spacing.sm, justifyContent: 'space-between' }}>
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
            rightIcon={currentStep === steps.length - 1 ? <Check size={16} /> : <ArrowRight size={16} />}
          >
            {currentStep === steps.length - 1 ? 'Create Organization' : 'Next'}
          </Button>
        </View>
      </Card.Footer>
    </Card>
  );
}

// Plan Card Component
function PlanCard({
  plan,
  isSelected,
  onSelect,
  colors,
  spacing,
}: {
  plan: typeof plans[0];
  isSelected: boolean;
  onSelect: () => void;
  colors: any;
  spacing: any;
}) {
  return (
    <Card
      variant={isSelected ? 'filled' : 'outlined'}
      interactive
      onPress={onSelect}
      style={{
        borderColor: isSelected ? colors[plan.color] : colors.border,
        backgroundColor: isSelected ? colors[`${plan.color}Subtle`] : colors.card,
      }}
    >
      <Card.Content>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
              <Text size="lg" weight="bold">{plan.name}</Text>
              {plan.recommended && (
                <Badge size="xs" variant="secondary">Recommended</Badge>
              )}
            </View>
            <Text variant="muted" size="sm">{plan.description}</Text>
            <View style={{ marginTop: spacing.sm, gap: spacing.xs }}>
              {plan.features.map((feature, index) => (
                <View key={index} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                  <Check size={14} color={colors.success} />
                  <Text size="xs">{feature}</Text>
                </View>
              ))}
            </View>
          </View>
          <Text size="xl" weight="bold" style={{ color: colors[plan.color] }}>
            {plan.price}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );
}