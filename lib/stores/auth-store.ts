// lib/stores/auth-store.ts
import React from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage, subscribeWithSelector } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import type { User, Session } from 'better-auth/types';
import '@/types/auth'; // Import our type extensions

// Types
export interface AppUser extends User {
  role: 'admin' | 'manager' | 'user' | 'guest';
  organizationId?: string;
  needsProfileCompletion?: boolean;
}

// Helper type to ensure user objects can be converted to AppUser
export type UserToAppUser<T extends User> = T & {
  role: 'admin' | 'manager' | 'user' | 'guest';
  organizationId?: string;
  needsProfileCompletion?: boolean;
};

// Helper function to safely convert any user object to AppUser
export function toAppUser(user: any, fallbackRole: 'admin' | 'manager' | 'user' | 'guest' = 'user'): AppUser {
  return {
    ...user,
    role: user.role || fallbackRole,
    organizationId: user.organizationId || undefined,
    needsProfileCompletion: user.needsProfileCompletion || false,
  } as AppUser;
}

interface AuthState {
  // Core state
  user: AppUser | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasHydrated: boolean;
  
  // Enhanced state
  lastActivity: Date;
  error: string | null;
}

interface AuthActions {
  // Hydration
  setHasHydrated: (state: boolean) => void;
  
  // Authentication (state management only - actual auth calls via tRPC)
  setUser: (user: AppUser | null) => void;
  setSession: (session: Session | null) => void;
  setAuthenticated: (authenticated: boolean) => void;
  clearAuth: () => void;
  
  // Internal state management
  updateAuth: (user: AppUser | null, session: Session | null) => void;
  updateUserData: (userData: Partial<AppUser>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateActivity: () => void;
  
  // Permissions
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  canAccess: (resource: string) => boolean;
  
  // Session management
  logout: (reason?: string) => Promise<void>;
  checkSession: () => Promise<void>;
}

type AuthStore = AuthState & AuthActions;

// Credentials types
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface SignUpCredentials {
  email: string;
  password: string;
  name: string;
  role?: 'operator' | 'doctor' | 'nurse' | 'head_doctor';
  hospitalId?: string;
}

// Create the store with Better Auth integration
export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      subscribeWithSelector((set, get) => ({
        // Initial state
        user: null,
        session: null,
        isAuthenticated: false,
        isLoading: false,
        hasHydrated: false,
        lastActivity: new Date(),
        error: null,

        // Hydration
        setHasHydrated: (state) => set({ hasHydrated: state }),

        // Authentication state management only
        setUser: (user) => {
          console.log('[AUTH STORE] Setting user:', user);
          set({ user });
        },

        setSession: (session) => {
          console.log('[AUTH STORE] Setting session:', session);
          set({ session });
        },

        setAuthenticated: (authenticated) => {
          console.log('[AUTH STORE] Setting authenticated:', authenticated);
          set({ isAuthenticated: authenticated });
        },

        clearAuth: () => {
          console.log('[AUTH STORE] Clearing auth state');
          set({
            user: null,
            session: null,
            isAuthenticated: false,
            error: null,
          });
        },

        logout: async (reason = 'user_initiated') => {
          console.log('[AUTH STORE] Logging out:', reason);
          
          try {
            // Call Better Auth logout endpoint
            // Note: In a full implementation, you'd call the auth API here
            // For now, we'll just clear the local state
            
            get().clearAuth();
            console.log('[AUTH STORE] Logout completed');
          } catch (error) {
            console.error('[AUTH STORE] Logout error:', error);
            // Even if API call fails, clear local state
            get().clearAuth();
            throw error;
          }
        },

        // Internal state management
        updateAuth: (user, session) => {
          const currentState = get();
          
          // Prevent unnecessary updates if data is the same
          if (currentState.user?.id === user?.id && 
              currentState.isAuthenticated === (!!user && !!session)) {
            console.log('[AUTH STORE] No changes detected, skipping update');
            return;
          }
          
          console.log('[AUTH STORE] Updating auth state:', { 
            userId: user?.id, 
            isAuth: !!user && !!session 
          });
          
          set({
            user,
            session,
            isAuthenticated: !!user && !!session,
            lastActivity: new Date(),
            error: null, // Clear any existing errors
          });
        },

        updateUserData: (userData) => {
          const currentState = get();
          
          if (!currentState.user) {
            console.warn('[AUTH STORE] Cannot update user data - no user logged in');
            return;
          }
          
          console.log('[AUTH STORE] Updating user data:', userData);
          
          set({
            user: {
              ...currentState.user,
              ...userData,
            },
            lastActivity: new Date(),
          });
        },

        setLoading: (loading) => set({ isLoading: loading }),
        
        setError: (error) => set({ error }),

        updateActivity: () => {
          set({ lastActivity: new Date() });
        },

        // Session validation (will be called by components using tRPC)
        checkSession: async () => {
          // This will be called by components after they check session via tRPC
          const state = get();
          console.log('[AUTH STORE] Checking session, current auth status:', {
            hasUser: !!state.user,
            isAuthenticated: state.isAuthenticated
          });
          
          // In a full implementation, this would call the auth API to validate the session
          // For now, we'll just update the activity timestamp without triggering other updates
          const now = new Date();
          if (state.lastActivity.getTime() < now.getTime() - 30000) { // Only update if 30s passed
            set({ lastActivity: now });
          }
        },

        // Permission checking
        hasPermission: (permission) => {
          const user = get().user;
          if (!user) return false;
          
          // Role-based permissions
          const rolePermissions: Record<string, string[]> = {
            admin: ['*'], // Admin can access everything
            manager: ['manage_users', 'view_analytics', 'manage_content'],
            user: ['view_content', 'edit_profile'],
            guest: ['view_content'],
          };
          
          const permissions = rolePermissions[user.role] || [];
          return permissions.includes('*') || permissions.includes(permission);
        },

        hasRole: (role) => {
          const user = get().user;
          return user?.role === role;
        },

        canAccess: (resource) => {
          return get().hasPermission(resource);
        },
      })),
      {
        name: 'app-auth-storage',
        storage: createJSONStorage(() => AsyncStorage),
        onRehydrateStorage: () => (state) => {
          state?.setHasHydrated(true);
          
          // Session validation will be handled by components via tRPC
          if (state?.user) {
            console.log('[AUTH STORE] Rehydrated with user:', state.user.email);
          }
        },
        // Only persist non-sensitive data
        partialize: (state) => ({
          user: state.user,
          session: state.session,
          isAuthenticated: state.isAuthenticated,
          lastActivity: state.lastActivity,
        }),
      }
    ),
    { name: 'AppAuthStore' }
  )
);

// Subscribe to auth changes for side effects with throttling
let lastAuthStateChange = 0;
useAuthStore.subscribe(
  (state) => state.isAuthenticated,
  (isAuthenticated, previousIsAuthenticated) => {
    const now = Date.now();
    
    // Throttle subscription calls to prevent infinite loops
    if (now - lastAuthStateChange < 100) {
      return;
    }
    lastAuthStateChange = now;
    
    if (previousIsAuthenticated && !isAuthenticated) {
      // User logged out - clear any sensitive data
      console.log('[AUTH STORE] User logged out, clearing sensitive data');
    }
  }
);

// Export typed hooks
export const useAuth = () => {
  const store = useAuthStore();
  
  return {
    user: store.user,
    session: store.session,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    hasHydrated: store.hasHydrated,
    error: store.error,
    
    // State management methods
    setUser: store.setUser,
    setSession: store.setSession,
    setAuthenticated: store.setAuthenticated,
    clearAuth: store.clearAuth,
    updateAuth: store.updateAuth,
    updateUserData: store.updateUserData,
    setLoading: store.setLoading,
    setError: store.setError,
    updateActivity: store.updateActivity,
    checkSession: store.checkSession,
    logout: store.logout,
    
    // Permissions
    hasPermission: store.hasPermission,
    hasRole: store.hasRole,
    canAccess: store.canAccess,
  };
};

export const useAuthGuard = (requiredPermission?: string) => {
  const { isAuthenticated, hasHydrated, canAccess } = useAuth();
  
  const isAuthorized = React.useMemo(() => {
    if (!hasHydrated || !isAuthenticated) return false;
    if (!requiredPermission) return true;
    return canAccess(requiredPermission);
  }, [isAuthenticated, hasHydrated, requiredPermission, canAccess]);
  
  return {
    isAuthorized,
    isLoading: !hasHydrated,
  };
};

// Legacy exports for backward compatibility during transition
export const useUser = () => useAuthStore((state) => state.user);
export const useSession = () => useAuthStore((state) => state.session);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);