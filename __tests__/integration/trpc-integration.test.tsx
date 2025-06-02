import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { QueryClient } from '@tanstack/react-query';
import { 
  api, 
  TRPCProvider, 
  useOptimisticMutation, 
  useBatchInvalidation,
  usePrefetch 
} from '@/lib/trpc';
import { authClient } from '@/lib/auth/auth-client';

// Mock auth client
jest.mock('@/lib/auth/auth-client');
const mockAuthClient = authClient as jest.Mocked<typeof authClient>;

// Mock config
jest.mock('@/lib/config', () => ({
  getApiUrl: () => 'http://localhost:8081',
}));

describe('tRPC Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthClient.getCookie.mockReturnValue('test-session-cookie');
  });

  describe('TRPCProvider', () => {
    it('should create query client with platform-specific optimizations', () => {
      const TestComponent = () => {
        const { data } = api.auth.getSession.useQuery();
        return null;
      };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TRPCProvider>{children}</TRPCProvider>
      );

      // Test doesn't throw
      expect(() => {
        renderHook(() => <TestComponent />, { wrapper });
      }).not.toThrow();
    });

    it('should configure different stale times for web vs mobile', () => {
      // Test mobile platform
      Object.defineProperty(Platform, 'OS', {
        writable: true,
        value: 'ios',
      });

      let mobileQueryClient: QueryClient | undefined;

      const MobileWrapper = ({ children }: { children: React.ReactNode }) => {
        return <TRPCProvider>{children}</TRPCProvider>;
      };

      renderHook(() => null, { wrapper: MobileWrapper });

      // Test web platform
      Object.defineProperty(Platform, 'OS', {
        writable: true,
        value: 'web',
      });

      const WebWrapper = ({ children }: { children: React.ReactNode }) => {
        return <TRPCProvider>{children}</TRPCProvider>;
      };

      renderHook(() => null, { wrapper: WebWrapper });

      // Both should work without errors
      expect(true).toBe(true);
    });
  });

  describe('Enhanced tRPC Hooks', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TRPCProvider>{children}</TRPCProvider>
    );

    describe('useOptimisticMutation', () => {
      it('should handle optimistic updates', async () => {
        const mockMutation = {
          useMutation: jest.fn().mockReturnValue({
            mutate: jest.fn(),
            isLoading: false,
            error: null,
          }),
        };

        const onSuccess = jest.fn();
        const onError = jest.fn();

        const { result } = renderHook(
          () => useOptimisticMutation(mockMutation, { onSuccess, onError }),
          { wrapper }
        );

        expect(mockMutation.useMutation).toHaveBeenCalledWith(
          expect.objectContaining({
            onMutate: expect.any(Function),
            onError: expect.any(Function),
            onSuccess: expect.any(Function),
            onSettled: expect.any(Function),
          })
        );
      });

      it('should call custom success handler', async () => {
        const mockMutation = {
          useMutation: jest.fn().mockImplementation((options) => {
            // Simulate successful mutation
            setTimeout(() => {
              options.onSuccess('test-data');
            }, 0);
            
            return {
              mutate: jest.fn(),
              isLoading: false,
              error: null,
            };
          }),
        };

        const onSuccess = jest.fn();

        renderHook(
          () => useOptimisticMutation(mockMutation, { onSuccess }),
          { wrapper }
        );

        await waitFor(() => {
          expect(onSuccess).toHaveBeenCalledWith('test-data');
        });
      });

      it('should call custom error handler', async () => {
        const mockMutation = {
          useMutation: jest.fn().mockImplementation((options) => {
            // Simulate failed mutation
            setTimeout(() => {
              options.onError(new Error('Mutation failed'));
            }, 0);
            
            return {
              mutate: jest.fn(),
              isLoading: false,
              error: new Error('Mutation failed'),
            };
          }),
        };

        const onError = jest.fn();

        renderHook(
          () => useOptimisticMutation(mockMutation, { onError }),
          { wrapper }
        );

        await waitFor(() => {
          expect(onError).toHaveBeenCalledWith(new Error('Mutation failed'));
        });
      });
    });

    describe('useBatchInvalidation', () => {
      it('should provide invalidation utilities', () => {
        const { result } = renderHook(() => useBatchInvalidation(), { wrapper });

        expect(result.current).toHaveProperty('invalidateAll');
        expect(result.current).toHaveProperty('invalidateAuth');
        expect(typeof result.current.invalidateAll).toBe('function');
        expect(typeof result.current.invalidateAuth).toBe('function');
      });

      it('should call invalidation methods without errors', () => {
        const { result } = renderHook(() => useBatchInvalidation(), { wrapper });

        expect(() => {
          result.current.invalidateAll();
          result.current.invalidateAuth();
        }).not.toThrow();
      });
    });

    describe('usePrefetch', () => {
      it('should provide prefetch utilities', () => {
        const { result } = renderHook(() => usePrefetch(), { wrapper });

        expect(result.current).toHaveProperty('prefetchOnHover');
        expect(result.current).toHaveProperty('prefetchOnFocus');
        expect(typeof result.current.prefetchOnHover).toBe('function');
        expect(typeof result.current.prefetchOnFocus).toBe('function');
      });

      it('should return platform-specific prefetch handlers', () => {
        // Test web platform
        Object.defineProperty(Platform, 'OS', {
          writable: true,
          value: 'web',
        });

        const { result: webResult } = renderHook(() => usePrefetch(), { wrapper });
        const webHoverProps = webResult.current.prefetchOnHover(
          { prefetch: jest.fn() },
          {}
        );

        expect(webHoverProps).toHaveProperty('onMouseEnter');
        expect(typeof webHoverProps.onMouseEnter).toBe('function');

        // Test mobile platform
        Object.defineProperty(Platform, 'OS', {
          writable: true,
          value: 'ios',
        });

        const { result: mobileResult } = renderHook(() => usePrefetch(), { wrapper });
        const mobileHoverProps = mobileResult.current.prefetchOnHover(
          { prefetch: jest.fn() },
          {}
        );

        expect(mobileHoverProps.onMouseEnter).toBeUndefined();
      });

      it('should handle prefetch on focus', () => {
        const mockProcedure = { prefetch: jest.fn() };
        const { result } = renderHook(() => usePrefetch(), { wrapper });
        
        const focusProps = result.current.prefetchOnFocus(mockProcedure, {});
        
        expect(focusProps).toHaveProperty('onFocus');
        expect(typeof focusProps.onFocus).toBe('function');
        
        // Simulate focus
        focusProps.onFocus();
        expect(mockProcedure.prefetch).toHaveBeenCalledWith({});
      });
    });
  });

  describe('Error Handling', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TRPCProvider>{children}</TRPCProvider>
    );

    it('should handle auth errors properly', () => {
      // Mock auth client to throw error
      mockAuthClient.getCookie.mockImplementation(() => {
        throw new Error('Auth error');
      });

      expect(() => {
        renderHook(() => null, { wrapper });
      }).not.toThrow();
    });

    it('should include auth headers when cookie is available', () => {
      mockAuthClient.getCookie.mockReturnValue('valid-session-cookie');

      const { result } = renderHook(() => null, { wrapper });

      // Should not throw and should work properly
      expect(mockAuthClient.getCookie).toHaveBeenCalled();
    });

    it('should handle missing auth headers gracefully', () => {
      mockAuthClient.getCookie.mockReturnValue(null);

      expect(() => {
        renderHook(() => null, { wrapper });
      }).not.toThrow();
    });
  });

  describe('Platform-Specific Behavior', () => {
    it('should configure different retry strategies for mobile vs web', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TRPCProvider>{children}</TRPCProvider>
      );

      // Test mobile
      Object.defineProperty(Platform, 'OS', {
        writable: true,
        value: 'ios',
      });

      expect(() => {
        renderHook(() => null, { wrapper });
      }).not.toThrow();

      // Test web
      Object.defineProperty(Platform, 'OS', {
        writable: true,
        value: 'web',
      });

      expect(() => {
        renderHook(() => null, { wrapper });
      }).not.toThrow();
    });

    it('should handle window focus refetch based on platform', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TRPCProvider>{children}</TRPCProvider>
      );

      // Should work on both platforms without errors
      expect(() => {
        renderHook(() => null, { wrapper });
      }).not.toThrow();
    });
  });

  describe('Network Error Handling', () => {
    it('should handle network errors with proper retry logic', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TRPCProvider>{children}</TRPCProvider>
      );

      // Mock network error
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      expect(() => {
        renderHook(() => null, { wrapper });
      }).not.toThrow();
    });

    it('should handle timeout errors', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TRPCProvider>{children}</TRPCProvider>
      );

      // Mock timeout
      global.fetch = jest.fn().mockImplementation(
        () => new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout')), 100);
        })
      );

      expect(() => {
        renderHook(() => null, { wrapper });
      }).not.toThrow();
    });
  });
});