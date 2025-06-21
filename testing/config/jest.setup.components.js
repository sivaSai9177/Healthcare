// Component test setup file
import '@testing-library/jest-native/extend-expect';

// Add TextEncoder and TextDecoder for Node.js environment (required by pg library)
if (typeof TextEncoder === 'undefined') {
  global.TextEncoder = require('util').TextEncoder;
}

if (typeof TextDecoder === 'undefined') {
  global.TextDecoder = require('util').TextDecoder;
}

// Set up global mocks before any module imports
global.window = global.window || {};
global.window.matchMedia = global.window.matchMedia || function() {
  return {
    matches: false,
    addListener: function() {},
    removeListener: function() {},
  };
};

// Mock TurboModuleRegistry for react-native-reanimated
global.TurboModuleRegistry = {
  get: jest.fn((name) => {
    if (name === 'NativeReanimated') {
      return {
        installTurboModule: jest.fn(),
        configureLayoutAnimationBatch: jest.fn(),
        makeMutable: jest.fn(),
        makeShareable: jest.fn(),
        scheduleOnJS: jest.fn(),
        registerEventHandler: jest.fn(),
        unregisterEventHandler: jest.fn(),
        getViewProp: jest.fn(),
      };
    }
    return null;
  }),
  getEnforcing: jest.fn((name) => {
    if (name === 'NativeReanimated') {
      return {
        installTurboModule: jest.fn(),
        configureLayoutAnimationBatch: jest.fn(),
        makeMutable: jest.fn(),
        makeShareable: jest.fn(),
        scheduleOnJS: jest.fn(),
        registerEventHandler: jest.fn(),
        unregisterEventHandler: jest.fn(),
        getViewProp: jest.fn(),
      };
    }
    return null;
  }),
};

// Mock react-native-css-interop
jest.mock('react-native-css-interop', () => {
  const React = require('react');
  return {
    cssInterop: jest.fn(),
    remapProps: jest.fn((component) => component),
    StyleSheet: {
      create: (styles) => styles,
      flatten: (style) => style,
      absoluteFillObject: {},
    },
  };
});

// Mock nativewind
jest.mock('nativewind', () => ({
  styled: (component) => component,
  useColorScheme: () => 'light',
  StyledComponent: jest.fn(),
}));

// Mock React Native modules
jest.mock('react-native', () => {
  const React = require('react');
  const RN = jest.requireActual('react-native');
  
  // Override problematic modules
  return Object.setPrototypeOf({
    ...RN,
    Platform: {
      OS: 'ios',
      Version: '14.0',
      select: jest.fn((obj) => obj.ios || obj.default),
      isTV: false,
    },
    Appearance: {
      getColorScheme: jest.fn(() => 'light'),
      addChangeListener: jest.fn(),
      removeChangeListener: jest.fn(),
    },
    Dimensions: {
      get: jest.fn(() => ({ width: 375, height: 812 })),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },
    StyleSheet: {
      create: (styles) => styles,
      flatten: (style) => style,
      absoluteFillObject: {},
      hairlineWidth: 1,
    },
    // Add component mocks
    ScrollView: ({ children }) => children,
    FlatList: ({ children, data, renderItem }) => {
      if (data && renderItem) {
        return React.createElement('View', {}, data.map((item, index) => renderItem({ item, index })));
      }
      return children;
    },
    TouchableOpacity: ({ children, ...props }) => 
      React.createElement('View', { ...props, testID: props.testID }, children),
    ActivityIndicator: () => React.createElement('View', { testID: 'activity-indicator' }),
  }, RN);
});

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock localStorage for zustand
const localStorageMock = {
  getItem: jest.fn(() => null),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(() => null),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true,
});

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true,
});

// react-native-reanimated is mocked via __mocks__ directory

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
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
    Soft: 'soft',
    Rigid: 'rigid',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
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

// Mock expo-symbols
jest.mock('expo-symbols', () => ({
  SymbolView: ({ children }) => children,
}));

// Mock glass theme hook
jest.mock('@/lib/design/themes/glass-theme', () => ({
  useGlassTheme: () => ({
    colors: {
      primary: '#000',
      background: '#fff',
      text: '#000',
      border: '#ccc',
    },
    isDark: false,
  }),
}));

// Mock responsive spacing utilities
jest.mock('@/lib/design/responsive-spacing', () => ({
  BREAKPOINTS: {
    mobile: 640,
    tablet: 768,
    desktop: 1024,
    wide: 1440,
    ultrawide: 1920,
  },
  getScreenSize: jest.fn(() => 'mobile'),
  getResponsiveSpacing: jest.fn((scale) => scale * 4),
  getContainerPadding: jest.fn(() => 16),
  getMaxContentWidth: jest.fn(() => '100%'),
  useResponsiveSpacing: jest.fn((config) => {
    // Return an object with scale method to match the usage
    return {
      scale: jest.fn((multiplier = 1) => multiplier * 4),
      mobile: 16,
      tablet: 20,
      desktop: 24,
      wide: 32,
      ultrawide: 40,
    };
  }),
  CONTAINER_PADDING: {
    mobile: 4,
    tablet: 6,
    desktop: 8,
    wide: 10,
    ultrawide: 12,
  },
  GRID_GAPS: {
    mobile: 3,
    tablet: 4,
    desktop: 6,
    wide: 8,
    ultrawide: 10,
  },
  SPACING_MULTIPLIERS: {
    mobile: 1,
    tablet: 1.2,
    desktop: 1.5,
    wide: 1.8,
    ultrawide: 2,
  },
  largeScreenStyles: {
    centerContent: () => ({ width: '100%', maxWidth: 1200, marginHorizontal: 'auto' }),
    responsivePadding: () => ({ paddingHorizontal: 16 }),
    widgetGrid: () => ({ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }),
    sidebarLayout: { display: 'flex', flexDirection: 'row', height: '100%' },
    mainContent: () => ({ flex: 1, marginLeft: 0, overflow: 'auto' }),
  },
  FONT_SIZE_MULTIPLIERS: {
    mobile: 1,
    tablet: 1.05,
    desktop: 1.1,
    wide: 1.15,
    ultrawide: 1.2,
  },
  getResponsiveFontSize: jest.fn((size) => size),
}));

// Mock responsive hooks
jest.mock('@/hooks/responsive', () => ({
  useResponsive: jest.fn(() => ({
    isMobile: true,
    isTablet: false,
    isDesktop: false,
    screenSize: 'mobile',
  })),
  useResponsiveValue: jest.fn((values) => {
    // Return null if no values provided
    if (!values || typeof values !== 'object') return null;
    // Return mobile value by default
    return values.xs || values.mobile || values[Object.keys(values)[0]];
  }),
  useReducedMotion: jest.fn(() => false),
}));

// Mock stores
jest.mock('@/lib/stores/spacing-store', () => ({
  useSpacing: jest.fn(() => ({
    spacing: {
      0: 0,
      1: 4,
      2: 8,
      3: 12,
      4: 16,
      5: 20,
      6: 24,
      8: 32,
      10: 40,
      12: 48,
      16: 64,
      20: 80,
      24: 96,
      32: 128,
      40: 160,
      48: 192,
      56: 224,
      64: 256,
      72: 288,
      80: 320,
      96: 384,
    },
  })),
  useSpacingStore: jest.fn(() => ({
    spacing: {
      0: 0,
      1: 4,
      2: 8,
      3: 12,
      4: 16,
      5: 20,
      6: 24,
      8: 32,
      10: 40,
      12: 48,
      16: 64,
      20: 80,
      24: 96,
      28: 112,
      32: 128,
      36: 144,
      40: 160,
      44: 176,
      48: 192,
      56: 224,
      64: 256,
      72: 288,
      80: 320,
      96: 384,
    },
    componentSpacing: {
      cardPadding: 16,
      stackGap: 12,
      sectionMargin: 24,
      formGap: 16,
      borderRadius: 8,
    },
    componentSizes: {
      button: {
        sm: { height: 32, paddingX: 12 },
        md: { height: 40, paddingX: 16 },
        lg: { height: 48, paddingX: 20 },
      },
    },
  })),
}));

// Mock spacing from different import path
jest.mock('@/lib/design/spacing', () => ({
  useSpacing: jest.fn(() => ({
    spacing: {
      0: 0,
      1: 4,
      2: 8,
      3: 12,
      4: 16,
      5: 20,
      6: 24,
      8: 32,
      10: 40,
      12: 48,
      16: 64,
      20: 80,
      24: 96,
      32: 128,
      40: 160,
      48: 192,
      56: 224,
      64: 256,
      72: 288,
      80: 320,
      96: 384,
    },
  })),
  spacingScales: {
    medium: {
      0: 0,
      1: 4,
      2: 8,
      3: 12,
      4: 16,
      5: 20,
      6: 24,
      8: 32,
      10: 40,
      12: 48,
      16: 64,
      20: 80,
      24: 96,
      32: 128,
      40: 160,
      48: 192,
      56: 224,
      64: 256,
      72: 288,
      80: 320,
      96: 384,
    },
  },
}));

jest.mock('@/lib/stores/theme-store', () => ({
  useThemeStore: jest.fn(() => ({
    theme: {
      primary: '#0070f3',
      background: '#ffffff',
      foreground: '#000000',
      mutedForeground: '#666666',
      card: '#f5f5f5',
      border: '#e5e5e5',
      muted: '#f0f0f0',
      destructive: '#ff0000',
    },
  })),
}));

jest.mock('@/lib/stores/animation-store', () => ({
  useAnimationStore: jest.fn(() => ({
    shouldAnimate: jest.fn(() => false),
  })),
}));

// Mock shadow hook
jest.mock('@/hooks/useShadow', () => ({
  useShadow: jest.fn(() => ({})),
  useInteractiveShadow: jest.fn(() => ({
    shadowStyle: {},
    animatedStyle: {},
    onPressIn: jest.fn(),
    onPressOut: jest.fn(),
    onHoverIn: jest.fn(),
    onHoverOut: jest.fn(),
    isHovered: false,
    isPressed: false,
  })),
}));

// Mock haptics
jest.mock('@/lib/ui/haptics', () => ({
  haptic: jest.fn(),
}));

// Mock theme provider
jest.mock('@/lib/theme/provider', () => ({
  useTheme: jest.fn(() => ({
    primary: '#0070f3',
    background: '#ffffff',
    foreground: '#000000',
    mutedForeground: '#666666',
    card: '#f5f5f5',
    border: '#e5e5e5',
    muted: '#f0f0f0',
    destructive: '#ff0000',
  })),
}));

// Mock alert utilities
jest.mock('@/lib/core/alert', () => ({
  showErrorAlert: jest.fn(),
  showSuccessAlert: jest.fn(),
  showWarningAlert: jest.fn(),
  showInfoAlert: jest.fn(),
}));

// Mock healthcare validation hooks
jest.mock('@/hooks/healthcare', () => ({
  useCreateAlertValidation: jest.fn(() => ({
    validateWithContext: jest.fn(() => true),
    validateField: jest.fn(),
    errors: {},
    isValid: true,
    clearErrors: jest.fn(),
    getFieldError: jest.fn(() => undefined),
  })),
  getFirstError: jest.fn(() => null),
}));

// Mock utils
jest.mock('@/lib/core/utils', () => ({
  cn: jest.fn((...args) => args.filter(Boolean).join(' ')),
}));

// Mock TRPC API
jest.mock('@/lib/api/trpc', () => ({
  api: {
    healthcare: {
      getActivityLogs: {
        useQuery: jest.fn(() => ({
          data: { logs: [] },
          isLoading: false,
          isError: false,
          error: null,
          refetch: jest.fn(),
        })),
      },
      getResponseAnalytics: {
        useQuery: jest.fn(() => ({
          data: null,
          isLoading: true,
          isError: false,
          error: null,
          refetch: jest.fn(),
        })),
      },
      createAlert: {
        useMutation: jest.fn(() => ({
          mutate: jest.fn(),
          mutateAsync: jest.fn(),
          isPending: false,
          isError: false,
          error: null,
        })),
      },
    },
    auth: {
      signIn: {
        useMutation: jest.fn(() => ({
          mutate: jest.fn(),
          mutateAsync: jest.fn(),
          isPending: false,
          isError: false,
          error: null,
        })),
      },
    },
  },
  createTRPCReact: jest.fn(() => ({})),
}));

// Mock typography hooks
jest.mock('@/hooks/useTypography', () => ({
  useTypography: jest.fn(() => ({
    // Return mock typography styles
    h1: { fontSize: 32, fontWeight: 'bold', lineHeight: 40 },
    h2: { fontSize: 24, fontWeight: 'bold', lineHeight: 32 },
    h3: { fontSize: 20, fontWeight: 'semibold', lineHeight: 28 },
    h4: { fontSize: 18, fontWeight: 'semibold', lineHeight: 24 },
    body: { fontSize: 16, fontWeight: 'normal', lineHeight: 24 },
    small: { fontSize: 14, fontWeight: 'normal', lineHeight: 20 },
    xs: { fontSize: 12, fontWeight: 'normal', lineHeight: 16 },
    // Add sizes mapping
    sizes: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
      '4xl': 36,
      '5xl': 48,
      '6xl': 60,
      '7xl': 72,
      '8xl': 96,
      '9xl': 128,
    },
    // Add methods
    getLineHeight: jest.fn((fontSize) => fontSize * 1.5),
    getLetterSpacing: jest.fn((fontSize) => fontSize * 0.02),
  })),
  useSystemFontScale: jest.fn(() => ({
    scaleFont: jest.fn((size) => size),
  })),
}));

// Mock typography system
jest.mock('@/lib/design/typography', () => ({
  typographySystem: {
    fontWeights: {
      thin: '100',
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
      black: '900',
    },
    getFontFamily: jest.fn(() => 'System'),
  },
}));

// Mock unified logger
jest.mock('@/lib/core/debug/unified-logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    auth: {
      debug: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
    },
    store: {
      update: jest.fn(),
    },
  },
  UnifiedLogger: jest.fn(() => ({
    log: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  })),
}));

// Mock debug store
jest.mock('@/lib/stores/debug-store', () => ({
  useDebugStore: Object.assign(jest.fn(() => ({
    enableAuthLogging: false,
    enableTRPCLogging: false,
  })), {
    getState: jest.fn(() => ({
      enableAuthLogging: false,
      enableTRPCLogging: false,
    })),
  }),
}));

// Mock debounce hook
jest.mock('@/hooks/useDebounce', () => ({
  useDebounce: jest.fn((value) => value),
}));

// Mock date-fns
jest.mock('date-fns', () => ({
  format: jest.fn((date) => '2024-01-01'),
  isToday: jest.fn(() => false),
  isYesterday: jest.fn(() => false),
  formatDistanceToNow: jest.fn(() => '2 hours ago'),
}));

// Mock auth store to prevent localStorage errors
jest.mock('@/lib/stores/auth-store', () => ({
  useAuthStore: Object.assign(jest.fn(() => ({
    user: null,
    session: null,
    isAuthenticated: false,
    setUser: jest.fn(),
    setSession: jest.fn(),
    clearAuth: jest.fn(),
    setHasHydrated: jest.fn(),
    hasHydrated: true,
  })), {
    getState: jest.fn(() => ({
      user: null,
      session: null,
      isAuthenticated: false,
      hasHydrated: true,
    })),
  }),
}));

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const MockIcon = ({ name, size, color, ...props }) => 
    React.createElement('Text', props, name);
  
  return {
    MaterialIcons: MockIcon,
    MaterialCommunityIcons: MockIcon,
    Ionicons: MockIcon,
    Feather: MockIcon,
    FontAwesome: MockIcon,
    FontAwesome5: MockIcon,
    AntDesign: MockIcon,
    Entypo: MockIcon,
    EvilIcons: MockIcon,
    Foundation: MockIcon,
    Octicons: MockIcon,
    SimpleLineIcons: MockIcon,
    Zocial: MockIcon,
  };
});

// Mock gesture handler
jest.mock('react-native-gesture-handler', () => {
  const React = require('react');
  return {
    Directions: {},
    State: {},
    PanGestureHandler: ({ children }) => children,
    BaseButton: ({ children }) => children,
    Swipeable: ({ children }) => children,
    DrawerLayout: ({ children }) => children,
    ScrollView: ({ children }) => children,
    FlatList: ({ children }) => children,
  };
});

// Global test setup
global.__DEV__ = true;

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
       args[0].includes('Warning: Cannot update') || // React unmounted component warning
       args[0].includes('react-test-renderer is deprecated')) // React test renderer warning
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

// Mock TRPC API for tests
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