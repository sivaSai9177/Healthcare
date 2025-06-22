import { useState, useEffect } from 'react';
import { SafeNetInfo } from '@/lib/utils/safe-netinfo';
import { logger } from '@/lib/core/debug/server-logger';

interface NetworkStatus {
  isOffline: boolean;
  isConnected: boolean;
  connectionType: string | null;
}

export function useNetworkStatus(): NetworkStatus {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOffline: false,
    isConnected: true,
    connectionType: null,
  });

  useEffect(() => {
    let isSubscribed = true;

    const updateNetworkStatus = (state: any) => {
      if (!isSubscribed) return;
      
      const isConnected = state.isConnected === true;
      const isOffline = !isConnected;
      
      setNetworkStatus({
        isOffline,
        isConnected,
        connectionType: state.type,
      });

      logger.debug('Network status changed', {
        isConnected,
        type: state.type,
        details: state.details,
      });
    };

    // Get initial state
    SafeNetInfo.fetch().then(state => {
      if (isSubscribed) {
        updateNetworkStatus(state);
      }
    });

    // Subscribe to updates
    const unsubscribe = SafeNetInfo.addEventListener(updateNetworkStatus);

    return () => {
      isSubscribed = false;
      unsubscribe();
    };
  }, []);

  return networkStatus;
}