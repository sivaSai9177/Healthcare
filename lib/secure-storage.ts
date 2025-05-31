import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Better Auth storage interface for web
export const webStorage = {
  getItem: (key: string) => {
    try {
      const item = localStorage.getItem(key);
      console.log(`[WEB STORAGE] Getting ${key}:`, item ? `Found: ${item.substring(0, 20)}...` : 'Not found');
      return item;
    } catch (error) {
      console.error('[WEB STORAGE] Error getting item:', error);
      return null;
    }
  },
  setItem: (key: string, value: string) => {
    try {
      console.log(`[WEB STORAGE] Setting ${key}:`, value ? `Value: ${value.substring(0, 20)}...` : 'Empty value');
      localStorage.setItem(key, value);
      
      // Verify the item was set correctly
      const stored = localStorage.getItem(key);
      if (stored !== value) {
        console.warn(`[WEB STORAGE] Storage verification failed for ${key}`);
      } else {
        console.log(`[WEB STORAGE] Successfully stored ${key}`);
      }
    } catch (error) {
      console.error('[WEB STORAGE] Error setting item:', error);
    }
  },
  removeItem: (key: string) => {
    try {
      console.log(`[WEB STORAGE] Removing ${key}`);
      localStorage.removeItem(key);
    } catch (error) {
      console.error('[WEB STORAGE] Error removing item:', error);
    }
  },
};

// Initialize storage by loading session data from SecureStore
let storageInitialized = false;
const initializeStorage = async () => {
  if (storageInitialized) return;
  
  try {
    console.log('[MOBILE STORAGE] Initializing storage...');
    
    // Initialize the persistent store
    if (!(global as any).__persistentStore) {
      (global as any).__persistentStore = {};
    }
    
    // Load all hospital-alert related keys from SecureStore
    const keys = ['hospital-alert.session-token', 'hospital-alert.cached-user'];
    const loadPromises = keys.map(async (key) => {
      try {
        const value = await SecureStore.getItemAsync(key);
        if (value) {
          (global as any).__persistentStore[key] = value;
          console.log(`[MOBILE STORAGE] Loaded ${key} from SecureStore`);
        }
      } catch (error) {
        console.error(`[MOBILE STORAGE] Failed to load ${key}:`, error);
      }
    });
    
    await Promise.all(loadPromises);
    storageInitialized = true;
    console.log('[MOBILE STORAGE] Storage initialization complete');
  } catch (error) {
    console.error('[MOBILE STORAGE] Storage initialization failed:', error);
  }
};

// Initialize storage immediately
if (Platform.OS !== 'web') {
  initializeStorage();
}

// Better Auth storage interface for mobile with persistent storage
export const mobileStorage = {
  getItem: (key: string) => {
    try {
      console.log(`[MOBILE STORAGE] Getting ${key}`);
      
      // Ensure storage is initialized
      if (!storageInitialized) {
        initializeStorage(); // Start initialization if not done
      }
      
      const persistentStore = (global as any).__persistentStore || {};
      const value = persistentStore[key] || '';
      console.log(`[MOBILE STORAGE] Retrieved ${key}:`, value ? 'Found' : 'Not found');
      return value;
    } catch (error) {
      console.error('[MOBILE STORAGE] Error getting item:', error);
      return '';
    }
  },
  setItem: (key: string, value: string) => {
    try {
      console.log(`[MOBILE STORAGE] Setting ${key}:`, value ? 'Value set' : 'Empty value');
      
      // Initialize persistent storage if it doesn't exist
      if (!(global as any).__persistentStore) {
        (global as any).__persistentStore = {};
      }
      
      // Store in persistent memory store immediately
      const persistentStore = (global as any).__persistentStore;
      persistentStore[key] = value;
      
      // Also store in SecureStore asynchronously for actual persistence
      SecureStore.setItemAsync(key, value).then(() => {
        console.log(`[MOBILE STORAGE] Successfully stored ${key} in SecureStore`);
      }).catch(error => {
        console.error(`[MOBILE STORAGE] Failed to store ${key} in SecureStore:`, error);
      });
    } catch (error) {
      console.error('[MOBILE STORAGE] Error setting item:', error);
    }
  },
  removeItem: (key: string) => {
    try {
      console.log(`[MOBILE STORAGE] Removing ${key}`);
      
      // Remove from persistent memory store
      if ((global as any).__persistentStore) {
        delete (global as any).__persistentStore[key];
      }
      
      // Also remove from SecureStore asynchronously
      SecureStore.deleteItemAsync(key).then(() => {
        console.log(`[MOBILE STORAGE] Successfully removed ${key} from SecureStore`);
      }).catch(error => {
        console.error(`[MOBILE STORAGE] Failed to remove ${key} from SecureStore:`, error);
      });
    } catch (error) {
      console.error('[MOBILE STORAGE] Error removing item:', error);
    }
  },
};

// Cross-platform secure storage wrapper
export const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      // Use localStorage for web
      return localStorage.getItem(key);
    }
    // Use SecureStore for mobile
    return await SecureStore.getItemAsync(key);
  },

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      // Use localStorage for web
      localStorage.setItem(key, value);
    } else {
      // Use SecureStore for mobile
      await SecureStore.setItemAsync(key, value);
    }
  },

  async deleteItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      // Use localStorage for web
      localStorage.removeItem(key);
    } else {
      // Use SecureStore for mobile
      await SecureStore.deleteItemAsync(key);
    }
  },

  // Synchronous methods for Better Auth
  getItemSync(key: string): string | null {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    // SecureStore doesn't have sync methods, so we'll return null
    // This is a limitation on mobile - need to use async storage
    console.warn('Sync storage not available on mobile, use async methods');
    return null;
  },

  setItemSync(key: string, value: string): void {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
    } else {
      console.warn('Sync storage not available on mobile, use async methods');
    }
  },

  deleteItemSync(key: string): void {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
    } else {
      console.warn('Sync storage not available on mobile, use async methods');
    }
  }
};