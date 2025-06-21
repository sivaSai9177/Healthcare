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
  Badge,
} from '@/components/universal';
import { useSpacing } from '@/lib/stores/spacing-store';
import { useShadow } from '@/hooks/useShadow';
import { Symbol } from '@/components/universal/display/Symbols';
import { showSuccessAlert, showErrorAlert } from '@/lib/core/alert';

export default function TwoFactorAuthScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const theme = useTheme();
  const { spacing } = useSpacing();
  const shadowMd = useShadow({ size: 'md' });
  
  const [isEnabling, setIsEnabling] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState<'setup' | 'verify'>('setup');
  
  const isEnabled = user?.twoFactorEnabled || false;
  
  const handleEnable = () => {
    setIsEnabling(true);
    setStep('verify');
    // TODO: Generate QR code and secret
  };
  
  const handleVerify = () => {
    if (verificationCode.length !== 6) {
      showErrorAlert('Invalid Code', 'Please enter a 6-digit verification code');
      return;
    }
    
    // TODO: Verify code and enable 2FA
    showSuccessAlert('2FA Enabled', 'Two-factor authentication has been enabled');
    setIsEnabling(false);
    setStep('setup');
    setVerificationCode('');
  };
  
  const handleDisable = () => {
    // TODO: Implement 2FA disable
    showSuccessAlert('2FA Disabled', 'Two-factor authentication has been disabled');
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
        <Text size="xl" weight="bold">Two-Factor Authentication</Text>
      </HStack>
      
      {/* Status Card */}
      <Card style={shadowMd}>
        <Box p={4 as any}>
          <HStack justifyContent="between" alignItems="center">
            <VStack gap={1 as any}>
              <Text weight="semibold">2FA Status</Text>
              <Text size="sm" colorTheme="mutedForeground">
                {isEnabled ? 'Your account is protected with 2FA' : 'Add an extra layer of security'}
              </Text>
            </VStack>
            <Badge variant={isEnabled ? 'success' : 'secondary'} size="default">
              {isEnabled ? 'Enabled' : 'Disabled'}
            </Badge>
          </HStack>
        </Box>
      </Card>
      
      {!isEnabled && !isEnabling && (
        <>
          {/* Info Card */}
          <Card style={shadowMd}>
            <Box p={4 as any}>
              <VStack gap={3 as any}>
                <HStack gap={2 as any} alignItems="center">
                  <Symbol name="shield" size={20} className="text-primary" />
                  <Text weight="semibold">What is Two-Factor Authentication?</Text>
                </HStack>
                <Text size="sm" colorTheme="mutedForeground">
                  Two-factor authentication adds an extra layer of security to your account. 
                  In addition to your password, you'll need to enter a code from your authenticator app.
                </Text>
                <VStack gap={2 as any}>
                  <Text size="sm" weight="semibold">Benefits:</Text>
                  <HStack gap={2 as any}>
                    <Symbol name="checkmark.circle" size={16} className="text-success" />
                    <Text size="sm">Protects against password theft</Text>
                  </HStack>
                  <HStack gap={2 as any}>
                    <Symbol name="checkmark.circle" size={16} className="text-success" />
                    <Text size="sm">Prevents unauthorized access</Text>
                  </HStack>
                  <HStack gap={2 as any}>
                    <Symbol name="checkmark.circle" size={16} className="text-success" />
                    <Text size="sm">Complies with security best practices</Text>
                  </HStack>
                </VStack>
              </VStack>
            </Box>
          </Card>
          
          {/* Enable Button */}
          <Button
            onPress={handleEnable}
            variant="default"
            fullWidth
          >
            <Symbol name="shield" size={20} />
            <Text>Enable Two-Factor Authentication</Text>
          </Button>
        </>
      )}
      
      {isEnabling && step === 'verify' && (
        <>
          {/* Setup Instructions */}
          <Card style={shadowMd}>
            <Box p={4 as any}>
              <VStack gap={3 as any}>
                <Text weight="semibold">Setup Instructions</Text>
                <VStack gap={2 as any}>
                  <HStack gap={2 as any}>
                    <Badge variant="outline" size="sm">1</Badge>
                    <Text size="sm">Install an authenticator app (Google Authenticator, Authy, etc.)</Text>
                  </HStack>
                  <HStack gap={2 as any}>
                    <Badge variant="outline" size="sm">2</Badge>
                    <Text size="sm">Scan the QR code below with your authenticator app</Text>
                  </HStack>
                  <HStack gap={2 as any}>
                    <Badge variant="outline" size="sm">3</Badge>
                    <Text size="sm">Enter the 6-digit code from your app</Text>
                  </HStack>
                </VStack>
              </VStack>
            </Box>
          </Card>
          
          {/* QR Code Placeholder */}
          <Card style={shadowMd}>
            <Box p={6} alignItems="center">
              <Box
                style={{
                  width: 200,
                  height: 200,
                  backgroundColor: theme.muted,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Symbol name="qrcode" size={48} className="text-muted-foreground" />
              </Box>
              <Text size="xs" colorTheme="mutedForeground" style={{ marginTop: spacing[2] as any }}>
                QR Code would appear here
              </Text>
            </Box>
          </Card>
          
          {/* Verification Input */}
          <VStack gap={3 as any}>
            <Label>Verification Code</Label>
            <Input
              value={verificationCode}
              onChangeText={setVerificationCode}
              placeholder="Enter 6-digit code"
              keyboardType="numeric"
              maxLength={6}
            />
            <HStack gap={2 as any}>
              <Button
                onPress={() => {
                  setIsEnabling(false);
                  setStep('setup');
                  setVerificationCode('');
                }}
                variant="outline"
                fullWidth
              >
                Cancel
              </Button>
              <Button
                onPress={handleVerify}
                variant="default"
                fullWidth
                disabled={verificationCode.length !== 6}
              >
                Verify & Enable
              </Button>
            </HStack>
          </VStack>
        </>
      )}
      
      {isEnabled && (
        <>
          {/* Backup Codes */}
          <Card style={shadowMd}>
            <Box p={4 as any}>
              <VStack gap={3 as any}>
                <HStack justifyContent="between" alignItems="center">
                  <Text weight="semibold">Backup Codes</Text>
                  <Button
                    variant="ghost"
                    size="sm"
                    onPress={() => {
                      // TODO: Generate new backup codes
                    }}
                  >
                    <Symbol name="arrow.triangle.2.circlepath" size={16} />
                    <Text>Regenerate</Text>
                  </Button>
                </HStack>
                <Text size="sm" colorTheme="mutedForeground">
                  Save these codes in a safe place. You can use them to access your account if you lose your authenticator device.
                </Text>
              </VStack>
            </Box>
          </Card>
          
          {/* Disable Button */}
          <Button
            onPress={handleDisable}
            variant="error"
            fullWidth
          >
            Disable Two-Factor Authentication
          </Button>
        </>
      )}
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