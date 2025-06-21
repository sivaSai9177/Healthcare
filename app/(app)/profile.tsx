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
  Avatar,
  Input,
  Label,
  Badge,
} from '@/components/universal';
import { useSpacing } from '@/lib/stores/spacing-store';
import { useShadow } from '@/hooks/useShadow';
import { Symbol } from '@/components/universal/display/Symbols';
import { showSuccessAlert } from '@/lib/core/alert';

export default function ProfileScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const theme = useTheme();
  const { spacing } = useSpacing();
  const shadowMd = useShadow({ size: 'md' });
  
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email] = useState(user?.email || '');
  
  const handleSave = () => {
    // TODO: Implement profile update
    showSuccessAlert('Profile Updated', 'Your profile has been updated successfully');
    setIsEditing(false);
  };
  
  const roleDisplay = user?.role ? user.role.replace('_', ' ').charAt(0).toUpperCase() + user.role.slice(1) : 'User';
  
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
        <Text size="xl" weight="bold">Profile</Text>
      </HStack>
      
      {/* Avatar Section */}
      <Card style={shadowMd}>
        <Box p={4 as any}>
          <VStack gap={4 as any} alignItems="center">
            <Avatar
              source={user?.image ? { uri: user.image } : undefined}
              name={user?.name || 'User'}
              size="2xl"
            />
            <VStack gap={1 as any} alignItems="center">
              <Text size="default" weight="semibold">{user?.name || 'User'}</Text>
              <Text size="sm" colorTheme="mutedForeground">{user?.email}</Text>
              <Badge variant="outline" size="sm">
                {roleDisplay}
              </Badge>
            </VStack>
            <Button
              variant="outline"
              size="sm"
              onPress={() => {
                // TODO: Implement avatar upload
              }}
            >
              <Symbol name="camera" size={16} />
              <Text>Change Photo</Text>
            </Button>
          </VStack>
        </Box>
      </Card>
      
      {/* Profile Information */}
      <Card style={shadowMd}>
        <Box p={4 as any}>
          <HStack justifyContent="between" alignItems="center" style={{ marginBottom: spacing[4] as any }}>
            <Text weight="semibold">Profile Information</Text>
            <Button
              variant="ghost"
              size="sm"
              onPress={() => setIsEditing(!isEditing)}
            >
              <Symbol name={isEditing ? "xmark" : "pencil"} size={16} />
              <Text>{isEditing ? 'Cancel' : 'Edit'}</Text>
            </Button>
          </HStack>
          
          <VStack gap={4 as any}>
            <VStack gap={2 as any}>
              <Label>Name</Label>
              {isEditing ? (
                <Input
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your name"
                />
              ) : (
                <Text>{user?.name || 'Not set'}</Text>
              )}
            </VStack>
            
            <VStack gap={2 as any}>
              <Label>Email</Label>
              <Text colorTheme={!isEditing ? "default" : "mutedForeground"}>
                {email}
              </Text>
              {isEditing && (
                <Text size="xs" colorTheme="mutedForeground">
                  Email cannot be changed
                </Text>
              )}
            </VStack>
            
            <VStack gap={2 as any}>
              <Label>Role</Label>
              <Text>{roleDisplay}</Text>
            </VStack>
            
            {user?.organizationId && (
              <VStack gap={2 as any}>
                <Label>Organization</Label>
                <Text>{user.organizationName || 'Healthcare Organization'}</Text>
              </VStack>
            )}
            
            {isEditing && (
              <HStack gap={2 as any} style={{ marginTop: spacing[2] as any }}>
                <Button
                  onPress={handleSave}
                  variant="default"
                  fullWidth
                >
                  Save Changes
                </Button>
              </HStack>
            )}
          </VStack>
        </Box>
      </Card>
      
      {/* Account Info */}
      <Card style={shadowMd}>
        <Box p={4 as any}>
          <VStack gap={3 as any}>
            <Text weight="semibold">Account Information</Text>
            <VStack gap={2 as any}>
              <HStack justifyContent="between">
                <Text size="sm" colorTheme="mutedForeground">Account Created</Text>
                <Text size="sm">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                </Text>
              </HStack>
              <HStack justifyContent="between">
                <Text size="sm" colorTheme="mutedForeground">Email Verified</Text>
                <Badge variant={user?.emailVerified ? 'success' : 'secondary'} size="sm">
                  {user?.emailVerified ? 'Verified' : 'Unverified'}
                </Badge>
              </HStack>
              <HStack justifyContent="between">
                <Text size="sm" colorTheme="mutedForeground">Two-Factor Auth</Text>
                <Badge variant={user?.twoFactorEnabled ? 'success' : 'secondary'} size="sm">
                  {user?.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </HStack>
            </VStack>
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