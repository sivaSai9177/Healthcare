import { authClient } from "@/lib/auth-client";
import { useRouter } from "expo-router";
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
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
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  // Use optional chaining to safely access useSession
  const sessionHook = authClient.useSession?.();
  const { data: session, isPending = false, error, refetch } = sessionHook || {};
  
  console.log("[AUTH PROVIDER] Hook initialization:", { 
    hasAuthClient: !!authClient,
    hasUseSession: !!authClient.useSession,
    hasSessionHook: !!sessionHook,
    isPending,
    hasSession: !!session
  });
  
  // Check for OAuth callback in URL
  React.useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (url.pathname.includes('/api/auth/callback/')) {
        console.log("[AUTH] OAuth callback detected, refreshing session");
        refetch?.();
      }
    }
  }, [refetch]);
  
  // Create a stable refetch function
  const stableRefetch = React.useCallback(() => {
    if (refetch && typeof refetch === 'function') {
      refetch();
    } else {
      console.warn("[AUTH PROVIDER] refetch not available");
    }
  }, [refetch]);
  // Reduce logging frequency
  useEffect(() => {
    console.log("[AUTH PROVIDER] Session update:", {
      hasSession: !!session,
      hasError: !!error,
      isPending
    });
  }, [session?.user?.id, error, isPending]); // Only log when session ID changes
  
  
  // Debug: Check stored tokens ONCE on mount (web only)
  React.useEffect(() => {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          console.log("[AUTH PROVIDER] Initial token check on mount");
          const keys = Object.keys(window.localStorage).filter(key => key.includes('auth') || key.includes('session'));
          keys.forEach(key => {
            const value = window.localStorage.getItem(key);
            console.log(`[AUTH PROVIDER] ${key}:`, value ? value.substring(0, 50) + '...' : 'null');
          });
        }
      } catch {
        // localStorage might not be available in some environments
        console.log("[AUTH PROVIDER] localStorage not available");
      }
    }
  }, []); // Empty deps - run once on mount

  // Derive user from Better Auth session - single source of truth
  const user = session?.user ? {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: (session.user as any).role || "doctor",
    hospitalId: (session.user as any).hospitalId,
    emailVerified: session.user.emailVerified || false,
  } : null;

  // Handle loading state and session recovery
  useEffect(() => {
    console.log("[AUTH PROVIDER] Session state:", { 
      isPending, 
      hasSession: !!session, 
      hasUser: !!session?.user 
    });
    
    // If authClient is not properly initialized, stop loading
    if (!authClient.useSession) {
      console.log("[AUTH PROVIDER] authClient.useSession not available, stopping loading");
      setIsLoading(false);
      return;
    }
    
    // Set loading false when Better Auth finishes checking session
    if (!isPending) {
      setIsLoading(false);
      
      // Session recovery is handled by Better Auth's expo plugin
    }
    
    // Timeout fallback to prevent infinite loading
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.log("[AUTH PROVIDER] Loading timeout reached, forcing loading to false");
        setIsLoading(false);
      }
    }, 5000); // 5 second timeout
    
    return () => clearTimeout(timeout);
  }, [session, isPending]);



  const signIn = async (email: string, password: string): Promise<void> => {
    try {
      const result = await authClient.signIn.email(
        { email, password },
        {
          onSuccess: async (ctx) => {
            console.log("[SIGNIN] Sign in successful, full context:", JSON.stringify(ctx, null, 2));
            console.log("[SIGNIN] Context data:", ctx.data);
            
            // Store session only for mobile platforms
            // Web handles cookies automatically through the browser
            if (ctx.data && ctx.data.token && Platform.OS !== 'web') {
              console.log("[SIGNIN] Storing session for mobile platform");
              try {
                const { mobileStorage } = await import('../lib/secure-storage');
                
                // Store cookie in Better Auth's expected format for mobile
                const cookieData = {
                  "better-auth.session-token": {
                    value: ctx.data.token,
                    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
                  }
                };
                mobileStorage.setItem('better-auth_cookie', JSON.stringify(cookieData));
                
                // Also store session data for caching
                const sessionData = {
                  user: ctx.data.user,
                  session: {
                    id: ctx.data.token,
                    userId: ctx.data.user?.id,
                    token: ctx.data.token
                  }
                };
                mobileStorage.setItem('better-auth_session_data', JSON.stringify(sessionData));
                
                console.log("[SIGNIN] Stored session in Better Auth format for mobile");
              } catch (error) {
                console.error("[SIGNIN] Failed to store session:", error);
              }
            }
            
            // For web, check if cookies were set
            if (Platform.OS === 'web' && typeof document !== 'undefined') {
              console.log("[SIGNIN] Web cookies after login:", document.cookie);
            }
            
            // Give Better Auth time to persist the session
            setTimeout(() => {
              console.log("[SIGNIN] Refreshing session after delay");
              stableRefetch();
              
              // Check cookies again after delay on web
              if (Platform.OS === 'web' && typeof document !== 'undefined') {
                console.log("[SIGNIN] Web cookies after delay:", document.cookie);
              }
            }, 200);
          },
          onError: (ctx) => {
            Alert.alert("Sign In Failed", ctx.error.message || "Invalid credentials");
            throw ctx.error;
          },
        }
      );
      
      console.log("[SIGNIN] Sign in completed successfully, full result:", JSON.stringify(result, null, 2));
      
      // Double-check session update
      setTimeout(() => {
        console.log("[SIGNIN] Checking session after delay...");
        stableRefetch();
      }, 500);
      
    } catch (error) {
      console.error("[SIGNIN] Sign in error:", error);
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
      // Clear Better Auth storage
      const storage = Platform.OS === 'web' ? 
        (await import('../lib/secure-storage')).webStorage : 
        (await import('../lib/secure-storage')).mobileStorage;
      
      storage.removeItem('better-auth_cookie');
      storage.removeItem('better-auth_session_data');
      
      await authClient.signOut(
        {},
        {
          onSuccess: () => {
            console.log("[SIGNOUT] Sign out successful");
            // Just refresh the session, let auth layout handle navigation
            stableRefetch();
            // Don't navigate here - auth layout will handle it
          },
          onError: (ctx) => {
            console.error("[SIGNOUT] Sign out error:", ctx.error);
            router.replace("/(auth)/login");
            Alert.alert("Sign Out Warning", "You have been logged out locally, but there may have been an issue clearing your server session.");
          },
        }
      );
    } catch (error) {
      console.error("[SIGNOUT] Sign out error:", error);
      // Don't navigate here - let auth state handle it
    }
  };

  const refreshSession = async () => {
    console.log("[AUTH PROVIDER] Manual session refresh requested");
    stableRefetch();
  };


  const refreshUser = useCallback(async () => {
    console.log("[AUTH] Refreshing user data...");
    await stableRefetch();
  }, [stableRefetch]);

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
        refreshUser,
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