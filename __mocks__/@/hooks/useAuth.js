const mockUseAuth = jest.fn(() => ({
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: false,
  hasHydrated: true,
  isRefreshing: false,
  signIn: jest.fn(),
  signOut: jest.fn(),
  signUp: jest.fn(),
  refreshSession: jest.fn(),
}));

// Helper to set mock return value
mockUseAuth.__setMockReturnValue = (value) => {
  mockUseAuth.mockReturnValue(value);
};

// Helper to reset mock
mockUseAuth.__reset = () => {
  mockUseAuth.mockReset();
  mockUseAuth.mockReturnValue({
    user: null,
    session: null,
    isAuthenticated: false,
    isLoading: false,
    hasHydrated: true,
    isRefreshing: false,
    signIn: jest.fn(),
    signOut: jest.fn(),
    signUp: jest.fn(),
    refreshSession: jest.fn(),
  });
};

module.exports = {
  useAuth: mockUseAuth,
};