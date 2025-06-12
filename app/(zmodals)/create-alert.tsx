import React, { useState } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import {
  Text,
  Button,
  Input,
  Label,
  Select,
  Card,
  Stack,
  Container,
} from '@/components/universal';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useSpacing } from '@/hooks/core/useSpacing';

type AlertPriority = 'low' | 'medium' | 'high' | 'critical';
type AlertType = 'medical' | 'operational' | 'emergency' | 'general';

interface AlertFormData {
  title: string;
  description: string;
  priority: AlertPriority;
  type: AlertType;
  patientId?: string;
  assignedTo?: string;
}

export default function CreateAlertModal() {
  const backgroundColor = useThemeColor({}, 'background');
  const spacing = useSpacing();
  
  const [formData, setFormData] = useState<AlertFormData>({
    title: '',
    description: '',
    priority: 'medium',
    type: 'general',
  });

  const handleSubmit = () => {
    // TODO: Implement alert creation logic
// TODO: Replace with structured logging - console.log('Creating alert:', formData);
    router.back();
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
            <Stack spacing="sm">
              <Text variant="h2" style={{ textAlign: 'center' }}>
                Create Alert
              </Text>
              <Text
                variant="body"
                style={{ textAlign: 'center', opacity: 0.7 }}
              >
                Create a new alert for the healthcare team
              </Text>
            </Stack>

            <Card>
              <Stack spacing="md">
                <Stack spacing="sm">
                  <Label htmlFor="title">Alert Title</Label>
                  <Input
                    id="title"
                    placeholder="Enter alert title"
                    value={formData.title}
                    onChangeText={(text) =>
                      setFormData({ ...formData, title: text })
                    }
                  />
                </Stack>

                <Stack spacing="sm">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    placeholder="Describe the alert details"
                    value={formData.description}
                    onChangeText={(text) =>
                      setFormData({ ...formData, description: text })
                    }
                    multiline
                    numberOfLines={4}
                    style={{ minHeight: 100 }}
                  />
                </Stack>

                <Stack spacing="sm">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    id="priority"
                    value={formData.priority}
                    onValueChange={(value) =>
                      setFormData({ ...formData, priority: value as AlertPriority })
                    }
                    placeholder="Select priority"
                  >
                    <Select.Item label="Low" value="low" />
                    <Select.Item label="Medium" value="medium" />
                    <Select.Item label="High" value="high" />
                    <Select.Item label="Critical" value="critical" />
                  </Select>
                </Stack>

                <Stack spacing="sm">
                  <Label htmlFor="type">Alert Type</Label>
                  <Select
                    id="type"
                    value={formData.type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, type: value as AlertType })
                    }
                    placeholder="Select type"
                  >
                    <Select.Item label="Medical" value="medical" />
                    <Select.Item label="Operational" value="operational" />
                    <Select.Item label="Emergency" value="emergency" />
                    <Select.Item label="General" value="general" />
                  </Select>
                </Stack>

                <Stack spacing="sm">
                  <Label htmlFor="patientId">Patient ID (Optional)</Label>
                  <Input
                    id="patientId"
                    placeholder="Enter patient ID"
                    value={formData.patientId || ''}
                    onChangeText={(text) =>
                      setFormData({ ...formData, patientId: text })
                    }
                  />
                </Stack>

                <Stack spacing="sm">
                  <Label htmlFor="assignedTo">Assign To (Optional)</Label>
                  <Input
                    id="assignedTo"
                    placeholder="Enter staff member name or ID"
                    value={formData.assignedTo || ''}
                    onChangeText={(text) =>
                      setFormData({ ...formData, assignedTo: text })
                    }
                  />
                </Stack>
              </Stack>
            </Card>

            <Stack spacing="sm" direction="row">
              <Button
                variant="outline"
                onPress={handleCancel}
                style={{ flex: 1 }}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                onPress={handleSubmit}
                style={{ flex: 1 }}
                disabled={!formData.title || !formData.description}
              >
                Create Alert
              </Button>
            </Stack>
          </Stack>
        </ScrollView>
      </Container>
    </KeyboardAvoidingView>
  );
}