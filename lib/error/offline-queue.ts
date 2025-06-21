import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '@/lib/core/debug/unified-logger';
import { NetworkRecovery } from './error-recovery';

interface QueuedOperation {
  id: string;
  type: 'alert' | 'patient-update' | 'response' | 'generic';
  operation: string;
  data: any;
  timestamp: number;
  retries: number;
  userId?: string;
  hospitalId?: string;
}

const STORAGE_KEY = '@healthcare/offline_queue';
const MAX_QUEUE_SIZE = 100;
const MAX_RETRIES = 3;

export class OfflineQueue {
  private static instance: OfflineQueue;
  private queue: QueuedOperation[] = [];
  private isProcessing = false;
  private networkRecovery: NetworkRecovery;

  static getInstance(): OfflineQueue {
    if (!OfflineQueue.instance) {
      OfflineQueue.instance = new OfflineQueue();
    }
    return OfflineQueue.instance;
  }

  private constructor() {
    this.networkRecovery = NetworkRecovery.getInstance();
    this.loadQueue();
    this.setupNetworkListener();
  }

  private async loadQueue() {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
        logger.info(`Loaded ${this.queue.length} queued operations`);
      }
    } catch (error) {
      logger.error('Failed to load offline queue:', error);
    }
  }

  private async saveQueue() {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      logger.error('Failed to save offline queue:', error);
    }
  }

  private setupNetworkListener() {
    this.networkRecovery.onNetworkChange((isOnline) => {
      if (isOnline && this.queue.length > 0) {
        this.processQueue();
      }
    });
  }

  public async enqueue(
    type: QueuedOperation['type'],
    operation: string,
    data: any,
    metadata?: { userId?: string; hospitalId?: string }
  ): Promise<string> {
    const id = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const queuedOp: QueuedOperation = {
      id,
      type,
      operation,
      data,
      timestamp: Date.now(),
      retries: 0,
      ...metadata,
    };

    // Enforce queue size limit
    if (this.queue.length >= MAX_QUEUE_SIZE) {
      // Remove oldest non-critical operations
      const criticalTypes = ['alert', 'response'];
      const nonCriticalIndex = this.queue.findIndex(op => !criticalTypes.includes(op.type));
      
      if (nonCriticalIndex !== -1) {
        this.queue.splice(nonCriticalIndex, 1);
      } else {
        // If all operations are critical, remove the oldest
        this.queue.shift();
      }
    }

    this.queue.push(queuedOp);
    await this.saveQueue();
    
    logger.info(`Queued ${type} operation for offline processing`, { id });
    
    // Try to process immediately if online
    if (this.networkRecovery.getIsOnline()) {
      this.processQueue();
    }
    
    return id;
  }

  public async processQueue() {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    logger.info(`Processing ${this.queue.length} queued operations`);

    const processedIds: string[] = [];

    for (const operation of [...this.queue]) {
      if (!this.networkRecovery.getIsOnline()) {
        break; // Stop if we go offline
      }

      try {
        await this.processOperation(operation);
        processedIds.push(operation.id);
      } catch (error) {
        logger.error(`Failed to process queued operation ${operation.id}:`, error);
        
        operation.retries++;
        if (operation.retries >= MAX_RETRIES) {
          logger.error(`Max retries reached for operation ${operation.id}, removing from queue`);
          processedIds.push(operation.id); // Remove failed operations after max retries
        }
      }
    }

    // Remove processed operations
    this.queue = this.queue.filter(op => !processedIds.includes(op.id));
    await this.saveQueue();

    this.isProcessing = false;
    
    if (this.queue.length > 0) {
      logger.info(`${this.queue.length} operations remaining in queue`);
    }
  }

  private async processOperation(operation: QueuedOperation) {
    logger.info(`Processing queued ${operation.type} operation`, { id: operation.id });

    switch (operation.type) {
      case 'alert':
        await this.processAlertOperation(operation);
        break;
      case 'patient-update':
        await this.processPatientUpdateOperation(operation);
        break;
      case 'response':
        await this.processResponseOperation(operation);
        break;
      default:
        await this.processGenericOperation(operation);
    }
  }

  private async processAlertOperation(operation: QueuedOperation) {
    // This would integrate with your TRPC client
    // For now, we'll log the operation
    logger.info('Processing alert operation', {
      operation: operation.operation,
      data: operation.data,
    });
    
    // TODO: When TRPC client is available in a way that can be imported,
    // implement the actual API calls here
  }

  private async processPatientUpdateOperation(operation: QueuedOperation) {
    logger.info('Processing patient update operation', {
      operation: operation.operation,
      data: operation.data,
    });
    
    // TODO: Implement actual patient update API call
  }

  private async processResponseOperation(operation: QueuedOperation) {
    logger.info('Processing response operation', {
      operation: operation.operation,
      data: operation.data,
    });
    
    // TODO: Implement actual response API call
  }

  private async processGenericOperation(operation: QueuedOperation) {
    // Handle generic operations
    logger.info('Processing generic operation', operation);
  }

  public getQueueStatus() {
    return {
      count: this.queue.length,
      isProcessing: this.isProcessing,
      oldestOperation: this.queue[0]?.timestamp,
      types: this.queue.reduce((acc, op) => {
        acc[op.type] = (acc[op.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  public async clearQueue() {
    this.queue = [];
    await this.saveQueue();
    logger.info('Offline queue cleared');
  }

  public async removeOperation(id: string) {
    this.queue = this.queue.filter(op => op.id !== id);
    await this.saveQueue();
  }

  public getQueuedOperations() {
    return [...this.queue];
  }
}

// Hook for using offline queue
export function useOfflineQueue() {
  const queue = OfflineQueue.getInstance();
  
  return {
    enqueue: queue.enqueue.bind(queue),
    processQueue: queue.processQueue.bind(queue),
    getStatus: queue.getQueueStatus.bind(queue),
    clearQueue: queue.clearQueue.bind(queue),
  };
}