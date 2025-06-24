import * as React from 'react';
import { ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { useTheme } from '@/lib/theme/provider';
import { useSpacing } from '@/lib/stores/spacing-store';
import { AlertSoundSettings } from '@/components/blocks/settings/AlertSoundSettings';
import { Container, VStack } from '@/components/universal';

export default function NotificationsSettingsScreen() {
  const theme = useTheme();
  const { spacing } = useSpacing();

  const content = <AlertSoundSettings />;

  if (Platform.OS !== 'web') {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Notification Settings',
            headerStyle: {
              backgroundColor: theme.background,
            },
            headerTintColor: theme.foreground,
          }}
        />
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
          {content}
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Notification Settings',
          headerShown: false,
        }}
      />
      <Container>
        {content}
      </Container>
    </>
  );
}