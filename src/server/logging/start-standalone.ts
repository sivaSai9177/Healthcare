#!/usr/bin/env bun
/**
 * Standalone Logging Service
 * No React Native imports - pure Node.js/Bun service
 */

const port = parseInt(process.env.LOGGING_SERVICE_PORT || '3003', 10);

// Configuration
const config = {
  maxLogSize: parseInt(process.env.LOGGING_MAX_SIZE || '10000', 10),
  logRetentionMs: parseInt(process.env.LOGGING_RETENTION_MS || '86400000', 10), // 24 hours
  allowedOrigins: process.env.LOGGING_ALLOWED_ORIGINS?.split(',') || ['*'],
  enableCompression: process.env.LOGGING_ENABLE_COMPRESSION === 'true',
};

// In-memory log storage (in production, use a proper database)
const logStorage: Map<string, any[]> = new Map();
let totalLogCount = 0;

// Simple console logger for Docker environment
const log = {
  info: (message: string, data?: any) => {
    console.log(`[INFO] [LOGGING] ${message}`, data ? JSON.stringify(data) : '');
  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] [LOGGING] ${message}`, error || '');
  }
};

// Enhanced logging service with storage and rotation
const loggingService = {
  logEvent: async (event: any) => {
    const enrichedEvent = {
      ...event,
      receivedAt: new Date().toISOString(),
      serverVersion: '1.0.0',
    };
    
    // Store by category
    const category = event.category || 'general';
    if (!logStorage.has(category)) {
      logStorage.set(category, []);
    }
    
    const categoryLogs = logStorage.get(category)!;
    categoryLogs.push(enrichedEvent);
    totalLogCount++;
    
    // Output to console for Docker logs
    const logPrefix = `[${event.level?.toUpperCase() || 'INFO'}] [${category}]`;
    const logMessage = `${logPrefix} ${event.message || 'No message'}`;
    
    // Log with appropriate level
    if (event.level === 'error') {
      console.error(logMessage, event.data ? JSON.stringify(event.data, null, 2) : '');
    } else if (event.level === 'warn') {
      console.warn(logMessage, event.data ? JSON.stringify(event.data, null, 2) : '');
    } else {
      console.log(logMessage, event.data ? JSON.stringify(event.data, null, 2) : '');
    }
    
    // Rotate logs if needed
    if (totalLogCount > config.maxLogSize) {
      loggingService.rotateLogs();
    }
    
    return Promise.resolve();
  },
  
  rotateLogs: () => {
    const cutoffTime = Date.now() - config.logRetentionMs;
    let removedCount = 0;
    
    for (const [category, logs] of logStorage.entries()) {
      const filteredLogs = logs.filter(log => {
        const logTime = new Date(log.receivedAt || log.timestamp).getTime();
        if (logTime < cutoffTime) {
          removedCount++;
          return false;
        }
        return true;
      });
      
      if (filteredLogs.length === 0) {
        logStorage.delete(category);
      } else {
        logStorage.set(category, filteredLogs);
      }
    }
    
    totalLogCount -= removedCount;
    log.info(`Log rotation complete: removed ${removedCount} old logs`);
  },
  
  getStats: () => {
    const stats: any = {
      totalLogs: totalLogCount,
      categories: {},
    };
    
    for (const [category, logs] of logStorage.entries()) {
      stats.categories[category] = {
        count: logs.length,
        oldestLog: logs[0]?.receivedAt,
        newestLog: logs[logs.length - 1]?.receivedAt,
      };
    }
    
    return stats;
  },
  
  close: () => {
    log.info('Logging service closing', loggingService.getStats());
  }
};

const server = Bun.serve({
  port,
  async fetch(req) {
    const url = new URL(req.url);
    const method = req.method;
    
    // Dynamic CORS headers based on configuration
    const origin = req.headers.get('origin') || '*';
    const isAllowedOrigin = config.allowedOrigins.includes('*') || 
                           config.allowedOrigins.includes(origin);
    
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': isAllowedOrigin ? origin : config.allowedOrigins[0],
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Batch-ID, X-Retry-Count',
      'Access-Control-Max-Age': '86400', // 24 hours
    };
    
    // Handle OPTIONS
    if (method === 'OPTIONS') {
      return new Response(null, { headers, status: 204 });
    }
    
    // Health check endpoint
    if (url.pathname === '/health' && method === 'GET') {
      return new Response(JSON.stringify({ 
        status: 'ok', 
        service: 'logging', 
        timestamp: new Date().toISOString(),
        note: 'Standalone service without React Native imports'
      }), {
        headers,
        status: 200
      });
    }
    
    // Log event endpoint
    if (url.pathname === '/log' && method === 'POST') {
      try {
        const body = await req.json();
        await loggingService.logEvent(body);
        return new Response(JSON.stringify({ success: true }), {
          headers,
          status: 200
        });
      } catch (error) {
        log.error('Failed to log event', error);
        return new Response(JSON.stringify({ error: 'Failed to log event' }), {
          headers,
          status: 500
        });
      }
    }
    
    // Batch log endpoint with enhanced features
    if (url.pathname === '/log/batch' && method === 'POST') {
      try {
        const batchId = req.headers.get('X-Batch-ID') || 'unknown';
        const retryCount = req.headers.get('X-Retry-Count') || '0';
        
        const body = await req.json();
        const { events } = body;
        
        if (!Array.isArray(events)) {
          return new Response(JSON.stringify({ error: 'Events must be an array' }), {
            headers,
            status: 400
          });
        }
        
        log.info(`Processing batch ${batchId} (retry: ${retryCount})`, {
          eventCount: events.length,
        });
        
        await Promise.all(events.map(event => loggingService.logEvent(event)));
        
        return new Response(JSON.stringify({ 
          success: true, 
          count: events.length,
          batchId,
          stats: loggingService.getStats(),
        }), {
          headers,
          status: 200
        });
      } catch (error) {
        log.error('Failed to log batch events', error);
        return new Response(JSON.stringify({ error: 'Failed to log batch events' }), {
          headers,
          status: 500
        });
      }
    }
    
    // Stats endpoint
    if (url.pathname === '/stats' && method === 'GET') {
      return new Response(JSON.stringify(loggingService.getStats()), {
        headers,
        status: 200
      });
    }
    
    // Query logs endpoint
    if (url.pathname === '/logs' && method === 'GET') {
      const category = url.searchParams.get('category') || 'all';
      const limit = parseInt(url.searchParams.get('limit') || '100', 10);
      
      let logs: any[] = [];
      if (category === 'all') {
        for (const categoryLogs of logStorage.values()) {
          logs.push(...categoryLogs);
        }
      } else if (logStorage.has(category)) {
        logs = logStorage.get(category)!;
      }
      
      // Sort by timestamp descending and limit
      logs.sort((a, b) => {
        const timeA = new Date(a.receivedAt || a.timestamp).getTime();
        const timeB = new Date(b.receivedAt || b.timestamp).getTime();
        return timeB - timeA;
      });
      
      return new Response(JSON.stringify({
        logs: logs.slice(0, limit),
        total: logs.length,
        category,
      }), {
        headers,
        status: 200
      });
    }
    
    // Default response with enhanced documentation
    return new Response(JSON.stringify({
      service: 'Healthcare Alert Logging Service (Standalone)',
      version: '1.0.0',
      config: {
        maxLogSize: config.maxLogSize,
        logRetentionMs: config.logRetentionMs,
        allowedOrigins: config.allowedOrigins,
      },
      endpoints: {
        health: '/health - Health check',
        log: '/log - Log single event',
        batch: '/log/batch - Log multiple events',
        stats: '/stats - Get logging statistics',
        logs: '/logs?category=all&limit=100 - Query logs',
      },
      stats: loggingService.getStats(),
    }), { headers, status: 200 });
  }
});

log.info(`Logging service (standalone) listening on port ${server.port}`);
log.info('Configuration:', config);
log.info('Available endpoints:', {
  health: `http://localhost:${server.port}/health`,
  log: `http://localhost:${server.port}/log`,
  batch: `http://localhost:${server.port}/log/batch`,
  stats: `http://localhost:${server.port}/stats`,
  logs: `http://localhost:${server.port}/logs`,
});

// Start periodic log rotation
setInterval(() => {
  loggingService.rotateLogs();
}, 60000); // Every minute

// Graceful shutdown
process.on('SIGTERM', () => {
  log.info('SIGTERM received, shutting down gracefully');
  loggingService.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  log.info('SIGINT received, shutting down gracefully');
  loggingService.close();
  process.exit(0);
});