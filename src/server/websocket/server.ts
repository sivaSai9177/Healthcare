import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { parse } from 'url';
import { alertEvents } from '../services/alert-subscriptions';
import { log } from '@/lib/core/debug/logger';
import { db } from '@/src/db';
import { sessions, users } from '@/src/db/schema';
import { eq } from 'drizzle-orm';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  organizationId?: string;
  hospitalId?: string;
  role?: string;
  isAlive?: boolean;
}

interface WebSocketMessage {
  type: 'subscribe' | 'unsubscribe' | 'ping' | 'auth';
  channel?: string;
  data?: any;
  token?: string;
}

class WebSocketManager {
  private wss: WebSocketServer;
  private clients: Map<string, Set<AuthenticatedWebSocket>> = new Map();
  private heartbeatInterval: NodeJS.Timeout;

  constructor(port: number = 3002) {
    const server = createServer();
    this.wss = new WebSocketServer({ server });
    
    this.setupWebSocketServer();
    this.setupAlertEventListeners();
    this.startHeartbeat();
    
    server.listen(port, () => {
      log.info(`WebSocket server running on ws://localhost:${port}`, 'WEBSOCKET');
    });
  }

  private setupWebSocketServer() {
    this.wss.on('connection', async (ws: AuthenticatedWebSocket, req) => {
      log.info('New WebSocket connection', 'WEBSOCKET');
      
      // Parse auth token from query params or headers
      const url = parse(req.url || '', true);
      const token = url.query.token as string || req.headers.authorization?.replace('Bearer ', '');
      
      if (token) {
        await this.authenticateClient(ws, token);
      }
      
      ws.isAlive = true;
      ws.on('pong', () => {
        ws.isAlive = true;
      });
      
      ws.on('message', async (data) => {
        try {
          const message: WebSocketMessage = JSON.parse(data.toString());
          await this.handleMessage(ws, message);
        } catch (error) {
          log.error('Failed to parse WebSocket message', 'WEBSOCKET', error);
          ws.send(JSON.stringify({ error: 'Invalid message format' }));
        }
      });
      
      ws.on('close', () => {
        this.removeClient(ws);
        log.info('WebSocket connection closed', 'WEBSOCKET');
      });
      
      ws.on('error', (error) => {
        log.error('WebSocket error', 'WEBSOCKET', error);
      });
      
      // Send welcome message
      ws.send(JSON.stringify({
        type: 'connected',
        message: 'Connected to Hospital Alert System',
        authenticated: !!ws.userId,
      }));
    });
  }

  private async authenticateClient(ws: AuthenticatedWebSocket, token: string) {
    try {
      // Validate session token
      const [session] = await db
        .select({
          userId: sessions.userId,
          expiresAt: sessions.expiresAt,
        })
        .from(sessions)
        .where(eq(sessions.token, token))
        .limit(1);
      
      if (!session || session.expiresAt < new Date()) {
        ws.send(JSON.stringify({ error: 'Invalid or expired token' }));
        return;
      }
      
      // Get user details
      const [user] = await db
        .select({
          id: users.id,
          role: users.role,
          organizationId: users.organizationId,
        })
        .from(users)
        .where(eq(users.id, session.userId))
        .limit(1);
      
      if (!user) {
        ws.send(JSON.stringify({ error: 'User not found' }));
        return;
      }
      
      // Set authenticated properties
      ws.userId = user.id;
      ws.role = user.role || 'guest';
      ws.organizationId = user.organizationId || undefined;
      ws.hospitalId = user.organizationId || undefined; // For healthcare context
      
      // Add to authenticated clients
      if (ws.hospitalId) {
        if (!this.clients.has(ws.hospitalId)) {
          this.clients.set(ws.hospitalId, new Set());
        }
        this.clients.get(ws.hospitalId)!.add(ws);
      }
      
      log.info('WebSocket client authenticated', 'WEBSOCKET', {
        userId: ws.userId,
        role: ws.role,
        hospitalId: ws.hospitalId,
      });
      
      ws.send(JSON.stringify({
        type: 'authenticated',
        userId: ws.userId,
        role: ws.role,
      }));
    } catch (error) {
      log.error('Failed to authenticate WebSocket client', 'WEBSOCKET', error);
      ws.send(JSON.stringify({ error: 'Authentication failed' }));
    }
  }

  private async handleMessage(ws: AuthenticatedWebSocket, message: WebSocketMessage) {
    switch (message.type) {
      case 'auth':
        if (message.token) {
          await this.authenticateClient(ws, message.token);
        }
        break;
        
      case 'subscribe':
        if (!ws.userId) {
          ws.send(JSON.stringify({ error: 'Not authenticated' }));
          return;
        }
        
        if (message.channel === 'alerts' && ws.hospitalId) {
          log.info('Client subscribed to alerts', 'WEBSOCKET', {
            userId: ws.userId,
            hospitalId: ws.hospitalId,
          });
          
          ws.send(JSON.stringify({
            type: 'subscribed',
            channel: 'alerts',
          }));
        }
        break;
        
      case 'unsubscribe':
        // Handle unsubscribe logic
        break;
        
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong' }));
        break;
        
      default:
        ws.send(JSON.stringify({ error: 'Unknown message type' }));
    }
  }

  private setupAlertEventListeners() {
    // Listen for alert events and broadcast to relevant clients
    alertEvents.on('alert:*', (event) => {
      this.broadcastToHospital(event.hospitalId, {
        type: 'alert',
        event: event.type,
        data: event.data,
        timestamp: event.timestamp,
      });
    });
  }

  private broadcastToHospital(hospitalId: string, data: any) {
    const clients = this.clients.get(hospitalId);
    if (!clients) return;
    
    const message = JSON.stringify(data);
    let sent = 0;
    
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
        sent++;
      }
    });
    
    log.debug(`Broadcast to ${sent} clients in hospital ${hospitalId}`, 'WEBSOCKET');
  }

  private removeClient(ws: AuthenticatedWebSocket) {
    if (ws.hospitalId) {
      const hospitalClients = this.clients.get(ws.hospitalId);
      if (hospitalClients) {
        hospitalClients.delete(ws);
        if (hospitalClients.size === 0) {
          this.clients.delete(ws.hospitalId);
        }
      }
    }
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.wss.clients.forEach((ws: AuthenticatedWebSocket) => {
        if (ws.isAlive === false) {
          return ws.terminate();
        }
        
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000); // 30 seconds
  }

  public shutdown() {
    clearInterval(this.heartbeatInterval);
    this.wss.close(() => {
      log.info('WebSocket server shut down', 'WEBSOCKET');
    });
  }

  // Get connection statistics
  public getStats() {
    const stats = {
      totalConnections: this.wss.clients.size,
      authenticatedConnections: 0,
      hospitalBreakdown: {} as Record<string, number>,
    };
    
    this.clients.forEach((clients, hospitalId) => {
      stats.hospitalBreakdown[hospitalId] = clients.size;
      stats.authenticatedConnections += clients.size;
    });
    
    return stats;
  }
}

// Export singleton instance
let wsManager: WebSocketManager | null = null;

export function initializeWebSocketServer(port?: number): WebSocketManager {
  if (!wsManager) {
    wsManager = new WebSocketManager(port);
  }
  return wsManager;
}

export function getWebSocketManager(): WebSocketManager | null {
  return wsManager;
}

// Graceful shutdown
process.on('SIGINT', () => {
  if (wsManager) {
    wsManager.shutdown();
    process.exit(0);
  }
});