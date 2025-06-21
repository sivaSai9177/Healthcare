const mockTRPCClient = {
  auth: {
    signIn: {
      mutate: jest.fn(),
      mutateAsync: jest.fn(() => Promise.resolve({ user: {}, session: {} })),
    },
    signOut: {
      mutate: jest.fn(),
      mutateAsync: jest.fn(() => Promise.resolve()),
    },
    getSession: {
      query: jest.fn(() => Promise.resolve({ user: null, session: null })),
    },
  },
  organization: {
    list: {
      useQuery: jest.fn(() => ({ data: [], isLoading: false })),
    },
    create: {
      mutate: jest.fn(),
      mutateAsync: jest.fn(() => Promise.resolve({ id: '1' })),
    },
  },
  healthcare: {
    getAlerts: {
      useQuery: jest.fn(() => ({ data: { alerts: [] }, isLoading: false })),
    },
    createAlert: {
      mutate: jest.fn(),
      mutateAsync: jest.fn(() => Promise.resolve({ id: '1' })),
    },
  },
};

const mockUseContext = jest.fn(() => mockTRPCClient);
const mockApi = {
  useContext: mockUseContext,
  ...mockTRPCClient,
};

module.exports = {
  TRPCProvider: ({ children }) => children,
  api: mockApi,
  trpc: mockApi,
  createTRPCClient: jest.fn(() => mockTRPCClient),
};