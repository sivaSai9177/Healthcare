/**
 * Safe wrapper around NetInfo to handle abort errors gracefully
 */

// Dynamic import with fallback
let NetInfo: any;
let isNetInfoAvailable = false;

try {
   
  NetInfo = require('@react-native-community/netinfo').default;
  isNetInfoAvailable = true;
} catch {
  // NetInfo not available - provide a mock
  NetInfo = {
    addEventListener: () => () => {},
    fetch: () => Promise.resolve({ 
      isConnected: true, 
      isInternetReachable: true,
      type: 'unknown',
      details: null
    }),
    configure: () => {},
  };
}

// Configure NetInfo to be less aggressive with reachability checks
if (isNetInfoAvailable && NetInfo.configure) {
  try {
    // Check if we're on web platform
    const isWeb = typeof window !== 'undefined' && typeof window.document !== 'undefined';
    
    NetInfo.configure({
      // Don't use reachability checks on web due to CORS
      reachabilityUrl: isWeb ? undefined : 'https://clients3.google.com/generate_204',
      reachabilityTest: async (response: Response) => response.status === 204,
      reachabilityLongTimeout: 60 * 1000, // 60s
      reachabilityShortTimeout: 5 * 1000, // 5s
      reachabilityRequestTimeout: 15 * 1000, // 15s
      reachabilityShouldRun: () => !isWeb, // Disable on web
      shouldFetchWiFiSSID: false,
      useNativeReachability: false, // Disable native reachability to avoid abort errors
    });
  } catch (error) {
    console.warn('Failed to configure NetInfo:', error);
  }
}

export interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string;
  details: any;
}

const isWeb = typeof window !== 'undefined' && typeof window.document !== 'undefined';

export const SafeNetInfo = {
  addEventListener: (listener: (state: NetworkState) => void) => {
    // On web, use online/offline events as fallback
    if (isWeb && !isNetInfoAvailable) {
      const handleOnline = () => listener({
        isConnected: true,
        isInternetReachable: true,
        type: 'web',
        details: null,
      });
      
      const handleOffline = () => listener({
        isConnected: false,
        isInternetReachable: false,
        type: 'web',
        details: null,
      });

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      
      // Return unsubscribe function
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }

    // Wrap listener to handle any errors
    const safeListener = (state: any) => {
      try {
        // On web, isInternetReachable is often null due to CORS
        const webState = isWeb ? {
          ...state,
          isInternetReachable: state?.isConnected ? true : false,
        } : state;

        listener({
          isConnected: webState?.isConnected ?? false,
          isInternetReachable: webState?.isInternetReachable ?? null,
          type: webState?.type ?? 'unknown',
          details: webState?.details ?? null,
        });
      } catch (error) {
        console.warn('NetInfo listener error:', error);
      }
    };

    return NetInfo.addEventListener(safeListener);
  },

  fetch: async (): Promise<NetworkState> => {
    // On web without NetInfo, use navigator.onLine
    if (isWeb && !isNetInfoAvailable) {
      const isOnline = navigator.onLine;
      return {
        isConnected: isOnline,
        isInternetReachable: isOnline,
        type: 'web',
        details: null,
      };
    }

    try {
      const state = await NetInfo.fetch();
      
      // On web, isInternetReachable is often null due to CORS
      if (isWeb && state?.isInternetReachable === null) {
        state.isInternetReachable = state.isConnected;
      }

      return {
        isConnected: state?.isConnected ?? false,
        isInternetReachable: state?.isInternetReachable ?? null,
        type: state?.type ?? 'unknown',
        details: state?.details ?? null,
      };
    } catch (error: any) {
      // Ignore abort errors and CORS errors
      if (error?.name === 'AbortError' || 
          error?.message?.includes('abort') ||
          error?.message?.includes('CORS') ||
          error?.message?.includes('Failed to fetch')) {
        // On web, fallback to navigator.onLine
        if (isWeb) {
          const isOnline = navigator.onLine;
          return {
            isConnected: isOnline,
            isInternetReachable: isOnline,
            type: 'web',
            details: null,
          };
        }
        
        return {
          isConnected: true, // Assume connected on error
          isInternetReachable: null, // Unknown reachability
          type: 'unknown',
          details: null,
        };
      }
      
      console.warn('NetInfo fetch error:', error);
      
      // Return a safe default
      return {
        isConnected: true,
        isInternetReachable: null,
        type: 'unknown',
        details: null,
      };
    }
  },
};