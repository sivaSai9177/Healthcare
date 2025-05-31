import { Redirect } from "expo-router";
import { authClient } from "@/lib/auth-client";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
  const { data: session, isPending } = authClient.useSession();

  console.log("[INDEX] Session state:", {
    isPending,
    hasSession: !!session,
    hasUser: !!session?.user,
    userEmail: session?.user?.email
  });

  if (isPending) {
    console.log("[INDEX] Session pending, showing loading");
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Redirect based on authentication status
  if (session?.user) {
    console.log("[INDEX] User authenticated, redirecting to home");
    return <Redirect href="/(home)" />;
  }
  
  console.log("[INDEX] User not authenticated, redirecting to login");
  return <Redirect href="/(auth)/login" />;
}