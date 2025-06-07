// Import crypto polyfill first for React Native
import "../core/crypto";

import { expoClient } from "@better-auth/expo/client";
import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { Platform } from "react-native";
import { webStorage, mobileStorage } from "../core/secure-storage";
import { getApiUrlSync } from "../core/config";
import { sessionManager } from "./auth-session-manager";
// Note: Removed auth-store import to prevent circular dependency

const BASE_URL = getApiUrlSync();

// Log configuration once (only on client side)
if (typeof window !== 'undefined') {
  console.log("[AUTH CLIENT] Initialized:", {
    platform: Platform.OS,
    baseURL: BASE_URL,
    authEndpoint: `${BASE_URL}/api/auth`
  });
}

export const authClient = createAuthClient({
  baseURL: `${BASE_URL}/api/auth`, // Full auth endpoint path
  plugins: [
    expoClient({
      scheme: "expo-starter", // App scheme from app.json
      storagePrefix: "better-auth", // Use Better Auth's default prefix
      storage: Platform.OS === 'web' ? webStorage : mobileStorage,
      disableCache: false, // Enable session caching
    }),
    inferAdditionalFields({
      user: {
        role: {
          type: "string",
          required: true,
          defaultValue: "user",
        },
        organizationId: {
          type: "string", 
          required: false,
        },
        organizationName: {
          type: "string",
          required: false,
        },
        department: {
          type: "string",
          required: false,
        },
        needsProfileCompletion: {
          type: "boolean",
          required: false,
          defaultValue: true,
        },
      },
    }),
  ],
  fetchOptions: {
    credentials: 'include', // Important for cookie-based auth on web
    onRequest: (ctx: any) => {
      // The Expo plugin handles cookie management automatically
      // No need to manually add headers
      console.log('[AUTH CLIENT] Request to:', ctx.url);
    },
    onResponse: async (ctx: any) => {
      // The Expo plugin handles cookie storage automatically
      // Log for debugging purposes only
      if (ctx.response && ctx.response.headers) {
        const setCookie = ctx.response.headers.get('set-cookie');
        if (setCookie) {
          console.log('[AUTH CLIENT] Set-Cookie header received (handled by Expo plugin)');
        }
      }
      
      // Update Zustand store on successful auth responses
      if (ctx.response && ctx.response.ok && ctx.url && ctx.url.includes('/api/auth')) {
        try {
          const data = await ctx.response.clone().json();
          
          // Handle sign-in/sign-up responses
          if (ctx.url && (ctx.url.includes('/signin') || ctx.url.includes('/signup')) && data.user) {
            console.log('[AUTH CLIENT] Response received, storing session data');
            
            // Log the response structure for debugging
            console.log('[AUTH CLIENT] Sign-in response structure:', {
              platform: Platform.OS,
              hasToken: !!data.token,
              hasSession: !!data.session,
              hasSessionToken: !!data.session?.token,
              tokenValue: data.token ? `${data.token.substring(0, 10)}...` : null,
              sessionKeys: data.session ? Object.keys(data.session) : [],
              dataKeys: Object.keys(data),
            });
            
            // Better Auth returns the token at the top level or in session
            const token = data.token || data.session?.token || data.sessionToken;
            
            // Create a proper session object
            const session = data.session || (token ? { 
              id: crypto.randomUUID(),
              token: token, 
              userId: data.user.id,
              createdAt: new Date(),
              updatedAt: new Date(),
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            } : null);
            
            // Store token for mobile platforms
            if (Platform.OS !== 'web' && token) {
              console.log('[AUTH CLIENT] Mobile session - ensuring token is accessible');
              
              try {
                // Store in session manager for persistence
                await sessionManager.storeSession({ token, userId: data.user.id });
                console.log('[AUTH CLIENT] Stored session token for mobile API access');
                
                // Update Zustand store with session info
                const { useAuthStore } = require('@/lib/stores/auth-store');
                const authStore = useAuthStore.getState();
                if (session) {
                  authStore.setSession(session);
                }
                
              } catch (e) {
                console.log('[AUTH CLIENT] Could not store session token:', e);
              }
            }
          }
        } catch (error) {
          // Response might not be JSON, ignore
        }
      }
    },
  },
});

// Export the properly typed auth client
export type AuthClient = typeof authClient;