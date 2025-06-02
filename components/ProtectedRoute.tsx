import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, View, Alert } from "react-native";

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
  redirectTo = "/(home)"
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user && requiredRoles) {
      const hasAccess = requiredRoles.includes(user.role);
      if (!hasAccess) {
        Alert.alert("Access Denied", "You don't have permission to access this page");
        router.replace(redirectTo as any);
      }
    }
  }, [user, isLoading, requiredRoles, router, redirectTo]);

  if (isLoading) {
    return fallback || (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Auth protection is now handled at root level via Stack.Protected
  if (!user) {
    return null; // This shouldn't happen with root-level protection
  }

  // Role-based access control
  if (requiredRoles) {
    const hasAccess = requiredRoles.includes(user.role);
    if (!hasAccess) {
      return unauthorizedFallback || null; // Will redirect via useEffect
    }
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

// Hook for role-based access control (simplified)
export function useRequireRole(allowedRoles: UserRole[], redirectTo = "/(home)") {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user && !allowedRoles.includes(user.role)) {
      Alert.alert("Access Denied", "You don't have permission to access this page");
      router.replace(redirectTo as any);
    }
  }, [user, isLoading, router, allowedRoles, redirectTo]);

  return { 
    user, 
    isLoading, 
    hasAccess: user ? allowedRoles.includes(user.role) : false 
  };
}