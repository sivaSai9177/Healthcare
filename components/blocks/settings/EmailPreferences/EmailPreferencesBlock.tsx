import React, { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { VStack, HStack, Separator } from '@/components/universal/layout';
import { Button } from '@/components/universal/interaction';
import { Text } from '@/components/universal/typography';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/universal/display';
import { Skeleton } from '@/components/universal/feedback';
import { Switch } from '@/components/universal/form';
import { api } from '@/lib/api/trpc';
import { log } from '@/lib/core/debug/logger';
import { SpacingScale } from '@/lib/design';
import { Symbol } from '@/components/universal/display/Symbols';

// Email preference categories
const emailCategories = [
  {
    id: 'account',
    title: 'Account Updates',
    description: 'Important account and security notifications',
    icon: 'shield',
    preferences: [
      { id: 'account_security', label: 'Security alerts', required: true },
      { id: 'account_login', label: 'New login notifications', required: false },
      { id: 'account_changes', label: 'Profile changes', required: false },
    ],
  },
  {
    id: 'alerts',
    title: 'Alert Notifications',
    description: 'Healthcare alert system notifications',
    icon: 'bell',
    preferences: [
      { id: 'alert_critical', label: 'Critical alerts', required: true },
      { id: 'alert_assigned', label: 'Alerts assigned to me', required: false },
      { id: 'alert_escalation', label: 'Escalation notifications', required: false },
      { id: 'alert_resolved', label: 'Alert resolution updates', required: false },
    ],
  },
  {
    id: 'team',
    title: 'Team Updates',
    description: 'Team and organization notifications',
    icon: 'person.2',
    preferences: [
      { id: 'team_invites', label: 'Team invitations', required: false },
      { id: 'team_announcements', label: 'Team announcements', required: false },
      { id: 'team_shift', label: 'Shift reminders', required: false },
    ],
  },
  {
    id: 'reports',
    title: 'Reports & Analytics',
    description: 'Periodic reports and insights',
    icon: 'chart.line.uptrend.xyaxis',
    preferences: [
      { id: 'report_weekly', label: 'Weekly summary', required: false },
      { id: 'report_monthly', label: 'Monthly reports', required: false },
      { id: 'report_performance', label: 'Performance insights', required: false },
    ],
  },
  {
    id: 'marketing',
    title: 'Product Updates',
    description: 'New features and product announcements',
    icon: 'envelope',
    preferences: [
      { id: 'marketing_features', label: 'New feature announcements', required: false },
      { id: 'marketing_tips', label: 'Tips and best practices', required: false },
      { id: 'marketing_newsletter', label: 'Monthly newsletter', required: false },
    ],
  },
];

interface EmailPreferencesBlockProps {
  onSuccess?: () => void;
  onBack?: () => void;
}

export const EmailPreferencesBlock: React.FC<EmailPreferencesBlockProps> = ({
  onSuccess,
  onBack,
}) => {
  const [preferences, setPreferences] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Get user email preferences
  const { data: userPreferences, isLoading: isLoadingPreferences } = 
    api.user.getEmailPreferences.useQuery();

  // Update preferences when data is loaded
  React.useEffect(() => {
    if (userPreferences) {
      setPreferences(userPreferences.preferences || {});
    }
  }, [userPreferences]);

  // Update email preferences
  const updatePreferencesMutation = api.user.updateEmailPreferences.useMutation({
    onSuccess: () => {
      log.info('Email preferences updated', 'EMAIL_PREFERENCES');
      onSuccess?.();
      
      Alert.alert(
        'Success',
        'Your email preferences have been updated.',
        [{ text: 'OK' }]
      );
    },
    onError: (error) => {
      log.error('Failed to update email preferences', 'EMAIL_PREFERENCES', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to update preferences. Please try again.',
        [{ text: 'OK' }]
      );
    },
  });

  useEffect(() => {
    if (!isLoadingPreferences) {
      setIsLoading(false);
    }
  }, [isLoadingPreferences]);

  const handleTogglePreference = (prefId: string, isRequired: boolean) => {
    if (isRequired) {
      Alert.alert(
        'Required Notification',
        'This notification type is required and cannot be disabled.',
        [{ text: 'OK' }]
      );
      return;
    }

    setPreferences(prev => ({
      ...prev,
      [prefId]: !prev[prefId],
    }));
  };

  const handleSave = () => {
    updatePreferencesMutation.mutate({ preferences });
  };

  const handleUnsubscribeAll = () => {
    Alert.alert(
      'Unsubscribe from All',
      'Are you sure you want to unsubscribe from all non-required email notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unsubscribe',
          style: 'destructive',
          onPress: () => {
            const newPreferences: Record<string, boolean> = {};
            
            // Keep only required preferences
            emailCategories.forEach(category => {
              category.preferences.forEach(pref => {
                newPreferences[pref.id] = pref.required;
              });
            });
            
            setPreferences(newPreferences);
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <VStack spacing={4 as SpacingScale}>
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </VStack>
        </CardContent>
      </Card>
    );
  }

  const hasChanges = JSON.stringify(preferences) !== 
    JSON.stringify(userPreferences?.preferences || {});

  return (
    <Card>
      <CardHeader>
        <HStack justifyContent="space-between" alignItems="center">
          <VStack spacing={1 as SpacingScale}>
            <CardTitle>Email Preferences</CardTitle>
            <CardDescription>
              Manage which emails you receive from us
            </CardDescription>
          </VStack>
          {onBack && (
            <Button
              size="sm"
              variant="ghost"
              onPress={onBack}
            >
              Back
            </Button>
          )}
        </HStack>
      </CardHeader>
      
      <CardContent>
        <VStack spacing={6 as SpacingScale}>
          {emailCategories.map((category, categoryIndex) => {
            return (
              <VStack key={category.id} spacing={3 as SpacingScale}>
                {categoryIndex > 0 && <Separator />}
                
                <HStack spacing={3 as SpacingScale} alignItems="center">
                  <Symbol name={category.icon} size={20} className="text-muted-foreground" />
                  <VStack flex={1} spacing={1 as SpacingScale}>
                    <Text weight="semibold">{category.title}</Text>
                    <Text size="sm" colorTheme="mutedForeground">
                      {category.description}
                    </Text>
                  </VStack>
                </HStack>
                
                <VStack spacing={2 as SpacingScale} pl={8 as SpacingScale}>
                  {category.preferences.map(pref => (
                    <HStack
                      key={pref.id}
                      justifyContent="space-between"
                      alignItems="center"
                      py={1 as SpacingScale}
                    >
                      <VStack flex={1} spacing={0}>
                        <Text size="sm">{pref.label}</Text>
                        {pref.required && (
                          <Text size="xs" colorTheme="mutedForeground">
                            Required for account security
                          </Text>
                        )}
                      </VStack>
                      <Switch
                        value={preferences[pref.id] ?? true}
                        onValueChange={() => handleTogglePreference(pref.id, pref.required)}
                        disabled={pref.required || updatePreferencesMutation.isPending}
                      />
                    </HStack>
                  ))}
                </VStack>
              </VStack>
            );
          })}
          
          <Separator />
          
          <VStack spacing={3 as SpacingScale}>
            <Button
              variant="outline"
              fullWidth
              onPress={handleUnsubscribeAll}
              disabled={updatePreferencesMutation.isPending}
            >
              Unsubscribe from All (except required)
            </Button>
            
            {hasChanges && (
              <Button
                variant="solid"
                fullWidth
                onPress={handleSave}
                isLoading={updatePreferencesMutation.isPending}
              >
                Save Preferences
              </Button>
            )}
          </VStack>
          
          <Text size="xs" colorTheme="mutedForeground" align="center">
            You can unsubscribe from emails at any time by clicking the unsubscribe
            link in any email we send you.
          </Text>
        </VStack>
      </CardContent>
    </Card>
  );
};