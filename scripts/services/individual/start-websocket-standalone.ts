#!/usr/bin/env bun

/**
 * Standalone WebSocket Server
 * Runs the enhanced WebSocket server with authentication and alert subscriptions
 */

import { initializeWebSocketServer } from '../src/server/websocket/server';
import { log } from '../lib/core/debug/logger';
import dotenv from 'dotenv';
import { join } from 'path';

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const PORT = process.env.EXPO_PUBLIC_WS_PORT ? parseInt(process.env.EXPO_PUBLIC_WS_PORT) : 3002;

log.info('Starting enhanced WebSocket server', 'WEBSOCKET', { port: PORT });

// Initialize the WebSocket server
const wsManager = initializeWebSocketServer(PORT);

// Log server stats periodically
setInterval(() => {
  const stats = wsManager.getStats();
  log.debug('WebSocket server stats', 'WEBSOCKET', stats);
}, 60000); // Every minute

log.info('WebSocket server ready', 'WEBSOCKET', {
  port: PORT,
  testCommand: `wscat -c ws://localhost:${PORT}`,
});