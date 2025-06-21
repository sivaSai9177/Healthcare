import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PlatformStorage } from '../../lib/core/platform-storage';
import { secureStorage, waitForStorageInit, initializeSecureStorage } from '../../lib/core/secure-storage';
import { Platform } from 'react-native';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  getAllKeys: jest.fn(),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
  multiRemove: jest.fn(),
}));

// Mock Platform
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: jest.fn((options) => options.ios || options.default),
  },
}));

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
}));

describe('PlatformStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset localStorage for web tests
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
  });

  describe('Mobile Platform (iOS/Android)', () => {
    beforeEach(() => {
      (Platform.OS as any) = 'ios';
      (Platform.select as jest.Mock).mockImplementation((options) => options.ios || options.default);
    });

    it('should get item from AsyncStorage on mobile', async () => {
      const mockValue = JSON.stringify({ test: 'value' });
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(mockValue);

      const result = await PlatformStorage.getItem('testKey');
      
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('testKey');
      expect(result).toEqual({ test: 'value' });
    });

    it('should set item in AsyncStorage on mobile', async () => {
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await PlatformStorage.setItem('testKey', { test: 'value' });
      
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('testKey', JSON.stringify({ test: 'value' }));
    });

    it('should remove item from AsyncStorage on mobile', async () => {
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);

      await PlatformStorage.removeItem('testKey');
      
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('testKey');
    });

    it('should clear AsyncStorage on mobile', async () => {
      (AsyncStorage.clear as jest.Mock).mockResolvedValue(undefined);

      await PlatformStorage.clear();
      
      expect(AsyncStorage.clear).toHaveBeenCalled();
    });

    it('should handle null values gracefully', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await PlatformStorage.getItem('nonExistentKey');
      
      expect(result).toBeNull();
    });

    it('should handle JSON parse errors', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('invalid json');

      const result = await PlatformStorage.getItem('testKey');
      
      expect(result).toBe('invalid json');
    });
  });

  describe('Web Platform', () => {
    beforeEach(() => {
      (Platform.OS as any) = 'web';
      (Platform.select as jest.Mock).mockImplementation((options) => options.web || options.default);
      
      // Mock localStorage
      const localStorageMock = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      };
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
        writable: true,
      });
    });

    it('should get item from localStorage on web', async () => {
      const mockValue = JSON.stringify({ test: 'value' });
      (window.localStorage.getItem as jest.Mock).mockReturnValue(mockValue);

      const result = await PlatformStorage.getItem('testKey');
      
      expect(window.localStorage.getItem).toHaveBeenCalledWith('testKey');
      expect(result).toEqual({ test: 'value' });
    });

    it('should set item in localStorage on web', async () => {
      await PlatformStorage.setItem('testKey', { test: 'value' });
      
      expect(window.localStorage.setItem).toHaveBeenCalledWith('testKey', JSON.stringify({ test: 'value' }));
    });

    it('should handle localStorage errors', async () => {
      (window.localStorage.setItem as jest.Mock).mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      await expect(PlatformStorage.setItem('testKey', { test: 'value' })).rejects.toThrow('QuotaExceededError');
    });
  });
});

describe('SecureStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Mobile Secure Storage', () => {
    beforeEach(() => {
      (Platform.OS as any) = 'ios';
    });

    it('should initialize secure storage on mobile', async () => {
      const SecureStore = require('expo-secure-store');
      
      await initializeSecureStorage();
      
      expect(SecureStore.isAvailableAsync).toHaveBeenCalled();
    });

    it('should wait for storage initialization', async () => {
      jest.useFakeTimers();
      
      // Simulate initialization after 100ms
      setTimeout(() => {
        // Mark storage as initialized
      }, 100);
      
      const waitPromise = waitForStorageInit();
      jest.advanceTimersByTime(150);
      
      await expect(waitPromise).resolves.toBeUndefined();
      
      jest.useRealTimers();
    });

    it('should get item from secure storage', async () => {
      const SecureStore = require('expo-secure-store');
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('testValue');

      const result = await secureStorage.getItem('testKey');
      
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('testKey');
      expect(result).toBe('testValue');
    });

    it('should set item in secure storage', async () => {
      const SecureStore = require('expo-secure-store');
      (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);

      await secureStorage.setItem('testKey', 'testValue');
      
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('testKey', 'testValue');
    });

    it('should remove item from secure storage', async () => {
      const SecureStore = require('expo-secure-store');
      (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValue(undefined);

      await secureStorage.removeItem('testKey');
      
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('testKey');
    });

    it('should handle secure storage errors gracefully', async () => {
      const SecureStore = require('expo-secure-store');
      (SecureStore.getItemAsync as jest.Mock).mockRejectedValue(new Error('Secure store error'));

      await expect(secureStorage.getItem('testKey')).rejects.toThrow('Secure store error');
    });
  });

  describe('Web Secure Storage', () => {
    beforeEach(() => {
      (Platform.OS as any) = 'web';
      
      // Mock localStorage for web
      const localStorageMock = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      };
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
        writable: true,
      });
    });

    it('should use localStorage on web', async () => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue('testValue');

      const result = await secureStorage.getItem('testKey');
      
      expect(window.localStorage.getItem).toHaveBeenCalledWith('secure_testKey');
      expect(result).toBe('testValue');
    });

    it('should prefix keys with secure_ on web', async () => {
      await secureStorage.setItem('testKey', 'testValue');
      
      expect(window.localStorage.setItem).toHaveBeenCalledWith('secure_testKey', 'testValue');
    });
  });
});

describe('Storage Edge Cases', () => {
  it('should handle storing complex objects', async () => {
    const complexObject = {
      id: '123',
      nested: {
        array: [1, 2, 3],
        date: new Date().toISOString(),
      },
      nullValue: null,
      undefinedValue: undefined,
    };

    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(complexObject));

    await PlatformStorage.setItem('complex', complexObject);
    const retrieved = await PlatformStorage.getItem('complex');
    
    expect(retrieved).toEqual(complexObject);
  });

  it('should handle concurrent operations', async () => {
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

    const operations = [
      PlatformStorage.setItem('key1', 'value1'),
      PlatformStorage.setItem('key2', 'value2'),
      PlatformStorage.setItem('key3', 'value3'),
    ];

    await Promise.all(operations);
    
    expect(AsyncStorage.setItem).toHaveBeenCalledTimes(3);
  });

  it('should handle storage quota errors', async () => {
    const largeData = 'x'.repeat(10 * 1024 * 1024); // 10MB string
    
    (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Storage quota exceeded'));

    await expect(PlatformStorage.setItem('large', largeData)).rejects.toThrow('Storage quota exceeded');
  });
});