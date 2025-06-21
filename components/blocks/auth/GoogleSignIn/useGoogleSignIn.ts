import React from "react";
import { Platform } from "react-native";
import Constants from 'expo-constants';
import { showErrorAlert } from "@/lib/core/alert";
import { useRouter } from "expo-router";
import { useAuthStore, toAppUser } from "@/lib/stores/auth-store";
import { logger } from "@/lib/core/debug/unified-logger";
import { authClient as defaultAuthClient } from "@/lib/auth/auth-client";
import { api } from "@/lib/api/trpc";

export function useGoogleSignIn() {
  const [isLoading, setIsLoading] = React.useState(false);
  const router = useRouter();
  const { updateAuth } = useAuthStore();
  const utils = api.useUtils();
  const loadingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  
  // Clean up timeout on unmount
  React.useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  const handleGoogleSignIn = async () => {
    if (isLoading) {
      logger.auth.debug('Already loading, ignoring click');
      return;
    }
    
    setIsLoading(true);
    logger.auth.info('Starting OAuth flow with google', { platform: Platform.OS });
    
    // Set a timeout to reset loading state if OAuth takes too long
    loadingTimeoutRef.current = setTimeout(() => {
      logger.warn('OAuth timeout - resetting loading state', 'AUTH', { platform: Platform.OS });
      setIsLoading(false);
    }, 30000) as any; // 30 second timeout
    
    try {
      // Check if running in Expo Go first
      if ((Platform.OS === 'ios' || Platform.OS === 'android') && Constants.executionEnvironment === 'storeClient') {
        throw new Error('OAuth authentication requires a development build. Expo Go does not support OAuth redirects.');
      }
      
      const callbackURL = Platform.OS === 'web' 
        ? `${window.location.origin}/auth-callback`
        : '/auth-callback';
      
      logger.auth.debug('OAuth parameters', { callbackURL, platform: Platform.OS });
      
      // Use Better Auth client for OAuth initiation only
      // Then rely on tRPC + TanStack Query for session management
      try {
        logger.auth.debug('Starting OAuth with Better Auth client', { platform: Platform.OS });
        
        if (Platform.OS === 'web') {
          // For web, use direct navigation to avoid the API error
          logger.auth.debug('Starting web OAuth flow with direct navigation', { 
            provider: 'google',
            callbackURL,
            platform: Platform.OS 
          });
          
          try {
            // Make direct POST request to avoid Better Auth client serialization issues
            const response = await fetch(`${window.location.origin}/api/auth/sign-in/social`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify({
                provider: 'google',
                callbackURL
              })
            });
            
            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`OAuth request failed: ${response.status} - ${errorText}`);
            }
            
            const result = await response.json();
            logger.auth.debug('OAuth initiated for web', { hasResult: !!result, result });
            
            // If we get a redirect URL, navigate to it
            if (result?.url) {
              window.location.href = result.url;
            }
            return;
          } catch (webError: any) {
            logger.auth.error('Web OAuth error', { 
              error: webError,
              message: webError?.message,
              response: webError?.response,
              status: webError?.status
            });
            
            // Try to get error details from response
            if (webError?.response) {
              try {
                const errorData = await webError.response.json();
                logger.auth.error('OAuth error response data', errorData);
              } catch (e) {
                logger.auth.error('Could not parse error response');
              }
            }
            
            throw webError;
          }
        } else {
          // Mobile OAuth flow - add device info for Better Auth
          const deviceInfo = {
            device_id: Constants.sessionId || 'unknown',
            device_name: `${Platform.OS}-${Constants.deviceName || 'mobile'}`
          };
          
          const result = await defaultAuthClient.signIn.social({
            provider: 'google',
            callbackURL,
          });
          
          logger.auth.debug('OAuth initiated for mobile', { hasResult: !!result, platform: Platform.OS });
        }
        
        // For mobile, wait a moment then fetch session via tRPC
        const isMobile = Platform.OS === 'ios' || Platform.OS === 'android';
        if (isMobile) {
          // Use TanStack Query to fetch fresh session data
          logger.auth.debug('Fetching session via tRPC after OAuth');
          
          // Use utils to fetch fresh session - this will use TanStack Query caching
          const sessionData = await utils.auth.getSession.fetch() as any;
          
          if (sessionData?.user) {
            logger.auth.info('OAuth success, updating auth state via tRPC', { userId: sessionData.user.id });
            
            // Convert to AppUser and update Zustand store with tRPC data
            const appUser = toAppUser(sessionData.user, 'user');
            updateAuth(appUser, sessionData.session);
            
            // Navigate based on profile completion status from tRPC
            if (appUser.needsProfileCompletion) {
              logger.auth.debug('Navigating to profile completion');
              router.replace('/auth/complete-profile');
            } else {
              logger.auth.debug('Navigating to home');
              router.replace('/');
            }
          } else {
            throw new Error('No session data received after OAuth');
          }
        }
      } catch (oauthError: any) {
        logger.auth.error('OAuth flow failed', oauthError);
        throw oauthError;
      }
      
      // Clear timeout and reset loading
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      setIsLoading(false);
    } catch (error: any) {
      // Clear timeout on error
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      logger.auth.error('Sign-in error', { 
        error,
        errorType: typeof error,
        errorMessage: error?.message || 'Unknown error',
        errorStack: error?.stack || 'No stack trace'
      });
      
      logger.auth.error('OAuth callback failed', { provider: 'google', error: error?.message });
      
      // Safely extract error message with better handling for TypeErrors
      let errorMessage = '';
      try {
        if (error instanceof TypeError) {
          // Handle TypeError specifically (like the "Cannot read properties of undefined" error)
          errorMessage = 'Authentication service error. Please try again.';
          logger.auth.error('TypeError in OAuth flow', { 
            message: error.message,
            stack: error.stack,
            name: error.name
          });
        } else if (error instanceof Error) {
          errorMessage = error.message || '';
        } else if (typeof error === 'string') {
          errorMessage = error;
        } else if (error && typeof error === 'object') {
          // Safely check for message property
          if ('message' in error && typeof error.message === 'string') {
            errorMessage = error.message;
          } else if ('error' in error && typeof error.error === 'string') {
            errorMessage = error.error;
          } else if (typeof error.toString === 'function') {
            errorMessage = error.toString();
          } else {
            errorMessage = 'An unknown error occurred';
          }
        } else {
          errorMessage = 'An unknown error occurred';
        }
      } catch (extractError) {
        logger.auth.error('Error extracting error message', { extractError });
        errorMessage = 'Authentication service error. Please try again.';
      }
      
      logger.auth.debug('Extracted error message', { errorMessage });
      
      // Enhanced error handling for OAuth and backend errors
      const isExpoGo = (Platform.OS === 'ios' || Platform.OS === 'android') && Constants.executionEnvironment === 'storeClient';
      const isOAuthError = errorMessage && typeof errorMessage === 'string' && errorMessage.length > 0 &&
          (errorMessage.includes('scheme') || errorMessage.includes('redirect') || 
           errorMessage.includes('OAuth') || errorMessage.includes('development build'));
      const isTypeError = error instanceof TypeError;
      
      // Handle specific error types
      let title = "Sign In Failed";
      let message = errorMessage || "Failed to sign in with Google";
      
      if (isTypeError) {
        title = "Service Error";
        message = "There was a temporary issue with the authentication service. Please try again in a moment.";
      } else if (isExpoGo || isOAuthError) {
        title = "Development Build Required";
        message = "Google OAuth requires a development build. You cannot use Expo Go for OAuth authentication.\n\nPlease create a development build:\neas build --profile development";
      } else if (errorMessage?.includes('Rate limit exceeded')) {
        title = "Too Many Attempts";
        message = "Too many sign-in attempts. Please wait a few minutes before trying again.";
      } else if (errorMessage?.includes('Disposable email')) {
        title = "Invalid Email";
        message = "Please use a valid business email address. Disposable email addresses are not allowed.";
      } else if (errorMessage?.includes('Organization name is required')) {
        title = "Profile Incomplete";
        message = "Please complete your profile by providing your organization information.";
      } else if (errorMessage?.includes('Profile completion required')) {
        title = "Profile Setup Required";
        message = "Please complete your profile setup to continue using the app.";
      } else if (errorMessage?.includes('network') || errorMessage?.includes('Network')) {
        title = "Connection Error";
        message = "Unable to connect to Google. Please check your internet connection and try again.";
      } else if (errorMessage?.includes('cancelled') || errorMessage?.includes('canceled')) {
        // Don't show error for user cancellation
        setIsLoading(false);
        return;
      }
      
      showErrorAlert(title, message);
      
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    handleGoogleSignIn
  };
}