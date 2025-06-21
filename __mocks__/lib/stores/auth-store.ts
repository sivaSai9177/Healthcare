// Mock for auth-store.ts
import { create } from 'zustand';

// Define types for the mock store
interface MockUser {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions?: string[];
  organizationId?: string;
  organizationName?: string;
  organizationRole?: string;
  department?: string;
  needsProfileCompletion?: boolean;
  emailVerified?: boolean;
  defaultHospitalId?: string;
}

interface MockSession {
  id: string;
  sessionId?: string;
  expiresAt?: string;
}

interface MockAuthStore {
  // State
  user: MockUser | null;
  session: MockSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasHydrated: boolean;
  lastActivity: Date;
  error: any;
  isRefreshing: boolean;
  
  // Actions
  setHasHydrated: (state: boolean) => void;
  setUser: (user: MockUser | null) => void;
  setSession: (session: MockSession | null) => void;
  setAuthenticated: (authenticated: boolean) => void;
  clearAuth: () => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: any) => void;
  setRefreshing: (isRefreshing: boolean) => void;
  updateAuth: (user: MockUser | null, session: MockSession | null) => void;
  updateUserData: (updates: Partial<MockUser>) => void;
  updateActivity: () => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  canAccess: (resource: string) => boolean;
  logout: jest.Mock;
  signOut: jest.Mock;
  checkSession: jest.Mock;
}

// Mock auth store with basic functionality
const createAuthStore = () => {
  const store = create<MockAuthStore>((set, get) => ({
    // State
    user: null,
    session: null,
    isAuthenticated: false,
    isLoading: false,
    hasHydrated: false,
    lastActivity: new Date(),
    error: null,
    isRefreshing: false,

    // Actions
    setHasHydrated: (state) => set({ hasHydrated: state }),
    setUser: (user) => set({ 
      user, 
      isAuthenticated: !!user 
    }),
    setSession: (session) => set({ session }),
    setAuthenticated: (authenticated) => set({ isAuthenticated: authenticated }),
    clearAuth: () => set({
      user: null,
      session: null,
      isAuthenticated: false,
      error: null,
    }),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
    setRefreshing: (isRefreshing) => set({ isRefreshing }),
    updateAuth: (user, session) => {
      const currentState = get();
      if (currentState.user?.id !== user?.id || currentState.session?.sessionId !== session?.sessionId) {
        set({ user, session, isAuthenticated: !!user });
      }
    },
    updateUserData: (updates) => {
      const currentUser = get().user;
      if (currentUser) {
        set({ user: { ...currentUser, ...updates } });
      }
    },
    updateActivity: () => {
      const now = new Date();
      const lastActivity = get().lastActivity;
      if (now.getTime() - lastActivity.getTime() > 10000) {
        set({ lastActivity: now });
      }
    },
    hasPermission: (permission) => {
      const user = get().user;
      return user?.permissions?.includes(permission) || false;
    },
    hasRole: (role) => {
      const user = get().user;
      return user?.role === role;
    },
    canAccess: (resource) => {
      const user = get().user;
      return !!user;
    },
    logout: jest.fn(async (reason) => {
      get().clearAuth();
    }),
    signOut: jest.fn(async () => {
      get().clearAuth();
    }),
    checkSession: jest.fn(async () => {}),
  }));

  return store;
};

// Create the mock store
export const useAuthStore = createAuthStore();

// Helper function for the actual export
export const useAuth = () => useAuthStore();

// Helper for auth guard
export const useAuthGuard = (permission?: string) => {
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const user = useAuthStore((state) => state.user);
  const hasPermission = useAuthStore((state) => state.hasPermission);
  
  return {
    isAuthorized: permission ? hasPermission(permission) : !!user,
    isLoading: !hasHydrated,
    user,
  };
};

// Mock the toAppUser function
export const toAppUser = (user, fallbackRole = 'user') => ({
  ...user,
  role: user.role || fallbackRole,
  organizationId: user.organizationId || undefined,
  organizationName: user.organizationName || undefined,
  organizationRole: user.organizationRole || undefined,
  department: user.department || undefined,
  needsProfileCompletion: user.needsProfileCompletion || false,
  emailVerified: user.emailVerified !== false,
  defaultHospitalId: user.defaultHospitalId || undefined,
});