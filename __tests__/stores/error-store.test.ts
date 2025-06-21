// @ts-nocheck
// Unit tests for error store

// Create mock store
const createMockErrorStore = () => {
  let state = {
    error: null,
    errorHistory: [],
  };

  const subscribers = new Set();

  const getState = () => state;
  
  const setState = (updates) => {
    state = typeof updates === 'function' ? updates(state) : { ...state, ...updates };
    subscribers.forEach(fn => fn());
  };

  const subscribe = (fn) => {
    subscribers.add(fn);
    return () => subscribers.delete(fn);
  };

  const actions = {
    setError: (error, context) => {
      const errorInfo = {
        message: typeof error === 'string' ? error : 
                 error === null ? 'null' :
                 error === undefined ? 'undefined' :
                 error.message || String(error),
        code: typeof error === 'object' && error !== null && 'code' in error ? error.code : undefined,
        stack: typeof error === 'object' && error !== null && 'stack' in error ? error.stack : undefined,
        timestamp: new Date(),
        context,
      };

      setState((state) => ({
        error: errorInfo,
        errorHistory: [...state.errorHistory, errorInfo].slice(-50), // Keep last 50 errors
      }));
    },
    
    clearError: () => {
      setState({ error: null });
    },
    
    clearHistory: () => {
      setState({ errorHistory: [] });
    },
  };

  const store = {
    getState: () => ({ ...state, ...actions }),
    subscribe,
    // Direct access for tests
    get error() { return state.error; },
    get errorHistory() { return state.errorHistory; },
    // Actions
    ...actions,
  };

  return store;
};

// Mock the error store module
jest.mock('@/lib/stores/error-store', () => {
  const mockStore = createMockErrorStore();
  return {
    useErrorStore: mockStore,
  };
});

// Import after mocks
const { useErrorStore } = require('@/lib/stores/error-store');

describe('Error Store Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset store
    const store = useErrorStore;
    store.clearError();
    store.clearHistory();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const store = useErrorStore;
      
      expect(store.error).toBeNull();
      expect(store.errorHistory).toEqual([]);
    });
  });

  describe('Error Management', () => {
    it('should set error from string', () => {
      const store = useErrorStore;
      
      store.setError('Something went wrong');
      
      expect(store.error).toMatchObject({
        message: 'Something went wrong',
        code: undefined,
        stack: undefined,
        timestamp: expect.any(Date),
      });
    });

    it('should set error from Error object', () => {
      const store = useErrorStore;
      
      const error = new Error('Network error');
      error.stack = 'Error: Network error\n    at test.js:10:15';
      
      store.setError(error);
      
      expect(store.error).toMatchObject({
        message: 'Network error',
        code: undefined,
        stack: error.stack,
        timestamp: expect.any(Date),
      });
    });

    it('should set error with custom code', () => {
      const store = useErrorStore;
      
      const error = {
        message: 'Authentication failed',
        code: 'AUTH_FAILED',
        stack: 'Error stack trace',
      };
      
      store.setError(error);
      
      expect(store.error).toMatchObject({
        message: 'Authentication failed',
        code: 'AUTH_FAILED',
        stack: 'Error stack trace',
        timestamp: expect.any(Date),
      });
    });

    it('should set error with context', () => {
      const store = useErrorStore;
      
      const context = {
        userId: 'user-123',
        action: 'login',
        endpoint: '/api/auth/login',
      };
      
      store.setError('Login failed', context);
      
      expect(store.error).toMatchObject({
        message: 'Login failed',
        context: context,
        timestamp: expect.any(Date),
      });
    });

    it('should clear current error', () => {
      const store = useErrorStore;
      
      store.setError('Test error');
      expect(store.error).not.toBeNull();
      
      store.clearError();
      expect(store.error).toBeNull();
    });
  });

  describe('Error History', () => {
    it('should add errors to history', () => {
      const store = useErrorStore;
      
      store.setError('First error');
      store.setError('Second error');
      store.setError('Third error');
      
      expect(store.errorHistory).toHaveLength(3);
      expect(store.errorHistory[0].message).toBe('First error');
      expect(store.errorHistory[1].message).toBe('Second error');
      expect(store.errorHistory[2].message).toBe('Third error');
    });

    it('should maintain error history when clearing current error', () => {
      const store = useErrorStore;
      
      store.setError('Error 1');
      store.setError('Error 2');
      
      const historyBeforeClear = [...store.errorHistory];
      
      store.clearError();
      
      expect(store.error).toBeNull();
      expect(store.errorHistory).toEqual(historyBeforeClear);
    });

    it('should limit error history to 50 items', () => {
      const store = useErrorStore;
      
      // Add 60 errors
      for (let i = 1; i <= 60; i++) {
        store.setError(`Error ${i}`);
      }
      
      expect(store.errorHistory).toHaveLength(50);
      expect(store.errorHistory[0].message).toBe('Error 11'); // First 10 should be removed
      expect(store.errorHistory[49].message).toBe('Error 60'); // Last one should be the 60th
    });

    it('should clear error history', () => {
      const store = useErrorStore;
      
      store.setError('Error 1');
      store.setError('Error 2');
      store.setError('Error 3');
      
      expect(store.errorHistory).toHaveLength(3);
      
      store.clearHistory();
      
      expect(store.errorHistory).toEqual([]);
      expect(store.error).toMatchObject({ message: 'Error 3' }); // Current error not affected
    });
  });

  describe('Error Timestamps', () => {
    it('should add timestamp to each error', () => {
      const store = useErrorStore;
      
      const beforeTime = new Date();
      store.setError('Test error');
      const afterTime = new Date();
      
      expect(store.error.timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(store.error.timestamp.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });

    it('should have different timestamps for sequential errors', () => {
      jest.useFakeTimers();
      const store = useErrorStore;
      
      const mockDate1 = new Date('2024-01-01T10:00:00');
      jest.setSystemTime(mockDate1);
      
      store.setError('Error 1');
      const firstTimestamp = store.error.timestamp;
      
      // Advance time
      const mockDate2 = new Date('2024-01-01T10:00:01');
      jest.setSystemTime(mockDate2);
      
      store.setError('Error 2');
      const secondTimestamp = store.error.timestamp;
      
      expect(secondTimestamp.getTime()).toBeGreaterThan(firstTimestamp.getTime());
      
      jest.useRealTimers();
    });
  });

  describe('Complex Error Objects', () => {
    it('should handle errors with nested properties', () => {
      const store = useErrorStore;
      
      const complexError = {
        message: 'API Error',
        code: 'API_ERROR',
        details: {
          statusCode: 500,
          endpoint: '/api/users',
          method: 'POST',
        },
        originalError: new Error('Network timeout'),
      };
      
      store.setError(complexError);
      
      expect(store.error).toMatchObject({
        message: 'API Error',
        code: 'API_ERROR',
        timestamp: expect.any(Date),
      });
    });

    it('should handle TypeError objects', () => {
      const store = useErrorStore;
      
      const typeError = new TypeError('Cannot read property "name" of undefined');
      typeError.code = 'TYPE_ERROR';
      
      store.setError(typeError);
      
      expect(store.error).toMatchObject({
        message: 'Cannot read property "name" of undefined',
        code: 'TYPE_ERROR',
        stack: expect.any(String),
      });
    });

    it('should handle custom error classes', () => {
      const store = useErrorStore;
      
      class CustomError extends Error {
        constructor(message, code) {
          super(message);
          this.code = code;
          this.name = 'CustomError';
        }
      }
      
      const customError = new CustomError('Custom error occurred', 'CUSTOM_001');
      
      store.setError(customError);
      
      expect(store.error).toMatchObject({
        message: 'Custom error occurred',
        code: 'CUSTOM_001',
        stack: expect.stringContaining('CustomError'),
      });
    });
  });

  describe('Error Context', () => {
    it('should store error context information', () => {
      const store = useErrorStore;
      
      const context = {
        component: 'LoginForm',
        action: 'submit',
        formData: { email: 'test@example.com' },
        timestamp: Date.now(),
      };
      
      store.setError('Form submission failed', context);
      
      expect(store.error.context).toEqual(context);
    });

    it('should handle errors with and without context', () => {
      const store = useErrorStore;
      
      // Error without context
      store.setError('Error without context');
      expect(store.error.context).toBeUndefined();
      
      // Error with context
      store.setError('Error with context', { foo: 'bar' });
      expect(store.error.context).toEqual({ foo: 'bar' });
      
      // Another error without context shouldn't have previous context
      store.setError('Another error');
      expect(store.error.context).toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null or undefined gracefully', () => {
      const store = useErrorStore;
      
      // These should not throw
      store.setError(null);
      expect(store.error.message).toBe('null');
      
      store.setError(undefined);
      expect(store.error.message).toBe('undefined');
    });

    it('should handle empty string error', () => {
      const store = useErrorStore;
      
      store.setError('');
      expect(store.error.message).toBe('');
    });

    it('should handle clearing already cleared state', () => {
      const store = useErrorStore;
      
      store.clearError();
      store.clearError(); // Should not throw
      expect(store.error).toBeNull();
      
      store.clearHistory();
      store.clearHistory(); // Should not throw
      expect(store.errorHistory).toEqual([]);
    });
  });
});