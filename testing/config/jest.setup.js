// Jest setup file
import '@testing-library/jest-native/extend-expect';
import 'react-native-gesture-handler/jestSetup';

import React from 'react';

// Mock react-native-css-interop before any imports
jest.mock('react-native-css-interop', () => ({
  cssInterop: jest.fn(),
  remapProps: jest.fn((component) => component),
}));

// Mock nativewind
jest.mock('nativewind', () => ({
  styled: (component) => component,
  useColorScheme: () => 'light',
}));

// Mock window.matchMedia for color scheme
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock Recharts for component tests
jest.mock('recharts', () => ({
  LineChart: ({ children, ...props }) => <div data-testid="line-chart" {...props}>{children}</div>,
  Line: ({ children, ...props }) => <div data-testid="line" {...props}>{children}</div>,
  BarChart: ({ children, ...props }) => <div data-testid="bar-chart" {...props}>{children}</div>,
  Bar: ({ children, ...props }) => <div data-testid="bar" {...props}>{children}</div>,
  XAxis: ({ children, ...props }) => <div data-testid="x-axis" {...props}>{children}</div>,
  YAxis: ({ children, ...props }) => <div data-testid="y-axis" {...props}>{children}</div>,
  CartesianGrid: ({ children, ...props }) => <div data-testid="cartesian-grid" {...props}>{children}</div>,
  Tooltip: ({ children, ...props }) => <div data-testid="tooltip" {...props}>{children}</div>,
  Legend: ({ children, ...props }) => <div data-testid="legend" {...props}>{children}</div>,
  ResponsiveContainer: ({ children, ...props }) => <div data-testid="responsive-container" {...props}>{children}</div>,
  PieChart: ({ children, ...props }) => <div data-testid="pie-chart" {...props}>{children}</div>,
  Pie: ({ children, ...props }) => <div data-testid="pie" {...props}>{children}</div>,
  Cell: ({ children, ...props }) => <div data-testid="cell" {...props}>{children}</div>,
}));

// Mock expo modules
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
  })),
  usePathname: jest.fn(() => '/'),
  useLocalSearchParams: jest.fn(() => ({})),
  useGlobalSearchParams: jest.fn(() => ({})),
  Stack: {
    Screen: ({ children }) => children,
  },
  Tabs: {
    Screen: ({ children }) => children,
  },
  Slot: ({ children }) => children,
  Redirect: ({ children }) => children,
}));

jest.mock('expo-linking', () => ({
  createURL: jest.fn((path) => `exp://localhost:8081/${path}`),
  parse: jest.fn((url) => ({ path: url })),
}));

jest.mock('expo-font', () => ({
  loadAsync: jest.fn(),
  isLoaded: jest.fn(() => true),
}));

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn(),
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

jest.mock('expo-blur', () => ({
  BlurView: 'BlurView',
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
}));

// Mock safe area context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }) => children,
  SafeAreaView: ({ children }) => children,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

// Mock react-native-screens
jest.mock('react-native-screens', () => ({
  enableScreens: jest.fn(),
}));

// Global test setup
global.__DEV__ = true;

// Add TextEncoder and TextDecoder for Node.js environment (required by pg library)
if (typeof TextEncoder === 'undefined') {
  global.TextEncoder = require('util').TextEncoder;
}

if (typeof TextDecoder === 'undefined') {
  global.TextDecoder = require('util').TextDecoder;
}

// Silence console warnings in tests
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

beforeAll(() => {
  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('ViewPropTypes') // Common RN warning
    ) {
      return;
    }
    originalConsoleWarn(...args);
  };
  
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: An update to') || // React state update warning
       args[0].includes('Warning: Cannot update')) // React unmounted component warning
    ) {
      return;
    }
    originalConsoleError(...args);
  };
});

afterAll(() => {
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
});

// Mock TRPC API for component tests
jest.mock('@/lib/api/trpc', () => ({
  api: {
    useUtils: jest.fn(() => ({
      healthcare: {
        getActiveAlerts: {
          invalidate: jest.fn(),
        },
        getAlertById: {
          invalidate: jest.fn(),
        },
      },
    })),
    healthcare: {
      getResponseAnalytics: {
        useQuery: jest.fn(() => ({
          data: null,
          isLoading: false,
          error: null,
        })),
      },
      getActivityLogs: {
        useQuery: jest.fn(() => ({
          data: null,
          isLoading: false,
          error: null,
        })),
      },
      getActiveAlerts: {
        useQuery: jest.fn(() => ({
          data: { alerts: [], total: 0 },
          isLoading: false,
          error: null,
        })),
      },
      createAlert: {
        useMutation: jest.fn(() => ({
          mutate: jest.fn(),
          mutateAsync: jest.fn(),
          isLoading: false,
          error: null,
        })),
      },
      acknowledgeAlert: {
        useMutation: jest.fn(() => ({
          mutate: jest.fn(),
          mutateAsync: jest.fn(),
          isLoading: false,
          error: null,
        })),
      },
      resolveAlert: {
        useMutation: jest.fn(() => ({
          mutate: jest.fn(),
          mutateAsync: jest.fn(),
          isLoading: false,
          error: null,
        })),
      },
    },
  },
}));