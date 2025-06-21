/**
 * tRPC WebSocket Integration
 * Integrates WebSocket server with tRPC for real-time subscriptions
 */

import { applyWSSHandler } from '@trpc/server/adapters/ws';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { appRouter } from '../routers';
import { createContext } from '../trpc';
import { log } from '@/lib/core/debug/logger';
import { parse } from 'url';

interface WebSocketServerOptions {
  port?: number;
  path?: string;
}

export class TRPCWebSocketServer {
  private httpServer: ReturnType<typeof createServer>;
  private wss: WebSocketServer;
  private handler: ReturnType<typeof applyWSSHandler>;
  private port: number;

  constructor(options: WebSocketServerOptions = {}) {
    this.port = options.port || parseInt(process.env.EXPO_PUBLIC_WS_PORT || '3002', 10);
    
    // Create HTTP server
    this.httpServer = createServer();
    
    // Create WebSocket server
    this.wss = new WebSocketServer({
      server: this.httpServer,
      path: options.path || '/api/trpc',
    });

    // Apply tRPC WebSocket handler
    this.handler = applyWSSHandler({
      wss: this.wss,
      router: appRouter,
      createContext: async ({ req, res }) => {
        // Parse authorization from connection params or headers
        const url = parse(req.url || '', true);
        const token = url.query.token as string || 
                     req.headers.authorization?.replace('Bearer ', '') || 
                     '';

        // Create a mock Request object for context creation
        const mockRequest = new Request(`http://localhost:${this.port}${req.url}`, {
          headers: {
            'authorization': token ? `Bearer ${token}` : '',
            'user-agent': req.headers['user-agent'] || '',
            'x-forwarded-for': req.headers['x-forwarded-for'] as string || '',
            'x-real-ip': req.headers['x-real-ip'] as string || '',
          },
        });

        return createContext(mockRequest);
      },
      onError: ({ error, type, path, input, ctx, req }) => {
        log.error('WebSocket tRPC error', 'WS_TRPC', {
          error: error.message,
          type,
          path,
          input,
          hasSession: !!ctx?.session,
        });
      },
    });

    // Additional WebSocket event logging
    this.wss.on('connection', (ws, req) => {
      const clientIp = req.socket.remoteAddress;
      log.info('WebSocket client connected', 'WS_TRPC', {
        clientIp,
        url: req.url,
        headers: {
          'user-agent': req.headers['user-agent'],
        },
      });

      ws.on('close', () => {
        log.info('WebSocket client disconnected', 'WS_TRPC', { clientIp });
      });

      ws.on('error', (error) => {
        log.error('WebSocket client error', 'WS_TRPC', { clientIp, error });
      });
    });
  }

  /**
   * Start the WebSocket server
   */
  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.httpServer.listen(this.port, () => {
          log.info('tRPC WebSocket server started', 'WS_TRPC', {
            port: this.port,
            url: `ws://localhost:${this.port}/api/trpc`,
          });
          resolve();
        });

        this.httpServer.on('error', (error) => {
          log.error('HTTP server error', 'WS_TRPC', error);
          reject(error);
        });
      } catch (error) {
        log.error('Failed to start WebSocket server', 'WS_TRPC', error);
        reject(error);
      }
    });
  }

  /**
   * Stop the WebSocket server
   */
  stop(): Promise<void> {
    return new Promise((resolve) => {
      log.info('Shutting down tRPC WebSocket server', 'WS_TRPC');
      
      // Close all WebSocket connections
      this.wss.clients.forEach((client) => {
        client.close();
      });

      // Close the WebSocket server
      this.wss.close(() => {
        log.debug('WebSocket server closed', 'WS_TRPC');
        
        // Close the HTTP server
        this.httpServer.close(() => {
          log.info('tRPC WebSocket server shut down', 'WS_TRPC');
          resolve();
        });
      });
    });
  }

  /**
   * Get server statistics
   */
  getStats() {
    return {
      port: this.port,
      connections: this.wss.clients.size,
      ready: this.httpServer.listening,
    };
  }
}

// Singleton instance
let wsServer: TRPCWebSocketServer | null = null;

/**
 * Initialize the tRPC WebSocket server
 */
export function initializeTRPCWebSocketServer(options?: WebSocketServerOptions): TRPCWebSocketServer {
  if (!wsServer) {
    wsServer = new TRPCWebSocketServer(options);
  }
  return wsServer;
}

/**
 * Get the current WebSocket server instance
 */
export function getTRPCWebSocketServer(): TRPCWebSocketServer | null {
  return wsServer;
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  if (wsServer) {
    await wsServer.stop();
    process.exit(0);
  }
});

process.on('SIGTERM', async () => {
  if (wsServer) {
    await wsServer.stop();
    process.exit(0);
  }
});