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

// React Native is mocked via moduleNameMapping in jest.config.js

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

jest.mock('@/lib/auth/auth-client', () => ({
  authClient: mockAuthClient,
}));

// Mock tRPC
jest.mock('@/lib/api/trpc', () => ({
  TRPCProvider: ({ children }) => children,
  api: {
    createClient: jest.fn(),
    Provider: ({ children }) => children,
    auth: {
      getSession: {
        useQuery: jest.fn(),
      },
    },
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
jest.mock('@/lib/core', () => ({
  showErrorAlert: jest.fn(),
  showSuccessAlert: jest.fn(),
  log: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock database for server tests
jest.mock('@/src/db', () => ({
  db: {
    insert: jest.fn().mockReturnValue({
      values: jest.fn().mockResolvedValue({}),
    }),
    select: jest.fn().mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([{
          id: 'test-id',
          checksum: 'mock-checksum',
        }]),
      }),
    }),
  },
}));

// Mock nanoid
jest.mock('nanoid', () => ({
  nanoid: jest.fn(() => 'mock-id'),
}));

// React Native is already mocked via moduleNameMapper in jest.config.js

// Mock React Native Reanimated
jest.mock('react-native-reanimated', () => {
  return {
    ...require('react-native-reanimated/mock'),
    default: {
      ...require('react-native-reanimated/mock').default,
      call: () => {},
      createAnimatedComponent: (comp) => comp,
    },
    withSpring: jest.fn((toValue, config, callback) => {
      if (callback) callback(true);
      return { value: toValue };
    }),
    withTiming: jest.fn((toValue, config, callback) => {
      if (callback) callback(true);
      return { value: toValue };
    }),
    withSequence: jest.fn((...animations) => animations[animations.length - 1]),
    withDelay: jest.fn((delay, animation) => animation),
    interpolate: jest.fn((value, inputRange, outputRange) => {
      const ratio = value / inputRange[inputRange.length - 1];
      return outputRange[0] + (outputRange[outputRange.length - 1] - outputRange[0]) * ratio;
    }),
    runOnJS: jest.fn(fn => (...args) => fn(...args)),
    useSharedValue: jest.fn(initialValue => ({ value: initialValue })),
    useAnimatedStyle: jest.fn(styleFactory => styleFactory()),
    FadeIn: { duration: 300 },
    FadeOut: { duration: 300 },
    ZoomIn: { duration: 300 },
    ZoomOut: { duration: 300 },
    SlideInDown: { duration: 300 },
    SlideInUp: { duration: 300 },
    SlideInLeft: { duration: 300 },
    SlideInRight: { duration: 300 },
  };
});

// Mock NativeWind
jest.mock('nativewind', () => ({
  styled: (component) => component,
  hairlineWidth: () => 1,
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  getAllKeys: jest.fn(),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
  multiRemove: jest.fn(),
}));

// Mock haptics
jest.mock('@/lib/ui/haptics', () => ({
  haptic: {
    light: jest.fn(),
    medium: jest.fn(),
    heavy: jest.fn(),
    selection: jest.fn(),
    success: jest.fn(),
    warning: jest.fn(),
    error: jest.fn(),
    impact: jest.fn(),
  }
}));

// Global test utilities
global.mockAuthClient = mockAuthClient;
global.jest = jest;

// Polyfill jest for global usage
if (typeof global !== 'undefined') {
  global.jest = jest;
}

// Mock Appearance API
global.Appearance = {
  getColorScheme: jest.fn(() => 'light'),
  addChangeListener: jest.fn(),
  removeChangeListener: jest.fn(),
};

// Mock Platform
global.Platform = {
  OS: 'ios',
  select: jest.fn((obj) => obj.ios || obj.default),
  Version: 14,
};

// Silence console warnings in tests
const originalWarn = console.warn;
console.warn = (...args) => {
  if (args[0]?.includes?.('Warning:')) {
    return;
  }
  originalWarn(...args);
};