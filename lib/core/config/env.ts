/**
 * Environment Configuration
 * Enhanced environment detection with dynamic API resolution
 */

import { Platform } from 'react-native';
import { getCurrentEnvironment, isDebugEnabled as isDebug, isEASBuild } from './env-config';
import { log } from '../debug/logger';
import { isInTunnelMode, getApiUrlForTunnel } from './tunnel';
import { getNetworkApiUrl } from './network';

// Import unified functions
import { 
  getApiUrl as getUnifiedApiUrl,
  getAuthUrl as getUnifiedAuthUrl,
  getAuthBaseUrl as getUnifiedAuthBaseUrl,
  isOAuthSafe,
  getDatabaseUrl,
  logEnvironment as logUnifiedEnvironment
} from './unified-env';

// Cache for API URL to avoid repeated resolution
let cachedApiUrl: string | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 60000; // 1 minute

export const getEnvironment = () => {
  return {
    platform: Platform.OS,
    isDevelopment: getCurrentEnvironment() !== 'production',
    isDebugMode: isDebug(),
    apiUrl: getApiUrlSync(),
    environment: getCurrentEnvironment(),
    isEASBuild: isEASBuild(),
  };
};

/**
 * Get API URL with intelligent fallback (async version)
 * This is the preferred method for getting the API URL
 */
export const getApiUrl = async (forceRefresh = false): Promise<string> => {
  try {
    // Check cache first
    if (!forceRefresh && cachedApiUrl && (Date.now() - cacheTimestamp) < CACHE_DURATION) {
      return cachedApiUrl;
    }

    // Resolve API URL with fallback
    let url: string;
    
    // Check if we're in tunnel mode
    if (isInTunnelMode()) {
      const baseUrl = Platform.OS === "web" && typeof window !== 'undefined' 
        ? window.location.origin 
        : (process.env.EXPO_PUBLIC_API_URL || "http://localhost:8081");
      url = getApiUrlForTunnel(baseUrl);
    } else {
      // Try network detection first
      url = await getNetworkApiUrl();
    }
    
    // Update cache
    cachedApiUrl = url;
    cacheTimestamp = Date.now();
    
    log.debug('API URL resolved', 'ENV', { url, cached: !forceRefresh });
    return url;
  } catch (error) {
    log.error('Failed to resolve API URL', 'ENV', error as Error);
    
    // Fallback to sync method
    return getApiUrlSync();
  }
};

/**
 * Get API URL synchronously (for backward compatibility)
 * Prefer getApiUrl() when possible
 */
export function getApiUrlSync(): string {
  // Use cached value if available and fresh
  if (cachedApiUrl && (Date.now() - cacheTimestamp) < CACHE_DURATION) {
    return cachedApiUrl;
  }

  // Check if we're in tunnel mode first
  if (isInTunnelMode()) {
    const baseUrl = Platform.OS === "web" && typeof window !== 'undefined' 
      ? window.location.origin 
      : (process.env.EXPO_PUBLIC_API_URL || "http://localhost:8081");
    return getApiUrlForTunnel(baseUrl);
  }

  // For web, use the same origin to avoid CORS cookie issues
  if (Platform.OS === "web") {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return process.env.EXPO_PUBLIC_API_URL || "http://localhost:8081";
  }

  // For mobile development, try environment variable first
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Android emulator special case
  if (Platform.OS === 'android' && __DEV__) {
    return "http://10.0.2.2:8081";
  }

  // Default fallback
  return "http://localhost:8081";
}

export const isDevelopment = getCurrentEnvironment() !== 'production' && getCurrentEnvironment() !== 'staging';
export const isProduction = getCurrentEnvironment() === 'production';
export const isDebugMode = isDebug();

export const env = {
  getEnvironment,
  getApiUrl,
  getApiUrlSync,
  isDevelopment,
  isProduction,
  isDebugMode,
  getCurrentEnvironment,
  isEASBuild,
  // Unified functions
  getUnifiedApiUrl,
  getUnifiedAuthUrl,
  getUnifiedAuthBaseUrl,
  isOAuthSafe,
  getDatabaseUrl,
  logUnifiedEnvironment,
};

export default env;