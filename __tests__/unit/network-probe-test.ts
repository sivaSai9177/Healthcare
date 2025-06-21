import { networkProbe, NetworkProbeResult } from '@/lib/error/network-probe';
import { logger } from '@/lib/core/debug/unified-logger';

// Mock the logger
jest.mock('@/lib/core/debug/unified-logger', () => ({
  logger: {
    debug: jest.fn(),
  },
}));

// Mock fetch
global.fetch = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

// Mock AbortController
const mockAbort = jest.fn();
const mockAbortController = {
  abort: mockAbort,
  signal: { aborted: false } as AbortSignal,
};
global.AbortController = jest.fn(() => mockAbortController) as any;

// Mock setTimeout and clearTimeout
jest.useFakeTimers();

describe('Network Probe', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    // Reset singleton instance
    (networkProbe as any).constructor.instance = null;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('networkProbe.check()', () => {
    it('should return online status when first endpoint succeeds', async () => {
      mockFetch.mockResolvedValueOnce({} as Response);

      const result = await networkProbe.check();

      expect(result).toEqual({
        isOnline: true,
        latency: expect.any(Number),
        endpoint: 'https://www.google.com/generate_204',
      });
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://www.google.com/generate_204',
        expect.objectContaining({
          method: 'HEAD',
          mode: 'no-cors',
          cache: 'no-store',
          signal: mockAbortController.signal,
        })
      );
      expect(logger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Network probe succeeded'),
        'SYSTEM'
      );
    });

    it('should try next endpoint when first fails', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({} as Response);

      const result = await networkProbe.check();

      expect(result).toEqual({
        isOnline: true,
        latency: expect.any(Number),
        endpoint: 'https://cloudflare.com/cdn-cgi/trace',
      });
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(logger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Network probe failed: https://www.google.com/generate_204'),
        'SYSTEM',
        expect.any(Error)
      );
    });

    it('should return offline status when all endpoints fail', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await networkProbe.check();

      expect(result).toEqual({
        isOnline: false,
        error: new Error('All connectivity checks failed'),
      });
      expect(mockFetch).toHaveBeenCalledTimes(4); // All 4 endpoints
    });

    it('should handle timeout correctly', async () => {
      mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

      const checkPromise = networkProbe.check();
      
      // Fast-forward time to trigger timeout
      jest.advanceTimersByTime(5000);
      
      // Mock the fetch to reject after abort
      mockFetch.mockRejectedValueOnce(new Error('AbortError'));
      mockFetch.mockResolvedValueOnce({} as Response);

      const result = await checkPromise;

      expect(mockAbort).toHaveBeenCalled();
      expect(result.isOnline).toBe(true); // Second endpoint succeeds
    });

    it('should not log AbortError', async () => {
      const abortError = new Error('AbortError');
      abortError.name = 'AbortError';
      mockFetch.mockRejectedValueOnce(abortError);
      mockFetch.mockResolvedValueOnce({} as Response);

      await networkProbe.check();

      // Should not log abort errors
      expect(logger.debug).not.toHaveBeenCalledWith(
        expect.stringContaining('Network probe failed'),
        'SYSTEM',
        abortError
      );
    });

    it('should use cached result if within cache duration', async () => {
      mockFetch.mockResolvedValueOnce({} as Response);

      // First check
      const result1 = await networkProbe.check();
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second check immediately after (should use cache)
      const result2 = await networkProbe.check();
      expect(mockFetch).toHaveBeenCalledTimes(1); // No additional calls
      expect(result2).toEqual(result1);
    });

    it('should make new request after cache expires', async () => {
      mockFetch.mockResolvedValue({} as Response);

      // First check
      await networkProbe.check();
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Advance time past cache duration (10 seconds)
      jest.advanceTimersByTime(11000);

      // Second check should make new request
      await networkProbe.check();
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should prevent concurrent probes', async () => {
      mockFetch.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({} as Response), 100))
      );

      // Start two checks simultaneously
      const promise1 = networkProbe.check();
      const promise2 = networkProbe.check();

      jest.advanceTimersByTime(100);

      const [result1, result2] = await Promise.all([promise1, promise2]);

      // Should only make one fetch call
      expect(mockFetch).toHaveBeenCalledTimes(1);
      
      // Second call should return cached or default result
      expect(result2).toBeDefined();
    });

    it('should handle non-Error exceptions', async () => {
      mockFetch.mockRejectedValueOnce('String error');
      mockFetch.mockResolvedValueOnce({} as Response);

      const result = await networkProbe.check();

      expect(result.isOnline).toBe(true);
      expect(logger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Network probe failed'),
        'SYSTEM',
        expect.objectContaining({
          message: 'String error',
        })
      );
    });

    it('should calculate latency correctly', async () => {
      const startTime = Date.now();
      mockFetch.mockImplementation(() => 
        new Promise(resolve => {
          setTimeout(() => resolve({} as Response), 50);
        })
      );

      const result = await networkProbe.check();
      
      jest.advanceTimersByTime(50);

      expect(result.isOnline).toBe(true);
      expect(result.latency).toBeGreaterThanOrEqual(0);
      expect(result.latency).toBeLessThanOrEqual(100);
    });
  });

  describe('networkProbe.cancel()', () => {
    it('should abort ongoing probe', async () => {
      mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

      // Start a probe
      const checkPromise = networkProbe.check();
      
      // Cancel it
      networkProbe.cancel();

      expect(mockAbort).toHaveBeenCalled();
    });

    it('should handle cancel when no probe is active', () => {
      // Should not throw
      expect(() => networkProbe.cancel()).not.toThrow();
    });
  });

  describe('Singleton behavior', () => {
    it('should maintain single instance across multiple calls', async () => {
      mockFetch.mockResolvedValue({} as Response);

      // Make multiple checks
      await networkProbe.check();
      await networkProbe.check();
      
      // Advance time to expire cache
      jest.advanceTimersByTime(11000);
      
      await networkProbe.check();

      // All calls should use the same instance
      expect(global.AbortController).toHaveBeenCalledTimes(3); // One per actual probe
    });
  });

  describe('Edge cases', () => {
    it('should handle all endpoints having different timeouts', async () => {
      let callCount = 0;
      mockFetch.mockImplementation(() => {
        callCount++;
        // Make each endpoint take longer than its timeout
        const timeouts = [5000, 5000, 8000, 8000];
        return new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout')), timeouts[callCount - 1] + 1000);
        });
      });

      const result = await networkProbe.check();

      expect(result.isOnline).toBe(false);
      expect(result.error).toEqual(new Error('All connectivity checks failed'));
    });

    it('should clear timeout when request succeeds quickly', async () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      mockFetch.mockResolvedValueOnce({} as Response);

      await networkProbe.check();

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it('should return last result when concurrent probe is blocked', async () => {
      mockFetch.mockResolvedValueOnce({} as Response);

      // First successful check
      const firstResult = await networkProbe.check();
      
      // Start a slow probe
      mockFetch.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({} as Response), 1000))
      );
      const slowProbe = networkProbe.check();

      // Try another check while slow probe is running
      const concurrentResult = await networkProbe.check();

      expect(concurrentResult).toEqual(firstResult);
      
      jest.advanceTimersByTime(1000);
      await slowProbe;
    });
  });
});