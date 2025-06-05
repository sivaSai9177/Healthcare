/**
 * Environment Configuration
 * Simple environment detection for mobile development
 */

import { Platform } from 'react-native';
import { getApiUrlSync } from './config';

export const getEnvironment = () => {
  return {
    platform: Platform.OS,
    isDevelopment: process.env.NODE_ENV === 'development',
    isDebugMode: process.env.EXPO_PUBLIC_DEBUG_MODE === 'true',
    apiUrl: getApiUrlSync(),
  };
};

export const getApiUrl = async (): Promise<string> => {
  // Return the synchronous API URL as a promise for compatibility
  return Promise.resolve(getApiUrlSync());
};

export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';
export const isDebugMode = process.env.EXPO_PUBLIC_DEBUG_MODE === 'true';

export const env = {
  getEnvironment,
  getApiUrl,
  isDevelopment,
  isProduction,
  isDebugMode,
};

export default env;