import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { sessionTimeoutManager } from '@/lib/auth/session-timeout-manager';
import { tokenRefreshManager } from '@/lib/auth/token-refresh-manager';
import { SessionTimeoutWarning } from '@/components/blocks/auth/SessionTimeoutWarning';
import { useRouter } from 'expo-router';
import { log } from '@/lib/core/debug/logger';

interface SessionProviderProps {
  children: React.ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
  const { isAuthenticated, clearAuth } = useAuth();
  const router = useRouter();
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      // Start session timeout monitoring
      sessionTimeoutManager.start({
        onWarning: () => {
          log.info('Session timeout warning triggered', 'AUTH');
          setShowTimeoutWarning(true);
        },
        onTimeout: () => {
          log.info('Session timed out', 'AUTH');
          handleLogout();
        }
      });
    } else {
      // Stop monitoring if not authenticated
      sessionTimeoutManager.stop();
      setShowTimeoutWarning(false);
    }

    return () => {
      sessionTimeoutManager.stop();
    };
  }, [isAuthenticated]);

  const handleExtendSession = () => {
    setShowTimeoutWarning(false);
    // Token refresh is handled automatically by sessionTimeoutManager.extendSession()
  };

  const handleLogout = async () => {
    setShowTimeoutWarning(false);
    
    // Clear auth state
    await clearAuth();
    
    // Stop session management
    sessionTimeoutManager.stop();
    tokenRefreshManager.stop();
    
    // Redirect to login
    router.replace('/(auth)/login');
  };

  return (
    <>
      {children}
      <SessionTimeoutWarning
        open={showTimeoutWarning}
        onExtend={handleExtendSession}
        onLogout={handleLogout}
      />
    </>
  );
}