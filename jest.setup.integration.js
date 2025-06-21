// Setup for integration tests
require('dotenv').config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.APP_ENV = 'test';

// Override test database URL if needed
if (!process.env.TEST_DATABASE_URL) {
  process.env.TEST_DATABASE_URL = 'postgresql://myexpo:myexpo123@localhost:5433/myexpo_test';
}
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

// Mock React Native modules that aren't available in Node
jest.mock('react-native', () => ({
  Platform: {
    OS: 'web',
    select: (obj) => obj.web || obj.default,
  },
}));

// Mock expo modules
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Global test utilities
global.testConfig = {
  api: {
    baseUrl: process.env.API_BASE_URL || 'http://localhost:8081',
    wsUrl: process.env.WS_URL || 'ws://localhost:3002',
  },
  timeouts: {
    short: 5000,
    medium: 15000,
    long: 30000,
  },
};

// Suppress console logs during tests unless DEBUG is set
if (!process.env.DEBUG) {
  global.console = {
    ...console,
    log: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('Unhandled Promise Rejection:', error);
});

// Increase timeout for integration tests
jest.setTimeout(60000);