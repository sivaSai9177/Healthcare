import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { logger } from '@/lib/core/debug/unified-logger';

/**
 * Cross-platform draft storage utility
 * Uses AsyncStorage for native platforms (iOS, Android)
 * Uses localStorage for web
 * 
 * Note: This is specifically for non-sensitive draft data only
 */

export interface DraftData<T = any> {
  data: T;
  timestamp: number;
  version: number;
}

const DRAFT_VERSION = 1;
const DRAFT_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

class DraftStorage {
  private readonly isWeb = Platform.OS === 'web';

  /**
   * Save draft data with timestamp
   */
  async saveDraft<T>(key: string, data: T): Promise<void> {
    try {
      const draft: DraftData<T> = {
        data,
        timestamp: Date.now(),
        version: DRAFT_VERSION,
      };

      const serialized = JSON.stringify(draft);

      if (this.isWeb) {
        // Web platform - use localStorage
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(`draft:${key}`, serialized);
          logger.system.debug('Draft saved to localStorage', { key });
        }
      } else {
        // Native platforms - use AsyncStorage
        await AsyncStorage.setItem(`draft:${key}`, serialized);
        logger.system.debug('Draft saved to AsyncStorage', { key });
      }
    } catch (error) {
      logger.system.error('Failed to save draft', { 
        key, 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      // Don't throw - draft saving should not break the app
    }
  }

  /**
   * Load draft data if not expired
   */
  async loadDraft<T>(key: string): Promise<T | null> {
    try {
      let serialized: string | null = null;

      if (this.isWeb) {
        // Web platform - use localStorage
        if (typeof window !== 'undefined' && window.localStorage) {
          serialized = window.localStorage.getItem(`draft:${key}`);
        }
      } else {
        // Native platforms - use AsyncStorage
        serialized = await AsyncStorage.getItem(`draft:${key}`);
      }

      if (!serialized) {
        return null;
      }

      const draft: DraftData<T> = JSON.parse(serialized);

      // Check version compatibility
      if (draft.version !== DRAFT_VERSION) {
        logger.system.warn('Draft version mismatch, discarding', { 
          key, 
          draftVersion: draft.version, 
          currentVersion: DRAFT_VERSION 
        });
        await this.removeDraft(key);
        return null;
      }

      // Check if draft is expired
      const age = Date.now() - draft.timestamp;
      if (age > DRAFT_EXPIRY_MS) {
        logger.system.debug('Draft expired, discarding', { key, ageHours: age / (1000 * 60 * 60) });
        await this.removeDraft(key);
        return null;
      }

      logger.system.debug('Draft loaded successfully', { key, ageMinutes: age / (1000 * 60) });
      return draft.data;
    } catch (error) {
      logger.system.error('Failed to load draft', { 
        key, 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      // If draft is corrupted, remove it
      await this.removeDraft(key);
      return null;
    }
  }

  /**
   * Remove draft data
   */
  async removeDraft(key: string): Promise<void> {
    try {
      if (this.isWeb) {
        // Web platform - use localStorage
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(`draft:${key}`);
          logger.system.debug('Draft removed from localStorage', { key });
        }
      } else {
        // Native platforms - use AsyncStorage
        await AsyncStorage.removeItem(`draft:${key}`);
        logger.system.debug('Draft removed from AsyncStorage', { key });
      }
    } catch (error) {
      logger.system.error('Failed to remove draft', { 
        key, 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      // Don't throw - draft removal should not break the app
    }
  }

  /**
   * Clear all drafts (useful for logout)
   */
  async clearAllDrafts(): Promise<void> {
    try {
      if (this.isWeb) {
        // Web platform - use localStorage
        if (typeof window !== 'undefined' && window.localStorage) {
          const keys = Object.keys(window.localStorage);
          keys.forEach(key => {
            if (key.startsWith('draft:')) {
              window.localStorage.removeItem(key);
            }
          });
          logger.system.info('All drafts cleared from localStorage');
        }
      } else {
        // Native platforms - use AsyncStorage
        const keys = await AsyncStorage.getAllKeys();
        const draftKeys = keys.filter(key => key.startsWith('draft:'));
        if (draftKeys.length > 0) {
          await AsyncStorage.multiRemove(draftKeys);
          logger.system.info('All drafts cleared from AsyncStorage', { count: draftKeys.length });
        }
      }
    } catch (error) {
      logger.system.error('Failed to clear all drafts', { 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  }

  /**
   * Get draft age in minutes
   */
  async getDraftAge(key: string): Promise<number | null> {
    try {
      let serialized: string | null = null;

      if (this.isWeb) {
        if (typeof window !== 'undefined' && window.localStorage) {
          serialized = window.localStorage.getItem(`draft:${key}`);
        }
      } else {
        serialized = await AsyncStorage.getItem(`draft:${key}`);
      }

      if (!serialized) {
        return null;
      }

      const draft: DraftData = JSON.parse(serialized);
      const ageMs = Date.now() - draft.timestamp;
      return Math.floor(ageMs / (1000 * 60)); // Return age in minutes
    } catch (error) {
      return null;
    }
  }
}

// Export singleton instance
export const draftStorage = new DraftStorage();