/**
 * Jest setup for integration tests
 */

// Set test environment first
process.env.APP_ENV = 'test';
process.env.NODE_ENV = 'test';

// Load test environment variables
require('dotenv').config({ path: '.env.test' });

// Add TextEncoder/TextDecoder for Node.js
if (typeof TextEncoder === 'undefined') {
  global.TextEncoder = require('util').TextEncoder;
}
if (typeof TextDecoder === 'undefined') {
  global.TextDecoder = require('util').TextDecoder;
}

// Mock console to reduce noise during tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  // Keep error for debugging
  error: console.error,
};

// Add custom matchers if needed
expect.extend({
  toBeValidUUID(received) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const pass = uuidRegex.test(received);
    return {
      pass,
      message: () =>
        pass
          ? `expected ${received} not to be a valid UUID`
          : `expected ${received} to be a valid UUID`,
    };
  },
});

// Global test helpers
global.testHelpers = {
  // Generate random test data
  randomEmail: () => `test-${Math.random().toString(36).substring(7)}@example.com`,
  randomName: () => `Test User ${Math.random().toString(36).substring(7)}`,
  randomRoom: () => `${['A', 'B', 'C'][Math.floor(Math.random() * 3)]}${Math.floor(Math.random() * 400) + 100}`,
  
  // Wait helper
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
};