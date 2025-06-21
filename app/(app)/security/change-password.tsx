import React, { useState } from 'react';
import { ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/lib/theme/provider';
import {
  Container,
  VStack,
  HStack,
  Text,
  Button,
  Card,
  Box,
  Input,
  Label,
} from '@/components/universal';
import { useSpacing } from '@/lib/stores/spacing-store';
import { useShadow } from '@/hooks/useShadow';
import { Symbol } from '@/components/universal/display/Symbols';
import { showSuccessAlert, showErrorAlert } from '@/lib/core/alert';
import { PasswordStrengthIndicator } from '@/components/blocks/auth/PasswordStrengthIndicator/PasswordStrengthIndicator';

export default function ChangePasswordScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const theme = useTheme();
  const { spacing } = useSpacing();
  const shadowMd = useShadow({ size: 'md' });
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleChangePassword = async () => {
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      showErrorAlert('Missing Fields', 'Please fill in all password fields');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      showErrorAlert('Passwords Don\'t Match', 'New password and confirmation must match');
      return;
    }
    
    if (newPassword.length < 8) {
      showErrorAlert('Password Too Short', 'Password must be at least 8 characters');
      return;
    }
    
    if (currentPassword === newPassword) {
      showErrorAlert('Same Password', 'New password must be different from current password');
      return;
    }
    
    setIsLoading(true);
    try {
      // TODO: Implement password change API call
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      showSuccessAlert('Password Changed', 'Your password has been updated successfully');
      router.back();
    } catch (error) {
      showErrorAlert('Failed to Change Password', 'Please try again');
    } finally {
      setIsLoading(false);
    }
  };
  
  const content = (
    <VStack gap={4 as any}>
      {/* Header */}
      <HStack alignItems="center" gap={2 as any}>
        <Button
          onPress={() => router.back()}
          variant="ghost"
          size="icon"
        >
          <Symbol name="chevron.left" size={24} />
        </Button>
        <Text size="xl" weight="bold">Change Password</Text>
      </HStack>
      
      {/* Password Requirements */}
      <Card style={shadowMd}>
        <Box p={4 as any}>
          <VStack gap={3 as any}>
            <HStack gap={2 as any} alignItems="center">
              <Symbol name="info.circle" size={20} className="text-primary" />
              <Text weight="semibold">Password Requirements</Text>
            </HStack>
            <VStack gap={2 as any}>
              <HStack gap={2 as any}>
                <Symbol name="checkmark.circle" size={16} className="text-muted-foreground" />
                <Text size="sm" colorTheme="mutedForeground">At least 8 characters long</Text>
              </HStack>
              <HStack gap={2 as any}>
                <Symbol name="checkmark.circle" size={16} className="text-muted-foreground" />
                <Text size="sm" colorTheme="mutedForeground">Include uppercase and lowercase letters</Text>
              </HStack>
              <HStack gap={2 as any}>
                <Symbol name="checkmark.circle" size={16} className="text-muted-foreground" />
                <Text size="sm" colorTheme="mutedForeground">Include at least one number</Text>
              </HStack>
              <HStack gap={2 as any}>
                <Symbol name="checkmark.circle" size={16} className="text-muted-foreground" />
                <Text size="sm" colorTheme="mutedForeground">Include at least one special character</Text>
              </HStack>
            </VStack>
          </VStack>
        </Box>
      </Card>
      
      {/* Password Form */}
      <Card style={shadowMd}>
        <Box p={4 as any}>
          <VStack gap={4 as any}>
            {/* Current Password */}
            <VStack gap={2 as any}>
              <Label>Current Password</Label>
              <Box position="relative">
                <Input
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Enter current password"
                  secureTextEntry={!showCurrentPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    bottom: 0,
                    justifyContent: 'center',
                  }}
                >
                  <Symbol 
                    name={showCurrentPassword ? "eye.slash" : "eye"} 
                    size={20} 
                    className="text-muted-foreground" 
                  />
                </Button>
              </Box>
            </VStack>
            
            {/* New Password */}
            <VStack gap={2 as any}>
              <Label>New Password</Label>
              <Box position="relative">
                <Input
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Enter new password"
                  secureTextEntry={!showNewPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onPress={() => setShowNewPassword(!showNewPassword)}
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    bottom: 0,
                    justifyContent: 'center',
                  }}
                >
                  <Symbol 
                    name={showNewPassword ? "eye.slash" : "eye"} 
                    size={20} 
                    className="text-muted-foreground" 
                  />
                </Button>
              </Box>
              {newPassword && (
                <PasswordStrengthIndicator password={newPassword} />
              )}
            </VStack>
            
            {/* Confirm Password */}
            <VStack gap={2 as any}>
              <Label>Confirm New Password</Label>
              <Box position="relative">
                <Input
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm new password"
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    bottom: 0,
                    justifyContent: 'center',
                  }}
                >
                  <Symbol 
                    name={showConfirmPassword ? "eye.slash" : "eye"} 
                    size={20} 
                    className="text-muted-foreground" 
                  />
                </Button>
              </Box>
              {confirmPassword && newPassword !== confirmPassword && (
                <Text size="xs" colorTheme="error">
                  Passwords do not match
                </Text>
              )}
            </VStack>
            
            {/* Actions */}
            <HStack gap={2 as any} style={{ marginTop: spacing[2] as any }}>
              <Button
                onPress={() => router.back()}
                variant="outline"
                fullWidth
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onPress={handleChangePassword}
                variant="default"
                fullWidth
                loading={isLoading}
                disabled={!currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
              >
                Change Password
              </Button>
            </HStack>
          </VStack>
        </Box>
      </Card>
    </VStack>
  );
  
  if (Platform.OS !== 'web') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <ScrollView
          contentContainerStyle={{ padding: spacing[4] as any, paddingBottom: spacing[6] as any }}
          showsVerticalScrollIndicator={false}
        >
          {content}
        </ScrollView>
      </SafeAreaView>
    );
  }
  
  return (
    <Container>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <VStack p={4} gap={4 as any}>
          {content}
        </VStack>
      </ScrollView>
    </Container>
  );
}