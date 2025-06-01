import React from "react";
import { Platform, Text, View, ActivityIndicator } from "react-native";
import { Button } from "@/components/shadcn/ui/button";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { authClient } from "@/lib/auth-client";
import { showErrorAlert } from "@/lib/alert";
import { getApiUrl } from "@/lib/config";

// Ensure web browser is ready for auth
WebBrowser.maybeCompleteAuthSession();

export function GoogleSignInButton() {
  const [isLoading, setIsLoading] = React.useState(false);

  // Get client IDs from environment or use defaults
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '59100460814-lvqieq6hjuhvhe0t3gue41cpbp499kr4.apps.googleusercontent.com';
  
  // For development, we need to handle platform-specific requirements
  const googleAuthConfig = Platform.select({
    ios: {
      // iOS requires iosClientId
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || webClientId,
      scopes: ['openid', 'email', 'profile'],
    },
    android: {
      // Android uses androidClientId if available, otherwise webClientId
      androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
      webClientId: webClientId,
      scopes: ['openid', 'email', 'profile'],
    },
    default: {
      webClientId: webClientId,
      scopes: ['openid', 'email', 'profile'],
    },
  });
  
  // Use Expo's Google Auth provider with platform-specific config
  const [request, response, promptAsync] = Google.useAuthRequest(googleAuthConfig);

  const handleAuthCode = React.useCallback(async (code: string) => {
    try {
      console.log('[GoogleSignInButton] Exchanging auth code for session...');
      
      const apiUrl = getApiUrl();
      const exchangeResponse = await fetch(`${apiUrl}/api/auth/google-mobile-callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          redirectUri: request?.redirectUri,
        }),
      });
      
      const exchangeData = await exchangeResponse.json();
      
      if (exchangeResponse.ok && exchangeData.success) {
        console.log('[GoogleSignInButton] Successfully exchanged code for session');
        
        // Force session refresh
        try {
          await authClient.getSession();
          console.log('[GoogleSignInButton] Session refreshed successfully');
        } catch (error) {
          console.log('[GoogleSignInButton] Session refresh error:', error);
        }
      } else {
        throw new Error(exchangeData.error || 'Failed to exchange authorization code');
      }
    } catch (error) {
      console.error('[GoogleSignInButton] Auth code exchange error:', error);
      showErrorAlert("Sign In Failed", "Failed to complete sign in");
    } finally {
      setIsLoading(false);
    }
  }, [request]);

  // Log configuration for debugging
  React.useEffect(() => {
    if (request) {
      console.log('=== GOOGLE OAUTH DEBUG INFO ===');
      console.log('[GoogleSignInButton] Platform:', Platform.OS);
      console.log('[GoogleSignInButton] Request URL:', request.url);
      console.log('[GoogleSignInButton] Redirect URI:', request.redirectUri);
      console.log('[GoogleSignInButton] Client ID:', webClientId.substring(0, 20) + '...');
      console.log('[GoogleSignInButton] Code Challenge:', request.codeChallenge);
      console.log('===============================');
    }
  }, [request, webClientId]);

  // Handle the response
  React.useEffect(() => {
    if (response?.type === 'success') {
      console.log('[GoogleSignInButton] OAuth Success!');
      console.log('[GoogleSignInButton] Auth Code:', response.params.code);
      handleAuthCode(response.params.code);
    } else if (response?.type === 'error') {
      console.error('[GoogleSignInButton] OAuth Error:', response.error);
      setIsLoading(false);
      showErrorAlert("Sign In Failed", "Failed to sign in with Google");
    } else if (response?.type === 'cancel') {
      console.log('[GoogleSignInButton] User cancelled');
      setIsLoading(false);
    }
  }, [response, handleAuthCode]);

  const handleGoogleSignIn = async () => {
    if (Platform.OS === "web") {
      // Web flow - use Better Auth directly
      setIsLoading(true);
      try {
        const response = await fetch(`/api/auth/sign-in/social`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            provider: 'google',
          }),
          credentials: 'include',
        });
        
        const data = await response.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          throw new Error('No redirect URL received');
        }
      } catch (error) {
        console.error("Google sign-in error:", error);
        showErrorAlert("Sign In Failed", "Failed to sign in with Google");
        setIsLoading(false);
      }
    } else {
      // Mobile flow - use Expo's Google Auth
      if (!request) {
        console.error('[GoogleSignInButton] Auth request not ready');
        showErrorAlert("Sign In Failed", "Authentication not configured properly");
        return;
      }
      
      console.log('[GoogleSignInButton] Starting Google OAuth...');
      setIsLoading(true);
      
      // Use Expo's built-in Google authentication
      await promptAsync();
      // Response will be handled by the useEffect above
    }
  };

  return (
    <Button
      variant="outline"
      className="w-full"
      onPress={handleGoogleSignIn}
      disabled={isLoading}
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