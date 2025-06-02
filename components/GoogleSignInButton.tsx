import React from "react";
import { Platform, Text, View, ActivityIndicator, Pressable } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import { makeRedirectUri } from "expo-auth-session";
import { showErrorAlert } from "@/lib/core/alert";
import { getApiUrl } from "@/lib/core/config";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/lib/stores/auth-store";
import { createAuthLogger } from "@/lib/core/debug";

// Ensure web browser is ready for auth
WebBrowser.maybeCompleteAuthSession();

const authLogger = createAuthLogger();

export function GoogleSignInButton() {
  const [isLoading, setIsLoading] = React.useState(false);
  const router = useRouter();
  const { updateAuth } = useAuthStore();

  // Create discovery document for Google
  const discovery = AuthSession.useAutoDiscovery('https://accounts.google.com');

  // Create redirect URI - use direct app scheme for mobile, localhost for web
  const redirectUri = React.useMemo(() => {
    if (Platform.OS === 'web') {
      // Web: use localhost
      const apiUrl = getApiUrl();
      return `${apiUrl}/api/auth/callback/google`;
    } else {
      // Mobile: use app's scheme directly (no proxy)
      return AuthSession.makeRedirectUri({ 
        useProxy: false,
        scheme: 'expo-starter', // Match the scheme in app.json
        path: 'auth-callback'
      });
    }
  }, []);

  authLogger.logOAuthStart('google');
  console.log('[GoogleSignInButton] Redirect URI:', redirectUri);

  // Create auth request for mobile - use single client ID for all platforms
  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '59100460814-lvqieq6hjuhvhe0t3gue41cpbp499kr4.apps.googleusercontent.com',
      responseType: AuthSession.ResponseType.Code,
      scopes: ['openid', 'email', 'profile'],
      redirectUri,
      // Add PKCE for security
      codeChallengeMethod: AuthSession.CodeChallengeMethod.S256,
    },
    discovery
  );



  // Process mobile OAuth success with better error handling
  const handleMobileOAuthSuccess = React.useCallback(async (authResponse: any) => {
    try {
      console.log('[GoogleSignInButton] Processing OAuth callback...');
      
      // Extract the authorization code and other parameters
      const { code, state } = authResponse.params;
      
      if (!code) {
        throw new Error('No authorization code received from OAuth');
      }

      // Send to our mobile OAuth callback endpoint
      const callbackResponse = await fetch(`${getApiUrl()}/api/auth/google-mobile-callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          redirectUri: redirectUri,
          state,
          type: 'authorization_code',
        }),
      });

      if (!callbackResponse.ok) {
        const errorData = await callbackResponse.json().catch(() => ({}));
        throw new Error(errorData.message || `OAuth callback failed: ${callbackResponse.status}`);
      }

      const result = await callbackResponse.json();
      
      if (result.success) {
        authLogger.logOAuthCallback('google', true);
        
        // Update auth state with user and session data
        if (result.user && result.session) {
          authLogger.logSessionUpdate(result.user, result.session);
          updateAuth(result.user, result.session);
          
          // Navigate based on profile completion status
          authLogger.logProfileCompletion(result.user.needsProfileCompletion);
          if (result.user.needsProfileCompletion) {
            authLogger.logNavigationDecision('/(auth)/complete-profile', 'User needs profile completion');
            router.replace('/(auth)/complete-profile');
          } else {
            authLogger.logNavigationDecision('/(home)', 'User profile complete');
            router.replace('/(home)');
          }
        } else {
          throw new Error('Invalid response format from server');
        }
        
        setIsLoading(false);
      } else {
        throw new Error(result.message || 'OAuth callback failed');
      }
    } catch (error) {
      authLogger.logOAuthCallback('google', false, error);
      setIsLoading(false);
      showErrorAlert(
        "Sign In Failed", 
        error instanceof Error ? error.message : "Failed to complete Google sign-in"
      );
    }
  }, [redirectUri]);

  // Enhanced OAuth response handling for mobile
  React.useEffect(() => {
    if (Platform.OS !== 'web' && response) {
      console.log('[GoogleSignInButton] Mobile OAuth response:', response.type);
      
      if (response.type === 'success') {
        console.log('[GoogleSignInButton] OAuth success, processing callback...');
        handleMobileOAuthSuccess(response);
      } else if (response.type === 'error') {
        console.error('[GoogleSignInButton] OAuth error:', response.error);
        setIsLoading(false);
        showErrorAlert("Sign In Failed", `OAuth error: ${response.error?.message || 'Unknown error'}`);
      } else if (response.type === 'cancel') {
        console.log('[GoogleSignInButton] User cancelled OAuth');
        setIsLoading(false);
      } else if (response.type === 'dismiss') {
        console.log('[GoogleSignInButton] OAuth dismissed');
        setIsLoading(false);
      }
    }
  }, [response, handleMobileOAuthSuccess]);

  // Enhanced web OAuth handling
  const handleWebOAuth = async () => {
    try {
      console.log('[GoogleSignInButton] Web: Initiating OAuth flow...');
      
      const apiUrl = getApiUrl();
      const endpoint = `${apiUrl}/api/auth/sign-in/social`;
      console.log('[GoogleSignInButton] Web: Calling endpoint:', endpoint);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: 'google',
          callbackURL: window.location.origin + '/auth-callback',
        }),
        credentials: 'include',
      });
      
      console.log('[GoogleSignInButton] Web: Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[GoogleSignInButton] Web: Error response:', errorData);
        throw new Error(errorData.message || errorData.error || `OAuth initialization failed: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('[GoogleSignInButton] Web: OAuth response data:', data);
      
      if (data.url) {
        // Store current path to redirect back after auth
        sessionStorage.setItem('auth_redirect_path', window.location.pathname);
        window.location.href = data.url;
      } else {
        throw new Error('No OAuth URL received from server');
      }
    } catch (error) {
      console.error('[GoogleSignInButton] Web: OAuth initialization failed:', error);
      setIsLoading(false);
      showErrorAlert(
        "Sign In Failed", 
        error instanceof Error ? error.message : "Failed to initiate Google sign-in"
      );
    }
  };

  const handleGoogleSignIn = async () => {
    // Prevent multiple clicks
    if (isLoading) {
      console.log('[GoogleSignInButton] Already loading, ignoring click');
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log('[GoogleSignInButton] Starting Google sign-in...');
      console.log('[GoogleSignInButton] Platform:', Platform.OS);
      
      if (Platform.OS === 'web') {
        // Web flow - improved with better error handling
        console.log('[GoogleSignInButton] Calling handleWebOAuth...');
        await handleWebOAuth();
      } else {
        // Mobile flow - use Expo AuthSession without proxy
        console.log('[GoogleSignInButton] Mobile: Using Expo AuthSession with direct scheme');
        console.log('[GoogleSignInButton] Redirect URI:', redirectUri);
        
        if (!request) {
          console.error('[GoogleSignInButton] Auth request not ready');
          
          // Check if running in Expo Go
          if (!global.expo?.modules?.ExpoDevice?.isDevice) {
            showErrorAlert(
              "Development Build Required", 
              "Google OAuth requires a development build. You cannot use Expo Go for OAuth authentication.\n\nPlease create a development build:\neas build --profile development"
            );
          } else {
            showErrorAlert("Sign In Failed", "Authentication not configured properly");
          }
          setIsLoading(false);
          return;
        }
        
        // This will open Google OAuth in a browser
        // The response will be handled by the useEffect above
        await promptAsync();
      }
    } catch (error) {
      console.error('[GoogleSignInButton] Sign-in error:', error);
      showErrorAlert("Sign In Failed", error instanceof Error ? error.message : "Failed to sign in with Google");
      setIsLoading(false);
    }
  };

  // Check if we're in Expo Go (development)
  const isExpoGo = Platform.OS !== 'web' && !global.expo?.modules?.ExpoDevice?.isDevice;
  
  return (
    <Pressable
      disabled={isLoading || (Platform.OS !== 'web' && !request)}
      onPress={handleGoogleSignIn}
      style={[
        {
          backgroundColor: isExpoGo ? '#6b7280' : '#1f2937',
          paddingVertical: 12,
          paddingHorizontal: 16,
          borderRadius: 6,
          opacity: (isLoading || (Platform.OS !== 'web' && !request)) ? 0.5 : 1,
          borderWidth: 1,
          borderColor: isExpoGo ? '#6b7280' : '#1f2937',
        }
      ]}
      className="w-full h-12 flex-row items-center justify-center"
    >
      {isLoading ? (
        <ActivityIndicator size="small" color="white" />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {/* Google G Icon */}
          <Text style={{ fontSize: 18, fontWeight: '600' }}>
            <Text style={{ color: '#4285F4' }}>G</Text>
            <Text style={{ color: '#EA4335' }}>o</Text>
            <Text style={{ color: '#FBBC04' }}>o</Text>
            <Text style={{ color: '#4285F4' }}>g</Text>
            <Text style={{ color: '#34A853' }}>l</Text>
            <Text style={{ color: '#EA4335' }}>e</Text>
          </Text>
          <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
            {isExpoGo ? 'OAuth requires dev build' : 'Continue with Google'}
          </Text>
        </View>
      )}
    </Pressable>
  );
}