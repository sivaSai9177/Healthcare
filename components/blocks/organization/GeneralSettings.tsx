import React from 'react';
import { View } from 'react-native';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/universal/display';
import { Form, Input, Select } from '@/components/universal/form';
import { Button } from '@/components/universal/interaction';
import { cn } from '@/lib/core/utils';
import { haptic } from '@/lib/ui/haptics';
import { useSpacing } from '@/lib/stores/spacing-store';
import { Building2, Globe, FileText } from '@/components/universal/display/Symbols';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const generalSettingsSchema = z.object({
  name: z.string().min(2, 'Organization name is required'),
  industry: z.string().optional(),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  description: z.string().max(500, 'Description too long').optional(),
});

type GeneralSettingsData = z.infer<typeof generalSettingsSchema>;

export interface GeneralSettingsBlockProps {
  organizationId: string;
  initialData?: Partial<GeneralSettingsData>;
  onSave?: (data: GeneralSettingsData) => void;
}

const industries = [
  { label: 'Technology', value: 'technology' },
  { label: 'Healthcare', value: 'healthcare' },
  { label: 'Finance', value: 'finance' },
  { label: 'Education', value: 'education' },
  { label: 'Retail', value: 'retail' },
  { label: 'Manufacturing', value: 'manufacturing' },
  { label: 'Other', value: 'other' },
];

export function GeneralSettingsBlock({
  initialData,
  onSave,
}: GeneralSettingsBlockProps) {
  const { spacing } = useSpacing();
  
  const form = useForm<GeneralSettingsData>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: initialData || {
      name: '',
      industry: '',
      website: '',
      description: '',
    },
  });
  
  const handleSubmit = (data: GeneralSettingsData) => {
    haptic('success');
    onSave?.(data);
  };
  
  return (
    <Card 
      shadow="md"
      className={cn(
        "animate-fade-in",
        "transition-all duration-200"
      )}
    >
      <CardHeader>
        <CardTitle>General Settings</CardTitle>
        <CardDescription>
          Update your organization&apos;s basic information
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Form form={form} onSubmit={handleSubmit}>
          <View style={{ gap: spacing[4] }}>
            <FormItem
              name="name"
              label="Organization Name"
              hint="This is your organization&apos;s display name"
            >
              {(field) => (
                <Input
                  placeholder="Acme Corporation"
                  leftIcon={<Building2 size={16} className="text-muted-foreground" />}
                  {...field}
                  onChangeText={field.onChange}
                />
              )}
            </FormItem>
            
            <FormItem
              name="industry"
              label="Industry"
            >
              {(field) => (
                <Select
                  placeholder="Select industry"
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
                  leftIcon={<Globe size={16} className="text-muted-foreground" />}
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
                  leftIcon={<FileText size={16} className="text-muted-foreground" />}
                  multiline
                  numberOfLines={3}
                  {...field}
                  onChangeText={field.onChange}
                />
              )}
            </FormItem>
          </View>
          <Button
            onPress={form.handleSubmit(handleSubmit)}
            isLoading={form.formState.isSubmitting}
            fullWidth
            className="animate-scale-in"
            style={{ marginTop: spacing[4] }}
          >
            Save Changes
          </Button>
        </Form>
      </CardContent>
    </Card>
  );
}