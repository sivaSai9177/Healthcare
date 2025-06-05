import { Platform } from "react-native";
import Constants from "expo-constants";

/**
 * Get the API URL based on the platform and environment (synchronous version)
 */
export function getApiUrlSync(): string {
  // For web, use the same origin to avoid CORS cookie issues
  if (Platform.OS === "web") {
    // If running in browser, use the same origin as the web app
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return process.env.EXPO_PUBLIC_API_URL || "http://localhost:8081";
  }

  // For mobile development, try to get the URL from environment variable first
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // For mobile development with Expo, dynamically determine the host
  try {
    const hostUri = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoGo?.debuggerHost;
    
    if (hostUri) {
      // Extract the IP address from hostUri (format: "192.168.1.100:19000")
      const hostname = hostUri.split(":")[0];
      return `http://${hostname}:8081`;
    }
  } catch (error) {
    console.warn("Failed to determine host URI:", error);
  }

  // Fallback to localhost (will only work on simulators)
  return "http://localhost:8081";
}

/**
 * Get the API URL based on the platform and environment (async version for compatibility)
 */
export function getApiUrl(): string {
  // For web, use the same origin to avoid CORS cookie issues
  if (Platform.OS === "web") {
    // If running in browser, use the same origin as the web app
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return process.env.EXPO_PUBLIC_API_URL || "http://localhost:8082";
  }

  // For mobile development, try to get the URL from environment variable first
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // For mobile development with Expo, dynamically determine the host
  try {
    const hostUri = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoGo?.debuggerHost;
    
    if (hostUri) {
      // Extract the IP address from hostUri (format: "192.168.1.100:19000")
      const hostname = hostUri.split(":")[0];
      return `http://${hostname}:8081`;
    }
  } catch (error) {
    console.warn("Failed to determine host URI:", error);
  }

  // Fallback to localhost (will only work on simulators)
  return "http://localhost:8081";
}

/**
 * Get the auth base URL (Better Auth automatically appends /api/auth)
 */
export function getAuthBaseUrl(): string {
  return getApiUrl();
}

/**
 * Get the tRPC URL
 */
export function getTrpcUrl(): string {
  return `${getApiUrl()}/api/trpc`;
}

/**
 * Environment configuration
 */
export const config = {
  // API URLs
  apiUrl: getApiUrlSync(),
  authBaseUrl: getApiUrlSync(),
  trpcUrl: `${getApiUrlSync()}/api/trpc`,
  
  // App configuration
  appScheme: "my-expo",
  
  // Feature flags
  features: {
    emailVerification: process.env.EXPO_PUBLIC_ENABLE_EMAIL_VERIFICATION === "true",
    pushNotifications: process.env.EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS !== "false", // Default to true
    biometricAuth: process.env.EXPO_PUBLIC_ENABLE_BIOMETRIC_AUTH === "true",
  },
  
  // Security
  sessionTimeout: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  
  // Development
  isDevelopment: __DEV__,
  isProduction: !__DEV__,
} as const;

export default config;