import React, { useState } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import {
  Text,
  Button,
  Input,
  Label,
  Card,
  Stack,
  Container,
  Avatar,
  Select,
} from '@/components/universal';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useSpacing } from '@/hooks/core/useSpacing';
import { useAuth } from '@/hooks/useAuth';

interface ProfileFormData {
  name: string;
  email: string;
  phone: string;
  department: string;
  role: string;
  bio: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
}

export default function ProfileEditModal() {
  const { user } = useAuth();
  const backgroundColor = useThemeColor({}, 'background');
  const spacing = useSpacing();

  // Initialize with current user data
  const [formData, setFormData] = useState<ProfileFormData>({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    department: '',
    role: user?.role || '',
    bio: '',
    notifications: {
      email: true,
      push: true,
      sms: false,
    },
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement profile update logic
// TODO: Replace with structured logging - console.log('Updating profile:', formData);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      router.back();
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Container style={{ flex: 1, backgroundColor }}>
        <ScrollView
          contentContainerStyle={{
            padding: spacing.md,
            paddingBottom: spacing.xl,
          }}
        >
          <Stack spacing="lg">
            {/* Header */}
            <Stack spacing="md" align="center">
              <Avatar
                size="xl"
                fallback={formData.name.split(' ').map(n => n[0]).join('') || 'U'}
              />
              <Button variant="outline" size="sm">
                Change Photo
              </Button>
            </Stack>

            {/* Personal Information */}
            <Card>
              <Stack spacing="md">
                <Text variant="h4">Personal Information</Text>
                <Stack spacing="md">
                  <Stack spacing="sm">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChangeText={(text) =>
                        setFormData({ ...formData, name: text })
                      }
                    />
                  </Stack>

                  <Stack spacing="sm">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChangeText={(text) =>
                        setFormData({ ...formData, email: text })
                      }
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </Stack>

                  <Stack spacing="sm">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      placeholder="Enter your phone number"
                      value={formData.phone}
                      onChangeText={(text) =>
                        setFormData({ ...formData, phone: text })
                      }
                      keyboardType="phone-pad"
                    />
                  </Stack>
                </Stack>
              </Stack>
            </Card>

            {/* Professional Information */}
            <Card>
              <Stack spacing="md">
                <Text variant="h4">Professional Information</Text>
                <Stack spacing="md">
                  <Stack spacing="sm">
                    <Label htmlFor="department">Department</Label>
                    <Select
                      id="department"
                      value={formData.department}
                      onValueChange={(value) =>
                        setFormData({ ...formData, department: value })
                      }
                      placeholder="Select department"
                    >
                      <Select.Item label="Emergency" value="emergency" />
                      <Select.Item label="Cardiology" value="cardiology" />
                      <Select.Item label="Pediatrics" value="pediatrics" />
                      <Select.Item label="Surgery" value="surgery" />
                      <Select.Item label="Internal Medicine" value="internal" />
                    </Select>
                  </Stack>

                  <Stack spacing="sm">
                    <Label htmlFor="role">Role</Label>
                    <Input
                      id="role"
                      placeholder="Enter your role"
                      value={formData.role}
                      onChangeText={(text) =>
                        setFormData({ ...formData, role: text })
                      }
                    />
                  </Stack>

                  <Stack spacing="sm">
                    <Label htmlFor="bio">Bio</Label>
                    <Input
                      id="bio"
                      placeholder="Tell us about yourself"
                      value={formData.bio}
                      onChangeText={(text) =>
                        setFormData({ ...formData, bio: text })
                      }
                      multiline
                      numberOfLines={4}
                      style={{ minHeight: 100 }}
                    />
                  </Stack>
                </Stack>
              </Stack>
            </Card>

            {/* Notification Preferences */}
            <Card>
              <Stack spacing="md">
                <Text variant="h4">Notification Preferences</Text>
                <Stack spacing="sm">
                  <Text variant="body" style={{ opacity: 0.7 }}>
                    Choose how you want to receive notifications
                  </Text>
                  {/* TODO: Add switches for notification preferences */}
                  <Text variant="caption" style={{ opacity: 0.5 }}>
                    Notification toggles coming soon
                  </Text>
                </Stack>
              </Stack>
            </Card>

            {/* Actions */}
            <Stack spacing="sm" direction="row">
              <Button
                variant="outline"
                onPress={handleCancel}
                style={{ flex: 1 }}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                onPress={handleSave}
                style={{ flex: 1 }}
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </Stack>
          </Stack>
        </ScrollView>
      </Container>
    </KeyboardAvoidingView>
  );
}