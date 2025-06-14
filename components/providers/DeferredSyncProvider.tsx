import React, { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { SyncProvider } from './SyncProvider';

export function DeferredSyncProvider({ children }: { children: React.ReactNode }) {
  // On web, we can initialize immediately
  // On native, we need to wait for TRPC and navigation to be ready
  const [isReady, setIsReady] = useState(Platform.OS === 'web');

  useEffect(() => {
    if (Platform.OS !== 'web') {
      // Use a longer delay on native to ensure TRPC is fully initialized
      const timer = setTimeout(() => {
        setIsReady(true);
      }, 200);

      return () => clearTimeout(timer);
    }
  }, []);

  if (!isReady) {
    // Return children without Sync during initial render
    return <>{children}</>;
  }

  return <SyncProvider>{children}</SyncProvider>;
}