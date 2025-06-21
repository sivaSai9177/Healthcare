import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

// Mock offline queue implementation
class OfflineQueue {
  private queue: {
    id: string;
    type: string;
    payload: any;
    timestamp: Date;
    retryCount: number;
    maxRetries: number;
  }[] = [];
  
  private isOnline: boolean = true;
  private processing: boolean = false;
  private listeners: Map<string, Function[]> = new Map();

  constructor() {
    this.listeners.set('online', []);
    this.listeners.set('offline', []);
    this.listeners.set('queued', []);
    this.listeners.set('processed', []);
    this.listeners.set('failed', []);
  }

  setOnlineStatus(online: boolean) {
    this.isOnline = online;
    const event = online ? 'online' : 'offline';
    this.emit(event, { online });
    
    if (online && this.queue.length > 0) {
      this.processQueue();
    }
  }

  async enqueue(type: string, payload: any, options = {}) {
    const item = {
      id: `queue-${Date.now()}-${Math.random()}`,
      type,
      payload,
      timestamp: new Date(),
      retryCount: 0,
      maxRetries: options.maxRetries || 3,
    };
    
    this.queue.push(item);
    this.emit('queued', item);
    
    if (this.isOnline) {
      await this.processQueue();
    }
    
    return item.id;
  }

  async processQueue() {
    if (this.processing || !this.isOnline || this.queue.length === 0) {
      return;
    }
    
    this.processing = true;
    
    while (this.queue.length > 0 && this.isOnline) {
      const item = this.queue[0];
      
      try {
        // Simulate API call
        await this.processItem(item);
        this.queue.shift(); // Remove processed item
        this.emit('processed', item);
      } catch (error) {
        item.retryCount++;
        
        if (item.retryCount >= item.maxRetries) {
          this.queue.shift(); // Remove failed item
          this.emit('failed', { item, error });
        } else {
          // Move to end of queue for retry
          this.queue.push(this.queue.shift()!);
        }
      }
    }
    
    this.processing = false;
  }

  private async processItem(item: any) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Simulate occasional failures
    if (Math.random() < 0.1 && item.retryCount === 0) {
      throw new Error('Network error');
    }
    
    // Process based on type
    switch (item.type) {
      case 'createAlert':
      case 'updatePatient':
      case 'syncData':
        return { success: true, id: item.id };
      default:
        throw new Error(`Unknown queue item type: ${item.type}`);
    }
  }

  on(event: string, listener: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
  }

  off(event: string, listener: Function) {
    const listeners = this.listeners.get(event) || [];
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }

  private emit(event: string, data: any) {
    const listeners = this.listeners.get(event) || [];
    listeners.forEach(listener => listener(data));
  }

  getQueueLength() {
    return this.queue.length;
  }

  getQueueItems() {
    return [...this.queue];
  }

  clearQueue() {
    this.queue = [];
  }
}

describe('Offline Queue Management', () => {
  let offlineQueue: OfflineQueue;
  
  beforeEach(() => {
    offlineQueue = new OfflineQueue();
  });

  describe('Basic Queue Operations', () => {
    it('enqueues items when offline', async () => {
      offlineQueue.setOnlineStatus(false);
      
      const itemId = await offlineQueue.enqueue('createAlert', {
        patientId: 'patient-123',
        type: 'medical_emergency',
        urgency: 2,
      });
      
      expect(itemId).toBeDefined();
      expect(offlineQueue.getQueueLength()).toBe(1);
    });

    it('processes queue immediately when online', async () => {
      const processedListener = jest.fn();
      offlineQueue.on('processed', processedListener);
      
      await offlineQueue.enqueue('createAlert', {
        patientId: 'patient-123',
        type: 'medical_emergency',
      });
      
      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(processedListener).toHaveBeenCalled();
      expect(offlineQueue.getQueueLength()).toBe(0);
    });

    it('processes queue when coming back online', async () => {
      const processedListener = jest.fn();
      offlineQueue.on('processed', processedListener);
      
      // Go offline
      offlineQueue.setOnlineStatus(false);
      
      // Enqueue items
      await offlineQueue.enqueue('createAlert', { type: 'alert1' });
      await offlineQueue.enqueue('updatePatient', { id: 'patient-1' });
      await offlineQueue.enqueue('syncData', { data: 'test' });
      
      expect(offlineQueue.getQueueLength()).toBe(3);
      
      // Go back online
      offlineQueue.setOnlineStatus(true);
      
      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(processedListener).toHaveBeenCalledTimes(3);
      expect(offlineQueue.getQueueLength()).toBe(0);
    });
  });

  describe('Retry Mechanism', () => {
    it('retries failed items', async () => {
      const failedListener = jest.fn();
      const processedListener = jest.fn();
      
      offlineQueue.on('failed', failedListener);
      offlineQueue.on('processed', processedListener);
      
      // Force failure by using high random threshold
      jest.spyOn(Math, 'random').mockReturnValue(0.05); // Will fail first time
      
      await offlineQueue.enqueue('createAlert', { test: true }, { maxRetries: 2 });
      
      // First attempt fails
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Reset random to allow success
      jest.spyOn(Math, 'random').mockReturnValue(0.5);
      
      // Process retries
      await offlineQueue.processQueue();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      expect(processedListener).toHaveBeenCalled();
      expect(failedListener).not.toHaveBeenCalled();
    });

    it('fails permanently after max retries', async () => {
      const failedListener = jest.fn();
      
      offlineQueue.on('failed', failedListener);
      
      // Force consistent failures
      jest.spyOn(Math, 'random').mockReturnValue(0.05);
      
      await offlineQueue.enqueue('createAlert', { test: true }, { maxRetries: 2 });
      
      // Process multiple times to exhaust retries
      for (let i = 0; i < 3; i++) {
        await offlineQueue.processQueue();
        await new Promise(resolve => setTimeout(resolve, 150));
      }
      
      expect(failedListener).toHaveBeenCalled();
      expect(offlineQueue.getQueueLength()).toBe(0);
    });
  });

  describe('Queue Event Handling', () => {
    it('emits queued event when item added', async () => {
      const queuedListener = jest.fn();
      offlineQueue.on('queued', queuedListener);
      
      offlineQueue.setOnlineStatus(false);
      await offlineQueue.enqueue('createAlert', { test: true });
      
      expect(queuedListener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'createAlert',
          payload: { test: true },
        })
      );
    });

    it('emits online/offline events', () => {
      const onlineListener = jest.fn();
      const offlineListener = jest.fn();
      
      offlineQueue.on('online', onlineListener);
      offlineQueue.on('offline', offlineListener);
      
      offlineQueue.setOnlineStatus(false);
      expect(offlineListener).toHaveBeenCalledWith({ online: false });
      
      offlineQueue.setOnlineStatus(true);
      expect(onlineListener).toHaveBeenCalledWith({ online: true });
    });

    it('removes event listeners', () => {
      const listener = jest.fn();
      
      offlineQueue.on('online', listener);
      offlineQueue.setOnlineStatus(true);
      expect(listener).toHaveBeenCalledTimes(1);
      
      offlineQueue.off('online', listener);
      offlineQueue.setOnlineStatus(false);
      offlineQueue.setOnlineStatus(true);
      expect(listener).toHaveBeenCalledTimes(1); // Not called again
    });
  });

  describe('Queue Management', () => {
    it('maintains queue order', async () => {
      offlineQueue.setOnlineStatus(false);
      
      await offlineQueue.enqueue('createAlert', { order: 1 });
      await offlineQueue.enqueue('updatePatient', { order: 2 });
      await offlineQueue.enqueue('syncData', { order: 3 });
      
      const items = offlineQueue.getQueueItems();
      expect(items[0].payload.order).toBe(1);
      expect(items[1].payload.order).toBe(2);
      expect(items[2].payload.order).toBe(3);
    });

    it('clears queue on demand', async () => {
      offlineQueue.setOnlineStatus(false);
      
      await offlineQueue.enqueue('createAlert', { test: 1 });
      await offlineQueue.enqueue('createAlert', { test: 2 });
      
      expect(offlineQueue.getQueueLength()).toBe(2);
      
      offlineQueue.clearQueue();
      expect(offlineQueue.getQueueLength()).toBe(0);
    });

    it('handles concurrent processing correctly', async () => {
      const processedItems: string[] = [];
      
      offlineQueue.on('processed', (item) => {
        processedItems.push(item.id);
      });
      
      // Enqueue multiple items
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(offlineQueue.enqueue('syncData', { index: i }));
      }
      
      await Promise.all(promises);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      expect(processedItems).toHaveLength(5);
    });
  });

  describe('Error Handling', () => {
    it('handles unknown item types', async () => {
      const failedListener = jest.fn();
      offlineQueue.on('failed', failedListener);
      
      await offlineQueue.enqueue('unknownType', { test: true }, { maxRetries: 1 });
      
      await offlineQueue.processQueue();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      expect(failedListener).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: expect.stringContaining('Unknown queue item type'),
          }),
        })
      );
    });

    it('preserves queue during processing errors', async () => {
      offlineQueue.setOnlineStatus(false);
      
      // Add valid items
      await offlineQueue.enqueue('createAlert', { valid: true });
      await offlineQueue.enqueue('unknownType', { invalid: true });
      await offlineQueue.enqueue('updatePatient', { valid: true });
      
      expect(offlineQueue.getQueueLength()).toBe(3);
      
      // Go online to process
      offlineQueue.setOnlineStatus(true);
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Should have processed valid items despite error
      const remaining = offlineQueue.getQueueItems();
      expect(remaining.length).toBeLessThan(3);
    });
  });

  describe('Performance', () => {
    it('handles large queues efficiently', async () => {
      offlineQueue.setOnlineStatus(false);
      
      const startTime = Date.now();
      
      // Enqueue 100 items
      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(offlineQueue.enqueue('syncData', { index: i }));
      }
      
      await Promise.all(promises);
      const enqueueTime = Date.now() - startTime;
      
      expect(enqueueTime).toBeLessThan(100); // Should be fast
      expect(offlineQueue.getQueueLength()).toBe(100);
    });

    it('processes items in batches', async () => {
      let processedCount = 0;
      offlineQueue.on('processed', () => processedCount++);
      
      // Add many items
      for (let i = 0; i < 20; i++) {
        await offlineQueue.enqueue('syncData', { index: i });
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      expect(processedCount).toBe(20);
      expect(offlineQueue.getQueueLength()).toBe(0);
    });
  });
});