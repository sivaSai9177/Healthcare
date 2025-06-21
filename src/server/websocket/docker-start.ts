#!/usr/bin/env node
/**
 * Docker-specific WebSocket Server Entry Point
 * Handles module resolution for Docker environment
 */

import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';

// Set up module aliases for Docker environment
const require = createRequire(import.meta.url || __filename);

// Register module aliases
const moduleAlias = require('module-alias');
const rootPath = path.resolve(process.cwd());

moduleAlias.addAliases({
  '@': path.join(rootPath, 'src'),
  '@/lib': path.join(rootPath, 'lib'),
  '@/types': path.join(rootPath, 'types')
});

// Import and start the WebSocket server
async function startServer() {
  try {

    const { initializeWebSocketServer } = await import('./server.js');
    const port = parseInt(process.env.EXPO_PUBLIC_WS_PORT || '3002', 10);
    
    const wsManager = initializeWebSocketServer(port);

    // Keep the process alive
    process.on('SIGTERM', () => {

      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Failed to start WebSocket server:', error);
    process.exit(1);
  }
}

startServer();