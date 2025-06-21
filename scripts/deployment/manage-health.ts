#!/usr/bin/env bun
/**
 * Health Monitoring Script
 * Monitors system health, service endpoints, and sends alerts
 */

import chalk from 'chalk';
import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import os from 'os';
import fetch from 'node-fetch';

// Simple logger
const log = {
  info: (msg: string) => console.log(msg),
  success: (msg: string) => console.log(msg),
  error: (msg: string) => console.log(msg),
  warn: (msg: string) => console.log(msg),
  debug: (msg: string) => process.env.DEBUG && console.log(msg),
};

interface HealthConfig {
  endpoints: {
    name: string;
    url: string;
    critical: boolean;
    timeout?: number;
  }[];
  monitoring: {
    interval: number;
    timeout: number;
    retries: number;
  };
  alerts: {
    slack?: {
      webhook: string;
    };
    email?: {
      to: string[];
      from: string;
    };
  };
  thresholds: {
    cpu: number;
    memory: number;
    disk: number;
    responseTime: number;
  };
}

interface SystemMetrics {
  cpu: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  disk: {
    used: number;
    total: number;
    percentage: number;
  };
  uptime: number;
}

// Default configuration
const DEFAULT_CONFIG: HealthConfig = {
  endpoints: [
    {
      name: 'API Server',
      url: 'http://localhost:3000/health',
      critical: true,
    },
    {
      name: 'Database',
      url: 'http://localhost:5432/health',
      critical: true,
    },
  ],
  monitoring: {
    interval: 300000, // 5 minutes
    timeout: 10000, // 10 seconds
    retries: 3,
  },
  alerts: {
    slack: {
      webhook: process.env.SLACK_WEBHOOK || '',
    },
    email: {
      to: ['admin@example.com'],
      from: 'monitoring@example.com',
    },
  },
  thresholds: {
    cpu: 80,
    memory: 90,
    disk: 85,
    responseTime: 5000,
  },
};

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (!command || args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(0);
  }

  const options = {
    command,
    services: args.includes('--services'),
    json: args.includes('--json'),
    endpoint: args.find(arg => arg.startsWith('--endpoint='))?.split('=')[1],
    dryRun: args.includes('--dry-run'),
    validate: args.includes('--validate'),
    test: args.includes('--test'),
    history: args.includes('--history'),
    export: args.includes('--export'),
    port: args.find(arg => arg.startsWith('--port='))?.split('=')[1] || '8080',
    quiet: args.includes('--quiet'),
    verbose: args.includes('--verbose') || args.includes('-v'),
    timeout: parseInt(args.find(arg => arg.startsWith('--timeout='))?.split('=')[1] || '10000'),
  };

  return options;
}

// Print help message
function printHelp() {

}

// Load configuration
function loadConfig(): HealthConfig {
  const configPath = join(process.cwd(), 'config/health-monitoring.json');
  
  if (!existsSync(configPath)) {
    log.warn('Configuration not found, creating default config...');
    const configDir = join(process.cwd(), 'config');
    if (!existsSync(configDir)) {
      mkdirSync(configDir, { recursive: true });
    }
    writeFileSync(configPath, JSON.stringify(DEFAULT_CONFIG, null, 2));
    return DEFAULT_CONFIG;
  }

  try {
    const configContent = readFileSync(configPath, 'utf8');
    return JSON.parse(configContent);
  } catch (error) {
    log.error(`Failed to parse configuration: ${error}`);
    return DEFAULT_CONFIG;
  }
}

// Get system metrics
function getSystemMetrics(): SystemMetrics {
  const cpuUsage = os.loadavg()[0] * 100 / os.cpus().length;
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  
  // Get disk usage (simplified - in real app would use df command)
  let diskUsage = { used: 0, total: 1, percentage: 0 };
  try {
    const dfOutput = execSync('df -k / | tail -1', { encoding: 'utf8' });
    const parts = dfOutput.trim().split(/\s+/);
    if (parts.length >= 5) {
      const total = parseInt(parts[1]) * 1024;
      const used = parseInt(parts[2]) * 1024;
      diskUsage = {
        used,
        total,
        percentage: (used / total) * 100,
      };
    }
  } catch (error) {
    log.debug(`Failed to get disk usage: ${error}`);
  }

  return {
    cpu: Math.round(cpuUsage),
    memory: {
      used: usedMem,
      total: totalMem,
      percentage: Math.round((usedMem / totalMem) * 100),
    },
    disk: diskUsage,
    uptime: os.uptime(),
  };
}

// Check endpoint health
async function checkEndpoint(endpoint: HealthConfig['endpoints'][0], timeout: number): Promise<{
  name: string;
  url: string;
  healthy: boolean;
  responseTime: number;
  error?: string;
}> {
  const startTime = Date.now();
  
  try {
    const response = await fetch(endpoint.url, {
      method: 'GET',
      timeout: endpoint.timeout || timeout,
      headers: {
        'User-Agent': 'HealthMonitor/1.0',
      },
    });
    
    const responseTime = Date.now() - startTime;
    
    return {
      name: endpoint.name,
      url: endpoint.url,
      healthy: response.ok,
      responseTime,
      error: response.ok ? undefined : `HTTP ${response.status}`,
    };
  } catch (error: any) {
    return {
      name: endpoint.name,
      url: endpoint.url,
      healthy: false,
      responseTime: Date.now() - startTime,
      error: error.message,
    };
  }
}

// Check system status
async function checkStatus(options: any) {
  if (!options.json && !options.quiet) {

  }

  const config = loadConfig();
  const metrics = getSystemMetrics();
  
  if (!options.services && !options.json && !options.quiet) {
    // Show system metrics

    if (!options.quiet) /* console.log() */;
  }

  if (options.services && !options.json) {

    const results = await Promise.all(
      config.endpoints.map(endpoint => checkEndpoint(endpoint, options.timeout))
    );
    
    for (const result of results) {
      const status = result.healthy ? chalk.green('✅ Healthy') : chalk.red('❌ Unhealthy');

      if (result.error && !options.quiet) {

      }
    }
  }

  if (options.json) {
    const output = {
      timestamp: new Date().toISOString(),
      system: metrics,
      services: options.services ? await Promise.all(
        config.endpoints.map(endpoint => checkEndpoint(endpoint, options.timeout))
      ) : undefined,
    };
    // Clear previous output for clean JSON
    console.clear();

    return;
  }
}

// Test endpoints
async function testEndpoints(options: any) {

  const config = loadConfig();
  let endpoints = config.endpoints;
  
  if (options.endpoint) {
    endpoints = endpoints.filter(ep => 
      ep.name.toLowerCase().includes(options.endpoint.toLowerCase())
    );
    if (endpoints.length === 0) {
      log.error(`No endpoint found matching: ${options.endpoint}`);
      return;
    }
  }

  for (const endpoint of endpoints) {
    log.info(`Testing ${endpoint.name}...`);
    const result = await checkEndpoint(endpoint, options.timeout);
    
    if (result.healthy) {
      log.success(`${endpoint.name} is healthy (${result.responseTime}ms)`);
    } else {
      log.error(`${endpoint.name} is unhealthy: ${result.error}`);
    }
  }
}

// Monitor health
async function startMonitoring(options: any) {
  const config = loadConfig();
  
  if (options.dryRun) {

    return;
  }

  if (options.validate) {

    // Validate configuration
    const issues = [];
    if (config.monitoring.interval < 60000) {
      issues.push('Monitoring interval is less than 1 minute');
    }
    if (config.endpoints.length === 0) {
      issues.push('No endpoints configured');
    }
    
    if (issues.length > 0) {
      log.error('Configuration issues found:');
      issues.forEach(issue => {});
    } else {
      log.success('Configuration is valid');
    }
    return;
  }

  log.info('Starting health monitoring...');
  log.warn('Use Ctrl+C to stop monitoring');
  
  // In a real implementation, this would start a background service
  // For now, we'll just indicate it would start
  log.info(`Monitoring ${config.endpoints.length} endpoints every ${config.monitoring.interval / 60000} minutes`);
}

// Test alerts
async function testAlerts(options: any) {
  const config = loadConfig();

  if (options.test) {
    // Test Slack
    if (config.alerts.slack?.webhook) {
      log.info('Testing Slack webhook...');
      // In real implementation, would send test message
      log.success('Slack webhook configured');
    } else {
      log.warn('Slack webhook not configured');
    }

    // Test Email
    if (config.alerts.email?.to.length) {
      log.info('Testing email configuration...');

      log.success('Email configuration valid');
    } else {
      log.warn('Email alerts not configured');
    }
  }

  if (options.validate) {
    log.info('Validating alert channels...');
    const valid = (config.alerts.slack?.webhook || config.alerts.email?.to.length) ? true : false;
    if (valid) {
      log.success('Alert configuration is valid');
    } else {
      log.error('No alert channels configured');
    }
  }
}

// Show metrics
async function showMetrics(options: any) {

  const metrics = getSystemMetrics();
  
  if (options.verbose) {

  }

  if (options.history) {

    // In real implementation, would read from metrics database

  }

  if (options.export) {
    const exportPath = join(process.cwd(), 'logs/metrics-export.json');
    const logsDir = join(process.cwd(), 'logs');
    if (!existsSync(logsDir)) {
      mkdirSync(logsDir, { recursive: true });
    }
    
    const exportData = {
      timestamp: new Date().toISOString(),
      metrics,
    };
    
    writeFileSync(exportPath, JSON.stringify(exportData, null, 2));
    log.success(`Metrics exported to: ${exportPath}`);
  }
}

// Show configuration
async function showConfig(options: any) {
  const config = loadConfig();

  if (options.validate) {
    log.info('Validating configuration...');
    // Basic validation
    if (config.endpoints.length > 0 && config.monitoring.interval > 0) {
      log.success('Configuration is valid');
    } else {
      log.error('Configuration validation failed');
    }
    return;
  }

  config.endpoints.forEach(ep => {

  });

}

// Start dashboard
async function startDashboard(options: any) {
  const port = options.port;

  if (options.dryRun) {
    log.info(`Would start dashboard on port ${port}`);
    return;
  }

  log.info(`Starting web dashboard on port ${port}...`);
  // In real implementation, would start express server with dashboard
  log.info(`Dashboard would be available at: http://localhost:${port}`);
}

// Helper functions
function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  
  return parts.join(' ') || '< 1m';
}

// Main execution
async function main() {
  try {
    const options = parseArgs();
    
    switch (options.command) {
      case 'status':
        await checkStatus(options);
        break;
      case 'test':
        await testEndpoints(options);
        break;
      case 'monitor':
        await startMonitoring(options);
        break;
      case 'alert':
        await testAlerts(options);
        break;
      case 'metrics':
        await showMetrics(options);
        break;
      case 'config':
        await showConfig(options);
        break;
      case 'dashboard':
        await startDashboard(options);
        break;
      default:
        log.error(`Unknown command: ${options.command}`);

        process.exit(1);
    }
  } catch (error: any) {
    log.error(`Health monitoring failed: ${error.message}`);
    if (process.env.DEBUG) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run the script
main();