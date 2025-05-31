
import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const getBaseURL = () => {
  if (Platform) {
    // Development - use separate API server
    return "http://localhost:3000";
  }
};
export const authClient = createAuthClient({
  baseURL: "http://localhost:8081" /* Base URL of your Better Auth backend. */,
  plugins: [
    expoClient({
      scheme: "expostarter",
      storagePrefix: "expostarter",
      storage: SecureStore,
    }),
  ],
});
