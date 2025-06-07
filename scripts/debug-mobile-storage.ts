import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export async function debugMobileStorage() {
  if (Platform.OS === 'web') {
    console.log('[DEBUG] This script is for mobile only');
    return;
  }

  console.log('[DEBUG] Checking all SecureStore keys...');
  
  const keysToCheck = [
    'better-auth_cookie',
    'better-auth_session-token',
    'better-auth_session_data',
    'better-auth_user_data',
    'better-auth.cookie',
    'better-auth.session-token',
    'better-auth.session_data',
    'better-auth.user_data',
  ];

  for (const key of keysToCheck) {
    try {
      const value = await SecureStore.getItemAsync(key);
      if (value) {
        console.log(`[DEBUG] ${key}:`);
        console.log(`  Raw value: ${value}`);
        console.log(`  Length: ${value.length}`);
        console.log(`  First 100 chars: ${value.substring(0, 100)}...`);
        
        // Try to parse as JSON
        try {
          const parsed = JSON.parse(value);
          console.log(`  Parsed as JSON:`, parsed);
        } catch {
          console.log(`  Not valid JSON`);
        }
      } else {
        console.log(`[DEBUG] ${key}: <empty>`);
      }
    } catch (error) {
      console.log(`[DEBUG] ${key}: Error reading - ${error.message}`);
    }
  }
  
  // Also check the global persistent store
  const persistentStore = (global as any).__persistentStore;
  if (persistentStore) {
    console.log('\n[DEBUG] Global persistent store:');
    Object.keys(persistentStore).forEach(key => {
      const value = persistentStore[key];
      console.log(`  ${key}: ${value ? value.substring(0, 50) + '...' : '<empty>'}`);
    });
  } else {
    console.log('\n[DEBUG] No global persistent store found');
  }
}

// Run if called directly
if (require.main === module) {
  debugMobileStorage();
}