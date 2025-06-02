import { Platform } from 'react-native';
import { authClient } from '../auth-client';
import { getApiUrl, config } from '../config';

// Mock dependencies
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: jest.fn((obj) => obj.ios),
  },
}));

jest.mock('@better-auth/expo/client', () => ({
  expoClient: jest.fn(() => ({
    name: 'expo-client',
  })),
}));

jest.mock('better-auth/react', () => ({
  createAuthClient: jest.fn(() => ({
    useSession: jest.fn(),
    signIn: {
      email: jest.fn(),
    },
    signOut: jest.fn(),
    $fetch: jest.fn(),
    getCookie: jest.fn(),
  })),
}));

jest.mock('better-auth/client/plugins', () => ({
  inferAdditionalFields: jest.fn(() => ({
    name: 'infer-additional-fields',
  })),
}));

jest.mock('../config', () => ({
  getApiUrl: jest.fn(() => 'http://localhost:8081'),
  config: {
    appScheme: 'hospital-alert',
  },
}));

jest.mock('../secure-storage', () => ({
  webStorage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
  mobileStorage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

// Import mocked modules
import { createAuthClient } from 'better-auth/react';
import { expoClient } from '@better-auth/expo/client';
import { inferAdditionalFields } from 'better-auth/client/plugins';

const mockCreateAuthClient = createAuthClient as jest.MockedFunction<typeof createAuthClient>;
const mockExpoClient = expoClient as jest.MockedFunction<typeof expoClient>;
const mockInferAdditionalFields = inferAdditionalFields as jest.MockedFunction<typeof inferAdditionalFields>;

describe('Auth Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Client Initialization', () => {
    it('should create auth client with correct base URL', () => {
      // Re-import to trigger initialization
      jest.isolateModules(() => {
        require('../auth-client');
      });

      expect(mockCreateAuthClient).toHaveBeenCalledWith({
        baseURL: 'http://localhost:8081',
        plugins: expect.arrayContaining([
          expect.any(Object), // expo client plugin
          expect.any(Object), // infer additional fields plugin
        ]),
      });
    });

    it('should configure expo client plugin correctly', () => {
      jest.isolateModules(() => {
        require('../auth-client');
      });

      expect(mockExpoClient).toHaveBeenCalledWith({
        scheme: 'hospital-alert',
        storagePrefix: 'hospital-alert',
        storage: expect.any(Object),
      });
    });

    it('should configure additional fields plugin for user roles', () => {
      jest.isolateModules(() => {
        require('../auth-client');
      });

      expect(mockInferAdditionalFields).toHaveBeenCalledWith({
        user: {
          role: {
            type: 'string',
            required: true,
            defaultValue: 'doctor',
          },
          hospitalId: {
            type: 'string',
            required: false,
          },
        },
      });
    });
  });

  describe('Platform-specific Configuration', () => {
    it('should use mobile storage on mobile platforms', () => {
      (Platform.OS as string) = 'ios';
      
      jest.isolateModules(() => {
        const { mobileStorage } = require('../secure-storage');
        require('../auth-client');
        
        expect(mockExpoClient).toHaveBeenCalledWith(
          expect.objectContaining({
            storage: mobileStorage,
          })
        );
      });
    });

    it('should use web storage on web platform', () => {
      (Platform.OS as string) = 'web';
      
      jest.isolateModules(() => {
        const { webStorage } = require('../secure-storage');
        require('../auth-client');
        
        expect(mockExpoClient).toHaveBeenCalledWith(
          expect.objectContaining({
            storage: webStorage,
          })
        );
      });
    });

    it('should log platform and base URL on initialization', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      jest.isolateModules(() => {
        require('../auth-client');
      });

      expect(consoleSpy).toHaveBeenCalledWith('[AUTH CLIENT] Platform:', Platform.OS);
      expect(consoleSpy).toHaveBeenCalledWith('[AUTH CLIENT] Using baseURL:', 'http://localhost:8081');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Auth Client Interface', () => {
    it('should export auth client with correct methods', () => {
      expect(authClient).toBeDefined();
      expect(authClient.useSession).toBeDefined();
      expect(authClient.signIn).toBeDefined();
      expect(authClient.signIn.email).toBeDefined();
      expect(authClient.signOut).toBeDefined();
      expect(authClient.$fetch).toBeDefined();
      expect(authClient.getCookie).toBeDefined();
    });

    it('should have proper TypeScript types', () => {
      // This test ensures the AuthClient type is properly exported
      const client: typeof authClient = authClient;
      expect(client).toBe(authClient);
    });
  });

  describe('Configuration Integration', () => {
    it('should use API URL from config', () => {
      expect(getApiUrl).toHaveBeenCalled();
    });

    it('should use app scheme from config', () => {
      expect(mockExpoClient).toHaveBeenCalledWith(
        expect.objectContaining({
          scheme: config.appScheme,
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle missing environment configuration gracefully', () => {
      const mockGetApiUrl = getApiUrl as jest.MockedFunction<typeof getApiUrl>;
      mockGetApiUrl.mockReturnValue('');

      expect(() => {
        jest.isolateModules(() => {
          require('../auth-client');
        });
      }).not.toThrow();
    });
  });
});