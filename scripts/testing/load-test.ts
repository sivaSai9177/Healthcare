#!/usr/bin/env bun
/**
 * Load Testing Script for Healthcare Alert System
 * Tests API performance under various load conditions
 */

import chalk from 'chalk';
import fetch from 'node-fetch';
import { performance } from 'perf_hooks';
import { writeFileSync } from 'fs';

// Simple logger
const log = {
  info: (msg: string) => console.log(msg),
  success: (msg: string) => console.log(msg),
  error: (msg: string) => console.log(msg),
  warn: (msg: string) => console.log(msg),
  debug: (msg: string) => process.env.DEBUG && console.log(msg),
};

interface LoadTestConfig {
  baseUrl: string;
  duration: number; // seconds
  concurrentUsers: number;
  rampUpTime: number; // seconds
  scenarios: TestScenario[];
}

interface TestScenario {
  name: string;
  weight: number; // percentage
  steps: TestStep[];
}

interface TestStep {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  headers?: Record<string, string>;
  body?: any;
  think?: number; // milliseconds
}

interface TestResult {
  scenario: string;
  step: string;
  duration: number;
  status: number;
  error?: string;
  timestamp: number;
}

interface TestSummary {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  requestsPerSecond: number;
  percentiles: {
    p50: number;
    p90: number;
    p95: number;
    p99: number;
  };
  errorRate: number;
  scenarios: Record<string, ScenarioStats>;
}

interface ScenarioStats {
  count: number;
  avgDuration: number;
  errors: number;
}

// Test configuration
const config: LoadTestConfig = {
  baseUrl: process.env.LOAD_TEST_URL || 'http://localhost:8081',
  duration: parseInt(process.env.LOAD_TEST_DURATION || '60'), // 1 minute default
  concurrentUsers: parseInt(process.env.LOAD_TEST_USERS || '10'),
  rampUpTime: parseInt(process.env.LOAD_TEST_RAMP || '10'),
  scenarios: [
    {
      name: 'Browse Alerts',
      weight: 40,
      steps: [
        { method: 'GET', path: '/api/health' },
        { method: 'POST', path: '/api/auth/sign-in/email', body: { email: 'test@example.com', password: 'password123' } },
        { method: 'GET', path: '/api/trpc/alert.list', think: 2000 },
        { method: 'GET', path: '/api/trpc/alert.getActive', think: 1000 },
      ],
    },
    {
      name: 'Create Alert',
      weight: 30,
      steps: [
        { method: 'POST', path: '/api/auth/sign-in/email', body: { email: 'nurse@hospital.com', password: 'password123' } },
        {
          method: 'POST',
          path: '/api/trpc/alert.create',
          body: {
            patientId: 'test-patient-1',
            type: 'CRITICAL',
            message: 'Load test alert',
            priority: 'HIGH',
          },
          think: 3000,
        },
      ],
    },
    {
      name: 'Dashboard Load',
      weight: 20,
      steps: [
        { method: 'POST', path: '/api/auth/sign-in/email', body: { email: 'doctor@hospital.com', password: 'password123' } },
        { method: 'GET', path: '/api/trpc/dashboard.getStats' },
        { method: 'GET', path: '/api/trpc/patient.list' },
        { method: 'GET', path: '/api/trpc/alert.getRecent', think: 5000 },
      ],
    },
    {
      name: 'Health Check',
      weight: 10,
      steps: [{ method: 'GET', path: '/api/health', think: 1000 }],
    },
  ],
};

// Store results
const results: TestResult[] = [];
let isRunning = true;
let startTime: number;

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(0);
  }
  
  // Override config with command line args
  const urlIndex = args.findIndex(arg => arg.startsWith('--url='));
  if (urlIndex !== -1) {
    config.baseUrl = args[urlIndex].split('=')[1];
  }
  
  const durationIndex = args.findIndex(arg => arg.startsWith('--duration='));
  if (durationIndex !== -1) {
    config.duration = parseInt(args[durationIndex].split('=')[1]);
  }
  
  const usersIndex = args.findIndex(arg => arg.startsWith('--users='));
  if (usersIndex !== -1) {
    config.concurrentUsers = parseInt(args[usersIndex].split('=')[1]);
  }
}

function printHelp() {

}

// Execute a single test step
async function executeStep(scenario: string, step: TestStep, authToken?: string): Promise<TestResult> {
  const startTime = performance.now();
  const url = `${config.baseUrl}${step.path}`;
  
  try {
    const headers: any = {
      'Content-Type': 'application/json',
      ...step.headers,
    };
    
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const response = await fetch(url, {
      method: step.method,
      headers,
      body: step.body ? JSON.stringify(step.body) : undefined,
      timeout: 30000, // 30 second timeout
    });
    
    const duration = performance.now() - startTime;
    
    return {
      scenario,
      step: `${step.method} ${step.path}`,
      duration,
      status: response.status,
      timestamp: Date.now(),
    };
  } catch (error) {
    const duration = performance.now() - startTime;
    
    return {
      scenario,
      step: `${step.method} ${step.path}`,
      duration,
      status: 0,
      error: error.message,
      timestamp: Date.now(),
    };
  }
}

// Run a single scenario
async function runScenario(scenario: TestScenario) {
  let authToken: string | undefined;
  
  for (const step of scenario.steps) {
    if (!isRunning) break;
    
    const result = await executeStep(scenario.name, step, authToken);
    results.push(result);
    
    // Extract auth token if this was a login step
    if (step.path.includes('sign-in') && result.status === 200) {
      // In real implementation, extract token from response
      authToken = 'mock-auth-token';
    }
    
    // Think time
    if (step.think && isRunning) {
      await new Promise(resolve => setTimeout(resolve, step.think));
    }
  }
}

// Virtual user simulation
async function virtualUser(userId: number) {
  // Delay start for ramp-up
  const rampDelay = (config.rampUpTime * 1000 * userId) / config.concurrentUsers;
  await new Promise(resolve => setTimeout(resolve, rampDelay));
  
  log.debug(`User ${userId} started`);
  
  while (isRunning) {
    // Select scenario based on weight
    const random = Math.random() * 100;
    let weightSum = 0;
    
    for (const scenario of config.scenarios) {
      weightSum += scenario.weight;
      if (random <= weightSum) {
        await runScenario(scenario);
        break;
      }
    }
  }
  
  log.debug(`User ${userId} finished`);
}

// Calculate statistics
function calculateStats(): TestSummary {
  const successfulResults = results.filter(r => r.status >= 200 && r.status < 400);
  const failedResults = results.filter(r => r.status === 0 || r.status >= 400);
  
  const durations = results.map(r => r.duration).sort((a, b) => a - b);
  const totalDuration = (Date.now() - startTime) / 1000; // seconds
  
  // Calculate percentiles
  const getPercentile = (arr: number[], p: number) => {
    const index = Math.ceil((p / 100) * arr.length) - 1;
    return arr[index] || 0;
  };
  
  // Group by scenario
  const scenarioStats: Record<string, ScenarioStats> = {};
  for (const scenario of config.scenarios) {
    const scenarioResults = results.filter(r => r.scenario === scenario.name);
    const scenarioErrors = scenarioResults.filter(r => r.error || r.status >= 400);
    
    scenarioStats[scenario.name] = {
      count: scenarioResults.length,
      avgDuration: scenarioResults.reduce((sum, r) => sum + r.duration, 0) / scenarioResults.length || 0,
      errors: scenarioErrors.length,
    };
  }
  
  return {
    totalRequests: results.length,
    successfulRequests: successfulResults.length,
    failedRequests: failedResults.length,
    averageResponseTime: durations.reduce((sum, d) => sum + d, 0) / durations.length || 0,
    minResponseTime: Math.min(...durations) || 0,
    maxResponseTime: Math.max(...durations) || 0,
    requestsPerSecond: results.length / totalDuration,
    percentiles: {
      p50: getPercentile(durations, 50),
      p90: getPercentile(durations, 90),
      p95: getPercentile(durations, 95),
      p99: getPercentile(durations, 99),
    },
    errorRate: (failedResults.length / results.length) * 100 || 0,
    scenarios: scenarioStats,
  };
}

// Display real-time stats
function displayStats() {
  const stats = calculateStats();
  
  console.clear();

  for (const [name, stats] of Object.entries(stats.scenarios)) {
    const errorRate = (stats.errors / stats.count) * 100 || 0;

  }
}

// Generate final report
function generateReport() {
  const stats = calculateStats();
  const report = {
    configuration: {
      baseUrl: config.baseUrl,
      duration: config.duration,
      concurrentUsers: config.concurrentUsers,
      rampUpTime: config.rampUpTime,
      scenarios: config.scenarios.map(s => ({ name: s.name, weight: s.weight })),
    },
    summary: stats,
    startTime: new Date(startTime).toISOString(),
    endTime: new Date().toISOString(),
    rawResults: results.slice(0, 1000), // First 1000 results for analysis
  };
  
  const filename = `load-test-report-${new Date().toISOString().replace(/:/g, '-')}.json`;
  writeFileSync(filename, JSON.stringify(report, null, 2));

  // Performance assessment
  if (stats.errorRate > 5) {
    log.error('High error rate detected. System may be overloaded.');
  } else if (stats.errorRate > 1) {
    log.warn('Some errors detected. Monitor system performance.');
  } else {
    log.success('Error rate within acceptable limits.');
  }
  
  if (stats.percentiles.p95 > 1000) {
    log.warn('95th percentile response time exceeds 1 second.');
  } else {
    log.success('Response times are good.');
  }

  log.success(`Report saved: ${filename}`);
}

// Main execution
async function main() {
  parseArgs();

  log.info(`Target: ${config.baseUrl}`);
  log.info(`Duration: ${config.duration} seconds`);
  log.info(`Virtual Users: ${config.concurrentUsers}`);
  log.info(`Ramp Up: ${config.rampUpTime} seconds`);

  // Verify target is accessible
  try {
    const healthCheck = await fetch(`${config.baseUrl}/api/health`);
    if (!healthCheck.ok) {
      log.error('Target server is not healthy');
      process.exit(1);
    }
    log.success('Target server is accessible');
  } catch (error) {
    log.error(`Cannot reach target: ${error.message}`);
    process.exit(1);
  }

  log.info('Starting load test...');

  startTime = Date.now();
  
  // Start virtual users
  const userPromises: Promise<void>[] = [];
  for (let i = 0; i < config.concurrentUsers; i++) {
    userPromises.push(virtualUser(i));
  }
  
  // Display stats every second
  const statsInterval = setInterval(() => {
    if (isRunning) {
      displayStats();
    }
  }, 1000);
  
  // Run for specified duration
  setTimeout(() => {
    isRunning = false;
    clearInterval(statsInterval);
  }, config.duration * 1000);
  
  // Wait for all users to finish
  await Promise.all(userPromises);
  
  // Generate final report
  generateReport();
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  log.warn('\nStopping load test...');
  isRunning = false;
});

// Run the script
main().catch(error => {
  log.error(`Load test failed: ${error}`);
  process.exit(1);
});