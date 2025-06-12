import React from 'react';
import { View } from 'react-native';
import { Card } from '@/components/universal/Card';
import { Form } from '@/components/universal/Form';
import { Input } from '@/components/universal/Input';
import { Select } from '@/components/universal/Select';
import { Button } from '@/components/universal/Button';
import { useTheme } from '@/lib/theme/provider';
import { useSpacing } from '@/lib/stores/spacing-store';
import { Building2, Globe, Briefcase, FileText } from '@/components/universal/Symbols';
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

interface GeneralSettingsBlockProps {
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
  organizationId,
  initialData,
  onSave,
}: GeneralSettingsBlockProps) {
  const { colors } = useTheme();
  const spacing = useSpacing();
  
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
    onSave?.(data);
  };
  
  return (
    <Card animated animationType="lift">
      <Card.Header>
        <Card.Title>General Settings</Card.Title>
        <Card.Description>
          Update your organization&apos;s basic information
        </Card.Description>
      </Card.Header>
      
      <Card.Content>
        <Form {...form}>
          <View style={{ gap: spacing.lg }}>
            <Form.Field
              control={form.control}
              name="name"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>Organization Name</Form.Label>
                  <Form.Control>
                    <Input
                      placeholder="Acme Corporation"
                      leftIcon={<Building2 size={16} />}
                      {...field}
                      onChangeText={field.onChange}
                    />
                  </Form.Control>
                  <Form.Description>
                    This is your organization&apos;s display name
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
                  <Form.Label>Industry</Form.Label>
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
              name="description"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>Description</Form.Label>
                  <Form.Control>
                    <Input
                      placeholder="Brief description of your organization..."
                      leftIcon={<FileText size={16} />}
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
        </Form>
      </Card.Content>
      
      <Card.Footer>
        <Button
          onPress={form.handleSubmit(handleSubmit)}
          isLoading={form.formState.isSubmitting}
          fullWidth
        >
          Save Changes
        </Button>
      </Card.Footer>
    </Card>
  );
}