/**
 * WebSocket Event Queue with Deduplication and Reliability
 * Ensures events are processed in order and not lost during disconnections
 */

import { logger } from '@/lib/core/debug/unified-logger';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AlertWebSocketEvent } from '@/types/alert';

interface QueuedEvent {
  id: string;
  event: AlertWebSocketEvent;
  timestamp: number;
  retryCount: number;
  processed: boolean;
}

interface EventQueueOptions {
  maxQueueSize?: number;
  maxRetries?: number;
  retryDelay?: number;
  persistQueue?: boolean;
  deduplicationWindow?: number; // milliseconds
}

export class WebSocketEventQueue {
  private queue: Map<string, QueuedEvent> = new Map();
  private processedEvents: Map<string, number> = new Map(); // eventId -> timestamp
  private processedEventHashes: Map<string, number> = new Map(); // eventHash -> timestamp
  private processingPromise: Promise<void> | null = null;
  private isProcessing = false;
  private eventHandlers: Map<string, (event: AlertWebSocketEvent) => Promise<void>> = new Map();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;
  
  private readonly options: Required<EventQueueOptions>;
  private readonly STORAGE_KEY = '@websocket_event_queue';
  
  constructor(options: EventQueueOptions = {}) {
    this.options = {
      maxQueueSize: options.maxQueueSize || 1000,
      maxRetries: options.maxRetries || 3,
      retryDelay: options.retryDelay || 1000,
      persistQueue: options.persistQueue ?? true,
      deduplicationWindow: options.deduplicationWindow || 5000, // 5 seconds
    };
    
    // Load persisted queue on initialization
    if (this.options.persistQueue) {
      this.loadPersistedQueue();
    }
    
    // Clean up old processed events periodically
    this.cleanupInterval = setInterval(() => this.cleanupProcessedEvents(), 60000); // Every minute
  }
  
  /**
   * Check if a similar event is already in the queue
   */
  private isInQueue(event: AlertWebSocketEvent): boolean {
    const eventHash = this.generateEventHash(event);
    
    for (const [, queuedEvent] of this.queue.entries()) {
      if (!queuedEvent.processed) {
        // Check if same event ID
        if (queuedEvent.event.id === event.id) {
          return true;
        }
        
        // Check if same content hash
        const queuedEventHash = this.generateEventHash(queuedEvent.event);
        if (queuedEventHash === eventHash) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Add an event to the queue
   */
  async enqueue(event: AlertWebSocketEvent): Promise<void> {
    const eventKey = this.getEventKey(event);
    
    // Check for duplicate
    if (this.isDuplicate(event)) {
      logger.debug('Duplicate event detected, skipping', 'WS_QUEUE', {
        eventId: event.id,
        type: event.type,
      });
      return;
    }
    
    // Check if already in queue
    if (this.isInQueue(event)) {
      logger.debug('Similar event already in queue, skipping', 'WS_QUEUE', {
        eventId: event.id,
        type: event.type,
      });
      return;
    }
    
    // Check queue size
    if (this.queue.size >= this.options.maxQueueSize) {
      logger.warn('Event queue full, removing oldest event', 'WS_QUEUE');
      const oldestKey = Array.from(this.queue.keys())[0];
      this.queue.delete(oldestKey);
    }
    
    // Add to queue
    const queuedEvent: QueuedEvent = {
      id: event.id,
      event,
      timestamp: Date.now(),
      retryCount: 0,
      processed: false,
    };
    
    this.queue.set(eventKey, queuedEvent);
    
    logger.debug('Event enqueued', 'WS_QUEUE', {
      eventId: event.id,
      type: event.type,
      queueSize: this.queue.size,
    });
    
    // Persist queue
    if (this.options.persistQueue) {
      await this.persistQueue();
    }
    
    // Start processing if not already running
    this.startProcessing();
  }
  
  /**
   * Register an event handler
   */
  registerHandler(eventType: string, handler: (event: AlertWebSocketEvent) => Promise<void>) {
    this.eventHandlers.set(eventType, handler);
  }
  
  /**
   * Unregister an event handler
   */
  unregisterHandler(eventType: string) {
    this.eventHandlers.delete(eventType);
    logger.debug('Event handler unregistered', 'WS_QUEUE', { eventType });
  }
  
  /**
   * Start processing the queue
   */
  private startProcessing() {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    this.processingPromise = this.processQueue();
  }
  
  /**
   * Process events in the queue
   */
  private async processQueue(): Promise<void> {
    while (this.queue.size > 0 && this.isProcessing) {
      const entries = Array.from(this.queue.entries());
      
      for (const [key, queuedEvent] of entries) {
        if (queuedEvent.processed) {
          this.queue.delete(key);
          continue;
        }
        
        try {
          await this.processEvent(queuedEvent);
          
          // Mark as processed
          queuedEvent.processed = true;
          const now = Date.now();
          this.processedEvents.set(queuedEvent.event.id, now);
          this.processedEventHashes.set(this.generateEventHash(queuedEvent.event), now);
          this.queue.delete(key);
          
          logger.debug('Event processed successfully', 'WS_QUEUE', {
            eventId: queuedEvent.event.id,
            type: queuedEvent.event.type,
          });
        } catch (error) {
          logger.error('Failed to process event', 'WS_QUEUE', {
            eventId: queuedEvent.event.id,
            error,
            retryCount: queuedEvent.retryCount,
          });
          
          queuedEvent.retryCount++;
          
          if (queuedEvent.retryCount >= this.options.maxRetries) {
            logger.error('Event exceeded max retries, removing from queue', 'WS_QUEUE', {
              eventId: queuedEvent.event.id,
            });
            this.queue.delete(key);
          } else {
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, this.options.retryDelay));
          }
        }
      }
      
      // Persist queue after processing
      if (this.options.persistQueue) {
        await this.persistQueue();
      }
      
      // Small delay between processing cycles
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    this.isProcessing = false;
    this.processingPromise = null;
  }
  
  /**
   * Process a single event
   */
  private async processEvent(queuedEvent: QueuedEvent): Promise<void> {
    const { event } = queuedEvent;
    const handler = this.eventHandlers.get(event.type);
    
    if (!handler) {
      logger.warn('No handler registered for event type', 'WS_QUEUE', {
        eventType: event.type,
      });
      return;
    }
    
    await handler(event);
  }
  
  /**
   * Generate a content hash for deduplication
   */
  private generateEventHash(event: AlertWebSocketEvent): string {
    // Create a hash based on event content (excluding timestamp and id)
    const contentToHash = {
      type: event.type,
      alertId: event.alertId,
      hospitalId: event.hospitalId,
      data: event.data,
    };
    
    // Simple hash function for content
    const str = JSON.stringify(contentToHash);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `hash_${hash}_${event.type}_${event.alertId}`;
  }

  /**
   * Check if an event is a duplicate
   */
  private isDuplicate(event: AlertWebSocketEvent): boolean {
    // Check by event ID
    const processedTime = this.processedEvents.get(event.id);
    if (processedTime) {
      const timeSinceProcessed = Date.now() - processedTime;
      if (timeSinceProcessed < this.options.deduplicationWindow) {
        logger.debug('Duplicate event detected by ID', 'WS_QUEUE', {
          eventId: event.id,
          timeSinceProcessed,
        });
        return true;
      }
    }
    
    // Check by content hash
    const eventHash = this.generateEventHash(event);
    const hashProcessedTime = this.processedEventHashes.get(eventHash);
    if (hashProcessedTime) {
      const timeSinceProcessed = Date.now() - hashProcessedTime;
      if (timeSinceProcessed < this.options.deduplicationWindow) {
        logger.debug('Duplicate event detected by content hash', 'WS_QUEUE', {
          eventId: event.id,
          eventHash,
          timeSinceProcessed,
        });
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Get a unique key for an event
   */
  private getEventKey(event: AlertWebSocketEvent): string {
    return `${event.type}:${event.alertId}:${event.id}`;
  }
  
  /**
   * Clean up old processed events
   */
  private cleanupProcessedEvents() {
    const cutoffTime = Date.now() - this.options.deduplicationWindow * 2;
    
    // Clean up processed event IDs
    for (const [eventId, timestamp] of this.processedEvents.entries()) {
      if (timestamp < cutoffTime) {
        this.processedEvents.delete(eventId);
      }
    }
    
    // Clean up processed event hashes
    for (const [eventHash, timestamp] of this.processedEventHashes.entries()) {
      if (timestamp < cutoffTime) {
        this.processedEventHashes.delete(eventHash);
      }
    }
    
    logger.debug('Cleaned up processed events', 'WS_QUEUE', {
      remainingEventIds: this.processedEvents.size,
      remainingEventHashes: this.processedEventHashes.size,
    });
  }
  
  /**
   * Persist queue to storage
   */
  private async persistQueue(): Promise<void> {
    if (!this.options.persistQueue) return;
    
    try {
      const queueData = Array.from(this.queue.entries()).map(([key, event]) => ({
        key,
        event,
      }));
      
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(queueData));
    } catch (error) {
      logger.error('Failed to persist queue', 'WS_QUEUE', error);
    }
  }
  
  /**
   * Load persisted queue from storage
   */
  private async loadPersistedQueue(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (!data) return;
      
      const queueData = JSON.parse(data) as { key: string; event: QueuedEvent }[];
      
      for (const { key, event } of queueData) {
        // Skip events that are too old
        if (Date.now() - event.timestamp > 3600000) continue; // 1 hour
        
        this.queue.set(key, event);
      }
      
      logger.info('Loaded persisted queue', 'WS_QUEUE', {
        eventCount: this.queue.size,
      });
      
      // Start processing loaded events
      if (this.queue.size > 0) {
        this.startProcessing();
      }
    } catch (error) {
      logger.error('Failed to load persisted queue', 'WS_QUEUE', error);
    }
  }
  
  /**
   * Get queue statistics
   */
  getStats() {
    return {
      queueSize: this.queue.size,
      processedCount: this.processedEvents.size,
      processedHashCount: this.processedEventHashes.size,
      isProcessing: this.isProcessing,
      oldestEvent: this.queue.size > 0 
        ? new Date(Array.from(this.queue.values())[0].timestamp)
        : null,
      deduplicationWindow: this.options.deduplicationWindow,
    };
  }
  
  /**
   * Get deduplication statistics
   */
  getDeduplicationStats() {
    return {
      uniqueEventIds: this.processedEvents.size,
      uniqueContentHashes: this.processedEventHashes.size,
      deduplicationWindow: this.options.deduplicationWindow,
      nextCleanup: this.cleanupInterval ? new Date(Date.now() + 60000) : null,
    };
  }
  
  /**
   * Clear the queue
   */
  async clear(): Promise<void> {
    this.queue.clear();
    this.processedEvents.clear();
    this.processedEventHashes.clear();
    this.isProcessing = false;
    
    if (this.options.persistQueue) {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
    }
    
    logger.info('Event queue cleared', 'WS_QUEUE');
  }
  
  /**
   * Stop processing
   */
  stop() {
    this.isProcessing = false;
  }
  
  /**
   * Destroy the queue and clean up resources
   */
  destroy() {
    // Stop processing
    this.stop();
    
    // Clear interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    // Clear all data
    this.queue.clear();
    this.processedEvents.clear();
    this.processedEventHashes.clear();
    this.eventHandlers.clear();
    
    // Wait for any ongoing processing to complete
    if (this.processingPromise) {
      this.processingPromise.then(() => {
        logger.info('Event queue destroyed', 'WS_QUEUE');
      }).catch(() => {
        // Ignore errors during cleanup
      });
    }
  }
}

// Export singleton instance
export const alertEventQueue = new WebSocketEventQueue({
  maxQueueSize: 500,
  maxRetries: 3,
  retryDelay: 2000,
  persistQueue: true,
  deduplicationWindow: 5000,
});