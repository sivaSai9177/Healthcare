import React, { useState, useEffect } from 'react';
import { TRPCProvider } from '@/lib/api/trpc';
import { Platform } from 'react-native';

export function DeferredTRPCProvider({ children }: { children: React.ReactNode }) {
  // On web, we can initialize immediately
  // On native, we need to wait for navigation to be ready
  const [isReady, setIsReady] = useState(Platform.OS === 'web');

  useEffect(() => {
    if (Platform.OS !== 'web') {
      // Use a longer delay on native to ensure navigation is fully initialized
      const timer = setTimeout(() => {
        setIsReady(true);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, []);

  if (!isReady) {
    // Return children without TRPC during initial render
    return <>{children}</>;
  }

  return <TRPCProvider>{children}</TRPCProvider>;
}