import { Redirect } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import React from "react";
import { DelayedLoadingScreen } from "@/components/blocks/loading/DelayedLoadingScreen";

export default function Index() {
  const { user, isLoading, hasHydrated, isAuthenticated } = useAuth();

  // Log only on significant changes
  React.useEffect(() => {
    console.log("[INDEX] Auth state:", {
      hasHydrated,
      isLoading,
      isAuthenticated,
      userEmail: user?.email,
      userRole: user?.role,
      needsProfileCompletion: user?.needsProfileCompletion
    });
  }, [hasHydrated, isLoading, isAuthenticated, user]);

  // Wrap the entire component with DelayedLoadingScreen
  return (
    <DelayedLoadingScreen isLoading={!hasHydrated || isLoading} minDisplayTime={1500}>
      {renderContent()}
    </DelayedLoadingScreen>
  );
  
  function renderContent() {

    // If not authenticated, go to login
    if (!user || !isAuthenticated) {
      console.log("[INDEX] User not authenticated, redirecting to login");
      return <Redirect href="/(public)/auth/login" />;
    }

    // Check if user needs to complete profile
    if (user.needsProfileCompletion === true || user.role === 'user' || !user.role || user.role === 'guest') {
      console.log("[INDEX] User needs profile completion", {
        needsProfileCompletion: user.needsProfileCompletion,
        role: user.role,
        hasOrganizationId: !!user.organizationId
      });
      return <Redirect href="/(public)/auth/complete-profile" />;
    }

    // Authenticated user with completed profile goes to home
    console.log("[INDEX] User authenticated with completed profile, redirecting to home");
    return <Redirect href="/home" />;
  }
}