#!/usr/bin/env bun
/**
 * Bun TRPC WebSocket Server
 * Combines Bun's native WebSocket with TRPC subscriptions
 */

import { EventEmitter } from 'events';

const port = parseInt(process.env.EXPO_PUBLIC_WS_PORT || '3002', 10);

// Create event emitter for alerts
const alertEmitter = new EventEmitter();

console.log(`[INFO] Starting Bun TRPC WebSocket server on port ${port}...`);

// Map to store WebSocket connections
const connections = new Map<any, { hospitalId?: string; subscriptionId?: string }>();

// Create Bun server with WebSocket support
const server = Bun.serve({
  port,
  fetch(req, server) {
    const url = new URL(req.url);
    
    // Handle WebSocket upgrade requests
    if (url.pathname === '/api/trpc') {
      const success = server.upgrade(req, {
        data: { url: url.toString() }
      });
      if (success) {
        return undefined;
      }
      return new Response('WebSocket upgrade failed', { status: 400 });
    }
    
    // Handle regular HTTP requests
    return new Response(JSON.stringify({
      message: 'TRPC WebSocket server is running',
      endpoints: {
        websocket: `ws://localhost:${port}/api/trpc`,
        health: '/health'
      }
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  },
  websocket: {
    // Handle new connections
    open(ws) {
      console.log(`[INFO] Client connected`);
      connections.set(ws, {});
    },
    
    // Handle incoming messages
    message(ws, message) {
      try {
        const data = typeof message === 'string' ? message : message.toString();
        const parsed = JSON.parse(data);
        console.log(`[INFO] Received message:`, parsed);
        
        // Handle TRPC protocol messages
        if (parsed.method === 'connectionParams') {
          // Handle connection params (authentication, etc)
          console.log('[INFO] Connection params received');
          return;
        }
        
        // Handle batch messages
        if (Array.isArray(parsed)) {
          for (const msg of parsed) {
            handleMessage(ws, msg);
          }
          return;
        }
        
        // Handle single message
        handleMessage(ws, parsed);
      } catch (error) {
        console.error(`[ERROR] Failed to parse message:`, error);
        ws.send(JSON.stringify({
          error: {
            message: 'Failed to parse message',
            code: -32700,
          }
        }));
      }
    },
    
    // Handle connection close
    close(ws) {
      console.log(`[INFO] Client disconnected`);
      const connData = connections.get(ws);
      if (connData?.subscriptionId) {
        // Clean up subscription
        alertEmitter.removeAllListeners(`subscription-${connData.subscriptionId}`);
      }
      connections.delete(ws);
    },
  },
});

// Handle individual message
function handleMessage(ws: any, message: any) {
  if (message.id && message.method) {
    switch (message.method) {
      case 'subscription':
        handleSubscription(ws, message);
        break;
      case 'subscription.stop':
        handleSubscriptionStop(ws, message);
        break;
      default:
        // Echo unknown messages
        ws.send(JSON.stringify({
          id: message.id,
          error: {
            message: `Unknown method: ${message.method}`,
            code: -32601,
          }
        }));
    }
  }
}

// Handle subscription
function handleSubscription(ws: any, message: any) {
  const { id, params } = message;
  
  if (params?.path === 'healthcare.subscribeToAlerts') {
    const hospitalId = params?.input?.hospitalId;
    const subscriptionId = `${id}-${Date.now()}`;
    
    // Store connection data
    const connData = connections.get(ws) || {};
    connData.hospitalId = hospitalId;
    connData.subscriptionId = subscriptionId;
    connections.set(ws, connData);
    
    console.log(`[INFO] Starting subscription ${subscriptionId} for hospital ${hospitalId}`);
    
    // Send subscription started response
    ws.send(JSON.stringify({
      id,
      result: {
        type: 'started',
      }
    }));
    
    // Send initial data
    ws.send(JSON.stringify({
      id,
      result: {
        type: 'data',
        data: {
          type: 'connected',
          hospitalId,
          timestamp: new Date().toISOString(),
        }
      }
    }));
    
    // Set up alert listener for this subscription
    const handleAlert = (alert: any) => {
      if (!hospitalId || alert.hospitalId === hospitalId) {
        ws.send(JSON.stringify({
          id,
          result: {
            type: 'data',
            data: {
              type: 'alert',
              alertId: alert.id,
              data: alert,
              timestamp: new Date().toISOString(),
            }
          }
        }));
      }
    };
    
    alertEmitter.on('alert', handleAlert);
    
    // Store cleanup function
    alertEmitter.on(`subscription-${subscriptionId}`, () => {
      alertEmitter.off('alert', handleAlert);
    });
    
    // Send periodic heartbeat
    const heartbeat = setInterval(() => {
      if (ws.readyState === 1) { // OPEN state
        ws.send(JSON.stringify({
          id,
          result: {
            type: 'data',
            data: {
              type: 'heartbeat',
              timestamp: new Date().toISOString(),
            }
          }
        }));
      } else {
        clearInterval(heartbeat);
      }
    }, 30000);
    
  } else if (params?.path === 'healthcare.subscribeToMetrics') {
    // Handle metrics subscription
    const hospitalId = params?.input?.hospitalId;
    const interval = params?.input?.interval || 30000;
    
    console.log(`[INFO] Starting metrics subscription for hospital ${hospitalId}`);
    
    // Send subscription started
    ws.send(JSON.stringify({
      id,
      result: {
        type: 'started',
      }
    }));
    
    // Send initial metrics
    ws.send(JSON.stringify({
      id,
      result: {
        type: 'data',
        data: {
          totalAlerts: 0,
          activeAlerts: 0,
          acknowledgedAlerts: 0,
          resolvedAlerts: 0,
          averageResponseTime: 0,
          timestamp: new Date().toISOString(),
        }
      }
    }));
    
  } else {
    // Unknown subscription path
    ws.send(JSON.stringify({
      id,
      error: {
        message: `Unknown subscription path: ${params?.path}`,
        code: -32602,
      }
    }));
  }
}

// Handle subscription stop
function handleSubscriptionStop(ws: any, message: any) {
  const { id } = message;
  const connData = connections.get(ws);
  
  if (connData?.subscriptionId) {
    console.log(`[INFO] Stopping subscription ${connData.subscriptionId}`);
    alertEmitter.emit(`subscription-${connData.subscriptionId}`);
    connData.subscriptionId = undefined;
  }
  
  // Send stopped response
  ws.send(JSON.stringify({
    id,
    result: {
      type: 'stopped',
    }
  }));
}

console.log(`[INFO] Bun TRPC WebSocket server running on ws://localhost:${port}/api/trpc`);

// Simulate some alerts for testing in development
if (process.env.NODE_ENV === 'development') {
  setInterval(() => {
    // Get all active hospital IDs from current connections
    const activeHospitalIds = Array.from(connections.values())
      .map(conn => conn.hospitalId)
      .filter(id => id && id !== undefined);
    
    // Only emit test alerts if there are active connections
    if (activeHospitalIds.length > 0) {
      // Emit an alert for each connected hospital
      activeHospitalIds.forEach(hospitalId => {
        const testAlert = {
          id: Math.random().toString(36).substring(2, 9),
          alertId: Math.random().toString(36).substring(2, 9),
          hospitalId: hospitalId,
          type: 'alert.created',
          data: {
            urgencyLevel: Math.floor(Math.random() * 3) + 1, // 1-3
            roomNumber: `Room ${Math.floor(Math.random() * 100)}`,
            message: 'Test alert from WebSocket',
            patientName: `Test Patient ${Math.floor(Math.random() * 100)}`,
            status: 'active',
            createdAt: new Date().toISOString(),
          },
          timestamp: new Date().toISOString(),
        };
        
        console.log(`[INFO] Emitting test alert for hospital ${hospitalId}`);
        alertEmitter.emit('alert', testAlert);
      });
    } else {
      console.log(`[INFO] No active connections, skipping test alert emission`);
    }
  }, 30000); // Every 30 seconds for testing
}

// Handle graceful shutdown
const shutdown = () => {
  console.log(`[INFO] Shutting down WebSocket server...`);
  connections.forEach((_, ws) => ws.close());
  server.stop();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);