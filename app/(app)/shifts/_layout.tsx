import { Stack } from 'expo-router';

export default function ShiftsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
      }}
    >
      <Stack.Screen 
        name="handover" 
        options={{ 
          title: 'Shift Handover',
          presentation: 'modal',
        }} 
      />
    </Stack>
  );
}