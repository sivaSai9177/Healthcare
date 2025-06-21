// Jest setup file for React Native testing with jest-expo
import '@testing-library/jest-native/extend-expect';
import '@testing-library/react-native';

// Setup fetch polyfill
if (typeof global.fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

// Setup TextEncoder/TextDecoder
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = require('util').TextEncoder;
  global.TextDecoder = require('util').TextDecoder;
}

// Mock window.matchMedia for web tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock React Native modules
// Note: NativeAnimatedHelper is now handled by jest-expo preset

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => 
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  
  // Mock additional functions if needed
  Reanimated.default.call = () => {};
  
  return Reanimated;
});

// Mock unified logger to avoid dynamic imports
jest.mock('@/lib/core/debug/unified-logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    trace: jest.fn(),
    system: {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    },
    auth: {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    },
    api: {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    },
    navigation: {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    },
  },
  log: jest.fn(),
  UnifiedLogger: jest.fn(),
}));

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(() => Promise.resolve()),
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

// Mock expo-router
jest.mock('expo-router', () => require('./__mocks__/expo-router'));

// Mock better-auth
jest.mock('better-auth', () => ({
  betterAuth: jest.fn(() => ({
    api: {},
    handler: jest.fn(),
  })),
  createSession: jest.fn(),
}));

// Mock uncrypto
jest.mock('uncrypto', () => ({
  webcrypto: {
    subtle: {
      digest: jest.fn(),
      encrypt: jest.fn(),
      decrypt: jest.fn(),
      generateKey: jest.fn(),
      sign: jest.fn(),
      verify: jest.fn(),
    },
    getRandomValues: jest.fn((arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }),
    randomUUID: jest.fn(() => 'test-uuid-' + Math.random()),
  },
  createHash: jest.fn(() => ({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn(() => 'mocked-hash'),
  })),
  randomBytes: jest.fn((size) => Buffer.alloc(size, 0)),
}));

// Mock expo-linking
jest.mock('expo-linking', () => ({
  createURL: jest.fn((path) => `exp://localhost:19000/${path}`),
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  parseInitialURLAsync: jest.fn(() => Promise.resolve(null)),
  canOpenURL: jest.fn(() => Promise.resolve(true)),
  openURL: jest.fn(() => Promise.resolve()),
}));

// Mock expo-constants
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    manifest: {
      extra: {},
    },
    expoConfig: {
      extra: {},
    },
  },
}));

// Mock react-native-css-interop
jest.mock('react-native-css-interop', () => ({
  __esModule: true,
  jsxRuntime: () => {},
  cssInterop: () => {},
  remapProps: () => {},
}));

// Mock Appearance
jest.mock('react-native/Libraries/Utilities/Appearance', () => ({
  getColorScheme: jest.fn(() => 'light'),
  addChangeListener: jest.fn(),
  removeChangeListener: jest.fn(),
}));

// Ensure Appearance is available globally
if (typeof global.Appearance === 'undefined') {
  global.Appearance = {
    getColorScheme: jest.fn(() => 'light'),
    addChangeListener: jest.fn(),
    removeChangeListener: jest.fn(),
  };
}

// Suppress console warnings in tests
const originalWarn = console.warn;
const originalError = console.error;

beforeAll(() => {
  console.warn = (...args) => {
    const warningMessage = args[0]?.toString() || '';
    if (
      warningMessage.includes('Animated') ||
      warningMessage.includes('useNativeDriver') ||
      warningMessage.includes('Non-serializable values') ||
      warningMessage.includes('VirtualizedLists') ||
      warningMessage.includes('componentWillReceiveProps')
    ) {
      return;
    }
    originalWarn.apply(console, args);
  };
  
  console.error = (...args) => {
    const errorMessage = args[0]?.toString() || '';
    if (
      errorMessage.includes('Warning: An update to') ||
      errorMessage.includes('not wrapped in act') ||
      errorMessage.includes('deprecated') ||
      errorMessage.includes('findDOMNode') ||
      errorMessage.includes('The current testing environment is not configured to support act')
    ) {
      return;
    }
    originalError.apply(console, args);
  };
});

afterAll(() => {
  console.warn = originalWarn;
  console.error = originalError;
});

// Global test utilities
global.flushPromises = () => new Promise(resolve => setImmediate(resolve));

// Mock timers by default
beforeEach(() => {
  jest.useFakeTimers();
});

// Clear all mocks and timers after each test
afterEach(() => {
  jest.clearAllMocks();
  jest.clearAllTimers();
  jest.useRealTimers();
});