// WebSocket logger utility
import { debugLog } from './logger';
import { useDebugStore } from '@/lib/stores/debug-store';

export interface WebSocketLog {
  timestamp: Date;
  type: 'connect' | 'disconnect' | 'message' | 'error' | 'open' | 'close';
  url: string;
  data?: any;
  error?: any;
  direction?: 'send' | 'receive';
  messageType?: string;
  size?: number;
}

class WebSocketLogger {
  private logs: WebSocketLog[] = [];
  private maxLogs = 100;
  private originalWebSocket: typeof WebSocket;
  private isIntercepting = false;

  constructor() {
    this.originalWebSocket = global.WebSocket || window.WebSocket;
  }

  startInterception() {
    if (this.isIntercepting) return;
    this.isIntercepting = true;

    const self = this;
    const OriginalWebSocket = this.originalWebSocket;

    // Create a wrapper for WebSocket
    const WebSocketWrapper = function(url: string, protocols?: string | string[]) {
      const ws = new OriginalWebSocket(url, protocols);
      
      // Log connection attempt
      self.log({
        type: 'connect',
        url,
        data: { protocols }
      });

      // Wrap event handlers
      const originalAddEventListener = ws.addEventListener.bind(ws);
      ws.addEventListener = function(type: string, listener: any, options?: any) {
        if (type === 'open') {
          const wrappedListener = function(event: Event) {
            self.log({
              type: 'open',
              url,
              data: { readyState: ws.readyState }
            });
            listener.call(this, event);
          };
          return originalAddEventListener(type, wrappedListener, options);
        }

        if (type === 'message') {
          const wrappedListener = function(event: MessageEvent) {
            const data = typeof event.data === 'string' 
              ? self.tryParseJSON(event.data) 
              : event.data;
            
            self.log({
              type: 'message',
              url,
              direction: 'receive',
              data,
              size: event.data.length || 0,
              messageType: self.detectMessageType(data)
            });
            listener.call(this, event);
          };
          return originalAddEventListener(type, wrappedListener, options);
        }

        if (type === 'error') {
          const wrappedListener = function(event: Event) {
            self.log({
              type: 'error',
              url,
              error: event
            });
            listener.call(this, event);
          };
          return originalAddEventListener(type, wrappedListener, options);
        }

        if (type === 'close') {
          const wrappedListener = function(event: CloseEvent) {
            self.log({
              type: 'close',
              url,
              data: {
                code: event.code,
                reason: event.reason,
                wasClean: event.wasClean
              }
            });
            listener.call(this, event);
          };
          return originalAddEventListener(type, wrappedListener, options);
        }

        return originalAddEventListener(type, listener, options);
      };

      // Wrap send method
      const originalSend = ws.send.bind(ws);
      ws.send = function(data: any) {
        const parsedData = typeof data === 'string' 
          ? self.tryParseJSON(data) 
          : data;
        
        self.log({
          type: 'message',
          url,
          direction: 'send',
          data: parsedData,
          size: data.length || 0,
          messageType: self.detectMessageType(parsedData)
        });
        
        return originalSend(data);
      };

      return ws;
    } as any;

    // Copy static properties
    Object.setPrototypeOf(WebSocketWrapper, OriginalWebSocket);
    Object.setPrototypeOf(WebSocketWrapper.prototype, OriginalWebSocket.prototype);

    // Replace global WebSocket
    if (typeof global !== 'undefined') {
      global.WebSocket = WebSocketWrapper;
    }
    if (typeof window !== 'undefined') {
      window.WebSocket = WebSocketWrapper;
    }
  }

  stopInterception() {
    if (!this.isIntercepting) return;
    this.isIntercepting = false;

    // Restore original WebSocket
    if (typeof global !== 'undefined') {
      global.WebSocket = this.originalWebSocket;
    }
    if (typeof window !== 'undefined') {
      window.WebSocket = this.originalWebSocket;
    }
  }

  private log(entry: Omit<WebSocketLog, 'timestamp'>) {
    const debugStore = useDebugStore.getState();
    if (!debugStore.enableWebSocketLogging) return;

    const log: WebSocketLog = {
      ...entry,
      timestamp: new Date()
    };

    this.logs.push(log);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Also send to debug panel
    const message = this.formatLogMessage(log);
    if (log.type === 'error') {
      debugLog.error(message, { source: 'WebSocket', ...log });
    } else if (log.type === 'connect' || log.type === 'disconnect') {
      debugLog.info(message, { source: 'WebSocket', ...log });
    } else {
      debugLog.debug(message, { source: 'WebSocket', ...log });
    }
  }

  private formatLogMessage(log: WebSocketLog): string {
    const url = new URL(log.url).pathname;
    
    switch (log.type) {
      case 'connect':
        return `[WS] Connecting to ${url}`;
      case 'open':
        return `[WS] Connected to ${url}`;
      case 'close':
        return `[WS] Disconnected from ${url} (${log.data?.code}: ${log.data?.reason || 'No reason'})`;
      case 'error':
        return `[WS] Error on ${url}`;
      case 'message':
        const direction = log.direction === 'send' ? '→' : '←';
        const type = log.messageType || 'unknown';
        return `[WS] ${direction} ${type} (${log.size} bytes) on ${url}`;
      default:
        return `[WS] ${log.type} on ${url}`;
    }
  }

  private tryParseJSON(data: string): any {
    try {
      return JSON.parse(data);
    } catch {
      return data;
    }
  }

  private detectMessageType(data: any): string {
    if (typeof data === 'string') return 'text';
    if (data instanceof ArrayBuffer) return 'binary';
    if (data instanceof Blob) return 'blob';
    
    // Try to detect common message patterns
    if (data && typeof data === 'object') {
      if (data.type) return data.type;
      if (data.event) return data.event;
      if (data.method) return data.method;
      if (data.action) return data.action;
      if (data.op || data.opcode) return 'opcode';
    }
    
    return 'json';
  }

  getLogs(): WebSocketLog[] {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
  }

  getLogCount(): number {
    return this.logs.length;
  }

  getErrorCount(): number {
    return this.logs.filter(log => log.type === 'error').length;
  }
}

// Export singleton instance
export const webSocketLogger = new WebSocketLogger();

// Auto-start in development if enabled
if (__DEV__ && typeof window !== 'undefined') {
  // Check if debug store has WebSocket logging enabled
  setTimeout(() => {
    try {
      const debugStore = useDebugStore.getState();
      if (debugStore.enableWebSocketLogging) {
        webSocketLogger.startInterception();
      }
    } catch (e) {
      // Store might not be initialized yet
    }
  }, 100);
}