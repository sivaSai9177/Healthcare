import { authClient } from "@/lib/auth-client";
import { useRouter } from "expo-router";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Alert, Platform } from "react-native";

type UserRole = "operator" | "doctor" | "nurse" | "head_doctor";

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  hospitalId?: string;
  emailVerified: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: {
    email: string;
    password: string;
    name: string;
    role: UserRole;
    hospitalId?: string;
  }) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [forceRefresh, setForceRefresh] = useState(0);

  const { data: session, isPending, refetch } = authClient.useSession();

  useEffect(() => {
    console.log("[AUTH PROVIDER] Session effect triggered:", {
      isPending,
      hasSession: !!session,
      hasUser: !!session?.user,
      userEmail: session?.user?.email,
      forceRefresh
    });
    
    if (!isPending) {
      if (session?.user) {
        const newUser = {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          role: (session.user as any).role || "doctor",
          hospitalId: (session.user as any).hospitalId,
          emailVerified: session.user.emailVerified || false,
        };
        
        console.log("[AUTH PROVIDER] Setting user:", newUser);
        setUser(newUser);
      } else {
        console.log("[AUTH PROVIDER] No session user, clearing user state");
        setUser(null);
      }
      setIsLoading(false);
    }
  }, [session, isPending, forceRefresh]);

  const signIn = async (email: string, password: string): Promise<void> => {
    try {
      await authClient.signIn.email(
        { email, password },
        {
          onSuccess: () => {
            console.log("Sign in successful");
          },
          onError: (ctx) => {
            Alert.alert("Sign In Failed", ctx.error.message || "Invalid credentials");
            throw ctx.error;
          },
        }
      );
      
      console.log("Sign in API call completed, refreshing session...");
      
      // Force multiple refresh attempts for web platform
      await refetch();
      console.log("Session refreshed after login");
      
      // Force a re-render to trigger session check
      setForceRefresh(prev => prev + 1);
      
      // Longer delay for web platform to ensure session is properly set
      const delay = Platform.OS === 'web' ? 500 : 100;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Additional refresh for web if needed
      if (Platform.OS === 'web') {
        console.log("Web platform: Additional session refresh");
        await refetch();
        setForceRefresh(prev => prev + 1);
      }
      
      console.log("Sign in process completed");
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    }
  };

  const signUp = async (data: {
    email: string;
    password: string;
    name: string;
    role: UserRole;
    hospitalId?: string;
  }) => {
    try {
      const response = await authClient.$fetch("/sign-up/email", {
        method: "POST",
        body: {
          email: data.email,
          password: data.password,
          name: data.name,
          role: data.role,
          hospitalId: data.hospitalId,
        },
      });
      
      if (response) {
        console.log("Sign up successful");
        // Auto sign in after signup
        await signIn(data.email, data.password);
        console.log("Auto sign-in after signup completed");
      }
    } catch (error) {
      console.error("Sign up error:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // First clear the user state immediately for better UX
      setUser(null);
      
      await authClient.signOut(
        {},
        {
          onSuccess: () => {
            console.log("Sign out successful");
            // Refresh the session to ensure it's cleared
            refetch();
            // Navigate to login
            router.replace("/(auth)/login");
          },
          onError: (ctx) => {
            console.error("Sign out error:", ctx.error);
            // Even if server logout fails, we should still clear local state
            router.replace("/(auth)/login");
            Alert.alert("Sign Out Warning", "You have been logged out locally, but there may have been an issue clearing your server session.");
          },
        }
      );
    } catch (error) {
      console.error("Sign out error:", error);
      // Fallback: ensure user is logged out locally even if server call fails
      setUser(null);
      router.replace("/(auth)/login");
    }
  };

  const refreshSession = async () => {
    console.log("[AUTH PROVIDER] Manual session refresh requested");
    refetch();
    setForceRefresh(prev => prev + 1);
  };

  // Debug function to check current auth state
  const debugAuthState = React.useCallback(() => {
    console.log("[AUTH DEBUG] Current auth state:", {
      user,
      isLoading,
      isAuthenticated: !!user,
      sessionData: session,
      sessionPending: isPending,
      platform: Platform.OS,
      forceRefresh
    });
  }, [user, isLoading, session, isPending, forceRefresh]);

  // Expose debug function in development
  React.useEffect(() => {
    if (__DEV__) {
      (global as any).debugAuth = debugAuthState;
    }
  }, [debugAuthState]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        signIn,
        signUp,
        signOut,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Hook for requiring authentication
export function useRequireAuth(redirectTo = "/(auth)/login") {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace(redirectTo as any);
    }
  }, [user, isLoading, router, redirectTo]);

  return { user, isLoading };
}

// Hook for role-based access control
export function useRequireRole(allowedRoles: UserRole[], redirectTo = "/(home)") {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user && !allowedRoles.includes(user.role)) {
      Alert.alert("Access Denied", "You don't have permission to access this page");
      router.replace(redirectTo as any);
    }
  }, [user, isLoading, router, allowedRoles, redirectTo]);

  return { user, isLoading, hasAccess: user && allowedRoles.includes(user.role) };
}