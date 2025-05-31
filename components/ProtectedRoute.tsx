import { useRequireAuth, useRequireRole } from "@/hooks/useAuth";
import React from "react";
import { ActivityIndicator, View } from "react-native";

type UserRole = "operator" | "doctor" | "nurse" | "head_doctor";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  fallback?: React.ReactNode;
  unauthorizedFallback?: React.ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  requiredRoles,
  fallback,
  unauthorizedFallback,
  redirectTo
}: ProtectedRouteProps) {
  const { user: authUser, isLoading: authLoading } = useRequireAuth();
  
  // Always call the hook, but pass empty array if no roles required
  const roleResult = useRequireRole(requiredRoles || [], redirectTo);
  
  const user = requiredRoles ? roleResult.user : authUser;
  const isLoading = requiredRoles ? roleResult.isLoading : authLoading;
  const hasAccess = requiredRoles ? roleResult.hasAccess : true;

  if (isLoading) {
    return fallback || (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!user) {
    return null; // Will redirect via useRequireAuth
  }

  if (requiredRoles && !hasAccess) {
    return unauthorizedFallback || null; // Will redirect via useRequireRole
  }

  return <>{children}</>;
}

// HOC version for easier usage
export function withProtectedRoute<T extends object>(
  Component: React.ComponentType<T>,
  requiredRoles?: UserRole[]
) {
  return function ProtectedComponent(props: T) {
    return (
      <ProtectedRoute requiredRoles={requiredRoles}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}