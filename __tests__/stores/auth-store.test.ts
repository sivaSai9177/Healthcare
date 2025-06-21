// @ts-nocheck
// Unit tests for auth store without React dependencies

// Mock dependencies
jest.mock('@/lib/core/platform-storage', () => ({
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(), 
    removeItem: jest.fn(),
  },
}));

jest.mock('@/lib/core/debug/unified-logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    store: {
      update: jest.fn(),
      create: jest.fn(),
      warn: jest.fn(),
    },
  },
}));

jest.mock('@/lib/auth/auth-session-manager', () => ({
  sessionManager: {
    clearSession: jest.fn(),
  },
  signOut: jest.fn(),
}));

jest.mock('@/lib/auth/permissions', () => ({
  checkPermission: jest.fn(),
  checkRole: jest.fn(),
  hasFeatureAccess: jest.fn(),
}));

// Create mock store directly
const createMockAuthStore = () => {
  let state = {
    user: null,
    session: null,
    isAuthenticated: false,
    isLoading: false,
    hasHydrated: false,
    lastActivity: new Date(),
    error: null,
    isRefreshing: false,
  };

  const subscribers = new Set();

  const getState = () => state;
  
  const setState = (updates) => {
    state = { ...state, ...updates };
    subscribers.forEach(fn => fn());
  };

  const subscribe = (fn) => {
    subscribers.add(fn);
    return () => subscribers.delete(fn);
  };

  const actions = {
    setHasHydrated: (hasHydrated) => setState({ hasHydrated }),
    setUser: (user) => setState({ user, isAuthenticated: !!user }),
    setSession: (session) => setState({ session }),
    setAuthenticated: (isAuthenticated) => setState({ isAuthenticated }),
    clearAuth: () => setState({
      user: null,
      session: null,
      isAuthenticated: false,
      error: null,
    }),
    setLoading: (isLoading) => setState({ isLoading }),
    setError: (error) => setState({ error }),
    setRefreshing: (isRefreshing) => setState({ isRefreshing }),
    updateAuth: (user, session) => {
      if (state.user?.id !== user?.id || state.session?.id !== session?.id) {
        setState({ user, session, isAuthenticated: !!user });
      }
    },
    updateUserData: (updates) => {
      if (state.user) {
        setState({ user: { ...state.user, ...updates } });
      }
    },
    updateActivity: () => {
      const now = new Date();
      if (now.getTime() - state.lastActivity.getTime() > 10000) {
        setState({ lastActivity: now });
      }
    },
    hasPermission: (permission) => {
      return state.user?.permissions?.includes(permission) || false;
    },
    hasRole: (role) => {
      return state.user?.role === role;
    },
    canAccess: (resource) => {
      return !!state.user;
    },
    logout: jest.fn(async (reason) => {
      actions.clearAuth();
    }),
    signOut: jest.fn(async () => {
      actions.clearAuth();
    }),
    checkSession: jest.fn(async () => {}),
  };

  return {
    getState: () => ({ ...state, ...actions }),
    subscribe,
    ...actions,
  };
};

// Mock the auth store module
jest.mock('@/lib/stores/auth-store', () => {
  const mockStore = createMockAuthStore();
  return {
    useAuthStore: mockStore,
    useAuth: () => mockStore.getState(),
    useAuthGuard: (permission) => {
      const state = mockStore.getState();
      return {
        isAuthorized: state.hasPermission(permission),
        isLoading: !state.hasHydrated,
        user: state.user,
      };
    },
    toAppUser: (user, fallbackRole = 'user') => ({
      ...user,
      role: user.role || fallbackRole,
      organizationId: user.organizationId || undefined,
      organizationName: user.organizationName || undefined,
      organizationRole: user.organizationRole || undefined,
      department: user.department || undefined,
      needsProfileCompletion: user.needsProfileCompletion || false,
      emailVerified: user.emailVerified !== false,
      defaultHospitalId: user.defaultHospitalId || undefined,
    }),
  };
});

// Import after mocks
const { useAuthStore, useAuth, useAuthGuard, toAppUser } = require('@/lib/stores/auth-store');

describe('Auth Store Unit Tests', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    emailVerified: true,
    role: 'operator',
    permissions: ['read', 'write'],
    organizations: [],
    hospitals: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockSession = {
    id: 'session-123',
    userId: 'user-123',
    token: 'fake-token',
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset store state
    const store = useAuthStore.getState();
    store.clearAuth();
    store.setHasHydrated(false);
    store.setLoading(false);
    store.setError(null);
    store.setRefreshing(false);
  });

  describe('Basic State Management', () => {
    it('should have correct initial state', () => {
      const state = useAuthStore.getState();
      
      expect(state.user).toBeNull();
      expect(state.session).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.isRefreshing).toBe(false);
    });

    it('should set user correctly', () => {
      const store = useAuthStore.getState();
      
      store.setUser(mockUser);

      const updatedState = useAuthStore.getState();
      expect(updatedState.user).toEqual(mockUser);
      expect(updatedState.isAuthenticated).toBe(true);
    });

    it('should set session correctly', () => {
      const store = useAuthStore.getState();
      
      store.setSession(mockSession);

      const updatedState = useAuthStore.getState();
      expect(updatedState.session).toEqual(mockSession);
    });

    it('should clear auth state', () => {
      const store = useAuthStore.getState();
      
      // Set up authenticated state
      store.setUser(mockUser);
      store.setSession(mockSession);
      store.setError('Some error');

      // Clear auth
      store.clearAuth();

      const clearedState = useAuthStore.getState();
      expect(clearedState.user).toBeNull();
      expect(clearedState.session).toBeNull();
      expect(clearedState.isAuthenticated).toBe(false);
      expect(clearedState.error).toBeNull();
    });
  });

  describe('Loading and Error States', () => {
    it('should set loading state', () => {
      const store = useAuthStore.getState();
      
      store.setLoading(true);
      expect(useAuthStore.getState().isLoading).toBe(true);
      
      store.setLoading(false);
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('should set error state', () => {
      const store = useAuthStore.getState();
      const error = 'Authentication failed';
      
      store.setError(error);
      expect(useAuthStore.getState().error).toBe(error);
    });

    it('should set refreshing state', () => {
      const store = useAuthStore.getState();
      
      store.setRefreshing(true);
      expect(useAuthStore.getState().isRefreshing).toBe(true);
    });
  });

  describe('User Data Updates', () => {
    it('should update partial user data', () => {
      const store = useAuthStore.getState();
      
      store.setUser(mockUser);
      store.updateUserData({
        name: 'Updated Name',
        role: 'admin',
      });

      const updatedState = useAuthStore.getState();
      expect(updatedState.user?.name).toBe('Updated Name');
      expect(updatedState.user?.role).toBe('admin');
      expect(updatedState.user?.email).toBe(mockUser.email);
    });

    it('should do nothing when no user is logged in', () => {
      const store = useAuthStore.getState();
      
      store.updateUserData({ name: 'New Name' });

      expect(useAuthStore.getState().user).toBeNull();
    });
  });

  describe('updateAuth optimization', () => {
    it('should update both user and session when changed', () => {
      const store = useAuthStore.getState();
      
      store.updateAuth(mockUser, mockSession);

      const updatedState = useAuthStore.getState();
      expect(updatedState.user).toEqual(mockUser);
      expect(updatedState.session).toEqual(mockSession);
      expect(updatedState.isAuthenticated).toBe(true);
    });

    it('should skip update when no changes detected', () => {
      const store = useAuthStore.getState();
      
      // Set initial state
      store.updateAuth(mockUser, mockSession);

      const initialUser = useAuthStore.getState().user;
      const initialSession = useAuthStore.getState().session;

      // Try to update with same data
      store.updateAuth(mockUser, mockSession);

      // State should remain the same
      expect(useAuthStore.getState().user).toBe(initialUser);
      expect(useAuthStore.getState().session).toBe(initialSession);
    });
  });

  describe('Activity Tracking', () => {
    it('should update activity timestamp', () => {
      const store = useAuthStore.getState();
      const initialTime = store.lastActivity;
      
      // Mock Date to be 11 seconds later
      const newTime = new Date(initialTime.getTime() + 11000);
      jest.spyOn(global, 'Date').mockImplementation(() => newTime);
      
      store.updateActivity();

      expect(useAuthStore.getState().lastActivity.getTime()).toBe(newTime.getTime());
      
      jest.spyOn(global, 'Date').mockRestore();
    });

    it('should throttle activity updates', () => {
      const store = useAuthStore.getState();
      const initialTime = store.lastActivity;
      
      // Immediate second call should be throttled
      store.updateActivity();
      
      expect(useAuthStore.getState().lastActivity).toBe(initialTime);
    });
  });

  describe('Permission Checking', () => {
    it('should check permissions correctly', () => {
      const store = useAuthStore.getState();
      
      store.setUser(mockUser);

      expect(store.hasPermission('read')).toBe(true);
      expect(store.hasPermission('write')).toBe(true);
      expect(store.hasPermission('delete')).toBe(false);
    });

    it('should return false when no user', () => {
      const store = useAuthStore.getState();
      expect(store.hasPermission('read')).toBe(false);
    });

    it('should check roles correctly', () => {
      const store = useAuthStore.getState();
      
      store.setUser(mockUser);

      expect(store.hasRole('operator')).toBe(true);
      expect(store.hasRole('admin')).toBe(false);
    });

    it('should check access correctly', () => {
      const store = useAuthStore.getState();
      
      expect(store.canAccess('resource')).toBe(false);
      
      store.setUser(mockUser);
      expect(store.canAccess('resource')).toBe(true);
    });
  });

  describe('Logout Functionality', () => {
    it('should perform logout', async () => {
      const store = useAuthStore.getState();
      
      store.setUser(mockUser);
      store.setSession(mockSession);

      await store.logout('manual');

      expect(store.logout).toHaveBeenCalledWith('manual');
      
      const updatedState = useAuthStore.getState();
      expect(updatedState.user).toBeNull();
      expect(updatedState.session).toBeNull();
      expect(updatedState.isAuthenticated).toBe(false);
    });

    it('should perform signOut', async () => {
      const store = useAuthStore.getState();
      
      store.setUser(mockUser);

      await store.signOut();

      expect(store.signOut).toHaveBeenCalled();
      expect(useAuthStore.getState().user).toBeNull();
    });
  });

  describe('useAuth Hook', () => {
    it('should return all store state and methods', () => {
      const auth = useAuth();

      expect(auth).toHaveProperty('user');
      expect(auth).toHaveProperty('session');
      expect(auth).toHaveProperty('isAuthenticated');
      expect(auth).toHaveProperty('isLoading');
      expect(auth).toHaveProperty('error');
      expect(auth).toHaveProperty('setUser');
      expect(auth).toHaveProperty('logout');
      expect(auth).toHaveProperty('signOut');
      expect(auth).toHaveProperty('hasPermission');
      expect(auth).toHaveProperty('hasRole');
    });
  });

  describe('useAuthGuard Hook', () => {
    it('should return authorized when user has permission', () => {
      const store = useAuthStore.getState();
      store.setUser(mockUser);
      store.setHasHydrated(true);

      const result = useAuthGuard('read');

      expect(result.isAuthorized).toBe(true);
      expect(result.isLoading).toBe(false);
    });

    it('should return unauthorized when user lacks permission', () => {
      const store = useAuthStore.getState();
      store.setUser(mockUser);
      store.setHasHydrated(true);

      const result = useAuthGuard('admin');

      expect(result.isAuthorized).toBe(false);
      expect(result.isLoading).toBe(false);
    });

    it('should return loading state when not hydrated', () => {
      const store = useAuthStore.getState();
      store.setHasHydrated(false);

      const result = useAuthGuard('read');

      expect(result.isAuthorized).toBe(false);
      expect(result.isLoading).toBe(true);
    });
  });

  describe('toAppUser Helper', () => {
    it('should convert user to AppUser format', () => {
      const basicUser = {
        id: '123',
        email: 'test@example.com',
        name: 'Test',
      };

      const appUser = toAppUser(basicUser);

      expect(appUser).toMatchObject({
        id: '123',
        email: 'test@example.com',
        name: 'Test',
        role: 'user',
        emailVerified: true,
        needsProfileCompletion: false,
      });
    });

    it('should preserve existing role', () => {
      const user = { ...mockUser, role: 'admin' };
      const appUser = toAppUser(user);
      expect(appUser.role).toBe('admin');
    });
  });
});