const React = require('react');

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  canGoBack: jest.fn(() => true),
  setParams: jest.fn(),
  navigate: jest.fn(),
  dismissAll: jest.fn(),
};

// Mock navigation state
let mockPathname = '/';
let mockSegments = [];
let mockParams = {};

const ExpoRouter = {
  // Router hooks
  useRouter: () => mockRouter,
  useLocalSearchParams: () => mockParams,
  useSearchParams: () => mockParams,
  useGlobalSearchParams: () => mockParams,
  useSegments: () => mockSegments,
  usePathname: () => mockPathname,
  useFocusEffect: jest.fn(),
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    dispatch: jest.fn(),
    setOptions: jest.fn(),
    addListener: jest.fn(() => ({ remove: jest.fn() })),
  }),
  useRootNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    canGoBack: jest.fn(() => true),
  }),
  useRootNavigationState: () => ({
    routes: [],
    index: 0,
  }),
  
  // Components
  Link: ({ children }) => children,
  Stack: ({ children }) => children,
  Stack: {
    Screen: ({ children }) => children,
  },
  Tabs: ({ children }) => children,
  Tabs: {
    Screen: ({ children }) => children,
  },
  Slot: ({ children }) => children,
  ErrorBoundary: ({ children }) => children,
  
  // Router object
  router: mockRouter,
  
  // Testing utilities
  renderRouter: (routes, options = {}) => {
    // Set initial URL if provided
    if (options.initialUrl) {
      mockPathname = options.initialUrl;
      // Parse segments from URL
      mockSegments = options.initialUrl.split('/').filter(Boolean);
    }
    
    // Mock file system
    if (Array.isArray(routes)) {
      // Simple array of routes
      return React.createElement('View', null, 'Mocked Router');
    } else if (typeof routes === 'object') {
      // Object with component mapping
      return React.createElement('View', null, 'Mocked Router');
    } else if (typeof routes === 'string') {
      // Fixture path
      return React.createElement('View', null, 'Mocked Router');
    }
  },
  
  // Test utilities for setting state
  __setMockPathname: (pathname) => {
    mockPathname = pathname;
    mockSegments = pathname.split('/').filter(Boolean);
  },
  __setMockParams: (params) => {
    mockParams = params;
  },
  __resetMocks: () => {
    mockPathname = '/';
    mockSegments = [];
    mockParams = {};
    jest.clearAllMocks();
  },
};

module.exports = ExpoRouter;