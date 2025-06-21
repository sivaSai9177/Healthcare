import { logger } from './debug/unified-logger';

class DatabaseConnectionMonitor {
  private static instance: DatabaseConnectionMonitor;
  private connectionCount = 0;
  private maxConnections = 8; // Leave 2 connections for other services
  private blockedRequests = new Set<string>();
  private lastWarningTime = 0;

  static getInstance(): DatabaseConnectionMonitor {
    if (!DatabaseConnectionMonitor.instance) {
      DatabaseConnectionMonitor.instance = new DatabaseConnectionMonitor();
    }
    return DatabaseConnectionMonitor.instance;
  }

  canMakeRequest(requestId: string): boolean {
    // Check if we're at connection limit
    if (this.connectionCount >= this.maxConnections) {
      const now = Date.now();
      
      // Log warning every 10 seconds
      if (now - this.lastWarningTime > 10000) {
        logger.auth.warn('Database connection limit reached', {
          current: this.connectionCount,
          max: this.maxConnections,
          blocked: this.blockedRequests.size
        });
        this.lastWarningTime = now;
      }
      
      this.blockedRequests.add(requestId);
      return false;
    }
    
    return true;
  }

  incrementConnection(requestId: string): void {
    this.connectionCount++;
    this.blockedRequests.delete(requestId);
    
    logger.auth.debug('Database connection opened', {
      requestId,
      current: this.connectionCount,
      max: this.maxConnections
    });
  }

  decrementConnection(requestId: string): void {
    if (this.connectionCount > 0) {
      this.connectionCount--;
    }
    
    logger.auth.debug('Database connection closed', {
      requestId,
      current: this.connectionCount,
      max: this.maxConnections
    });
  }

  reset(): void {
    this.connectionCount = 0;
    this.blockedRequests.clear();
    logger.auth.info('Database connection monitor reset');
  }

  getStatus() {
    return {
      current: this.connectionCount,
      max: this.maxConnections,
      blocked: this.blockedRequests.size,
      available: Math.max(0, this.maxConnections - this.connectionCount)
    };
  }
}

export const dbConnectionMonitor = DatabaseConnectionMonitor.getInstance();