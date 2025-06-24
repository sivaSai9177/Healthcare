import { Stack } from 'expo-router';

export default function ShiftsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Shifts',
        }} 
      />
      <Stack.Screen 
        name="handover" 
        options={{ 
          title: 'Shift Handover',
          presentation: 'modal',
        }} 
      />
      <Stack.Screen 
        name="schedule" 
        options={{ 
          title: 'Shift Schedule',
        }} 
      />
      <Stack.Screen 
        name="reports" 
        options={{ 
          title: 'Shift Reports',
        }} 
      />
    </Stack>
  );
}