import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { OfflineQueue } from '../../lib/error/offline-queue';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe('OfflineQueue', () => {
  let queue: OfflineQueue;

  beforeEach(() => {
    jest.clearAllMocks();
    queue = new OfflineQueue();
    
    // Reset fetch mock
    (global.fetch as jest.Mock).mockReset();
  });

  describe('enqueue', () => {
    it('should add operation to queue', async () => {
      const operation = {
        url: '/api/test',
        method: 'POST' as const,
        data: { test: 'data' },
      };

      const result = await queue.enqueue(operation);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('timestamp');
      expect(result.status).toBe('pending');
      expect(result.operation).toEqual(operation);
    });

    it('should persist queue to AsyncStorage', async () => {
      const operation = {
        url: '/api/test',
        method: 'GET' as const,
      };

      await queue.enqueue(operation);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@offline_queue',
        expect.any(String)
      );
    });

    it('should generate unique IDs for operations', async () => {
      const op1 = await queue.enqueue({ url: '/api/1', method: 'GET' });
      const op2 = await queue.enqueue({ url: '/api/2', method: 'GET' });

      expect(op1.id).not.toBe(op2.id);
    });

    it('should handle operations with headers', async () => {
      const operation = {
        url: '/api/test',
        method: 'POST' as const,
        headers: { 'Authorization': 'Bearer token' },
        data: { test: 'data' },
      };

      const result = await queue.enqueue(operation);

      expect(result.operation.headers).toEqual(operation.headers);
    });
  });

  describe('processQueue', () => {
    it('should process pending operations', async () => {
      // Mock successful response
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      // Add operations to queue
      await queue.enqueue({ url: '/api/1', method: 'GET' });
      await queue.enqueue({ url: '/api/2', method: 'POST', data: { test: 'data' } });

      // Process queue
      const results = await queue.processQueue();

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should handle failed operations', async () => {
      // Mock failed response
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await queue.enqueue({ url: '/api/test', method: 'GET' });

      const results = await queue.processQueue();

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
      expect(results[0].error).toBe('Network error');
    });

    it('should update operation status after processing', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      const queued = await queue.enqueue({ url: '/api/test', method: 'GET' });
      await queue.processQueue();

      const status = await queue.getQueueStatus();
      const processedOp = status.operations.find(op => op.id === queued.id);

      expect(processedOp?.status).toBe('completed');
    });

    it('should retry failed operations', async () => {
      // First attempt fails
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      // Second attempt succeeds
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await queue.enqueue({ url: '/api/test', method: 'GET' });

      // First process attempt
      await queue.processQueue();
      
      // Second process attempt
      const results = await queue.processQueue();

      expect(results[0].success).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should not process already completed operations', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      await queue.enqueue({ url: '/api/test', method: 'GET' });
      
      // Process once
      await queue.processQueue();
      
      // Process again
      const results = await queue.processQueue();

      expect(results).toHaveLength(0);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should handle empty queue', async () => {
      const results = await queue.processQueue();

      expect(results).toHaveLength(0);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('getQueueStatus', () => {
    it('should return queue status', async () => {
      await queue.enqueue({ url: '/api/1', method: 'GET' });
      await queue.enqueue({ url: '/api/2', method: 'POST', data: { test: 'data' } });

      const status = await queue.getQueueStatus();

      expect(status.total).toBe(2);
      expect(status.pending).toBe(2);
      expect(status.completed).toBe(0);
      expect(status.failed).toBe(0);
      expect(status.operations).toHaveLength(2);
    });

    it('should update status after processing', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      await queue.enqueue({ url: '/api/test', method: 'GET' });
      await queue.processQueue();

      const status = await queue.getQueueStatus();

      expect(status.pending).toBe(0);
      expect(status.completed).toBe(1);
    });

    it('should load persisted queue on initialization', async () => {
      const persistedQueue = [
        {
          id: '1',
          operation: { url: '/api/test', method: 'GET' },
          status: 'pending',
          timestamp: Date.now(),
        },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(persistedQueue)
      );

      const newQueue = new OfflineQueue();
      // Allow time for async initialization
      await new Promise(resolve => setTimeout(resolve, 10));

      const status = await newQueue.getQueueStatus();
      expect(status.total).toBe(1);
    });
  });

  describe('clearQueue', () => {
    it('should clear all operations', async () => {
      await queue.enqueue({ url: '/api/1', method: 'GET' });
      await queue.enqueue({ url: '/api/2', method: 'POST', data: {} });

      await queue.clearQueue();

      const status = await queue.getQueueStatus();
      expect(status.total).toBe(0);
      expect(AsyncStorage.setItem).toHaveBeenLastCalledWith(
        '@offline_queue',
        '[]'
      );
    });

    it('should not affect new operations after clear', async () => {
      await queue.enqueue({ url: '/api/1', method: 'GET' });
      await queue.clearQueue();
      
      await queue.enqueue({ url: '/api/2', method: 'GET' });
      
      const status = await queue.getQueueStatus();
      expect(status.total).toBe(1);
    });
  });

  describe('removeOperation', () => {
    it('should remove specific operation', async () => {
      const op1 = await queue.enqueue({ url: '/api/1', method: 'GET' });
      const op2 = await queue.enqueue({ url: '/api/2', method: 'GET' });

      await queue.removeOperation(op1.id);

      const status = await queue.getQueueStatus();
      expect(status.total).toBe(1);
      expect(status.operations[0].id).toBe(op2.id);
    });

    it('should handle removing non-existent operation', async () => {
      await queue.enqueue({ url: '/api/1', method: 'GET' });

      // Should not throw
      await expect(queue.removeOperation('non-existent')).resolves.not.toThrow();

      const status = await queue.getQueueStatus();
      expect(status.total).toBe(1);
    });
  });

  describe('getQueuedOperations', () => {
    it('should return all queued operations', async () => {
      const op1 = await queue.enqueue({ url: '/api/1', method: 'GET' });
      const op2 = await queue.enqueue({ url: '/api/2', method: 'POST', data: {} });

      const operations = await queue.getQueuedOperations();

      expect(operations).toHaveLength(2);
      expect(operations[0].id).toBe(op1.id);
      expect(operations[1].id).toBe(op2.id);
    });

    it('should filter by status', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      await queue.enqueue({ url: '/api/1', method: 'GET' });
      await queue.enqueue({ url: '/api/2', method: 'GET' });
      
      // Process only the first one
      const firstOp = (await queue.getQueuedOperations())[0];
      await queue.processQueue();
      await queue.removeOperation(firstOp.id);

      const pendingOps = await queue.getQueuedOperations('pending');
      expect(pendingOps).toHaveLength(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle network timeout', async () => {
      (global.fetch as jest.Mock).mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      );

      await queue.enqueue({ url: '/api/test', method: 'GET' });
      const results = await queue.processQueue();

      expect(results[0].success).toBe(false);
      expect(results[0].error).toBe('Timeout');
    });

    it('should handle invalid JSON in AsyncStorage', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('invalid json');

      const newQueue = new OfflineQueue();
      await new Promise(resolve => setTimeout(resolve, 10));

      const status = await newQueue.getQueueStatus();
      expect(status.total).toBe(0);
    });

    it('should handle concurrent enqueue operations', async () => {
      const operations = Array.from({ length: 10 }, (_, i) => ({
        url: `/api/test${i}`,
        method: 'GET' as const,
      }));

      const results = await Promise.all(
        operations.map(op => queue.enqueue(op))
      );

      expect(results).toHaveLength(10);
      const status = await queue.getQueueStatus();
      expect(status.total).toBe(10);
    });

    it('should maintain queue order', async () => {
      await queue.enqueue({ url: '/api/1', method: 'GET' });
      await queue.enqueue({ url: '/api/2', method: 'GET' });
      await queue.enqueue({ url: '/api/3', method: 'GET' });

      const operations = await queue.getQueuedOperations();
      
      expect(operations[0].operation.url).toBe('/api/1');
      expect(operations[1].operation.url).toBe('/api/2');
      expect(operations[2].operation.url).toBe('/api/3');
    });
  });
});