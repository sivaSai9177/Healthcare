const mockAuthStore = {
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: false,
  hasHydrated: true,
  signIn: jest.fn(),
  signOut: jest.fn(),
  setUser: jest.fn(),
  setSession: jest.fn(),
  clearAuth: jest.fn(),
  refreshSession: jest.fn(),
};

const createMockUseAuthStore = () => {
  return jest.fn((selector) => {
    if (typeof selector === 'function') {
      return selector(mockAuthStore);
    }
    return mockAuthStore;
  });
};

module.exports = {
  useAuthStore: createMockUseAuthStore(),
  authStore: mockAuthStore,
  // Helper to update mock state
  __setMockAuthState: (state) => {
    Object.assign(mockAuthStore, state);
  },
  __resetMockAuthState: () => {
    Object.assign(mockAuthStore, {
      user: null,
      session: null,
      isAuthenticated: false,
      isLoading: false,
      hasHydrated: true,
    });
  },
};