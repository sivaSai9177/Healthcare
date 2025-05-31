// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(() => true),
  }),
  useSegments: () => [],
  useFocusEffect: jest.fn(),
  Link: ({ children }) => children,
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  },
}));

// Mock expo modules
jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      extra: {
        apiUrl: 'http://localhost:8081',
      },
    },
  },
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock React Native modules
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: jest.fn((obj) => obj.ios),
  },
  Alert: {
    alert: jest.fn(),
  },
  View: 'View',
  Text: 'Text',
  TouchableOpacity: 'TouchableOpacity',
  ScrollView: 'ScrollView',
  ActivityIndicator: 'ActivityIndicator',
}));

// Mock Better Auth
const mockAuthClient = {
  useSession: jest.fn(() => ({
    data: null,
    isPending: false,
    refetch: jest.fn(),
  })),
  signIn: {
    email: jest.fn(),
  },
  signOut: jest.fn(),
  $fetch: jest.fn(),
  getCookie: jest.fn(),
};

jest.mock('@/lib/auth-client', () => ({
  authClient: mockAuthClient,
}));

// Mock tRPC
jest.mock('@/lib/trpc', () => ({
  TRPCProvider: ({ children }) => children,
  api: {
    createClient: jest.fn(),
    Provider: ({ children }) => children,
  },
  trpc: {
    auth: {
      getSession: {
        useQuery: jest.fn(),
      },
    },
  },
}));

// Mock alert utility
jest.mock('@/lib/alert', () => ({
  showErrorAlert: jest.fn(),
  showSuccessAlert: jest.fn(),
}));

// Global test utilities
global.mockAuthClient = mockAuthClient;

// Silence console warnings in tests
const originalWarn = console.warn;
console.warn = (...args) => {
  if (args[0]?.includes?.('Warning:')) {
    return;
  }
  originalWarn(...args);
};