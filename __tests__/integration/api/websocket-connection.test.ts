import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

// Mock WebSocket implementation
class MockWebSocket {
  public readyState: number;
  public url: string;
  public protocols?: string | string[];
  
  private listeners: Map<string, Function[]> = new Map();
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;
  private pingInterval?: NodeJS.Timeout;
  private isAlive: boolean = true;
  
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  constructor(url: string, protocols?: string | string[]) {
    this.url = url;
    this.protocols = protocols;
    this.readyState = MockWebSocket.CONNECTING;
    
    // Simulate connection
    setTimeout(() => {
      if (this.readyState === MockWebSocket.CONNECTING) {
        this.readyState = MockWebSocket.OPEN;
        this.emit('open', { type: 'open' });
        this.startHeartbeat();
      }
    }, 100);
  }

  send(data: string | ArrayBuffer | Blob) {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
    
    // Echo back for testing
    setTimeout(() => {
      this.emit('message', { 
        type: 'message', 
        data: JSON.stringify({ echo: data, timestamp: Date.now() })
      });
    }, 10);
  }

  close(code?: number, reason?: string) {
    if (this.readyState === MockWebSocket.CLOSED) return;
    
    this.readyState = MockWebSocket.CLOSING;
    this.stopHeartbeat();
    
    setTimeout(() => {
      this.readyState = MockWebSocket.CLOSED;
      this.emit('close', { type: 'close', code, reason });
    }, 50);
  }

  addEventListener(event: string, listener: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
  }

  removeEventListener(event: string, listener: Function) {
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

  private startHeartbeat() {
    this.pingInterval = setInterval(() => {
      if (this.isAlive === false) {
        this.close();
        return;
      }
      
      this.isAlive = false;
      this.send(JSON.stringify({ type: 'ping' }));
    }, 30000);
  }

  private stopHeartbeat() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
  }

  // Simulate server push
  simulateServerMessage(data: any) {
    if (this.readyState === MockWebSocket.OPEN) {
      this.emit('message', { type: 'message', data: JSON.stringify(data) });
    }
  }

  // Simulate connection error
  simulateError(error: string) {
    this.emit('error', { type: 'error', message: error });
    this.close();
  }
}

// WebSocket manager for healthcare alerts
class AlertWebSocketManager {
  private ws?: MockWebSocket;
  private url: string;
  private reconnecting: boolean = false;
  private messageQueue: any[] = [];
  private subscriptions: Map<string, Set<Function>> = new Map();
  private reconnectTimer?: NodeJS.Timeout;
  
  constructor(url: string) {
    this.url = url;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws && this.ws.readyState === MockWebSocket.OPEN) {
        resolve();
        return;
      }
      
      this.ws = new MockWebSocket(this.url, 'alerts-v1');
      
      this.ws.addEventListener('open', () => {
        console.log('WebSocket connected');
        this.reconnecting = false;
        this.flushMessageQueue();
        resolve();
      });
      
      this.ws.addEventListener('message', (event: any) => {
        this.handleMessage(event.data);
      });
      
      this.ws.addEventListener('close', () => {
        console.log('WebSocket closed');
        this.scheduleReconnect();
      });
      
      this.ws.addEventListener('error', (error: any) => {
        console.error('WebSocket error:', error);
        reject(error);
      });
    });
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = undefined;
    }
    
    this.messageQueue = [];
    this.subscriptions.clear();
  }

  subscribe(channel: string, callback: Function) {
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Set());
    }
    
    this.subscriptions.get(channel)!.add(callback);
    
    // Send subscription message
    this.send({
      type: 'subscribe',
      channel,
      timestamp: Date.now(),
    });
    
    // Return unsubscribe function
    return () => {
      const subs = this.subscriptions.get(channel);
      if (subs) {
        subs.delete(callback);
        if (subs.size === 0) {
          this.subscriptions.delete(channel);
          this.send({
            type: 'unsubscribe',
            channel,
          });
        }
      }
    };
  }

  send(data: any) {
    const message = typeof data === 'string' ? data : JSON.stringify(data);
    
    if (this.ws && this.ws.readyState === MockWebSocket.OPEN) {
      this.ws.send(message);
    } else {
      this.messageQueue.push(message);
    }
  }

  private handleMessage(data: string) {
    try {
      const message = JSON.parse(data);
      
      if (message.type === 'pong') {
        // Handle pong response
        return;
      }
      
      if (message.channel) {
        const subscribers = this.subscriptions.get(message.channel) || new Set();
        subscribers.forEach(callback => callback(message));
      }
      
      // Handle specific message types
      switch (message.type) {
        case 'alert:new':
        case 'alert:updated':
        case 'alert:acknowledged':
        case 'alert:resolved':
          this.notifySubscribers(`alerts:${message.data.urgency}`, message);
          this.notifySubscribers('alerts:all', message);
          break;
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  private notifySubscribers(channel: string, message: any) {
    const subscribers = this.subscriptions.get(channel) || new Set();
    subscribers.forEach(callback => callback(message));
  }

  private flushMessageQueue() {
    while (this.messageQueue.length > 0 && this.ws && this.ws.readyState === MockWebSocket.OPEN) {
      const message = this.messageQueue.shift();
      this.ws.send(message);
    }
  }

  private scheduleReconnect() {
    if (this.reconnecting) return;
    
    this.reconnecting = true;
    this.reconnectTimer = setTimeout(() => {
      console.log('Attempting to reconnect...');
      this.connect().catch(error => {
        console.error('Reconnection failed:', error);
        this.scheduleReconnect();
      });
    }, 5000);
  }

  getState() {
    return {
      connected: this.ws && this.ws.readyState === MockWebSocket.OPEN,
      reconnecting: this.reconnecting,
      queueSize: this.messageQueue.length,
      subscriptions: Array.from(this.subscriptions.keys()),
    };
  }
}

describe('WebSocket Connection Integration', () => {
  let wsManager: AlertWebSocketManager;
  
  beforeEach(() => {
    wsManager = new AlertWebSocketManager('ws://localhost:3001');
    (global as any).MockWebSocket = MockWebSocket;
  });
  
  afterEach(() => {
    wsManager.disconnect();
  });

  describe('Connection Management', () => {
    it('establishes connection successfully', async () => {
      await wsManager.connect();
      
      const state = wsManager.getState();
      expect(state.connected).toBe(true);
      expect(state.reconnecting).toBe(false);
    });

    it('handles connection errors', async () => {
      // Mock connection failure
      jest.spyOn(MockWebSocket.prototype as any, 'emit').mockImplementationOnce((event, data) => {
        if (event === 'open') {
          setTimeout(() => {
            (MockWebSocket.prototype as any).emit.call(this, 'error', { message: 'Connection failed' });
          }, 50);
        }
      });
      
      await expect(wsManager.connect()).rejects.toBeDefined();
    });

    it('disconnects cleanly', async () => {
      await wsManager.connect();
      wsManager.disconnect();
      
      const state = wsManager.getState();
      expect(state.connected).toBe(false);
      expect(state.subscriptions).toHaveLength(0);
    });

    it('prevents duplicate connections', async () => {
      await wsManager.connect();
      const state1 = wsManager.getState();
      
      await wsManager.connect(); // Should resolve immediately
      const state2 = wsManager.getState();
      
      expect(state1.connected).toBe(true);
      expect(state2.connected).toBe(true);
    });
  });

  describe('Message Handling', () => {
    it('sends and receives messages', async () => {
      await wsManager.connect();
      
      const testMessage = { type: 'test', data: 'hello' };
      wsManager.send(testMessage);
      
      // Message should be sent successfully
      expect(wsManager.getState().queueSize).toBe(0);
    });

    it('queues messages when disconnected', () => {
      const testMessage = { type: 'test', data: 'queued' };
      wsManager.send(testMessage);
      
      expect(wsManager.getState().queueSize).toBe(1);
    });

    it('flushes message queue on reconnect', async () => {
      // Queue messages while disconnected
      wsManager.send({ type: 'message1' });
      wsManager.send({ type: 'message2' });
      
      expect(wsManager.getState().queueSize).toBe(2);
      
      // Connect and verify queue is flushed
      await wsManager.connect();
      
      expect(wsManager.getState().queueSize).toBe(0);
    });
  });

  describe('Subscriptions', () => {
    it('subscribes to channels', async () => {
      await wsManager.connect();
      
      const callback = jest.fn();
      const unsubscribe = wsManager.subscribe('alerts:critical', callback);
      
      const state = wsManager.getState();
      expect(state.subscriptions).toContain('alerts:critical');
      
      // Cleanup
      unsubscribe();
    });

    it('receives channel messages', async () => {
      await wsManager.connect();
      
      const callback = jest.fn();
      wsManager.subscribe('alerts:critical', callback);
      
      // Simulate server message
      const ws = (wsManager as any).ws as MockWebSocket;
      ws.simulateServerMessage({
        channel: 'alerts:critical',
        type: 'alert:new',
        data: { id: 'alert-123', urgency: 'critical' },
      });
      
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          channel: 'alerts:critical',
          type: 'alert:new',
        })
      );
    });

    it('handles multiple subscribers', async () => {
      await wsManager.connect();
      
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      wsManager.subscribe('alerts:all', callback1);
      wsManager.subscribe('alerts:all', callback2);
      
      const ws = (wsManager as any).ws as MockWebSocket;
      ws.simulateServerMessage({
        channel: 'alerts:all',
        type: 'update',
        data: { test: true },
      });
      
      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });

    it('unsubscribes correctly', async () => {
      await wsManager.connect();
      
      const callback = jest.fn();
      const unsubscribe = wsManager.subscribe('alerts:high', callback);
      
      // Verify subscription
      expect(wsManager.getState().subscriptions).toContain('alerts:high');
      
      // Unsubscribe
      unsubscribe();
      
      // Verify unsubscribed
      expect(wsManager.getState().subscriptions).not.toContain('alerts:high');
      
      // Should not receive messages after unsubscribe
      const ws = (wsManager as any).ws as MockWebSocket;
      ws.simulateServerMessage({
        channel: 'alerts:high',
        type: 'update',
      });
      
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('Alert-Specific Features', () => {
    it('routes alert messages to appropriate channels', async () => {
      await wsManager.connect();
      
      const criticalCallback = jest.fn();
      const allCallback = jest.fn();
      
      wsManager.subscribe('alerts:critical', criticalCallback);
      wsManager.subscribe('alerts:all', allCallback);
      
      const ws = (wsManager as any).ws as MockWebSocket;
      ws.simulateServerMessage({
        type: 'alert:new',
        data: { 
          id: 'alert-123',
          urgency: 'critical',
          type: 'cardiac_arrest',
        },
      });
      
      // Should notify both subscribers
      expect(criticalCallback).toHaveBeenCalled();
      expect(allCallback).toHaveBeenCalled();
    });

    it('handles alert lifecycle events', async () => {
      await wsManager.connect();
      
      const callback = jest.fn();
      wsManager.subscribe('alerts:all', callback);
      
      const ws = (wsManager as any).ws as MockWebSocket;
      
      // New alert
      ws.simulateServerMessage({
        type: 'alert:new',
        data: { id: '1', status: 'pending' },
      });
      
      // Alert acknowledged
      ws.simulateServerMessage({
        type: 'alert:acknowledged',
        data: { id: '1', status: 'acknowledged' },
      });
      
      // Alert resolved
      ws.simulateServerMessage({
        type: 'alert:resolved',
        data: { id: '1', status: 'resolved' },
      });
      
      expect(callback).toHaveBeenCalledTimes(3);
    });
  });

  describe('Reconnection Logic', () => {
    it('attempts to reconnect after disconnect', async () => {
      await wsManager.connect();
      const ws = (wsManager as any).ws as MockWebSocket;
      
      // Simulate unexpected disconnect
      ws.close();
      
      // Should schedule reconnection
      expect(wsManager.getState().reconnecting).toBe(true);
      
      // Wait for reconnection attempt
      await new Promise(resolve => setTimeout(resolve, 5100));
      
      // Should attempt reconnection
      await Promise.resolve(); // Let reconnection complete
    });

    it('maintains subscriptions across reconnections', async () => {
      await wsManager.connect();
      
      const callback = jest.fn();
      wsManager.subscribe('alerts:critical', callback);
      
      // Simulate disconnect and reconnect
      const ws = (wsManager as any).ws as MockWebSocket;
      ws.close();
      
      // Wait and reconnect
      await new Promise(resolve => setTimeout(resolve, 100));
      await wsManager.connect();
      
      // Subscriptions should be maintained
      expect(wsManager.getState().subscriptions).toContain('alerts:critical');
    });
  });

  describe('Error Handling', () => {
    it('handles malformed messages gracefully', async () => {
      await wsManager.connect();
      
      const ws = (wsManager as any).ws as MockWebSocket;
      
      // Send malformed JSON
      ws.emit('message', { type: 'message', data: 'invalid json {' });
      
      // Should not throw
      expect(wsManager.getState().connected).toBe(true);
    });

    it('handles send errors', async () => {
      await wsManager.connect();
      const ws = (wsManager as any).ws as MockWebSocket;
      
      // Force close connection
      ws.readyState = MockWebSocket.CLOSED;
      
      // Should queue message instead of throwing
      wsManager.send({ type: 'test' });
      expect(wsManager.getState().queueSize).toBe(1);
    });
  });
});