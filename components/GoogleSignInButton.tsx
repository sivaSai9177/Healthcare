import React from "react";
import { Platform, Text, View, ActivityIndicator } from "react-native";
import { Button } from "@/components/shadcn/ui/button";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import { showErrorAlert, showSuccessAlert } from "@/lib/core/alert";
import { getApiUrl } from "@/lib/core/config";

// Ensure web browser is ready for auth
WebBrowser.maybeCompleteAuthSession();

export function GoogleSignInButton() {
  const [isLoading, setIsLoading] = React.useState(false);

  // Create discovery document for Google
  const discovery = AuthSession.useAutoDiscovery('https://accounts.google.com');

  // Create redirect URI - use Expo's auth proxy for mobile, localhost for web
  const redirectUri = React.useMemo(() => {
    if (Platform.OS === 'web') {
      // Web: use localhost
      const apiUrl = getApiUrl();
      return `${apiUrl}/api/auth/callback/google`;
    } else {
      // Mobile: use Expo's auth proxy service 
      // This generates: https://auth.expo.io/@anonymous/my-expo/auth/callback/google
      return AuthSession.makeRedirectUri({
        preferLocalhost: false, // Forces use of Expo proxy instead of localhost
        isTripleSlashed: false // Set to false for proper proxy URL generation
      });
    }
  }, []);

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
        console.log('[GoogleSignInButton] OAuth callback successful');
        showSuccessAlert("Welcome!", "Successfully signed in with Google");
        
        // Update auth state
        setTimeout(() => {
          setIsLoading(false);
        }, 500);
      } else {
        throw new Error(result.message || 'OAuth callback failed');
      }
    } catch (error) {
      console.error('[GoogleSignInButton] OAuth callback error:', error);
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
      
      const response = await fetch(`/api/auth/sign-in/social`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: 'google',
          callbackURL: window.location.origin + '/',
        }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `OAuth initialization failed: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('[GoogleSignInButton] Web: OAuth URL received');
      
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
    setIsLoading(true);
    
    try {
      console.log('[GoogleSignInButton] Starting Google sign-in...');
      console.log('[GoogleSignInButton] Platform:', Platform.OS);
      
      if (Platform.OS === 'web') {
        // Web flow - improved with better error handling
        await handleWebOAuth();
      } else {
        // Mobile flow - use Expo AuthSession with proxy
        console.log('[GoogleSignInButton] Mobile: Using Expo AuthSession with proxy');
        
        if (!request) {
          console.error('[GoogleSignInButton] Auth request not ready');
          showErrorAlert("Sign In Failed", "Authentication not configured properly");
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

  return (
    <Button
      variant="outline"
      className="w-full"
      onPress={handleGoogleSignIn}
      disabled={isLoading || (Platform.OS !== 'web' && !request)}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        {isLoading ? (
          <ActivityIndicator size="small" />
        ) : (
          <>
            {/* <Text style={{ fontSize: 18 }}>G</Text> */}
            <Text style={{ color: '#333333' }}>Continue with Google</Text>
          </>
        )}
      </View>
    </Button>
  );
}