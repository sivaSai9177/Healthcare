#!/usr/bin/env bun
/**
 * System Health Monitoring Script
 * Monitors database, API, WebSocket, Redis, and overall system health
 */

import { db } from '../../src/db/server-db';
import { sql } from 'drizzle-orm';
import chalk from 'chalk';
import fetch from 'node-fetch';
import { createConnection } from 'net';
import { execSync } from 'child_process';

// Simple logger
const log = {
  info: (msg: string) => console.log(msg),
  success: (msg: string) => console.log(msg),
  error: (msg: string) => console.log(msg),
  warn: (msg: string) => console.log(msg),
  debug: (msg: string) => process.env.DEBUG && console.log(msg),
};

interface HealthAction {
  action: 'check' | 'monitor' | 'report' | 'services' | 'performance' | 'alerts';
  interval?: number;
  format?: 'text' | 'json';
}

interface ServiceHealth {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime?: number;
  details?: any;
  error?: string;
}

interface SystemHealth {
  timestamp: Date;
  overall: 'healthy' | 'unhealthy' | 'degraded';
  services: ServiceHealth[];
  metrics?: {
    cpu?: number;
    memory?: number;
    disk?: number;
    connections?: number;
  };
}

// Parse command line arguments
function parseArgs(): HealthAction {
  const args = process.argv.slice(2);
  const action = args[0] as HealthAction['action'];
  
  if (!action || args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(0);
  }

  const intervalIndex = args.findIndex(arg => arg.startsWith('--interval='));
  const interval = intervalIndex !== -1 ? parseInt(args[intervalIndex].split('=')[1]) : undefined;
  
  const formatIndex = args.findIndex(arg => arg.startsWith('--format='));
  const format = formatIndex !== -1 ? args[formatIndex].split('=')[1] as 'text' | 'json' : 'text';

  return { action, interval, format };
}

function printHelp() {

}

// Check if a port is open
async function checkPort(host: string, port: number, timeout: number = 3000): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = createConnection({ host, port, timeout });
    
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    
    socket.on('error', () => {
      resolve(false);
    });
    
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
  });
}

// Check database health
async function checkDatabase(): Promise<ServiceHealth> {
  const startTime = Date.now();
  
  try {
    // Test connection
    const result = await db.execute(sql`SELECT 1 as health`);
    
    // Get connection stats
    const stats = await db.execute(sql`
      SELECT 
        COUNT(*) as active_connections,
        MAX(state_change) as last_activity
      FROM pg_stat_activity 
      WHERE datname = current_database()
    `);
    
    // Get database size
    const sizeResult = await db.execute(sql`
      SELECT pg_database_size(current_database()) as size
    `);
    
    const responseTime = Date.now() - startTime;
    
    return {
      name: 'PostgreSQL',
      status: 'healthy',
      responseTime,
      details: {
        activeConnections: Number(stats.rows[0].active_connections),
        databaseSizeMB: (Number(sizeResult.rows[0].size) / 1024 / 1024).toFixed(2),
        lastActivity: stats.rows[0].last_activity,
      }
    };
  } catch (error) {
    return {
      name: 'PostgreSQL',
      status: 'unhealthy',
      error: error.message,
      responseTime: Date.now() - startTime,
    };
  }
}

// Check API health
async function checkAPI(): Promise<ServiceHealth> {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8081';
  const startTime = Date.now();
  
  try {
    const response = await fetch(`${apiUrl}/api/health`, {
      timeout: 5000,
    });
    
    const responseTime = Date.now() - startTime;
    
    if (response.ok) {
      const data = await response.json().catch(() => ({}));
      return {
        name: 'API Server',
        status: 'healthy',
        responseTime,
        details: data,
      };
    } else {
      return {
        name: 'API Server',
        status: 'degraded',
        responseTime,
        details: { statusCode: response.status },
      };
    }
  } catch (error) {
    return {
      name: 'API Server',
      status: 'unhealthy',
      error: error.message,
      responseTime: Date.now() - startTime,
    };
  }
}

// Check WebSocket health
async function checkWebSocket(): Promise<ServiceHealth> {
  const wsPort = process.env.EXPO_PUBLIC_WS_PORT || '3002';
  const startTime = Date.now();
  
  try {
    const isOpen = await checkPort('localhost', parseInt(wsPort));
    const responseTime = Date.now() - startTime;
    
    return {
      name: 'WebSocket Server',
      status: isOpen ? 'healthy' : 'unhealthy',
      responseTime,
      details: { port: wsPort },
    };
  } catch (error) {
    return {
      name: 'WebSocket Server',
      status: 'unhealthy',
      error: error.message,
      responseTime: Date.now() - startTime,
    };
  }
}

// Check Redis health
async function checkRedis(): Promise<ServiceHealth> {
  const startTime = Date.now();
  
  try {
    const isOpen = await checkPort('localhost', 6379);
    const responseTime = Date.now() - startTime;
    
    if (isOpen) {
      // Try to get Redis info if running locally
      try {
        const info = execSync('redis-cli ping', { encoding: 'utf8' }).trim();
        return {
          name: 'Redis',
          status: info === 'PONG' ? 'healthy' : 'degraded',
          responseTime,
          details: { ping: info },
        };
      } catch {
        // Redis CLI not available, but port is open
        return {
          name: 'Redis',
          status: 'healthy',
          responseTime,
          details: { port: 6379 },
        };
      }
    } else {
      return {
        name: 'Redis',
        status: 'unhealthy',
        responseTime,
        error: 'Port 6379 not accessible',
      };
    }
  } catch (error) {
    return {
      name: 'Redis',
      status: 'unhealthy',
      error: error.message,
      responseTime: Date.now() - startTime,
    };
  }
}

// Check Docker health
async function checkDocker(): Promise<ServiceHealth> {
  const startTime = Date.now();
  
  try {
    const dockerInfo = execSync('docker info --format json', { encoding: 'utf8' });
    const info = JSON.parse(dockerInfo);
    const responseTime = Date.now() - startTime;
    
    // Check our specific containers
    const containers = execSync('docker ps --format "{{.Names}}" | grep healthcare', { encoding: 'utf8' })
      .trim()
      .split('\n')
      .filter(Boolean);
    
    return {
      name: 'Docker',
      status: 'healthy',
      responseTime,
      details: {
        containers: containers.length,
        runningContainers: info.ContainersRunning,
        images: info.Images,
      },
    };
  } catch (error) {
    return {
      name: 'Docker',
      status: 'unhealthy',
      error: 'Docker not running or not accessible',
      responseTime: Date.now() - startTime,
    };
  }
}

// Get system performance metrics
async function getPerformanceMetrics() {
  try {
    // Get memory usage
    let memoryUsage = 0;
    try {
      if (process.platform === 'darwin') {
        // macOS - use vm_stat
        const vmStat = execSync("vm_stat | grep 'Pages active\\|Pages wired' | awk '{print $NF}' | sed 's/\\.//'", { encoding: 'utf8' });
        const pages = vmStat.trim().split('\n').map(Number);
        const activePages = pages.reduce((a, b) => a + b, 0);
        const pageSize = parseInt(execSync("vm_stat | grep 'page size' | awk '{print $8}'", { encoding: 'utf8' }).trim());
        const totalMemory = parseInt(execSync("sysctl -n hw.memsize", { encoding: 'utf8' }).trim());
        memoryUsage = (activePages * pageSize / totalMemory) * 100;
      } else {
        // Linux
        const memInfo = execSync("free -m | grep Mem | awk '{print $3/$2 * 100.0}'", { encoding: 'utf8' });
        memoryUsage = parseFloat(memInfo.trim());
      }
    } catch {
      memoryUsage = -1; // Unable to determine
    }
    
    // Get CPU usage (macOS/Linux compatible)
    let cpuUsage = 0;
    try {
      if (process.platform === 'darwin') {
        // macOS
        const cpu = execSync("ps -A -o %cpu | awk '{s+=$1} END {print s}'", { encoding: 'utf8' });
        cpuUsage = parseFloat(cpu.trim());
      } else {
        // Linux
        const cpu = execSync("top -bn1 | grep 'Cpu(s)' | awk '{print $2}' | cut -d'%' -f1", { encoding: 'utf8' });
        cpuUsage = parseFloat(cpu.trim());
      }
    } catch {
      // Fallback
      cpuUsage = -1;
    }
    
    // Get disk usage
    const diskInfo = execSync("df -h / | tail -1 | awk '{print $5}' | sed 's/%//'", { encoding: 'utf8' });
    const diskUsage = parseFloat(diskInfo.trim());
    
    // Get database connections
    const connResult = await db.execute(sql`
      SELECT COUNT(*) as count FROM pg_stat_activity 
      WHERE datname = current_database()
    `);
    const connections = Number(connResult.rows[0].count);
    
    return {
      cpu: cpuUsage,
      memory: memoryUsage,
      disk: diskUsage,
      connections,
    };
  } catch (error) {
    log.debug(`Failed to get performance metrics: ${error}`);
    return {};
  }
}

// Perform comprehensive health check
async function performHealthCheck(): Promise<SystemHealth> {
  const services = await Promise.all([
    checkDatabase(),
    checkAPI(),
    checkWebSocket(),
    checkRedis(),
    checkDocker(),
  ]);
  
  const metrics = await getPerformanceMetrics();
  
  // Determine overall health
  const unhealthyCount = services.filter(s => s.status === 'unhealthy').length;
  const degradedCount = services.filter(s => s.status === 'degraded').length;
  
  let overall: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
  if (unhealthyCount > 0) {
    overall = 'unhealthy';
  } else if (degradedCount > 0) {
    overall = 'degraded';
  }
  
  return {
    timestamp: new Date(),
    overall,
    services,
    metrics,
  };
}

// Display health check results
function displayHealthResults(health: SystemHealth, format: 'text' | 'json') {
  if (format === 'json') {

    return;
  }
  
  // Text format

  // Overall status
  const statusColor = health.overall === 'healthy' ? chalk.green : 
                     health.overall === 'degraded' ? chalk.yellow : chalk.red;

  // Services

  for (const service of health.services) {
    const statusIcon = service.status === 'healthy' ? '✅' : 
                      service.status === 'degraded' ? '⚠️ ' : '❌';
    const statusText = service.status === 'healthy' ? chalk.green(service.status) :
                      service.status === 'degraded' ? chalk.yellow(service.status) :
                      chalk.red(service.status);

    if (service.error) {

    }
    
    if (service.details && process.env.VERBOSE) {

    }
  }
  
  // Performance metrics
  if (health.metrics && Object.keys(health.metrics).length > 0) {

    if (health.metrics.cpu !== undefined && health.metrics.cpu >= 0) {
      const cpuColor = health.metrics.cpu > 80 ? chalk.red : 
                       health.metrics.cpu > 60 ? chalk.yellow : chalk.green;

    }
    
    if (health.metrics.memory !== undefined) {
      const memColor = health.metrics.memory > 80 ? chalk.red : 
                      health.metrics.memory > 60 ? chalk.yellow : chalk.green;

    }
    
    if (health.metrics.disk !== undefined) {
      const diskColor = health.metrics.disk > 80 ? chalk.red : 
                       health.metrics.disk > 60 ? chalk.yellow : chalk.green;

    }
    
    if (health.metrics.connections !== undefined) {

    }
  }

}

// Monitor health continuously
async function monitorHealth(interval: number = 5) {

  while (true) {
    const health = await performHealthCheck();
    
    // Clear screen for clean display
    console.clear();
    displayHealthResults(health, 'text');
    
    // Show alerts if any
    if (health.overall !== 'healthy') {

      for (const service of health.services) {
        if (service.status !== 'healthy') {

        }
      }

    }
    
    await new Promise(resolve => setTimeout(resolve, interval * 1000));
  }
}

// Generate detailed health report
async function generateHealthReport(format: 'text' | 'json') {
  log.info('Generating comprehensive health report...');
  
  const health = await performHealthCheck();
  
  // Get additional database stats
  const dbStats = await db.execute(sql`
    SELECT 
      schemaname as schema,
      tablename as table,
      pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
      n_live_tup as rows
    FROM pg_stat_user_tables
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
    LIMIT 10
  `);
  
  // Get recent errors from logs (if available)
  let recentErrors = [];
  try {
    const errors = execSync('docker logs healthcare-app 2>&1 | grep -i error | tail -5', { encoding: 'utf8' });
    recentErrors = errors.trim().split('\n').filter(Boolean);
  } catch {
    // Ignore if Docker not available
  }
  
  const report = {
    ...health,
    database: {
      topTables: dbStats.rows,
    },
    recentErrors,
    recommendations: generateRecommendations(health),
  };
  
  if (format === 'json') {

  } else {
    displayHealthResults(health, 'text');
    
    // Additional report sections

    for (const table of dbStats.rows) {

    }
    
    if (recentErrors.length > 0) {

      recentErrors.forEach(err => {});
    }
    
    if (report.recommendations.length > 0) {

      report.recommendations.forEach(rec => {});
    }
  }
}

// Generate recommendations based on health status
function generateRecommendations(health: SystemHealth): string[] {
  const recommendations = [];
  
  // Service-specific recommendations
  for (const service of health.services) {
    if (service.status === 'unhealthy') {
      switch (service.name) {
        case 'PostgreSQL':
          recommendations.push('Check database connection settings and ensure PostgreSQL is running');
          break;
        case 'API Server':
          recommendations.push('Check if Expo server is running on the correct port');
          break;
        case 'WebSocket Server':
          recommendations.push('Start WebSocket server: docker-compose up -d websocket');
          break;
        case 'Redis':
          recommendations.push('Start Redis: docker-compose up -d redis');
          break;
        case 'Docker':
          recommendations.push('Ensure Docker Desktop is running');
          break;
      }
    }
  }
  
  // Performance recommendations
  if (health.metrics) {
    if (health.metrics.cpu > 80) {
      recommendations.push('High CPU usage detected. Check for runaway processes');
    }
    if (health.metrics.memory > 80) {
      recommendations.push('High memory usage. Consider restarting services');
    }
    if (health.metrics.disk > 80) {
      recommendations.push('Low disk space. Clean up Docker images and logs');
    }
    if (health.metrics.connections > 50) {
      recommendations.push('High database connection count. Check for connection leaks');
    }
  }
  
  return recommendations;
}

// Check for critical alerts
async function checkAlerts() {
  log.info('Checking for critical alerts...');
  
  const health = await performHealthCheck();
  const alerts = [];
  
  // Service alerts
  for (const service of health.services) {
    if (service.status === 'unhealthy') {
      alerts.push({
        level: 'critical',
        service: service.name,
        message: `${service.name} is down`,
        error: service.error,
      });
    } else if (service.status === 'degraded') {
      alerts.push({
        level: 'warning',
        service: service.name,
        message: `${service.name} is degraded`,
        details: service.details,
      });
    }
  }
  
  // Performance alerts
  if (health.metrics) {
    if (health.metrics.cpu > 90) {
      alerts.push({
        level: 'critical',
        service: 'System',
        message: `CPU usage critical: ${health.metrics.cpu.toFixed(1)}%`,
      });
    }
    if (health.metrics.memory > 90) {
      alerts.push({
        level: 'critical',
        service: 'System',
        message: `Memory usage critical: ${health.metrics.memory.toFixed(1)}%`,
      });
    }
  }
  
  // Check for stale data (if alert table exists)
  try {
    const staleDataCheck = await db.execute(sql`
      SELECT COUNT(*) as count 
      FROM alert 
      WHERE created_at < NOW() - INTERVAL '7 days' 
      AND status = 'pending'
    `);
    
    if (Number(staleDataCheck.rows[0].count) > 0) {
      alerts.push({
        level: 'warning',
        service: 'Database',
        message: `${staleDataCheck.rows[0].count} stale alerts (>7 days old)`,
      });
    }
  } catch (error) {
    // Alert table might not exist yet
    log.debug('Alert table check skipped');
  }
  
  // Display alerts
  if (alerts.length === 0) {
    log.success('No critical alerts found');
  } else {

    for (const alert of alerts) {
      const icon = alert.level === 'critical' ? '🔴' : '🟡';
      const color = alert.level === 'critical' ? chalk.red : chalk.yellow;

      if (alert.error) {

      }
      if (alert.details) {

      }
    }
  }
  
  return alerts;
}

// Check individual services
async function checkServices() {
  log.info('Checking individual services...\n');
  
  const services = [
    { name: 'PostgreSQL', check: checkDatabase },
    { name: 'API Server', check: checkAPI },
    { name: 'WebSocket', check: checkWebSocket },
    { name: 'Redis', check: checkRedis },
    { name: 'Docker', check: checkDocker },
  ];
  
  for (const service of services) {
    process.stdout.write(`Checking ${service.name}... `);
    
    const result = await service.check();
    
    if (result.status === 'healthy') {

    } else if (result.status === 'degraded') {

    } else {

      if (result.error) {

      }
    }
    
    if (result.details && process.env.VERBOSE) {

    }
  }
}

// Main execution
async function main() {
  const { action, interval, format } = parseArgs();
  
  try {
    switch (action) {
      case 'check':
        const health = await performHealthCheck();
        displayHealthResults(health, format);
        
        // Exit with appropriate code
        if (health.overall === 'unhealthy') {
          process.exit(1);
        } else if (health.overall === 'degraded') {
          process.exit(2);
        }
        break;
        
      case 'monitor':
        await monitorHealth(interval);
        break;
        
      case 'report':
        await generateHealthReport(format);
        break;
        
      case 'services':
        await checkServices();
        break;
        
      case 'performance':
        const metrics = await getPerformanceMetrics();

        break;
        
      case 'alerts':
        await checkAlerts();
        break;
        
      default:
        log.error(`Unknown action: ${action}`);
        printHelp();
        process.exit(1);
    }
    
    if (action !== 'monitor') {
      log.success('\nHealth check completed!');
    }
  } catch (error) {
    log.error(`Health check failed: ${error}`);
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  log.error(`Unexpected error: ${error}`);
  process.exit(1);
});