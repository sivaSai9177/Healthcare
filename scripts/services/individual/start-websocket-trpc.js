#!/usr/bin/env node

/**
 * tRPC WebSocket Server (Node.js version)
 * This script provides a minimal WebSocket server that works with tRPC
 */

const WebSocket = require('ws');
const { createServer } = require('http');

const port = parseInt(process.env.EXPO_PUBLIC_WS_PORT || '3002', 10);

// Create HTTP server
const httpServer = createServer();

// Create WebSocket server with tRPC subprotocol support
const wss = new WebSocket.Server({
  server: httpServer,
  path: '/api/trpc',
  // Handle WebSocket subprotocol negotiation for tRPC
  handleProtocols: (protocols, request) => {
    // tRPC uses 'graphql-ws' protocol
    if (protocols.has('graphql-ws')) {
      return 'graphql-ws';
    }
    return false;
  },
});

// Track connected clients
const clients = new Map();

// Handle tRPC WebSocket protocol
wss.on('connection', (ws, req) => {
  const clientId = Math.random().toString(36).substring(7);
  const clientIp = req.socket.remoteAddress;

  clients.set(clientId, ws);
  
  // Send connection acknowledgment
  ws.send(JSON.stringify({
    id: 1,
    type: 'connection_ack'
  }));
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());

      // Handle different message types based on what's actually being sent
      if (!message.id && !message.type && !message.method) {
        // This might be a connection init message
        ws.send(JSON.stringify({
          type: 'connection_ack'
        }));
        return;
      }
      
      // Handle tRPC-style messages
      if (message.method === 'subscription') {

        const subscriptionPath = message.params?.path;
        
        // Send acknowledgment
        ws.send(JSON.stringify({
          id: message.id,
          result: {
            type: 'started'
          }
        }));
        
        // Handle different subscription types
        if (subscriptionPath === 'healthcare.subscribeToAlerts') {
          // Send initial alert data
          setTimeout(() => {
            ws.send(JSON.stringify({
              id: message.id,
              result: {
                type: 'data',
                data: {
                  id: `event-${Date.now()}`,
                  type: 'alert.created',
                  alertId: `alert-${Date.now()}`,
                  hospitalId: 'default',
                  timestamp: new Date().toISOString(),
                  data: {
                    roomNumber: '101',
                    severity: 'medium',
                    message: 'Test alert from WebSocket'
                  }
                }
              }
            }));
          }, 1000);
          
          // Simulate periodic alert updates
          const alertInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              const eventTypes = ['alert.created', 'alert.acknowledged', 'alert.resolved'];
              const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
              
              ws.send(JSON.stringify({
                id: message.id,
                result: {
                  type: 'data',
                  data: {
                    id: `event-${Date.now()}`,
                    type: eventType,
                    alertId: `alert-${Date.now()}`,
                    hospitalId: 'default',
                    timestamp: new Date().toISOString(),
                    data: {
                      roomNumber: `${100 + Math.floor(Math.random() * 20)}`,
                      severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
                      message: `Simulated ${eventType} event`
                    }
                  }
                }
              }));
            } else {
              clearInterval(alertInterval);
            }
          }, 30000); // Every 30 seconds
          
          // Store interval for cleanup
          ws.intervals = ws.intervals || [];
          ws.intervals.push(alertInterval);
        } else if (subscriptionPath === 'healthcare.subscribeToMetrics') {
          // Send initial metrics data
          setTimeout(() => {
            ws.send(JSON.stringify({
              id: message.id,
              result: {
                type: 'data',
                data: {
                  activeAlerts: Math.floor(Math.random() * 10) + 5,
                  staffOnline: Math.floor(Math.random() * 20) + 15,
                  avgResponseTime: (Math.random() * 5 + 1).toFixed(1),
                  alertCapacity: 50,
                  criticalAlerts: Math.floor(Math.random() * 3),
                  timestamp: new Date().toISOString()
                }
              }
            }));
          }, 500);
          
          // Simulate periodic metrics updates
          const metricsInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                id: message.id,
                result: {
                  type: 'data',
                  data: {
                    activeAlerts: Math.floor(Math.random() * 10) + 5,
                    staffOnline: Math.floor(Math.random() * 20) + 15,
                    avgResponseTime: (Math.random() * 5 + 1).toFixed(1),
                    alertCapacity: 50,
                    criticalAlerts: Math.floor(Math.random() * 3),
                    timestamp: new Date().toISOString()
                  }
                }
              }));
            } else {
              clearInterval(metricsInterval);
            }
          }, 15000); // Every 15 seconds
          
          // Store interval for cleanup
          ws.intervals = ws.intervals || [];
          ws.intervals.push(metricsInterval);
        }
        
        return;
      }
      
      // Handle ping/pong
      if (message.type === 'ping' || message.method === 'ping') {
        ws.send(JSON.stringify({
          id: message.id,
          type: 'pong'
        }));
        return;
      }
      
      if (message.type === 'subscription.start') {
        // Simulate subscription response

        // Send initial data
        ws.send(JSON.stringify({
          id: message.id,
          type: 'subscription.data',
          data: {
            result: {
              data: {
                id: `event-${Date.now()}`,
                type: 'connected',
                timestamp: new Date().toISOString(),
                data: { status: 'WebSocket connected successfully' }
              }
            }
          }
        }));
        
        // Simulate periodic updates for testing
        const interval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              id: message.id,
              type: 'subscription.data',
              data: {
                result: {
                  data: {
                    id: `event-${Date.now()}`,
                    type: 'heartbeat',
                    timestamp: new Date().toISOString(),
                    data: { connections: clients.size }
                  }
                }
              }
            }));
          } else {
            clearInterval(interval);
          }
        }, 30000); // Every 30 seconds
        
        // Store interval for cleanup
        ws.intervals = ws.intervals || [];
        ws.intervals.push(interval);
      }
      
      if (message.method === 'subscription.stop') {

        // Clean up any intervals
        if (ws.intervals) {
          ws.intervals.forEach(interval => clearInterval(interval));
          ws.intervals = [];
        }
        
        // Send stopped acknowledgment
        ws.send(JSON.stringify({
          id: message.id,
          result: {
            type: 'stopped'
          }
        }));
      }
      
    } catch (error) {
      console.error('[WS] Error parsing message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        error: { message: 'Invalid message format' }
      }));
    }
  });
  
  ws.on('close', () => {

    clients.delete(clientId);
    // Clean up any intervals
    if (ws.intervals) {
      ws.intervals.forEach(interval => clearInterval(interval));
    }
  });
  
  ws.on('error', (error) => {
    console.error(`[WS] Client ${clientId} error:`, error.message);
  });
});

// Start server
httpServer.listen(port, () => {

});

// Handle graceful shutdown
process.on('SIGINT', () => {

  // Close all client connections
  clients.forEach((ws, clientId) => {

    ws.close();
  });
  
  wss.close(() => {
    httpServer.close(() => {

      process.exit(0);
    });
  });
});

process.on('SIGTERM', () => {
  process.exit(0);
});