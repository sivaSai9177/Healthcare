import { Stack } from 'expo-router';

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Settings',
        }} 
      />
      <Stack.Screen 
        name="members" 
        options={{ 
          title: 'Team Members',
          presentation: 'card',
        }} 
      />
      <Stack.Screen 
        name="invitations" 
        options={{ 
          title: 'Invitations',
          presentation: 'card',
        }} 
      />
    </Stack>
  );
}