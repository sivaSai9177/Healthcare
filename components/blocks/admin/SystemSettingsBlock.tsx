import React, { useState } from 'react';
import { View, ScrollView, ActivityIndicator } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from '@/components/universal/display';
import { Button } from '@/components/universal/interaction';
import { Input, Select, Switch, FormItem } from '@/components/universal/form';
import { Label, Text } from '@/components/universal/typography';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/universal/navigation';
import { VStack, HStack, Separator } from '@/components/universal/layout';
import { Alert, AlertDescription } from '@/components/universal/feedback';
import { Symbol } from '@/components/universal/display/Symbols';
import { api } from '@/lib/api/trpc';
import { useSpacing } from '@/lib/stores/spacing-store';
import { SpacingScale } from '@/lib/stores/spacing-types';

// Form schemas
const GeneralSettingsSchema = z.object({
  siteName: z.string().min(1, 'Site name is required'),
  siteUrl: z.string().url('Must be a valid URL'),
  supportEmail: z.string().email('Must be a valid email'),
  timezone: z.string(),
  language: z.string(),
  dateFormat: z.string(),
  timeFormat: z.string(),
});

const EmailConfigSchema = z.object({
  provider: z.enum(['smtp', 'sendgrid', 'ses', 'postmark']),
  from: z.string().email('Must be a valid email'),
  replyTo: z.string().email().optional(),
  smtpHost: z.string().optional(),
  smtpPort: z.number().optional(),
  smtpUser: z.string().optional(),
  smtpSecure: z.boolean().optional(),
  apiKey: z.string().optional(),
});

const SecuritySettingsSchema = z.object({
  sessionTimeout: z.number().min(5).max(10080),
  passwordPolicy: z.object({
    minLength: z.number().min(6).max(128),
    requireUppercase: z.boolean(),
    requireLowercase: z.boolean(),
    requireNumbers: z.boolean(),
    requireSpecialChars: z.boolean(),
    maxAge: z.number().min(0).max(365),
  }),
  twoFactorRequired: z.boolean(),
  allowedEmailDomains: z.array(z.string()).optional(),
  maxLoginAttempts: z.number().min(1).max(10),
  lockoutDuration: z.number().min(1).max(1440),
});

const FeatureFlagsSchema = z.object({
  enableRegistration: z.boolean(),
  enableOAuth: z.boolean(),
  enableEmailVerification: z.boolean(),
  enablePushNotifications: z.boolean(),
  enableBiometricAuth: z.boolean(),
  enableOfflineMode: z.boolean(),
  enableAnalytics: z.boolean(),
  enableDebugMode: z.boolean(),
});

type GeneralSettings = z.infer<typeof GeneralSettingsSchema>;
type EmailConfig = z.infer<typeof EmailConfigSchema>;
type SecuritySettings = z.infer<typeof SecuritySettingsSchema>;
type FeatureFlags = z.infer<typeof FeatureFlagsSchema>;

export function SystemSettingsBlock() {
  const { spacing } = useSpacing();
  const [activeTab, setActiveTab] = useState('general');
  const [testEmailTo, setTestEmailTo] = useState('');

  // Query system config
  const { data: config, isLoading, refetch } = api.system.getConfig.useQuery();

  // Mutations
  const updateGeneralMutation = api.system.updateGeneralSettings.useMutation();
  const updateEmailMutation = api.system.updateEmailConfig.useMutation();
  const updateSecurityMutation = api.system.updateSecuritySettings.useMutation();
  const updateFeatureMutation = api.system.updateFeatureFlags.useMutation();
  const testEmailMutation = api.system.testEmailConfig.useMutation();
  const clearCacheMutation = api.system.clearCache.useMutation();

  // Forms
  const generalForm = useForm<GeneralSettings>({
    resolver: zodResolver(GeneralSettingsSchema),
    defaultValues: config?.general,
  });

  const emailForm = useForm<EmailConfig>({
    resolver: zodResolver(EmailConfigSchema),
    defaultValues: config?.email,
  });

  const securityForm = useForm<SecuritySettings>({
    resolver: zodResolver(SecuritySettingsSchema),
    defaultValues: config?.security,
  });

  const featureForm = useForm<FeatureFlags>({
    resolver: zodResolver(FeatureFlagsSchema),
    defaultValues: config?.features,
  });

  // Update form values when data loads
  React.useEffect(() => {
    if (config) {
      generalForm.reset(config.general);
      emailForm.reset(config.email);
      securityForm.reset(config.security);
      featureForm.reset(config.features);
    }
  }, [config]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!config) {
    return (
      <Alert>
        <AlertDescription>Failed to load system configuration</AlertDescription>
      </Alert>
    );
  }

  const handleGeneralSubmit = async (data: GeneralSettings) => {
    try {
      await updateGeneralMutation.mutateAsync(data);
      await refetch();
    } catch (error) {
      console.error('Failed to update general settings:', error);
    }
  };

  const handleEmailSubmit = async (data: EmailConfig) => {
    try {
      await updateEmailMutation.mutateAsync(data);
      await refetch();
    } catch (error) {
      console.error('Failed to update email config:', error);
    }
  };

  const handleSecuritySubmit = async (data: SecuritySettings) => {
    try {
      await updateSecurityMutation.mutateAsync(data);
      await refetch();
    } catch (error) {
      console.error('Failed to update security settings:', error);
    }
  };

  const handleFeatureSubmit = async (data: FeatureFlags) => {
    try {
      await updateFeatureMutation.mutateAsync(data);
      await refetch();
    } catch (error) {
      console.error('Failed to update feature flags:', error);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmailTo) return;
    try {
      await testEmailMutation.mutateAsync({ to: testEmailTo });
    } catch (error) {
      console.error('Failed to send test email:', error);
    }
  };

  const handleClearCache = async (type: 'all' | 'sessions' | 'api' | 'static') => {
    try {
      await clearCacheMutation.mutateAsync({ type });
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>System Configuration</CardTitle>
        <CardDescription>Manage system-wide settings and configurations</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general">
              <VStack spacing="md" as SpacingScale>
                <VStack spacing="sm" as SpacingScale>
                  <Label>Site Name</Label>
                  <Controller
                    control={generalForm.control}
                    name="siteName"
                    render={({ field }) => (
                      <Input
                        {...field}
                        placeholder="My App"
                        error={generalForm.formState.errors.siteName?.message}
                      />
                    )}
                  />
                </VStack>

                <VStack spacing="sm" as SpacingScale>
                  <Label>Site URL</Label>
                  <Controller
                    control={generalForm.control}
                    name="siteUrl"
                    render={({ field }) => (
                      <Input
                        {...field}
                        placeholder="https://example.com"
                        error={generalForm.formState.errors.siteUrl?.message}
                      />
                    )}
                  />
                </VStack>

                <VStack spacing="sm" as SpacingScale>
                  <Label>Support Email</Label>
                  <Controller
                    control={generalForm.control}
                    name="supportEmail"
                    render={({ field }) => (
                      <Input
                        {...field}
                        placeholder="support@example.com"
                        error={generalForm.formState.errors.supportEmail?.message}
                      />
                    )}
                  />
                </VStack>

                <HStack spacing="md" as SpacingScale>
                  <VStack spacing="sm" as SpacingScale className="flex-1">
                    <Label>Date Format</Label>
                    <Controller
                      control={generalForm.control}
                      name="dateFormat"
                      render={({ field }) => (
                        <Select 
                          {...field}
                          placeholder="Select format"
                          options={[
                            { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
                            { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
                            { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
                          ]}
                        />
                      )}
                    />
                  </VStack>

                  <VStack spacing="sm" as SpacingScale className="flex-1">
                    <Label>Time Format</Label>
                    <Controller
                      control={generalForm.control}
                      name="timeFormat"
                      render={({ field }) => (
                        <Select 
                          {...field}
                          placeholder="Select format"
                          options={[
                            { value: '12h', label: '12 Hour' },
                            { value: '24h', label: '24 Hour' },
                          ]}
                        />
                      )}
                    />
                  </VStack>
                </HStack>

                <Button
                  onPress={generalForm.handleSubmit(handleGeneralSubmit)}
                  loading={updateGeneralMutation.isPending}
                  className="w-full"
                >
                  Save General Settings
                </Button>
              </VStack>
          </TabsContent>

          {/* Email Configuration */}
          <TabsContent value="email">
              <VStack spacing="md" as SpacingScale>
                <VStack spacing="sm" as SpacingScale>
                  <Label>Email Provider</Label>
                  <Controller
                    control={emailForm.control}
                    name="provider"
                    render={({ field }) => (
                      <Select 
                        {...field}
                        placeholder="Select provider"
                        options={[
                          { value: 'smtp', label: 'SMTP' },
                          { value: 'sendgrid', label: 'SendGrid' },
                          { value: 'ses', label: 'Amazon SES' },
                          { value: 'postmark', label: 'Postmark' },
                        ]}
                      />
                    )}
                  />
                </VStack>

                <VStack spacing="sm" as SpacingScale>
                  <Label>From Email</Label>
                  <Controller
                    control={emailForm.control}
                    name="from"
                    render={({ field }) => (
                      <Input
                        {...field}
                        placeholder="noreply@example.com"
                        error={emailForm.formState.errors.from?.message}
                      />
                    )}
                  />
                </VStack>

                {emailForm.watch('provider') === 'smtp' && (
                  <>
                    <HStack spacing="md" as SpacingScale>
                      <VStack spacing="sm" as SpacingScale className="flex-1">
                        <Label>SMTP Host</Label>
                        <Controller
                          control={emailForm.control}
                          name="smtpHost"
                          render={({ field }) => (
                            <Input {...field} placeholder="smtp.gmail.com" />
                          )}
                        />
                      </VStack>

                      <VStack spacing="sm" as SpacingScale className="flex-1">
                        <Label>SMTP Port</Label>
                        <Controller
                          control={emailForm.control}
                          name="smtpPort"
                          render={({ field }) => (
                            <Input
                              {...field}
                              keyboardType="numeric"
                              placeholder="587"
                              onChangeText={(value) => field.onChange(parseInt(value) || 0)}
                            />
                          )}
                        />
                      </VStack>
                    </HStack>

                    <VStack spacing="sm" as SpacingScale>
                      <Label>SMTP Username</Label>
                      <Controller
                        control={emailForm.control}
                        name="smtpUser"
                        render={({ field }) => (
                          <Input {...field} placeholder="user@gmail.com" />
                        )}
                      />
                    </VStack>
                  </>
                )}

                <Separator />

                <VStack spacing="sm" as SpacingScale>
                  <Label>Test Email Configuration</Label>
                  <HStack spacing="md" as SpacingScale>
                    <Input
                      value={testEmailTo}
                      onChangeText={setTestEmailTo}
                      placeholder="test@example.com"
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      onPress={handleTestEmail}
                      loading={testEmailMutation.isPending}
                    >
                      Send Test
                    </Button>
                  </HStack>
                  {testEmailMutation.isSuccess && (
                    <Alert>
                      <AlertDescription>Test email sent successfully!</AlertDescription>
                    </Alert>
                  )}
                </VStack>

                <Button
                  onPress={emailForm.handleSubmit(handleEmailSubmit)}
                  loading={updateEmailMutation.isPending}
                  className="w-full"
                >
                  Save Email Configuration
                </Button>
              </VStack>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security">
              <VStack spacing="md" as SpacingScale>
                <VStack spacing="sm" as SpacingScale>
                  <Label>Session Timeout (minutes)</Label>
                  <Controller
                    control={securityForm.control}
                    name="sessionTimeout"
                    render={({ field }) => (
                      <Input
                        {...field}
                        keyboardType="numeric"
                        placeholder="30"
                        onChangeText={(value) => field.onChange(parseInt(value) || 0)}
                      />
                    )}
                  />
                </VStack>

                <VStack spacing="sm" as SpacingScale>
                  <Text weight="semibold">Password Policy</Text>
                  
                  <HStack spacing="md" as SpacingScale>
                    <VStack spacing="sm" as SpacingScale className="flex-1">
                      <Label>Minimum Length</Label>
                      <Controller
                        control={securityForm.control}
                        name="passwordPolicy.minLength"
                        render={({ field }) => (
                          <Input
                            {...field}
                            keyboardType="numeric"
                            placeholder="12"
                            onChangeText={(value) => field.onChange(parseInt(value) || 0)}
                          />
                        )}
                      />
                    </VStack>

                    <VStack spacing="sm" as SpacingScale className="flex-1">
                      <Label>Max Age (days)</Label>
                      <Controller
                        control={securityForm.control}
                        name="passwordPolicy.maxAge"
                        render={({ field }) => (
                          <Input
                            {...field}
                            keyboardType="numeric"
                            placeholder="90"
                            onChangeText={(value) => field.onChange(parseInt(value) || 0)}
                          />
                        )}
                      />
                    </VStack>
                  </HStack>

                  <VStack spacing="sm" as SpacingScale>
                    <HStack justify="between" as SpacingScale>
                      <Label>Require Uppercase</Label>
                      <Controller
                        control={securityForm.control}
                        name="passwordPolicy.requireUppercase"
                        render={({ field }) => (
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        )}
                      />
                    </HStack>

                    <HStack justify="between" as SpacingScale>
                      <Label>Require Numbers</Label>
                      <Controller
                        control={securityForm.control}
                        name="passwordPolicy.requireNumbers"
                        render={({ field }) => (
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        )}
                      />
                    </HStack>

                    <HStack justify="between" as SpacingScale>
                      <Label>Require Special Characters</Label>
                      <Controller
                        control={securityForm.control}
                        name="passwordPolicy.requireSpecialChars"
                        render={({ field }) => (
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        )}
                      />
                    </HStack>
                  </VStack>
                </VStack>

                <Separator />

                <HStack justify="between" as SpacingScale>
                  <Label>Require Two-Factor Authentication</Label>
                  <Controller
                    control={securityForm.control}
                    name="twoFactorRequired"
                    render={({ field }) => (
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                </HStack>

                <Button
                  onPress={securityForm.handleSubmit(handleSecuritySubmit)}
                  loading={updateSecurityMutation.isPending}
                  className="w-full"
                >
                  Save Security Settings
                </Button>
              </VStack>
          </TabsContent>

          {/* Feature Flags */}
          <TabsContent value="features">
              <VStack spacing="md" as SpacingScale>
                {Object.entries({
                  enableRegistration: 'User Registration',
                  enableOAuth: 'OAuth Authentication',
                  enableEmailVerification: 'Email Verification',
                  enablePushNotifications: 'Push Notifications',
                  enableBiometricAuth: 'Biometric Authentication',
                  enableOfflineMode: 'Offline Mode',
                  enableAnalytics: 'Analytics',
                  enableDebugMode: 'Debug Mode',
                }).map(([key, label]) => (
                  <HStack key={key} justify="between" as SpacingScale>
                    <Label>{label}</Label>
                    <Controller
                      control={featureForm.control}
                      name={key as keyof FeatureFlags}
                      render={({ field }) => (
                        <Switch
                          checked={field.value as boolean}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                  </HStack>
                ))}

                <Button
                  onPress={featureForm.handleSubmit(handleFeatureSubmit)}
                  loading={updateFeatureMutation.isPending}
                  className="w-full"
                >
                  Save Feature Flags
                </Button>
              </VStack>
          </TabsContent>

          {/* Maintenance */}
          <TabsContent value="maintenance">
            <VStack spacing="lg" as SpacingScale>
              <Card>
                <CardHeader>
                  <CardTitle>Cache Management</CardTitle>
                  <CardDescription>Clear various system caches</CardDescription>
                </CardHeader>
                <CardContent>
                  <VStack spacing="md" as SpacingScale>
                    <Button
                      variant="outline"
                      onPress={() => handleClearCache('all')}
                      loading={clearCacheMutation.isPending}
                      className="w-full"
                    >
                      <Symbol name="trash-2" size={16} className="mr-2" />
                      Clear All Caches
                    </Button>
                    <HStack spacing="md" as SpacingScale>
                      <Button
                        variant="outline"
                        size="sm"
                        onPress={() => handleClearCache('sessions')}
                        className="flex-1"
                      >
                        Sessions
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onPress={() => handleClearCache('api')}
                        className="flex-1"
                      >
                        API
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onPress={() => handleClearCache('static')}
                        className="flex-1"
                      >
                        Static
                      </Button>
                    </HStack>
                    {clearCacheMutation.isSuccess && (
                      <Alert>
                        <AlertDescription>Cache cleared successfully!</AlertDescription>
                      </Alert>
                    )}
                  </VStack>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Limits</CardTitle>
                  <CardDescription>Current usage and limits</CardDescription>
                </CardHeader>
                <CardContent>
                  <VStack spacing="md" as SpacingScale>
                    <HStack justify="between" as SpacingScale>
                      <Text size="sm">Max File Size</Text>
                      <Badge>{config.limits.maxFileSize} MB</Badge>
                    </HStack>
                    <HStack justify="between" as SpacingScale>
                      <Text size="sm">Max Organization Members</Text>
                      <Badge>{config.limits.maxOrganizationMembers}</Badge>
                    </HStack>
                    <HStack justify="between" as SpacingScale>
                      <Text size="sm">Max Storage per Org</Text>
                      <Badge>{config.limits.maxStoragePerOrg} GB</Badge>
                    </HStack>
                    <HStack justify="between" as SpacingScale>
                      <Text size="sm">Rate Limit</Text>
                      <Badge>{config.limits.rateLimitRequests} req/{config.limits.rateLimitWindow}min</Badge>
                    </HStack>
                  </VStack>
                </CardContent>
              </Card>
            </VStack>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}