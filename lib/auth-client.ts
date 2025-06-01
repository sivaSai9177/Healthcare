import { expoClient } from "@better-auth/expo/client";
import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { Platform } from "react-native";
import { webStorage, mobileStorage } from "./secure-storage";
import { getApiUrl, config } from "./config";
import { sessionManager } from "./auth-session-manager";

const BASE_URL = getApiUrl();

// Log configuration once
console.log("[AUTH CLIENT] Initialized:", {
  platform: Platform.OS,
  baseURL: BASE_URL,
  authEndpoint: `${BASE_URL}/api/auth`
});

export const authClient = createAuthClient({
  baseURL: `${BASE_URL}/api/auth`, // Full auth endpoint path
  plugins: [
    expoClient({
      scheme: config.appScheme,
      storagePrefix: "better-auth", // Use Better Auth's default prefix
      storage: Platform.OS === 'web' ? webStorage : mobileStorage,
      disableCache: false, // Enable session caching
    }),
    inferAdditionalFields({
      user: {
        role: {
          type: "string",
          required: true,
          defaultValue: "doctor",
        },
        hospitalId: {
          type: "string", 
          required: false,
        },
      },
    }),
  ],
  fetchOptions: {
    credentials: 'include', // Important for cookie-based auth on web
    onRequest: (ctx: any) => {
      // For mobile, add stored session token to headers
      if (Platform.OS !== 'web') {
        const token = sessionManager.getSessionToken();
        if (token) {
          if (!ctx.headers) ctx.headers = {};
          ctx.headers['Authorization'] = `Bearer ${token}`;
        }
      }
    },
  },
});

// Export the properly typed auth client
export type AuthClient = typeof authClient;