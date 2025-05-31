import { expoClient } from "@better-auth/expo/client";
import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { Platform } from "react-native";
import { webStorage, mobileStorage } from "./secure-storage";
import { getApiUrl, config } from "./config";
import type { Auth } from "./auth";

const BASE_URL = getApiUrl();

console.log("[AUTH CLIENT] Platform:", Platform.OS);
console.log("[AUTH CLIENT] Using baseURL:", BASE_URL);

export const authClient = createAuthClient({
  baseURL: BASE_URL,
  plugins: [
    expoClient({
      scheme: config.appScheme,
      storagePrefix: "hospital-alert",
      storage: Platform.OS === 'web' ? webStorage : mobileStorage,
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
  },
  // For web, we need to handle the token manually
  onSuccess: (context: any) => {
    console.log("[AUTH CLIENT] Success callback:", context);
    if (Platform.OS === 'web' && context.token && typeof window !== 'undefined') {
      // Store the token manually for web
      localStorage.setItem('hospital-alert.session-token', context.token);
      console.log("[AUTH CLIENT] Stored session token in localStorage");
    }
  },
});

// Export the properly typed auth client
export type AuthClient = typeof authClient;