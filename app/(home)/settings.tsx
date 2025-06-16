import React, { useState, useEffect } from 'react';
import { Alert, Platform, View, Text as RNText } from 'react-native';
import { useRouter } from 'expo-router';
import { 
  ScrollContainer, 
  Box, 
  VStack, 
  HStack, 
  Text, 
  Heading1,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Avatar,
  SimpleBreadcrumb,
  Separator,
  SidebarTrigger
} from '@/components/universal';
import { DarkModeToggle } from '@/components/blocks/theme/DarkModeToggle/DarkModeToggle';
import { SpacingDensitySelector } from '@/components/blocks/theme/DensitySelector/SpacingDensitySelector';
import { ThemeSelector } from '@/components/blocks/theme/ThemeSelector/ThemeSelector';
import { ProfileEditBlock, PasswordChangeBlock, EmailPreferencesBlock, TwoFactorAuthBlock } from '@/components/blocks/settings';
import { PushNotificationSettings } from '@/components/blocks/settings/PushNotificationSettings';
import { useAuth } from '@/hooks/useAuth';
import { log } from '@/lib/core/debug/logger';
import { useTheme } from '@/lib/theme/provider';
import { notificationService } from '@/lib/ui/notifications/service';
import { SpacingScale } from '@/lib/design';
import { SignOutButton } from '@/components/blocks/auth';
import { signOut } from '@/lib/auth/signout-manager';
import { api } from '@/lib/api/trpc';

export default function SettingsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const theme = useTheme();
  
  // Debug logging
  React.useEffect(() => {
    console.log('[SettingsScreen] Mounted and rendering');
    console.log('[SettingsScreen] User:', user?.email, 'role:', user?.role);
    
    // Add navigation test button
    const timer = setTimeout(() => {
      console.log('[SettingsScreen] Still visible after 2 seconds');
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [user]);
  
  // Remove the test return and let the component render normally
  const [notificationPermission, setNotificationPermission] = useState<string>('undetermined');
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [showEmailPreferences, setShowEmailPreferences] = useState(false);
  const [showTwoFactorAuth, setShowTwoFactorAuth] = useState(false);
  
  // Debug mutation for role switching
  const debugRoleMutation = api.user.debugUpdateOwnRole.useMutation({
    onSuccess: () => {
      // Trigger a refresh of the session
      window.location.reload();
    },
    onError: (error) => {
      Alert.alert('Error', error.message || 'Failed to update role');
    }
  });

  // Check notification permission status on mount
  useEffect(() => {
    checkNotificationPermission();
    
    // Set up notification listeners
    notificationService.setupNotificationListeners(
      (notification) => {
        // Handle notification received while app is in foreground
        log.info('Notification received in foreground', 'SETTINGS', {
          title: notification.request.content.title,
        });
      },
      (response) => {
        // Handle notification response (user tapped on notification)
        log.info('User interacted with notification', 'SETTINGS', {
          actionIdentifier: response.actionIdentifier,
        });
      }
    );

    return () => {
      // Clean up listeners
      notificationService.removeNotificationListeners();
    };
  }, []);

  const checkNotificationPermission = async () => {
    try {
      const status = await notificationService.checkPermissionStatus();
      setNotificationPermission(status);
    } catch (error) {
      log.error('Failed to check notification permission', 'SETTINGS', error);
    }
  };


  const handleSignOut = async () => {
    console.log('handleSignOut called');
    
    try {
      // Direct signout without confirmation
      await signOut({
        reason: 'user_initiated',
        showAlert: false,
        redirectTo: '/(auth)/login'
      });
    } catch (error) {
      console.error('Sign out error:', error);
      // Even if API fails, we should still log out locally
      router.replace('/(auth)/login');
    }
  };

  const deleteAccountMutation = api.user.deleteAccount.useMutation({
    onSuccess: () => {
      log.info('Account deleted successfully', 'SETTINGS');
      signOut({
        reason: 'account_deleted',
        showAlert: false,
        redirectTo: '/(auth)/login'
      });
    },
    onError: (error) => {
      log.error('Failed to delete account', 'SETTINGS', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to delete account. Please try again.',
        [{ text: 'OK' }]
      );
    },
  });

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => {
            Alert.prompt(
              "Confirm Account Deletion",
              "Please enter your password and type DELETE to confirm:",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Delete Account",
                  style: "destructive",
                  onPress: (password) => {
                    if (password) {
                      deleteAccountMutation.mutate({
                        password,
                        confirmation: 'DELETE' as const,
                      });
                    }
                  }
                }
              ],
              'secure-text'
            );
          }
        }
      ]
    );
  };

  return (
    <ScrollContainer safe>
      <VStack p={0} spacing={0} style={{ backgroundColor: 'transparent' }}>
        {/* Header with Toggle and Breadcrumbs - Only on Web */}
        {Platform.OS === 'web' && (
          <Box px={4 as SpacingScale} py={3 as SpacingScale} borderBottomWidth={1} borderTheme="border">
            <HStack alignItems="center" spacing={2} mb={2}>
              <SidebarTrigger />
              <Separator orientation="vertical" style={{ height: 24 }} />
              <SimpleBreadcrumb
                items={[
                  { label: 'Settings', current: true }
                ]}
                showHome={true}
                homeLabel="Dashboard"
                homeHref="/(home)"
              />
            </HStack>
          </Box>
        )}

        <VStack p={4 as SpacingScale} spacing={4} style={{ backgroundColor: 'transparent', minHeight: '100%' }}>
          <Heading1 mb={6}>
            Settings
          </Heading1>

        {/* Debug Section - Remove in production */}
        <Card>
          <CardHeader>
            <CardTitle>Debug Info</CardTitle>
            <CardDescription>Current user information</CardDescription>
          </CardHeader>
          <CardContent>
            <VStack spacing={2}>
              <Text>Email: {user?.email}</Text>
              <Text>Role: {user?.role}</Text>
              <Text>Organization: {user?.organizationName || 'None'}</Text>
              <Text>Needs Profile Completion: {user?.needsProfileCompletion ? 'Yes' : 'No'}</Text>
            </VStack>
            
            {/* Temporary role switcher for testing */}
            {process.env.NODE_ENV !== 'production' && (
              <VStack spacing={2} mt={4}>
                <Text size="sm" weight="semibold">Debug: Change Role</Text>
                <VStack spacing={2}>
                  {/* General Roles */}
                  <HStack spacing={2}>
                    <Button
                      variant={user?.role === 'user' ? 'solid' : 'outline'}
                      size="sm"
                      onPress={() => debugRoleMutation.mutate({ role: 'user' })}
                    >
                      User
                    </Button>
                    <Button
                      variant={user?.role === 'admin' ? 'solid' : 'outline'}
                      size="sm"
                      onPress={() => debugRoleMutation.mutate({ role: 'admin' })}
                    >
                      Admin
                    </Button>
                    <Button
                      variant={user?.role === 'manager' ? 'solid' : 'outline'}
                      size="sm"
                      onPress={() => debugRoleMutation.mutate({ role: 'manager' })}
                    >
                      Manager
                    </Button>
                  </HStack>
                  
                  {/* Healthcare Roles */}
                  <Text size="xs" colorTheme="mutedForeground">Healthcare Roles:</Text>
                  <HStack spacing={2} style={{ flexWrap: 'wrap' }}>
                    <Button
                      variant={user?.role === 'operator' ? 'solid' : 'outline'}
                      size="sm"
                      onPress={() => debugRoleMutation.mutate({ role: 'operator' })}
                      style={{ marginBottom: 8 }}
                    >
                      Operator
                    </Button>
                    <Button
                      variant={user?.role === 'doctor' ? 'solid' : 'outline'}
                      size="sm"
                      onPress={() => debugRoleMutation.mutate({ role: 'doctor' })}
                      style={{ marginBottom: 8 }}
                    >
                      Doctor
                    </Button>
                    <Button
                      variant={user?.role === 'nurse' ? 'solid' : 'outline'}
                      size="sm"
                      onPress={() => debugRoleMutation.mutate({ role: 'nurse' })}
                      style={{ marginBottom: 8 }}
                    >
                      Nurse
                    </Button>
                    <Button
                      variant={user?.role === 'head_doctor' ? 'solid' : 'outline'}
                      size="sm"
                      onPress={() => debugRoleMutation.mutate({ role: 'head_doctor' })}
                      style={{ marginBottom: 8 }}
                    >
                      Head Doctor
                    </Button>
                  </HStack>
                </VStack>
              </VStack>
            )}
          </CardContent>
        </Card>

        {/* Profile Section */}
        <ProfileEditBlock />

        {/* Account Settings */}
        {!showPasswordChange && !showEmailPreferences && !showTwoFactorAuth && (
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>Manage your account settings</CardDescription>
            </CardHeader>
            <CardContent>
              <VStack spacing={3}>
                <Button
                  variant="outline"
                  fullWidth
                  onPress={() => setShowPasswordChange(true)}
                >
                  Change Password
                </Button>
                
                <Button
                  variant="outline"
                  fullWidth
                  onPress={() => setShowEmailPreferences(true)}
                >
                  Email Preferences
                </Button>
                
                <Button
                  variant="outline"
                  fullWidth
                  onPress={() => setShowTwoFactorAuth(true)}
                >
                  Two-Factor Authentication
                </Button>
              </VStack>
            </CardContent>
          </Card>
        )}

        {/* Password Change Block */}
        {showPasswordChange && (
          <PasswordChangeBlock 
            onSuccess={() => setShowPasswordChange(false)}
            onCancel={() => setShowPasswordChange(false)}
          />
        )}

        {/* Email Preferences Block */}
        {showEmailPreferences && (
          <EmailPreferencesBlock 
            onSuccess={() => setShowEmailPreferences(false)}
            onBack={() => setShowEmailPreferences(false)}
          />
        )}

        {/* Two-Factor Authentication Block */}
        {showTwoFactorAuth && (
          <TwoFactorAuthBlock 
            onSuccess={() => setShowTwoFactorAuth(false)}
            onCancel={() => setShowTwoFactorAuth(false)}
          />
        )}

        {/* Admin Section - Only show for admin users */}
        {user?.role === 'admin' && (
          <Card>
            <CardHeader>
              <CardTitle>Administration</CardTitle>
              <CardDescription>Admin tools and settings</CardDescription>
            </CardHeader>
            <CardContent>
              <VStack spacing={3}>
                <Button
                  variant="solid"
                  fullWidth
                  onPress={() => {
                    router.push('/(home)/admin');
                  }}
                >
                  Admin Dashboard
                </Button>
                
                <Button
                  variant="outline"
                  fullWidth
                  onPress={() => {
                    Alert.alert("Coming Soon", "System settings will be available in the next update.");
                  }}
                >
                  System Settings
                </Button>
              </VStack>
            </CardContent>
          </Card>
        )}

        {/* App Settings */}
        <Card>
          <CardHeader>
            <CardTitle>App Settings</CardTitle>
            <CardDescription>Configure app behavior and appearance</CardDescription>
          </CardHeader>
          <CardContent>
            <VStack spacing={4}>
              <DarkModeToggle />
              
              <Box borderTopWidth={1} borderTheme="border" pt={4} mt={2}>
                <ThemeSelector />
              </Box>
              
              <Box borderTopWidth={1} borderTheme="border" pt={4} mt={2}>
                <SpacingDensitySelector />
              </Box>
            </VStack>
          </CardContent>
        </Card>

        {/* Push Notifications */}
        <PushNotificationSettings />

        {/* Developer Options */}
        <Card>
          <CardHeader>
            <CardTitle>Developer Options</CardTitle>
            <CardDescription>Tools and demos for development</CardDescription>
          </CardHeader>
          <CardContent>
            <VStack spacing={3}>
              <Button
                variant="outline"
                fullWidth
                onPress={() => router.push('/(home)/demo-universal')}
              >
                Universal Components Demo
              </Button>
              <Text size="xs" colorTheme="mutedForeground" align="center">
                View Dialog and DropdownMenu examples
              </Text>
            </VStack>
          </CardContent>
        </Card>

        {/* Developer Options (only in development) */}
        {__DEV__ && (
          <Card>
            <CardHeader>
              <CardTitle>Developer Options</CardTitle>
              <CardDescription>Advanced options for development</CardDescription>
            </CardHeader>
            <CardContent>
              <VStack spacing={3}>
                <Button
                  variant="outline"
                  fullWidth
                  onPress={() => router.push('/(auth)/theme-test')}
                >
                  Theme Testing Playground
                </Button>
              </VStack>
            </CardContent>
          </Card>
        )}

        {/* About Section */}
        <Card>
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent>
            <VStack spacing={2}>
              <HStack justifyContent="space-between">
                <Text colorTheme="mutedForeground">Version</Text>
                <Text colorTheme="mutedForeground">1.0.0</Text>
              </HStack>
              <HStack justifyContent="space-between">
                <Text colorTheme="mutedForeground">Environment</Text>
                <Text colorTheme="mutedForeground">Development</Text>
              </HStack>
            </VStack>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card>
          <CardHeader>
            <CardTitle colorTheme="destructive">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent>
            <View style={{ gap: 12 }}>
              <Button
                variant="destructive"
                fullWidth
                onPress={handleSignOut}
              >
                Sign Out
              </Button>
              
              <Button
                variant="outline"
                fullWidth
                onPress={handleDeleteAccount}
              >
                Delete Account
              </Button>
            </View>
          </CardContent>
        </Card>
        </VStack>
      </VStack>
    </ScrollContainer>
  );
}