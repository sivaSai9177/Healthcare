import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import Constants from 'expo-constants';
import { logger } from '@/lib/core/debug/server-logger';

interface DeviceFingerprint {
  id: string;
  platform: string;
  deviceType: string;
  osVersion: string;
  brand?: string;
  model?: string;
  appVersion: string;
  buildVersion?: string;
  browserInfo?: string;
  screenResolution?: string;
  timezone: string;
  language: string;
}

class DeviceFingerprintManager {
  private cachedFingerprint: DeviceFingerprint | null = null;
  
  /**
   * Generate a unique device fingerprint
   */
  async generateFingerprint(): Promise<DeviceFingerprint> {
    if (this.cachedFingerprint) {
      return this.cachedFingerprint;
    }
    
    try {
      const fingerprint = await this.collectDeviceInfo();
      this.cachedFingerprint = fingerprint;
      
      logger.auth.debug('Device fingerprint generated', {
        fingerprintId: fingerprint.id,
        platform: fingerprint.platform
      });
      
      return fingerprint;
    } catch (error) {
      logger.auth.error('Failed to generate device fingerprint', {
        error: error?.message || error
      });
      
      // Return a basic fingerprint on error
      return this.getFallbackFingerprint();
    }
  }
  
  /**
   * Collect device information for fingerprinting
   */
  private async collectDeviceInfo(): Promise<DeviceFingerprint> {
    const baseInfo = {
      platform: Platform.OS,
      osVersion: Platform.Version ? Platform.Version.toString() : 'unknown',
      appVersion: Constants.manifest?.version || 'unknown',
      buildVersion: Constants.manifest?.ios?.buildNumber || Constants.manifest?.android?.versionCode?.toString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: Platform.OS === 'web' 
        ? navigator.language 
        : Constants.systemFonts?.[0] || 'en-US',
    };
    
    if (Platform.OS === 'web') {
      return {
        ...baseInfo,
        id: await this.generateWebFingerprint(),
        deviceType: 'web',
        browserInfo: navigator.userAgent,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
      };
    }
    
    // Mobile platforms
    const deviceInfo = {
      ...baseInfo,
      deviceType: Device.deviceType?.toString() || 'unknown',
      brand: Device.brand || undefined,
      model: Device.modelName || undefined,
    };
    
    // Generate unique ID based on platform
    let uniqueId: string;
    
    if (Platform.OS === 'ios') {
      // iOS: Use vendor ID (consistent for apps from same vendor)
      uniqueId = await Application.getIosIdForVendorAsync() || this.generateRandomId();
    } else if (Platform.OS === 'android') {
      // Android: Use Android ID (reset on factory reset)
      uniqueId = Application.androidId || this.generateRandomId();
    } else {
      uniqueId = this.generateRandomId();
    }
    
    return {
      ...deviceInfo,
      id: uniqueId,
    };
  }
  
  /**
   * Generate fingerprint for web browsers
   */
  private async generateWebFingerprint(): Promise<string> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      return this.generateRandomId();
    }
    
    // Canvas fingerprinting
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('Device Fingerprint', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('Device Fingerprint', 4, 17);
    
    const canvasData = canvas.toDataURL();
    
    // Combine with other browser properties
    const fingerPrintData = [
      canvasData,
      navigator.userAgent,
      navigator.language,
      screen.colorDepth,
      screen.width,
      screen.height,
      new Date().getTimezoneOffset(),
      navigator.hardwareConcurrency || 0,
      navigator.maxTouchPoints || 0,
    ].join('|');
    
    // Hash the fingerprint data
    return this.hashString(fingerPrintData);
  }
  
  /**
   * Simple hash function for fingerprint data
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
  
  /**
   * Generate a random device ID as fallback
   */
  private generateRandomId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  
  /**
   * Get fallback fingerprint when device info collection fails
   */
  private getFallbackFingerprint(): DeviceFingerprint {
    return {
      id: this.generateRandomId(),
      platform: Platform.OS,
      deviceType: 'unknown',
      osVersion: Platform.Version ? Platform.Version.toString() : 'unknown',
      appVersion: 'unknown',
      timezone: 'UTC',
      language: 'en-US',
    };
  }
  
  /**
   * Verify if the current device matches a stored fingerprint
   */
  async verifyFingerprint(storedFingerprint: Partial<DeviceFingerprint>): Promise<boolean> {
    const currentFingerprint = await this.generateFingerprint();
    
    // Check critical fields that should match
    const criticalFieldsMatch = 
      currentFingerprint.platform === storedFingerprint.platform &&
      currentFingerprint.deviceType === storedFingerprint.deviceType;
    
    if (!criticalFieldsMatch) {
      logger.auth.warn('Device fingerprint mismatch - critical fields', {
        current: {
          platform: currentFingerprint.platform,
          deviceType: currentFingerprint.deviceType,
        },
        stored: {
          platform: storedFingerprint.platform,
          deviceType: storedFingerprint.deviceType,
        }
      });
      return false;
    }
    
    // For mobile, check device ID
    if (Platform.OS !== 'web' && currentFingerprint.id !== storedFingerprint.id) {
      logger.auth.warn('Device fingerprint mismatch - device ID', {
        currentId: currentFingerprint.id.substring(0, 8) + '...',
        storedId: storedFingerprint.id?.substring(0, 8) + '...',
      });
      return false;
    }
    
    // For web, be more lenient as browser fingerprints can change
    if (Platform.OS === 'web') {
      // Just check platform and resolution
      return currentFingerprint.screenResolution === storedFingerprint.screenResolution;
    }
    
    return true;
  }
  
  /**
   * Clear cached fingerprint
   */
  clearCache() {
    this.cachedFingerprint = null;
  }
}

export const deviceFingerprintManager = new DeviceFingerprintManager();
export type { DeviceFingerprint };