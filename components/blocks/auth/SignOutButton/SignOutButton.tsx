import React, { useState } from 'react';
import { Alert, Platform } from 'react-native';
import { Button } from '@/components/universal/interaction';
import { useAuth } from '@/hooks/useAuth';
import { log } from '@/lib/core/debug/logger';
import { haptic } from '@/lib/ui/haptics';
import { MaterialIcons } from '@expo/vector-icons';

export interface SignOutButtonProps extends Omit<ButtonProps, 'onPress'> {
  showConfirmation?: boolean;
  confirmationTitle?: string;
  confirmationMessage?: string;
  showIcon?: boolean;
  onSignOutComplete?: () => void;
  redirectTo?: string;
}

export function SignOutButton({
  showConfirmation = true,
  confirmationTitle = "Sign Out",
  confirmationMessage = "Are you sure you want to sign out?",
  showIcon = true,
  onSignOutComplete,
  redirectTo,
  variant = "destructive",
  children = "Sign Out",
  ...buttonProps
}: SignOutButtonProps) {
  const { logout, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    setIsLoading(true);
    
    try {
      await logout('user_initiated');
      log.info('Sign out completed', 'SIGNOUT_BUTTON');
      
      // Haptic feedback
      if (Platform.OS !== 'web') {
        haptic('success');
      }
      
      // Call completion handler if provided
      if (onSignOutComplete) {
        onSignOutComplete();
      }
      
      // Show success message
      if (Platform.OS === 'web') {
        log.info('Successfully signed out', 'COMPONENT');
      } else {
        Alert.alert("Success", "You have been signed out");
      }
    } catch (error) {
      log.error('Sign out failed', 'SIGNOUT_BUTTON', error);
      
      // Show error but we're likely already signed out locally
      Alert.alert("Sign Out", "You have been signed out");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePress = () => {
    if (!isAuthenticated) {
      log.warn('Sign out button pressed but user not authenticated', 'SIGNOUT_BUTTON');
      return;
    }

    if (showConfirmation) {
      Alert.alert(
        confirmationTitle,
        confirmationMessage,
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Sign Out", 
            style: "destructive",
            onPress: handleSignOut
          }
        ]
      );
    } else {
      handleSignOut();
    }
  };

  return (
    <Button
      variant={variant}
      onPress={handlePress}
      isLoading={isLoading}
      isDisabled={!isAuthenticated || isLoading}
      leftIcon={showIcon ? <MaterialIcons name="logout" size={18} /> : undefined}
      {...buttonProps}
    >
      {children}
    </Button>
  );
}