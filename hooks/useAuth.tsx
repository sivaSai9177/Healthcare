import { authClient } from "@/lib/auth-client";
import { getApiUrl } from "@/lib/config";
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

  // Platform-specific session management
  const [webSessionChecked, setWebSessionChecked] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  
  // Use ref to track current user to avoid dependency issues
  const userRef = React.useRef<User | null>(null);
  React.useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Immediate cached data load for mobile to prevent premature redirect
  React.useEffect(() => {
    const loadCachedData = async () => {
      if (Platform.OS !== 'web' && !initialLoadComplete) {
        console.log("[INITIAL LOAD] Checking for cached user data immediately...");
        try {
          const { getItemAsync } = await import('expo-secure-store');
          const cachedUserData = await getItemAsync('hospital-alert.cached-user');
          
          if (cachedUserData) {
            const cachedUser = JSON.parse(cachedUserData);
            console.log("[INITIAL LOAD] Found cached user, setting immediately to prevent redirect:", cachedUser);
            setUser(cachedUser);
            setIsLoading(false);
          }
        } catch (error) {
          console.error("[INITIAL LOAD] Failed to load cached user:", error);
        }
        setInitialLoadComplete(true);
      }
    };

    loadCachedData();
  }, [initialLoadComplete]);

  // Web-specific session verification
  useEffect(() => {
    const verifyWebSession = async () => {
      if (Platform.OS === 'web' && !webSessionChecked && typeof window !== 'undefined') {
        console.log("[WEB SESSION] Starting web session verification...");
        console.log("[WEB SESSION] Current localStorage keys:", Object.keys(localStorage));
        console.log("[WEB SESSION] Document cookies:", document.cookie);
        
        // Check multiple sources for the session token
        const tokenSources = {
          betterAuthToken: localStorage.getItem('better-auth.session-token'),
          hospitalAlertToken: localStorage.getItem('hospital-alert.session-token'),
          cachedUser: localStorage.getItem('hospital-alert.cached-user'),
          cookies: document.cookie
        };
        
        console.log("[WEB SESSION] Session sources:", {
          betterAuthToken: tokenSources.betterAuthToken ? 'Found' : 'Not found',
          hospitalAlertToken: tokenSources.hospitalAlertToken ? 'Found' : 'Not found', 
          cachedUser: tokenSources.cachedUser ? 'Found' : 'Not found',
          cookies: tokenSources.cookies ? 'Found' : 'Empty'
        });
        
        const token = tokenSources.betterAuthToken || tokenSources.hospitalAlertToken;
        
        // If we have cached user data, use it immediately to prevent redirect
        if (tokenSources.cachedUser) {
          try {
            const cachedUser = JSON.parse(tokenSources.cachedUser);
            console.log("[WEB SESSION] Found cached user, setting immediately:", cachedUser);
            setUser(cachedUser);
            setIsLoading(false);
          } catch (error) {
            console.error("[WEB SESSION] Failed to parse cached user:", error);
          }
        }
        
        if (token) {
          console.log("[WEB SESSION] Found token, verifying with server...");
          
          // Set loading to false to prevent redirect while we verify
          setIsLoading(false);
          console.log("[WEB SESSION] Set loading to false to prevent redirect");
          
          try {
            // Manual session verification - try multiple endpoints
            const apiUrl = getApiUrl();
            let response;
            let sessionData = null;
            
            // Try different session endpoints
            const endpoints = [
              `${apiUrl}/api/auth/get-session`,
              `${apiUrl}/api/auth/session`,
              `${apiUrl}/api/auth/me`
            ];
            
            for (const endpoint of endpoints) {
              try {
                console.log(`[WEB SESSION] Trying endpoint: ${endpoint}`);
                response = await fetch(endpoint, {
                  method: 'GET',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Cookie': document.cookie, // Include cookies manually
                  },
                  credentials: 'include',
                });
                
                if (response.ok) {
                  sessionData = await response.json();
                  console.log(`[WEB SESSION] Success with endpoint ${endpoint}:`, sessionData);
                  break;
                } else {
                  console.log(`[WEB SESSION] Failed with ${endpoint}, status:`, response.status);
                }
              } catch (error) {
                console.log(`[WEB SESSION] Error with ${endpoint}:`, error);
              }
            }
            
            if (sessionData?.user) {
              const webUser = {
                id: sessionData.user.id,
                email: sessionData.user.email,
                name: sessionData.user.name,
                role: (sessionData.user as any).role || "doctor",
                hospitalId: (sessionData.user as any).hospitalId,
                emailVerified: sessionData.user.emailVerified || false,
              };
              
              setUser(webUser);
              // Cache user data for future session persistence
              localStorage.setItem('hospital-alert.cached-user', JSON.stringify(webUser));
              console.log("[WEB SESSION] Set user from manual verification and cached data:", webUser);
            } else if (!sessionData) {
              console.log("[WEB SESSION] Session verification failed with server");
              
              // Check if we have cached user data as a fallback
              const cachedUserData = localStorage.getItem('hospital-alert.cached-user');
              if (cachedUserData) {
                try {
                  const parsedUser = JSON.parse(cachedUserData);
                  console.log("[WEB SESSION] Using cached user data as fallback:", parsedUser);
                  setUser(parsedUser);
                } catch (error) {
                  console.log("[WEB SESSION] Failed to parse cached user data, clearing tokens");
                  localStorage.removeItem('better-auth.session-token');
                  localStorage.removeItem('hospital-alert.session-token');
                  localStorage.removeItem('hospital-alert.cached-user');
                }
              } else {
                console.log("[WEB SESSION] No cached user data, clearing tokens");
                localStorage.removeItem('better-auth.session-token');
                localStorage.removeItem('hospital-alert.session-token');
              }
            }
          } catch (error) {
            console.error("[WEB SESSION] Session verification error:", error);
          }
        } else {
          console.log("[WEB SESSION] No token found");
          // Even without token, check if Better Auth has session data
          console.log("[WEB SESSION] Checking Better Auth session directly...", { session, isPending });
        }
        
        setWebSessionChecked(true);
        if (!userRef.current) {
          setIsLoading(false);
        }
      }
    };

    if (Platform.OS === 'web') {
      verifyWebSession();
    }
  }, [webSessionChecked]);

  useEffect(() => {
    console.log("[AUTH PROVIDER] Session effect triggered:", {
      isPending,
      hasSession: !!session,
      hasUser: !!session?.user,
      userEmail: session?.user?.email,
      sessionData: session,
      forceRefresh,
      platform: Platform.OS,
      webSessionChecked
    });
    
    // Debug web storage if on web platform
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      console.log("[AUTH DEBUG] Web localStorage keys:", Object.keys(localStorage));
      console.log("[AUTH DEBUG] Hospital alert keys:", Object.keys(localStorage).filter(key => key.includes('hospital-alert')));
    }
    
    // Handle session for mobile platforms (not web) 
    if (Platform.OS !== 'web' && !isPending && initialLoadComplete) {
      console.log("[AUTH PROVIDER] Mobile session check:", {
        hasSession: !!session,
        hasUser: !!session?.user,
        sessionData: session,
        currentUser: userRef.current ? `${userRef.current.email} (${userRef.current.id})` : 'None',
        initialLoadComplete
      });
      
      if (session?.user) {
        // Better Auth session is working, use it and update cache
        const newUser = {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          role: (session.user as any).role || "doctor",
          hospitalId: (session.user as any).hospitalId,
          emailVerified: session.user.emailVerified || false,
        };
        
        // Only update user if it's different to prevent re-render loops
        if (!userRef.current || userRef.current.id !== newUser.id || userRef.current.email !== newUser.email) {
          console.log("[AUTH PROVIDER] Setting user from Better Auth session (mobile):", newUser);
          setUser(newUser);
          
          // Update cached data
          import('expo-secure-store').then(({ setItemAsync }) => {
            setItemAsync('hospital-alert.cached-user', JSON.stringify(newUser)).catch(console.error);
          });
        }
        setIsLoading(false);
      } else if (!session && userRef.current) {
        // If no Better Auth session but we have cached user, keep the cached user
        console.log("[AUTH PROVIDER] No Better Auth session but have cached user - preserving (mobile)");
        setIsLoading(false);
      } else if (!session && !userRef.current) {
        // No session and no cached user - user is not authenticated
        console.log("[AUTH PROVIDER] No session and no cached user - user not authenticated (mobile)");
        setIsLoading(false);
      }
    }
    
    // For web, handle session differently - prefer Better Auth session when available
    if (Platform.OS === 'web' && !isPending) {
      if (session?.user) {
        // Better Auth session is working, use it
        const newUser = {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          role: (session.user as any).role || "doctor",
          hospitalId: (session.user as any).hospitalId,
          emailVerified: session.user.emailVerified || false,
        };
        
        if (!userRef.current || userRef.current.id !== newUser.id) {
          console.log("[AUTH PROVIDER] Setting user from Better Auth session (web):", newUser);
          setUser(newUser);
          // Cache the user data
          localStorage.setItem('hospital-alert.cached-user', JSON.stringify(newUser));
        }
        setIsLoading(false);
      } else if (webSessionChecked && !userRef.current) {
        // No Better Auth session, try cached user data
        const cachedUserData = localStorage.getItem('hospital-alert.cached-user');
        if (cachedUserData) {
          try {
            const cachedUser = JSON.parse(cachedUserData);
            console.log("[AUTH PROVIDER] No Better Auth session, using cached user (web):", cachedUser);
            setUser(cachedUser);
          } catch (error) {
            console.error("[AUTH PROVIDER] Failed to parse cached user data:", error);
            localStorage.removeItem('hospital-alert.cached-user');
          }
        }
        setIsLoading(false);
      }
    }
  }, [session, isPending, forceRefresh, webSessionChecked, initialLoadComplete]);

  const signIn = async (email: string, password: string): Promise<void> => {
    try {
      const response = await authClient.signIn.email(
        { email, password },
        {
          onSuccess: (ctx) => {
            console.log("Sign in successful, response:", ctx);
            
            // For web platform, manually store the token if available
            if (Platform.OS === 'web' && ctx.data?.token && typeof window !== 'undefined') {
              localStorage.setItem('hospital-alert.session-token', ctx.data.token);
              console.log("[SIGNIN] Manually stored session token for web");
            }
          },
          onError: (ctx) => {
            Alert.alert("Sign In Failed", ctx.error.message || "Invalid credentials");
            throw ctx.error;
          },
        }
      );
      
      console.log("[SIGNIN] Full response:", response);
      
      // Extract token and user from response and handle manually for web
      if (Platform.OS === 'web' && response?.data) {
        console.log("[SIGNIN] Found response data:", response.data);
        
        if (response.data.token) {
          const token = response.data.token;
          console.log("[SIGNIN] Found token in response:", token.substring(0, 10) + "...");
          localStorage.setItem('hospital-alert.session-token', token);
          localStorage.setItem('better-auth.session-token', token);
          console.log("[SIGNIN] Stored token with both key formats");
        }
        
        // Manually set user state for web if user data is available
        if (response.data.user) {
          console.log("[SIGNIN] Found user in response, setting manually for web");
          const userData = response.data.user as any; // Type assertion for additional fields
          const newUser = {
            id: userData.id,
            email: userData.email,
            name: userData.name,
            role: userData.role || "doctor",
            hospitalId: userData.hospitalId,
            emailVerified: userData.emailVerified || false,
          };
          
          // Set user state immediately for web platform
          setUser(newUser);
          setIsLoading(false);
          setWebSessionChecked(true); // Mark as checked since we just set the user
          
          // Cache user data for session persistence
          if (Platform.OS === 'web') {
            localStorage.setItem('hospital-alert.cached-user', JSON.stringify(newUser));
          } else {
            // For mobile, store in SecureStore
            import('expo-secure-store').then(({ setItemAsync }) => {
              setItemAsync('hospital-alert.cached-user', JSON.stringify(newUser)).catch(console.error);
            });
          }
          console.log("[SIGNIN] Manually set user state and cached user data:", newUser);
          return; // Skip the normal refresh flow
        }
      }
      
      console.log("Sign in API call completed, refreshing session...");
      
      // Platform-specific delay and session handling
      if (Platform.OS === 'web') {
        // For web, we need to ensure cookies are properly set
        await new Promise(resolve => setTimeout(resolve, 1000)); // Longer delay for web
        
        // Check if session token exists in storage/cookies
        if (typeof window !== 'undefined') {
          console.log("[AUTH DEBUG] Document cookies:", document.cookie);
          console.log("[AUTH DEBUG] LocalStorage items:", Object.keys(localStorage).filter(key => key.includes('auth') || key.includes('session')));
        }
        
        // Try multiple refresh attempts for web
        for (let i = 0; i < 3; i++) {
          refetch();
          console.log(`[AUTH DEBUG] Refresh attempt ${i + 1}`);
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      } else {
        await new Promise(resolve => setTimeout(resolve, 100));
        refetch();
      }
      
      console.log("Session refreshed after login");
      
      // Force re-render multiple times for web
      setForceRefresh(prev => prev + 1);
      if (Platform.OS === 'web') {
        setTimeout(() => setForceRefresh(prev => prev + 1), 500);
        setTimeout(() => setForceRefresh(prev => prev + 1), 1000);
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
      
      // Clear all cached data for web
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        localStorage.removeItem('better-auth.session-token');
        localStorage.removeItem('hospital-alert.session-token');
        localStorage.removeItem('hospital-alert.cached-user');
        console.log("[SIGNOUT] Cleared all cached data");
      }
      
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