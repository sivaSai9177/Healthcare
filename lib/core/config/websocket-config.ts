import { Platform } from 'react-native';
import { getApiUrl } from './unified-env';
import { log } from '@/lib/core/debug/logger';

/**
 * WebSocket configuration with mobile support
 */
export interface WebSocketConfig {
  enabled: boolean;
  url: string;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  heartbeatInterval: number;
  protocols?: string[];
}

/**
 * Get WebSocket configuration based on platform and environment
 */
export function getWebSocketConfig(): WebSocketConfig {
  // Always enable WebSocket for healthcare features
  const forceEnable = true; // Override environment variable for now
  
  // Check if WebSocket is available (not in SSR)
  const isWebSocketAvailable = typeof WebSocket !== 'undefined';
  
  // Determine if we should enable WebSocket
  const enabled = forceEnable && isWebSocketAvailable && Platform.OS !== 'test';
  
  // Get base API URL
  const apiUrl = getApiUrl();
  
  // Generate WebSocket URL
  let wsUrl = apiUrl
    .replace(/^http:/, 'ws:')
    .replace(/^https:/, 'wss:')
    .replace(/:\d+$/, ':3002'); // Use WebSocket port
  
  // Add WebSocket path
  wsUrl = `${wsUrl}/api/trpc`;
  
  // Platform-specific adjustments
  if (Platform.OS === 'android' && wsUrl.includes('localhost')) {
    // Android emulator needs special IP
    wsUrl = wsUrl.replace('localhost', '10.0.2.2');
  }
  
  log.info('WebSocket configuration', 'WEBSOCKET', {
    enabled,
    url: wsUrl,
    platform: Platform.OS,
    apiUrl,
  });
  
  return {
    enabled,
    url: wsUrl,
    reconnectInterval: 3000, // 3 seconds
    maxReconnectAttempts: 10,
    heartbeatInterval: 30000, // 30 seconds
    protocols: ['trpc', 'json'], // Support multiple protocols
  };
}

/**
 * Create a WebSocket connection with automatic reconnection
 */
export class MobileWebSocketClient {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private reconnectAttempts = 0;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private isClosing = false;
  
  constructor(
    config: WebSocketConfig,
    private onOpen?: () => void,
    private onMessage?: (data: any) => void,
    private onError?: (error: Error) => void,
    private onClose?: () => void,
  ) {
    this.config = config;
    if (config.enabled) {
      this.connect();
    }
  }
  
  private connect() {
    if (this.isClosing) return;
    
    try {
      log.debug('Connecting to WebSocket', 'WEBSOCKET', { url: this.config.url });
      
      this.ws = new WebSocket(this.config.url, this.config.protocols);
      
      this.ws.onopen = () => {
        log.info('WebSocket connected', 'WEBSOCKET');
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        this.onOpen?.();
      };
      
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.onMessage?.(data);
        } catch (error) {
          log.error('Failed to parse WebSocket message', 'WEBSOCKET', error);
        }
      };
      
      this.ws.onerror = (event: any) => {
        log.error('WebSocket error', 'WEBSOCKET', event);
        this.onError?.(new Error(event.message || 'WebSocket error'));
      };
      
      this.ws.onclose = () => {
        log.info('WebSocket closed', 'WEBSOCKET');
        this.stopHeartbeat();
        this.onClose?.();
        
        if (!this.isClosing) {
          this.scheduleReconnect();
        }
      };
    } catch (error) {
      log.error('Failed to create WebSocket', 'WEBSOCKET', error);
      this.scheduleReconnect();
    }
  }
  
  private scheduleReconnect() {
    if (this.isClosing || this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      log.warn('Max reconnection attempts reached', 'WEBSOCKET');
      return;
    }
    
    this.reconnectAttempts++;
    const delay = Math.min(
      this.config.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1),
      30000 // Max 30 seconds
    );
    
    log.debug('Scheduling reconnect', 'WEBSOCKET', { 
      attempt: this.reconnectAttempts,
      delay 
    });
    
    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }
  
  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping' });
      }
    }, this.config.heartbeatInterval);
  }
  
  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
  
  send(data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      log.warn('WebSocket not connected, cannot send', 'WEBSOCKET');
    }
  }
  
  close() {
    this.isClosing = true;
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    this.stopHeartbeat();
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
  
  get isConnected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}