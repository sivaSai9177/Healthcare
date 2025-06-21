#!/usr/bin/env bun

/**
 * WebSocket Server Startup Script
 * Runs the WebSocket server for real-time healthcare alerts
 */

import { createWebSocketServer } from '../src/server/websocket';
import { log } from '../lib/core/debug/logger';
import { config } from '../lib/core/config';

const PORT = process.env.WEBSOCKET_PORT ? parseInt(process.env.WEBSOCKET_PORT) : 3001;

async function startWebSocketServer() {
  try {
    log.info('Starting WebSocket server...', 'WS_STARTUP');
    
    // Create and start the WebSocket server
    const wsServer = createWebSocketServer(PORT);
    
    log.info(`✅ WebSocket server started successfully`, 'WS_STARTUP', {
      port: PORT,
      url: `ws://localhost:${PORT}`,
    });
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      log.info('Shutting down WebSocket server...', 'WS_STARTUP');
      wsServer.close();
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      log.info('Shutting down WebSocket server...', 'WS_STARTUP');
      wsServer.close();
      process.exit(0);
    });
    
  } catch (error) {
    log.error('Failed to start WebSocket server', 'WS_STARTUP', error);
    process.exit(1);
  }
}

// Start the server
startWebSocketServer();