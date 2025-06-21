import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  webStorage,
  mobileStorage,
  secureStorage,
  waitForStorageInit,
  initializeSecureStorage,
} from '@/lib/core/secure-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage');

describe('secure-storage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear any storage state
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
  });

  describe('webStorage', () => {
    it('stores and retrieves data from localStorage', () => {
      // Mock web platform
      Platform.OS = 'web';
      
      webStorage.setItem('test-key', 'test-value');
      expect(webStorage.getItem('test-key')).toBe('test-value');
    });

    it('removes items from localStorage', () => {
      Platform.OS = 'web';
      
      webStorage.setItem('test-key', 'test-value');
      webStorage.removeItem('test-key');
      expect(webStorage.getItem('test-key')).toBeNull();
    });

    it('clears all items from localStorage', () => {
      Platform.OS = 'web';
      
      webStorage.setItem('key1', 'value1');
      webStorage.setItem('key2', 'value2');
      webStorage.clear();
      
      expect(webStorage.getItem('key1')).toBeNull();
      expect(webStorage.getItem('key2')).toBeNull();
    });
  });

  describe('mobileStorage', () => {
    beforeEach(() => {
      Platform.OS = 'ios';
    });

    it('stores and retrieves data from memory store', () => {
      mobileStorage.setItem('test-key', 'test-value');
      expect(mobileStorage.getItem('test-key')).toBe('test-value');
    });

    it('removes items from memory store', () => {
      mobileStorage.setItem('test-key', 'test-value');
      mobileStorage.removeItem('test-key');
      expect(mobileStorage.getItem('test-key')).toBeNull();
    });

    it('clears all items from memory store', () => {
      mobileStorage.setItem('key1', 'value1');
      mobileStorage.setItem('key2', 'value2');
      mobileStorage.clear();
      
      expect(mobileStorage.getItem('key1')).toBeNull();
      expect(mobileStorage.getItem('key2')).toBeNull();
    });
  });

  describe('secureStorage', () => {
    describe('on web platform', () => {
      beforeEach(() => {
        Platform.OS = 'web';
      });

      it('uses localStorage for web platform', async () => {
        await secureStorage.setItem('test-key', 'test-value');
        const value = await secureStorage.getItem('test-key');
        expect(value).toBe('test-value');
      });

      it('provides sync methods on web', () => {
        secureStorage.setItemSync('test-key', 'test-value');
        const value = secureStorage.getItemSync('test-key');
        expect(value).toBe('test-value');
      });

      it('deletes items on web', async () => {
        await secureStorage.setItem('test-key', 'test-value');
        await secureStorage.deleteItem('test-key');
        const value = await secureStorage.getItem('test-key');
        expect(value).toBeNull();
      });
    });

    describe('on mobile platform', () => {
      beforeEach(() => {
        Platform.OS = 'ios';
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('test-value');
        (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
        (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
      });

      it('uses AsyncStorage for mobile platform', async () => {
        await secureStorage.setItem('test-key', 'test-value');
        expect(AsyncStorage.setItem).toHaveBeenCalledWith('test-key', 'test-value');
        
        const value = await secureStorage.getItem('test-key');
        expect(AsyncStorage.getItem).toHaveBeenCalledWith('test-key');
        expect(value).toBe('test-value');
      });

      it('provides sync methods on mobile using memory store', () => {
        secureStorage.setItemSync('test-key', 'test-value');
        const value = secureStorage.getItemSync('test-key');
        expect(value).toBe('test-value');
      });

      it('deletes items on mobile', async () => {
        await secureStorage.deleteItem('test-key');
        expect(AsyncStorage.removeItem).toHaveBeenCalledWith('test-key');
      });

      it('handles AsyncStorage errors gracefully', async () => {
        const error = new Error('AsyncStorage error');
        (AsyncStorage.getItem as jest.Mock).mockRejectedValue(error);
        
        const value = await secureStorage.getItem('test-key');
        expect(value).toBeNull();
      });
    });
  });

  describe('waitForStorageInit', () => {
    it('resolves immediately on web', async () => {
      Platform.OS = 'web';
      const start = Date.now();
      await waitForStorageInit();
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(10); // Should be instant
    });

    it('waits for initialization on mobile', async () => {
      Platform.OS = 'ios';
      await waitForStorageInit();
      // Should complete without error
    });
  });

  describe('initializeSecureStorage', () => {
    it('does nothing on web', async () => {
      Platform.OS = 'web';
      await initializeSecureStorage();
      // Should complete without error
    });

    it('loads data from AsyncStorage on mobile', async () => {
      Platform.OS = 'ios';
      const mockData = [
        ['key1', 'value1'],
        ['key2', 'value2'],
      ];
      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue(['key1', 'key2']);
      (AsyncStorage.multiGet as jest.Mock).mockResolvedValue(mockData);
      
      await initializeSecureStorage();
      
      expect(AsyncStorage.getAllKeys).toHaveBeenCalled();
      expect(AsyncStorage.multiGet).toHaveBeenCalledWith(['key1', 'key2']);
      
      // Check that data was loaded into memory store
      expect(mobileStorage.getItem('key1')).toBe('value1');
      expect(mobileStorage.getItem('key2')).toBe('value2');
    });

    it('handles initialization errors gracefully', async () => {
      Platform.OS = 'ios';
      (AsyncStorage.getAllKeys as jest.Mock).mockRejectedValue(new Error('Init error'));
      
      // Should not throw
      await expect(initializeSecureStorage()).resolves.toBeUndefined();
    });
  });
});