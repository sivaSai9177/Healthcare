import { useEffect, useRef } from 'react';
import { alertEventQueue } from '@/lib/websocket/event-queue';
import { alertWebSocketManager } from '@/lib/websocket/connection-manager';
import { log } from '@/lib/core/debug/logger';

/**
 * Hook to manage event queue and connection manager cleanup
 * Prevents memory leaks by ensuring proper cleanup on unmount
 */
export function useEventQueueCleanup() {
  const cleanupRef = useRef(false);

  useEffect(() => {
    // Mark as active
    cleanupRef.current = false;

    return () => {
      // Prevent double cleanup
      if (cleanupRef.current) return;
      cleanupRef.current = true;

      log.info('Cleaning up WebSocket resources', 'WS_CLEANUP');

      // Stop event queue processing
      alertEventQueue.stop();

      // Reset connection manager
      alertWebSocketManager.reset();

      // Clean up connection manager resources
      alertWebSocketManager.cleanup();

      // Note: We don't destroy the event queue here since it's a singleton
      // and might be used by other components
    };
  }, []);

  // Cleanup on app state change (mobile)
  useEffect(() => {
    if (typeof window === 'undefined') {
      // React Native
      const { AppState } = require('react-native');
      
      const handleAppStateChange = (nextAppState: string) => {
        if (nextAppState === 'background') {
          log.info('App backgrounded, pausing WebSocket', 'WS_CLEANUP');
          alertEventQueue.stop();
        } else if (nextAppState === 'active') {
          log.info('App foregrounded, resuming WebSocket', 'WS_CLEANUP');
          // The queue will automatically restart when new events arrive
        }
      };

      const subscription = AppState.addEventListener('change', handleAppStateChange);
      return () => {
        subscription?.remove();
      };
    }
  }, []);
}