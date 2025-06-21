import { applyWSSHandler } from '@trpc/server/adapters/ws';
import ws from 'ws';
import { createContext } from '../trpc';
import { appRouter } from '../routers';
import { log } from '@/lib/core/debug/logger';


// WebSocket server for real-time subscriptions
export function createWebSocketServer(port: number = 3001) {
  // Create WebSocket server
  const wss = new (ws as any).Server({
    port,
    path: '/api/trpc',
  });

  // Apply tRPC WebSocket handler
  const handler = applyWSSHandler({
    wss,
    router: appRouter,
    createContext: async (opts) => {
      const { req } = opts;
      
      // Extract auth from headers or connection params
      let authorization: string | undefined;
      
      // Check headers first
      if (req.headers.authorization) {
        authorization = req.headers.authorization;
      }
      // Check connection params for WebSocket connections
      else if ('connectionParams' in opts && opts.connectionParams) {
        authorization = (opts.connectionParams as any).authorization;
      }
      
      log.info('WebSocket connection attempt', 'WS', {
        hasAuth: !!authorization,
        headers: req.headers,
        url: req.url,
      });

      // Create a mock response object for WebSocket context
      const mockRes = {
        setHeader: () => {},
        end: () => {},
      } as any;

      // Create context with auth info
      const baseContext = await createContext({ 
        req: req as any, 
        res: mockRes,
        headers: req.headers as any,
      });
      
      return {
        ...baseContext,
        // Add WebSocket-specific context
        isSubscription: true,
        connectionParams: 'connectionParams' in opts ? opts.connectionParams : undefined,
      };
    },
    // Keep alive ping/pong
    keepAlive: {
      enabled: true,
      pingMs: 30000,
      pongWaitMs: 5000,
    },
  });

  // Connection tracking
  const connections = new Map<string, Set<ws>>();

  wss.on('connection', (ws, req) => {
    const clientId = req.headers['x-client-id'] || `client-${Date.now()}`;
    log.info('WebSocket client connected', 'WS', { clientId });

    // Track connection
    if (!connections.has(clientId)) {
      connections.set(clientId, new Set());
    }
    connections.get(clientId)!.add(ws);

    ws.on('close', () => {
      log.info('WebSocket client disconnected', 'WS', { clientId });
      connections.get(clientId)?.delete(ws);
      if (connections.get(clientId)?.size === 0) {
        connections.delete(clientId);
      }
    });

    ws.on('error', (error) => {
      log.error('WebSocket error', 'WS', { clientId, error: error.message });
    });
  });

  log.info(`WebSocket server listening on ws://localhost:${port}`, 'WS');

  return {
    wss,
    handler,
    connections,
    broadcast: (event: string, data: any) => {
      const message = JSON.stringify({ event, data });
      wss.clients.forEach((client) => {
        if (client.readyState === ws.OPEN) {
          client.send(message);
        }
      });
    },
    broadcastToRoom: (room: string, event: string, data: any) => {
      // Room-based broadcasting for alerts
      const message = JSON.stringify({ event, room, data });
      wss.clients.forEach((client) => {
        if (client.readyState === ws.OPEN) {
          // Check if client is subscribed to this room
          // This would need to be tracked in connection metadata
          client.send(message);
        }
      });
    },
    close: () => {
      wss.close();
    },
  };
}