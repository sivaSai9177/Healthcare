#!/usr/bin/env bun
import { db } from '@/src/db';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'unhealthy' | 'warning';
  message: string;
  details?: any;
}

const results: HealthCheckResult[] = [];

// ANSI escape codes for colors
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m',
};

function log(message: string, color?: keyof typeof colors) {
  if (color) {

  } else {

  }
}

async function checkPostgreSQL(): Promise<void> {
  log('\n🔍 Checking PostgreSQL...', 'yellow');
  try {
    const result = await db.execute('SELECT 1');
    results.push({
      service: 'PostgreSQL',
      status: 'healthy',
      message: 'Database connection successful',
    });
    log('✅ PostgreSQL is healthy', 'green');
  } catch (error) {
    results.push({
      service: 'PostgreSQL',
      status: 'unhealthy',
      message: 'Database connection failed',
      details: error,
    });
    log('❌ PostgreSQL is unhealthy', 'red');
  }
}

async function checkRedis(): Promise<void> {
  log('\n🔍 Checking Redis...', 'yellow');
  try {
    const { stdout } = await execAsync('redis-cli ping');
    if (stdout.trim() === 'PONG') {
      results.push({
        service: 'Redis',
        status: 'healthy',
        message: 'Redis is responding',
      });
      log('✅ Redis is healthy', 'green');
    } else {
      throw new Error('Unexpected response from Redis');
    }
  } catch (error) {
    results.push({
      service: 'Redis',
      status: 'unhealthy',
      message: 'Redis connection failed',
      details: error,
    });
    log('❌ Redis is unhealthy', 'red');
  }
}

async function checkWebSocketServer(): Promise<void> {
  log('\n🔍 Checking WebSocket Server...', 'yellow');
  try {
    const response = await fetch('http://localhost:3002/health');
    if (response.ok) {
      const data = await response.json();
      results.push({
        service: 'WebSocket Server',
        status: 'healthy',
        message: 'WebSocket server is running',
        details: data,
      });
      log('✅ WebSocket Server is healthy', 'green');
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    // Check if it's just not running
    try {
      await execAsync('lsof -i :3002');
      results.push({
        service: 'WebSocket Server',
        status: 'warning',
        message: 'Port 3002 is in use but health check failed',
        details: error,
      });
      log('⚠️  WebSocket Server health check failed', 'yellow');
    } catch {
      results.push({
        service: 'WebSocket Server',
        status: 'unhealthy',
        message: 'WebSocket server is not running',
        details: error,
      });
      log('❌ WebSocket Server is not running', 'red');
    }
  }
}

async function checkEmailService(): Promise<void> {
  log('\n🔍 Checking Email Service...', 'yellow');
  try {
    const response = await fetch('http://localhost:3005/health');
    if (response.ok) {
      results.push({
        service: 'Email Service',
        status: 'healthy',
        message: 'Email service is running',
      });
      log('✅ Email Service is healthy', 'green');
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    results.push({
      service: 'Email Service',
      status: 'warning',
      message: 'Email service is not running (optional)',
      details: error,
    });
    log('⚠️  Email Service is not running (optional)', 'yellow');
  }
}

async function checkTRPCAPI(): Promise<void> {
  log('\n🔍 Checking TRPC API...', 'yellow');
  try {
    const response = await fetch('http://localhost:3000/api/health');
    if (response.ok) {
      results.push({
        service: 'TRPC API',
        status: 'healthy',
        message: 'API is responding',
      });
      log('✅ TRPC API is healthy', 'green');
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    results.push({
      service: 'TRPC API',
      status: 'unhealthy',
      message: 'API is not responding',
      details: error,
    });
    log('❌ TRPC API is unhealthy', 'red');
  }
}

async function checkDiskSpace(): Promise<void> {
  log('\n🔍 Checking Disk Space...', 'yellow');
  try {
    const { stdout } = await execAsync('df -h /');
    const lines = stdout.split('\n');
    const dataLine = lines[1];
    const usageMatch = dataLine.match(/(\d+)%/);
    
    if (usageMatch) {
      const usage = parseInt(usageMatch[1]);
      if (usage > 90) {
        results.push({
          service: 'Disk Space',
          status: 'warning',
          message: `Disk usage is high: ${usage}%`,
          details: { usage },
        });
        log(`⚠️  Disk usage is high: ${usage}%`, 'yellow');
      } else {
        results.push({
          service: 'Disk Space',
          status: 'healthy',
          message: `Disk usage is normal: ${usage}%`,
          details: { usage },
        });
        log(`✅ Disk usage is normal: ${usage}%`, 'green');
      }
    }
  } catch (error) {
    results.push({
      service: 'Disk Space',
      status: 'warning',
      message: 'Could not check disk space',
      details: error,
    });
    log('⚠️  Could not check disk space', 'yellow');
  }
}

async function checkMemoryUsage(): Promise<void> {
  log('\n🔍 Checking Memory Usage...', 'yellow');
  try {
    const { stdout } = await execAsync('free -m');
    const lines = stdout.split('\n');
    const memLine = lines[1];
    const parts = memLine.split(/\s+/);
    const total = parseInt(parts[1]);
    const used = parseInt(parts[2]);
    const usage = Math.round((used / total) * 100);
    
    if (usage > 90) {
      results.push({
        service: 'Memory',
        status: 'warning',
        message: `Memory usage is high: ${usage}%`,
        details: { total, used, usage },
      });
      log(`⚠️  Memory usage is high: ${usage}%`, 'yellow');
    } else {
      results.push({
        service: 'Memory',
        status: 'healthy',
        message: `Memory usage is normal: ${usage}%`,
        details: { total, used, usage },
      });
      log(`✅ Memory usage is normal: ${usage}%`, 'green');
    }
  } catch (error) {
    results.push({
      service: 'Memory',
      status: 'warning',
      message: 'Could not check memory usage',
      details: error,
    });
    log('⚠️  Could not check memory usage', 'yellow');
  }
}

async function runHealthChecks(): Promise<void> {
  log('\n🏥 Healthcare System Health Check', 'yellow');
  log('================================\n', 'yellow');

  // Run all health checks
  await checkPostgreSQL();
  await checkRedis();
  await checkWebSocketServer();
  await checkEmailService();
  await checkTRPCAPI();
  await checkDiskSpace();
  await checkMemoryUsage();

  // Summary
  log('\n📊 Health Check Summary', 'yellow');
  log('======================\n', 'yellow');

  const healthy = results.filter(r => r.status === 'healthy').length;
  const unhealthy = results.filter(r => r.status === 'unhealthy').length;
  const warnings = results.filter(r => r.status === 'warning').length;

  log(`✅ Healthy: ${healthy}`, 'green');
  log(`❌ Unhealthy: ${unhealthy}`, 'red');
  log(`⚠️  Warnings: ${warnings}`, 'yellow');

  // Detailed results
  log('\n📋 Detailed Results:', 'yellow');
  results.forEach(result => {
    const icon = result.status === 'healthy' ? '✅' : result.status === 'unhealthy' ? '❌' : '⚠️';
    const color = result.status === 'healthy' ? 'green' : result.status === 'unhealthy' ? 'red' : 'yellow';
    log(`\n${icon} ${result.service}`, color);
    log(`   Status: ${result.status}`);
    log(`   Message: ${result.message}`);
    if (result.details) {
      log(`   Details: ${JSON.stringify(result.details, null, 2)}`);
    }
  });

  // Exit code based on results
  if (unhealthy > 0) {
    log('\n❌ System health check failed!', 'red');
    process.exit(1);
  } else if (warnings > 0) {
    log('\n⚠️  System has warnings but is operational', 'yellow');
    process.exit(0);
  } else {
    log('\n✅ All systems are healthy!', 'green');
    process.exit(0);
  }
}

// Run health checks
runHealthChecks().catch(error => {
  log('\n❌ Health check script failed:', 'red');
  console.error(error);
  process.exit(1);
});