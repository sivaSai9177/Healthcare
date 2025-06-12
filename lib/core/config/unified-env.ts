/**
 * Unified Environment Configuration
 * Handles all environment scenarios: local, network, tunnel, OAuth
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';

export type EnvironmentMode = 'local' | 'network' | 'tunnel' | 'production';

interface EnvConfig {
  apiUrl: string;
  authUrl: string;
  authBaseUrl: string;
  databaseUrl: string;
  mode: EnvironmentMode;
  isOAuthSafe: boolean;
  wsUrl: string;
  wsEnabled: boolean;
  wsPort: number;
}

/**
 * Generate WebSocket URL from HTTP URL
 */
function generateWebSocketUrl(httpUrl: string): string {
  const wsPort = parseInt(process.env.EXPO_PUBLIC_WS_PORT || '3001', 10);
  return httpUrl
    .replace(/^http:/, 'ws:')
    .replace(/^https:/, 'wss:')
    .replace(/:8081/, `:${wsPort}`);
}

/**
 * Detect current environment mode
 */
function detectEnvironmentMode(): EnvironmentMode {
  // Check if we're in tunnel mode
  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    if (hostname.includes('.exp.direct') || hostname.includes('.exp.host')) {
      return 'tunnel';
    }
  }
  
  // Check environment variables
  const appEnv = process.env.APP_ENV;
  if (appEnv === 'production' || process.env.NODE_ENV === 'production') {
    return 'production';
  }
  
  // Check if explicitly set to local
  if (appEnv === 'local' || process.env.EXPO_PUBLIC_API_URL?.includes('localhost')) {
    return 'local';
  }
  
  // Default to network mode for development
  return 'network';
}

/**
 * Get unified environment configuration
 */
export function getUnifiedEnvConfig(): EnvConfig {
  const mode = detectEnvironmentMode();
  
  switch (mode) {
    case 'local':
      const localUrl = 'http://localhost:8081';
      return {
        apiUrl: localUrl,
        authUrl: localUrl,
        authBaseUrl: `${localUrl}/api/auth`,
        databaseUrl: process.env.LOCAL_DATABASE_URL || 'postgresql://myexpo:myexpo123@localhost:5432/myexpo_dev',
        mode: 'local',
        isOAuthSafe: true, // localhost is OAuth-safe
        wsUrl: generateWebSocketUrl(localUrl),
        wsEnabled: process.env.EXPO_PUBLIC_ENABLE_WS === 'true',
        wsPort: parseInt(process.env.EXPO_PUBLIC_WS_PORT || '3001', 10),
      };
      
    case 'tunnel':
      const tunnelUrl = getTunnelUrl();
      return {
        apiUrl: tunnelUrl,
        authUrl: tunnelUrl,
        authBaseUrl: `${tunnelUrl}/api/auth`,
        databaseUrl: process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || '',
        mode: 'tunnel',
        isOAuthSafe: true, // Public URLs are OAuth-safe
        wsUrl: generateWebSocketUrl(tunnelUrl),
        wsEnabled: process.env.EXPO_PUBLIC_ENABLE_WS === 'true',
        wsPort: parseInt(process.env.EXPO_PUBLIC_WS_PORT || '3001', 10),
      };
      
    case 'production':
      const prodUrl = process.env.EXPO_PUBLIC_API_URL_PRODUCTION || 'https://api.myapp.com';
      return {
        apiUrl: prodUrl,
        authUrl: prodUrl,
        authBaseUrl: `${prodUrl}/api/auth`,
        databaseUrl: process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || '',
        mode: 'production',
        isOAuthSafe: true, // Production URLs are OAuth-safe
        wsUrl: generateWebSocketUrl(prodUrl),
        wsEnabled: process.env.EXPO_PUBLIC_ENABLE_WS === 'true',
        wsPort: parseInt(process.env.EXPO_PUBLIC_WS_PORT || '3001', 10),
      };
      
    case 'network':
    default:
      // Network mode - detect best URL
      const networkUrl = getNetworkUrl();
      const isPrivateIP = networkUrl.includes('192.168') || networkUrl.includes('10.0');
      
      return {
        apiUrl: networkUrl,
        authUrl: isPrivateIP ? 'http://localhost:8081' : networkUrl, // Use localhost for auth if private IP
        authBaseUrl: isPrivateIP ? 'http://localhost:8081/api/auth' : `${networkUrl}/api/auth`,
        databaseUrl: process.env.DATABASE_URL || process.env.LOCAL_DATABASE_URL || '',
        mode: 'network',
        isOAuthSafe: !isPrivateIP, // Private IPs are not OAuth-safe
        wsUrl: generateWebSocketUrl(networkUrl),
        wsEnabled: process.env.EXPO_PUBLIC_ENABLE_WS === 'true',
        wsPort: parseInt(process.env.EXPO_PUBLIC_WS_PORT || '3001', 10),
      };
  }
}

/**
 * Get tunnel URL
 */
function getTunnelUrl(): string {
  if (typeof window !== 'undefined' && window.location) {
    return window.location.origin;
  }
  
  // Check environment variable
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl && (envUrl.includes('.exp.direct') || envUrl.includes('.exp.host'))) {
    return envUrl;
  }
  
  return 'http://localhost:8081'; // Fallback
}

/**
 * Get network URL based on platform
 */
function getNetworkUrl(): string {
  // Web always uses origin
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  // Check environment variable first
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) {
    return envUrl;
  }
  
  // Android emulator
  if (Platform.OS === 'android' && __DEV__) {
    return 'http://10.0.2.2:8081';
  }
  
  // iOS simulator or device
  return 'http://localhost:8081';
}

/**
 * Get API URL for general use
 */
export function getApiUrl(): string {
  const config = getUnifiedEnvConfig();
  return config.apiUrl;
}

/**
 * Get Auth URL (OAuth-safe)
 */
export function getAuthUrl(): string {
  const config = getUnifiedEnvConfig();
  return config.authUrl;
}

/**
 * Get Auth Base URL for Better Auth
 */
export function getAuthBaseUrl(): string {
  const config = getUnifiedEnvConfig();
  return config.authBaseUrl;
}

/**
 * Check if current environment is OAuth-safe
 */
export function isOAuthSafe(): boolean {
  const config = getUnifiedEnvConfig();
  return config.isOAuthSafe;
}

/**
 * Get database URL
 */
export function getDatabaseUrl(): string {
  const config = getUnifiedEnvConfig();
  return config.databaseUrl;
}

/**
 * Get WebSocket URL
 */
export function getWebSocketUrl(): string {
  const config = getUnifiedEnvConfig();
  return config.wsUrl;
}

/**
 * Check if WebSocket is enabled
 */
export function isWebSocketEnabled(): boolean {
  const config = getUnifiedEnvConfig();
  return config.wsEnabled;
}

/**
 * Log current environment (debug)
 */
export function logEnvironment(): void {
  const config = getUnifiedEnvConfig();
  // TODO: Replace with structured logging
  // console.log('[UNIFIED ENV] Configuration:', {
  //   mode: config.mode,
  //   apiUrl: config.apiUrl,
  //   authUrl: config.authUrl,
  //   authBaseUrl: config.authBaseUrl,
  //   isOAuthSafe: config.isOAuthSafe,
  //   wsUrl: config.wsUrl,
  //   wsEnabled: config.wsEnabled,
  //   platform: Platform.OS,
  //   isDev: __DEV__,
  // });
}