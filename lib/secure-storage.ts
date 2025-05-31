import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Better Auth storage interface for web
export const webStorage = {
  getItem: (key: string) => {
    const item = localStorage.getItem(key);
    console.log(`[WEB STORAGE] Getting ${key}:`, item ? 'Found' : 'Not found');
    return item;
  },
  setItem: (key: string, value: string) => {
    console.log(`[WEB STORAGE] Setting ${key}:`, value ? 'Value set' : 'Empty value');
    localStorage.setItem(key, value);
  },
  removeItem: (key: string) => {
    console.log(`[WEB STORAGE] Removing ${key}`);
    localStorage.removeItem(key);
  },
};

// Better Auth storage interface for mobile (simplified for compatibility)
export const mobileStorage = {
  getItem: (key: string) => {
    try {
      // SecureStore only has async methods, so we'll use a temporary in-memory fallback
      // This is not ideal for production but allows Better Auth to work
      const memoryStore = (global as any).__secureStoreMemory || {};
      return memoryStore[key] || '';
    } catch (error) {
      console.warn('Failed to get item from secure storage:', error);
      return '';
    }
  },
  setItem: (key: string, value: string) => {
    try {
      // Store in memory for immediate access and async to SecureStore
      const memoryStore = (global as any).__secureStoreMemory || {};
      memoryStore[key] = value;
      (global as any).__secureStoreMemory = memoryStore;
      
      // Also store securely (async)
      SecureStore.setItemAsync(key, value).catch(console.error);
    } catch (error) {
      console.error('Failed to set item in secure storage:', error);
    }
  },
  removeItem: (key: string) => {
    try {
      // Remove from memory store
      const memoryStore = (global as any).__secureStoreMemory || {};
      delete memoryStore[key];
      (global as any).__secureStoreMemory = memoryStore;
      
      // Also remove from SecureStore (async)
      SecureStore.deleteItemAsync(key).catch(console.error);
    } catch (error) {
      console.error('Failed to remove item from secure storage:', error);
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