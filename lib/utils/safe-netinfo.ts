import { Platform } from 'react-native';

// Type definitions to match NetInfo
export type NetInfoState = {
  type: string;
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  details: any;
};

export type NetInfoSubscription = () => void;

// Only import NetInfo on native platforms
let NetInfo: any = null;
if (Platform.OS !== 'web') {
  try {
    NetInfo = require('@react-native-community/netinfo').default;
  } catch (error) {
    console.warn('NetInfo not available on this platform');
  }
}

/**
 * Safe wrapper around NetInfo to handle web platform differences
 * On web, we use native browser APIs to avoid CORS and AbortError issues
 */
export const SafeNetInfo = {
  addEventListener: (listener: (state: NetInfoState) => void): NetInfoSubscription => {
    if (Platform.OS === 'web') {
      // For web, use native browser events
      const webListener = () => {
        listener({
          type: 'unknown',
          isConnected: navigator.onLine,
          isInternetReachable: navigator.onLine,
          details: null,
        });
      };
      
      window.addEventListener('online', webListener);
      window.addEventListener('offline', webListener);
      
      // Call immediately with current state
      webListener();
      
      // Return unsubscribe function
      return () => {
        window.removeEventListener('online', webListener);
        window.removeEventListener('offline', webListener);
      };
    }
    
    // For native platforms, use NetInfo if available
    if (NetInfo) {
      return NetInfo.addEventListener(listener);
    }
    
    // Fallback: return no-op unsubscribe
    return () => {};
  },
  
  fetch: async (): Promise<NetInfoState> => {
    if (Platform.OS === 'web') {
      // For web, use navigator.onLine
      return {
        type: 'unknown',
        isConnected: navigator.onLine,
        isInternetReachable: navigator.onLine,
        details: null,
      };
    }
    
    // For native platforms, use NetInfo if available
    if (NetInfo) {
      try {
        return await NetInfo.fetch();
      } catch (error) {
        console.warn('NetInfo fetch error:', error);
        // Return safe default
        return {
          type: 'unknown',
          isConnected: true,
          isInternetReachable: null,
          details: null,
        };
      }
    }
    
    // Fallback for when NetInfo is not available
    return {
      type: 'unknown',
      isConnected: true,
      isInternetReachable: null,
      details: null,
    };
  },
  
  configure: (configuration: any) => {
    // Only configure on native platforms
    if (Platform.OS !== 'web' && NetInfo) {
      NetInfo.configure(configuration);
    }
  },
};