import { log } from '@/lib/core/debug/logger';

export interface ConnectionConfig {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  heartbeatInterval?: number;
  connectionTimeout?: number;
}

export interface ConnectionState {
  status: 'connecting' | 'connected' | 'disconnected' | 'error' | 'reconnecting';
  retryCount: number;
  lastConnectedAt: Date | null;
  lastDisconnectedAt: Date | null;
  consecutiveFailures: number;
}

export class WebSocketConnectionManager {
  private state: ConnectionState = {
    status: 'disconnected',
    retryCount: 0,
    lastConnectedAt: null,
    lastDisconnectedAt: null,
    consecutiveFailures: 0,
  };

  private config: Required<ConnectionConfig>;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private connectionTimeoutTimer: ReturnType<typeof setTimeout> | null = null;
  private listeners: Map<string, Set<(state: ConnectionState) => void>> = new Map();
  private cleanupCallbacks: Set<() => void> = new Set();

  constructor(config: ConnectionConfig = {}) {
    this.config = {
      maxRetries: config.maxRetries ?? 10,
      initialDelay: config.initialDelay ?? 1000,
      maxDelay: config.maxDelay ?? 30000,
      backoffMultiplier: config.backoffMultiplier ?? 2,
      heartbeatInterval: config.heartbeatInterval ?? 30000,
      connectionTimeout: config.connectionTimeout ?? 10000,
    };
  }

  /**
   * Calculate delay using exponential backoff with jitter
   */
  private calculateBackoffDelay(): number {
    const baseDelay = Math.min(
      this.config.initialDelay * Math.pow(this.config.backoffMultiplier, this.state.retryCount),
      this.config.maxDelay
    );
    
    // Add jitter (±25%) to prevent thundering herd
    const jitter = baseDelay * 0.25 * (Math.random() * 2 - 1);
    return Math.round(baseDelay + jitter);
  }

  /**
   * Update connection state and notify listeners
   */
  private updateState(updates: Partial<ConnectionState>) {
    this.state = { ...this.state, ...updates };
    
    log.info('WebSocket connection state updated', 'WS_MANAGER', {
      status: this.state.status,
      retryCount: this.state.retryCount,
      consecutiveFailures: this.state.consecutiveFailures,
    });

    // Notify all listeners
    this.listeners.forEach((callbacks) => {
      callbacks.forEach((callback) => callback(this.state));
    });
  }

  /**
   * Start connection attempt
   */
  onConnectionAttempt() {
    this.clearTimers();
    this.updateState({ status: 'connecting' });
    
    // Set connection timeout
    this.connectionTimeoutTimer = setTimeout(() => {
      log.warn('WebSocket connection timeout', 'WS_MANAGER');
      this.onConnectionError(new Error('Connection timeout'));
    }, this.config.connectionTimeout);
  }

  /**
   * Handle successful connection
   */
  onConnectionSuccess() {
    this.clearTimers();
    
    const previousStatus = this.state.status;
    this.updateState({
      status: 'connected',
      retryCount: 0,
      lastConnectedAt: new Date(),
      consecutiveFailures: 0,
    });

    // Start heartbeat
    this.startHeartbeat();

    // Log reconnection success
    if (previousStatus === 'reconnecting') {
      log.info('WebSocket reconnected successfully', 'WS_MANAGER', {
        afterRetries: this.state.retryCount,
        downtime: this.state.lastDisconnectedAt 
          ? Date.now() - this.state.lastDisconnectedAt.getTime() 
          : 0,
      });
    }
  }

  /**
   * Handle connection error
   */
  onConnectionError(error: Error) {
    this.clearTimers();
    
    const wasConnected = this.state.status === 'connected';
    this.updateState({
      status: 'error',
      consecutiveFailures: this.state.consecutiveFailures + 1,
    });

    log.error('WebSocket connection error', 'WS_MANAGER', {
      error: error.message,
      wasConnected,
      consecutiveFailures: this.state.consecutiveFailures,
    });

    // Attempt reconnection if within retry limit
    if (this.state.retryCount < this.config.maxRetries) {
      this.scheduleReconnect();
    } else {
      log.error('WebSocket max retries exceeded', 'WS_MANAGER', {
        maxRetries: this.config.maxRetries,
      });
      this.updateState({ status: 'disconnected' });
    }
  }

  /**
   * Handle connection close
   */
  onConnectionClose(code?: number, reason?: string) {
    this.clearTimers();
    
    const wasConnected = this.state.status === 'connected';
    this.updateState({
      status: 'disconnected',
      lastDisconnectedAt: new Date(),
    });

    log.info('WebSocket connection closed', 'WS_MANAGER', {
      code,
      reason,
      wasConnected,
    });

    // Attempt reconnection for non-normal closures
    if (code !== 1000 && this.state.retryCount < this.config.maxRetries) {
      this.scheduleReconnect();
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect() {
    const delay = this.calculateBackoffDelay();
    
    this.updateState({
      status: 'reconnecting',
      retryCount: this.state.retryCount + 1,
    });

    log.info('Scheduling WebSocket reconnection', 'WS_MANAGER', {
      delay,
      attempt: this.state.retryCount,
      maxRetries: this.config.maxRetries,
    });

    this.reconnectTimer = setTimeout(() => {
      this.onReconnectAttempt?.();
    }, delay);
  }

  /**
   * Start heartbeat mechanism
   */
  private startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      if (this.state.status === 'connected') {
        this.onHeartbeat?.();
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Clear all timers
   */
  private clearTimers() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.connectionTimeoutTimer) {
      clearTimeout(this.connectionTimeoutTimer);
      this.connectionTimeoutTimer = null;
    }
  }

  /**
   * Subscribe to connection state changes
   */
  subscribe(callback: (state: ConnectionState) => void): () => void {
    const id = Math.random().toString(36).substr(2, 9);
    
    if (!this.listeners.has(id)) {
      this.listeners.set(id, new Set());
    }
    this.listeners.get(id)!.add(callback);

    // Immediately call with current state
    callback(this.state);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(id);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.listeners.delete(id);
        }
      }
    };
  }

  /**
   * Register cleanup callback
   */
  registerCleanup(callback: () => void) {
    this.cleanupCallbacks.add(callback);
  }

  /**
   * Get current connection state
   */
  getState(): ConnectionState {
    return { ...this.state };
  }

  /**
   * Reset connection attempts
   */
  reset() {
    this.clearTimers();
    this.updateState({
      status: 'disconnected',
      retryCount: 0,
      consecutiveFailures: 0,
    });
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.clearTimers();
    this.cleanupCallbacks.forEach(callback => callback());
    this.cleanupCallbacks.clear();
    this.listeners.clear();
  }

  // Callbacks to be implemented by consumer
  onReconnectAttempt?: () => void;
  onHeartbeat?: () => void;
}

// Singleton instance for the app
export const alertWebSocketManager = new WebSocketConnectionManager({
  maxRetries: 10,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 1.5,
  heartbeatInterval: 30000,
  connectionTimeout: 10000,
});