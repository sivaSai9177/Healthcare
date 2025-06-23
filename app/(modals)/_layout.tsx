import { Stack } from 'expo-router';
import { Platform, View, Text } from 'react-native';
import { useTheme } from '@/lib/theme/provider';
import { stackScreenOptions } from '@/lib/navigation/transitions';
import { BlurView } from 'expo-blur';

export default function ModalsLayout() {
  const theme = useTheme();

  return (
    <Stack
      screenOptions={{
        ...stackScreenOptions.modal,
        headerShown: true,
        headerStyle: Platform.select({
          ios: {
            backgroundColor: theme.card + 'CC', // Semi-transparent for blur effect
          },
          default: {
            backgroundColor: theme.card,
          },
        }),
        headerTintColor: theme.foreground,
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerShadowVisible: Platform.OS !== 'ios', // iOS uses blur instead of shadow
        headerTransparent: Platform.OS === 'ios',
        headerBackground: Platform.OS === 'ios' ? () => (
          <BlurView 
            intensity={80} 
            tint={theme.isDark ? 'dark' : 'light'}
            style={{ flex: 1 }}
          />
        ) : undefined,
        contentStyle: {
          backgroundColor: theme.muted, // Better for glass theme
        },
        // iOS floating header style
        ...(Platform.OS === 'ios' && {
          headerLargeTitle: false,
          headerBlurEffect: theme.isDark ? 'dark' : 'light',
        }),
      }}
    >
      <Stack.Screen
        name="create-alert"
        options={{
          presentation: 'modal',
          headerTitleAlign: 'center',
          headerRight: () => null,
          headerTitle: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 32 }}>🚨</Text>
              <Text style={{ 
                fontSize: 19, 
                fontWeight: '600',
                color: theme.foreground
              }}>
                Create Emergency Alert
              </Text>
            </View>
          ),
        }}
      />
      <Stack.Screen
        name="patient-details"
        options={{
          presentation: 'modal',
          title: 'Patient Details',
        }}
      />
      <Stack.Screen
        name="member-details"
        options={{
          title: 'Member Details',
        }}
      />
      <Stack.Screen
        name="profile-edit"
        options={{
          title: 'Edit Profile',
          headerLeft: () => null,
        }}
      />
      <Stack.Screen
        name="notification-center"
        options={{
          title: 'Notifications',
        }}
      />
      <Stack.Screen
        name="search"
        options={{
          title: 'Search',
          animation: 'fade', // Quick fade for search
          animationDuration: 200,
        }}
      />
      <Stack.Screen
        name="alert-details"
        options={{
          title: 'Alert Details',
        }}
      />
      <Stack.Screen
        name="acknowledge-alert"
        options={{
          title: 'Acknowledge Alert',
          headerLeft: () => null, // Prevent back, use cancel button
        }}
      />
      <Stack.Screen
        name="escalation-details"
        options={{
          title: 'Escalation Details',
        }}
      />
      <Stack.Screen
        name="shift-management"
        options={{
          presentation: 'modal',
          headerTitleAlign: 'center',
          headerRight: () => null,
          headerTitle: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 32 }}>⏰</Text>
              <Text style={{ 
                fontSize: 19, 
                fontWeight: '600',
                color: theme.foreground
              }}>
                Shift Management
              </Text>
            </View>
          ),
        }}
      />
      <Stack.Screen
        name="register-patient"
        options={{
          presentation: 'modal',
          headerTitleAlign: 'center',
          headerRight: () => null,
          headerTitle: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 32 }}>🏥</Text>
              <Text style={{ 
                fontSize: 19, 
                fontWeight: '600',
                color: theme.foreground
              }}>
                Register Patient
              </Text>
            </View>
          ),
        }}
      />
    </Stack>
  );
}