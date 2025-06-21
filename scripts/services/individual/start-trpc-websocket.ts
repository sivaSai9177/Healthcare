#!/usr/bin/env bun

/**
 * Start tRPC WebSocket Server
 * Runs the tRPC WebSocket server for real-time subscriptions
 */

import { initializeTRPCWebSocketServer } from '../src/server/websocket/trpc-websocket';
import { log } from '../lib/core/debug/logger';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function startWebSocketServer() {
  try {
    log.info('🚀 Starting tRPC WebSocket Server', 'WS_SERVER');
    
    const port = parseInt(process.env.EXPO_PUBLIC_WS_PORT || '3002', 10);
    
    // Initialize and start the server
    const wsServer = initializeTRPCWebSocketServer({ port });
    await wsServer.start();
    
    // Log server info
    const stats = wsServer.getStats();
    log.info('✅ tRPC WebSocket Server is running', 'WS_SERVER', {
      port: stats.port,
      url: `ws://localhost:${stats.port}/api/trpc`,
      ready: stats.ready,
    });
    
    // Keep the process running
    process.on('SIGINT', async () => {
      log.info('Shutting down WebSocket server...', 'WS_SERVER');
      await wsServer.stop();
      process.exit(0);
    });
    
  } catch (error) {
    log.error('Failed to start WebSocket server', 'WS_SERVER', error);
    process.exit(1);
  }
}

// Start the server
startWebSocketServer();