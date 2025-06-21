/**
 * PostHog Analytics Provider
 * Provides PostHog analytics tracking for React Native/Expo
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
// import PostHog from 'posthog-react-native';
// TODO: Enable PostHog for production builds
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@/lib/stores/auth-store';
import { getPostHogConfig } from '@/lib/core/config/unified-env';
import { logger } from '@/lib/core/debug/unified-logger';

interface PostHogContextType {
  posthog: any | null;
  isReady: boolean;
}

const PostHogContext = createContext<PostHogContextType>({ 
  posthog: null,
  isReady: false,
});

export function usePostHog() {
  const context = useContext(PostHogContext);
  if (!context) {
    throw new Error('usePostHog must be used within PostHogProvider');
  }
  return context;
}

interface PostHogProviderProps {
  children: React.ReactNode;
}

export function PostHogProvider({ children }: PostHogProviderProps) {
  // PostHog is disabled for development
  // Will be enabled for production and dev builds
  const posthog = null;
  const isReady = true;

  /* POSTHOG IMPLEMENTATION - Uncomment when ready to use
  const [posthog, setPostHog] = useState<any | null>(null);
  const [isReady, setIsReady] = useState(false);
  const { user, isAuthenticated } = useAuthStore();
  const config = getPostHogConfig();

  useEffect(() => {
    let client: any | null = null;

    const initializePostHog = async () => {
      if (!config.enabled || !config.apiKey) {
        logger.info('PostHog is disabled or API key missing', 'POSTHOG');
        setIsReady(true);
        return;
      }

      try {
        // Import PostHog dynamically
        const PostHog = require('posthog-react-native').default;
        
        // Initialize PostHog client
        client = new PostHog(config.apiKey, {
          host: config.apiHost,
          // React Native specific options
          captureApplicationLifecycleEvents: true,
          captureDeepLinks: true,
          captureNativeAppLifecycleEvents: true,
          // Privacy settings
          defaultOptIn: false, // Require explicit opt-in
          sendFeatureFlagRequestsToOrigin: false,
          // Performance settings
          flushAt: 20,
          flushInterval: 30000, // 30 seconds
          // Storage
          storageProvider: AsyncStorage,
          storagePrefix: 'ph_',
        });

        // Wait for initialization
        await client.initAsync();
        
        setPostHog(client);
        setIsReady(true);

        logger.info('PostHog initialized', 'POSTHOG', {
          host: config.apiHost,
        });

        // Identify user if logged in
        if (isAuthenticated && user) {
          await client.identify(user.id, {
            email: user.email,
            name: user.name,
            role: user.role,
            organizationId: user.organizationId,
            createdAt: user.createdAt,
          });

          logger.debug('User identified in PostHog', 'POSTHOG', {
            userId: user.id,
          });
        }

        // Track app open
        client.capture('app_opened', {
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        logger.error('Failed to initialize PostHog', 'POSTHOG', error);
        setIsReady(true); // Set ready even on error to prevent blocking
      }
    };

    initializePostHog();

    // Cleanup on unmount
    return () => {
      if (client) {
        client.flush();
      }
    };
  }, [config.enabled, config.apiKey, config.apiHost]);

  // Update user identification when auth state changes
  useEffect(() => {
    if (!posthog || !isReady) return;

    if (isAuthenticated && user) {
      // Identify logged in user
      posthog.identify(user.id, {
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organizationId,
        lastLogin: new Date().toISOString(),
      });
    } else {
      // Reset on logout
      posthog.reset();
    }
  }, [posthog, isReady, isAuthenticated, user]);
  */

  return (
    <PostHogContext.Provider value={{ posthog, isReady }}>
      {children}
    </PostHogContext.Provider>
  );
}