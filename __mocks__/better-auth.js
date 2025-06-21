module.exports = {
  betterAuth: jest.fn(() => ({
    handler: jest.fn(),
    api: {
      signInEmail: jest.fn().mockResolvedValue({ user: {}, session: {} }),
      signUpEmail: jest.fn().mockResolvedValue({ user: {}, session: {} }),
      signOut: jest.fn().mockResolvedValue({}),
      getSession: jest.fn().mockResolvedValue({ user: {}, session: {} }),
    },
  })),
  // Export all plugins as mocks
  oAuthProxy: jest.fn(() => ({})),
  organization: jest.fn(() => ({})),
  admin: jest.fn(() => ({})),
  magicLink: jest.fn(() => ({})),
  twoFactor: jest.fn(() => ({})),
  passkey: jest.fn(() => ({})),
  bearer: jest.fn(() => ({})),
};