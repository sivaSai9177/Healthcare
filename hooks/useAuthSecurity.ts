import { useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { useAuthStore } from '@/lib/stores/auth-store';
import { deviceFingerprintManager } from '@/lib/auth/device-fingerprint';
import { logger } from '@/lib/core/debug/unified-logger';
import { api } from '@/lib/api/trpc';

interface AuthSecurityOptions {
  enableFingerprinting?: boolean;
  enableAnomalyDetection?: boolean;
  enableGeolocation?: boolean;
}

export function useAuthSecurity(options: AuthSecurityOptions = {}) {
  const {
    enableFingerprinting = true,
    enableAnomalyDetection = true,
    enableGeolocation = false, // Disabled by default for privacy
  } = options;
  
  const { user, isAuthenticated } = useAuthStore();
  const utils = api.useUtils();
  
  // Generate and send device fingerprint on login
  const sendDeviceFingerprint = useCallback(async () => {
    if (!enableFingerprinting || !isAuthenticated || !user) return;
    
    try {
      const fingerprint = await deviceFingerprintManager.generateFingerprint();
      
      logger.auth.debug('Device fingerprint generated', {
        fingerprintId: fingerprint.id.substring(0, 8) + '...',
        platform: fingerprint.platform,
        deviceType: fingerprint.deviceType,
      });
      
      // Send fingerprint to server via tRPC
      // This would be implemented in the auth router
      // await utils.auth.updateSessionFingerprint.mutate({ fingerprint });
      
    } catch (error) {
      logger.auth.error('Failed to generate device fingerprint', {
        error: error?.message || error
      });
    }
  }, [isAuthenticated, user, enableFingerprinting]);
  
  // Monitor for suspicious activity
  const checkSessionAnomaly = useCallback(async () => {
    if (!enableAnomalyDetection || !isAuthenticated || !user) return;
    
    try {
      // Get current session info
      const sessionData = await utils.auth.getSession.fetch();
      
      if (!sessionData) return;
      
      // Check for anomalies (this would be implemented server-side)
      // const anomalyCheck = await utils.auth.checkSessionAnomaly.mutate();
      
      // if (anomalyCheck?.isAnomaly) {
      //   logger.auth.warn('Session anomaly detected', anomalyCheck);
      //   
      //   // Handle based on risk level
      //   switch (anomalyCheck.suggestedAction) {
      //     case 'challenge':
      //       // Require re-authentication
      //       break;
      //     case 'notify':
      //       // Send notification to user
      //       break;
      //     case 'block':
      //       // Force logout
      //       break;
      //   }
      // }
    } catch (error) {
      logger.auth.error('Failed to check session anomaly', {
        error: error?.message || error
      });
    }
  }, [isAuthenticated, user, enableAnomalyDetection, utils]);
  
  // Initialize security features on auth state change
  useEffect(() => {
    if (isAuthenticated && user) {
      // Send device fingerprint on login
      sendDeviceFingerprint();
      
      // Start anomaly detection
      if (enableAnomalyDetection) {
        // Check immediately
        checkSessionAnomaly();
        
        // Set up periodic checks (every 5 minutes)
        const interval = setInterval(checkSessionAnomaly, 5 * 60 * 1000);
        
        return () => clearInterval(interval);
      }
    }
  }, [isAuthenticated, user, sendDeviceFingerprint, checkSessionAnomaly]);
  
  // Get security status
  const getSecurityStatus = useCallback(async () => {
    const status = {
      fingerprintEnabled: enableFingerprinting,
      anomalyDetectionEnabled: enableAnomalyDetection,
      geolocationEnabled: enableGeolocation,
      deviceFingerprint: null as any,
      lastSecurityCheck: new Date(),
    };
    
    if (enableFingerprinting) {
      try {
        status.deviceFingerprint = await deviceFingerprintManager.generateFingerprint();
      } catch (error) {
        logger.auth.error('Failed to get device fingerprint for status', error);
      }
    }
    
    return status;
  }, [enableFingerprinting, enableAnomalyDetection, enableGeolocation]);
  
  // Force security check
  const forceSecurityCheck = useCallback(async () => {
    logger.auth.info('Force security check requested');
    
    const results = {
      fingerprint: null as any,
      anomalyCheck: null as any,
      geolocation: null as any,
    };
    
    // Update device fingerprint
    if (enableFingerprinting) {
      try {
        results.fingerprint = await deviceFingerprintManager.generateFingerprint();
        await sendDeviceFingerprint();
      } catch (error) {
        logger.auth.error('Fingerprint check failed', error);
      }
    }
    
    // Check for anomalies
    if (enableAnomalyDetection) {
      try {
        await checkSessionAnomaly();
        results.anomalyCheck = { checked: true, timestamp: new Date() };
      } catch (error) {
        logger.auth.error('Anomaly check failed', error);
      }
    }
    
    return results;
  }, [enableFingerprinting, enableAnomalyDetection, sendDeviceFingerprint, checkSessionAnomaly]);
  
  return {
    sendDeviceFingerprint,
    checkSessionAnomaly,
    getSecurityStatus,
    forceSecurityCheck,
  };
}

// Hook to monitor concurrent sessions
export function useConcurrentSessions() {
  const { user, isAuthenticated } = useAuthStore();
  const { data: sessions, isLoading } = api.auth.getActiveSessions.useQuery(undefined, {
    enabled: isAuthenticated && !!user,
    refetchInterval: 60000, // Check every minute
  });
  
  const terminateSession = api.auth.terminateSession.useMutation();
  
  const handleTerminateSession = useCallback(async (sessionId: string) => {
    try {
      await terminateSession.mutateAsync({ sessionId });
      logger.auth.info('Session terminated', { sessionId });
    } catch (error) {
      logger.auth.error('Failed to terminate session', {
        sessionId,
        error: error?.message || error
      });
      throw error;
    }
  }, [terminateSession]);
  
  return {
    sessions: sessions || [],
    isLoading,
    terminateSession: handleTerminateSession,
    sessionCount: sessions?.length || 0,
  };
}