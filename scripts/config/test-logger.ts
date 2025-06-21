/**
 * Test Logger Configuration
 * Sends test logs to Docker logging service for centralized monitoring
 */

import chalk from 'chalk';

interface LogContext {
  testFile?: string;
  testSuite?: string;
  testCase?: string;
  duration?: number;
  status?: 'pass' | 'fail' | 'skip';
  error?: any;
}

class TestLogger {
  private loggingServiceUrl: string;
  private enabled: boolean;
  private testRunId: string;
  
  constructor() {
    // Check if logging service is available
    this.loggingServiceUrl = process.env.LOGGING_SERVICE_URL || 'http://localhost:3003';
    this.enabled = process.env.ENABLE_TEST_LOGGING !== 'false';
    this.testRunId = `test-run-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    if (this.enabled) {
      this.checkLoggingService();
    }
  }

  private async checkLoggingService() {
    try {
      const response = await fetch(`${this.loggingServiceUrl}/health`);
      if (response.ok) {

      } else {
        console.warn(chalk.yellow('⚠️ Logging service not healthy'));
        this.enabled = false;
      }
    } catch (error) {
      console.warn(chalk.yellow('⚠️ Logging service not available'));
      this.enabled = false;
    }
  }

  private async sendLog(logData: any) {
    if (!this.enabled) return;
    
    try {
      await fetch(`${this.loggingServiceUrl}/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...logData,
          testRunId: this.testRunId,
          timestamp: new Date().toISOString(),
          environment: 'test',
        }),
      });
    } catch (error) {
      // Silently fail to not disrupt tests
    }
  }

  // Log test suite start
  async logSuiteStart(suiteName: string) {

    await this.sendLog({
      level: 'info',
      service: 'test-runner',
      category: 'test-suite',
      message: `Test suite started: ${suiteName}`,
      metadata: {
        suiteName,
        event: 'suite-start',
      },
    });
  }

  // Log test case
  async logTest(testName: string, context: LogContext) {
    const { status, duration, error } = context;
    const statusEmoji = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⏭️';
    const statusColor = status === 'pass' ? 'green' : status === 'fail' ? 'red' : 'gray';

    if (error) {

    }
    
    await this.sendLog({
      level: status === 'fail' ? 'error' : 'info',
      service: 'test-runner',
      category: 'test-case',
      message: `Test ${status}: ${testName}`,
      metadata: {
        testName,
        status,
        duration,
        error: error ? {
          message: error.message,
          stack: error.stack,
        } : undefined,
      },
    });
  }

  // Log test suite end
  async logSuiteEnd(suiteName: string, summary: { passed: number; failed: number; skipped: number; duration: number }) {
    const { passed, failed, skipped, duration } = summary;
    const total = passed + failed + skipped;

    if (failed > 0) {}
    if (skipped > 0) {}

    await this.sendLog({
      level: failed > 0 ? 'warn' : 'info',
      service: 'test-runner',
      category: 'test-suite',
      message: `Test suite completed: ${suiteName}`,
      metadata: {
        suiteName,
        event: 'suite-end',
        summary,
      },
    });
  }

  // Log script execution
  async logScriptExecution(scriptPath: string, args: string[], result: { success: boolean; output?: string; error?: any }) {
    const scriptName = scriptPath.split('/').pop() || scriptPath;

    if (result.success) {

      if (result.output) {

      }
    } else {

      if (result.error) {

      }
    }
    
    await this.sendLog({
      level: result.success ? 'info' : 'error',
      service: 'test-runner',
      category: 'script-execution',
      message: `Script ${result.success ? 'executed' : 'failed'}: ${scriptName}`,
      metadata: {
        scriptPath,
        args,
        success: result.success,
        output: result.output?.substring(0, 1000), // Limit output size
        error: result.error ? {
          message: result.error.message,
          stack: result.error.stack,
        } : undefined,
      },
    });
  }

  // Log database operations during tests
  async logDatabaseOperation(operation: string, details: any) {
    await this.sendLog({
      level: 'debug',
      service: 'test-runner',
      category: 'database',
      message: `Database operation: ${operation}`,
      metadata: {
        operation,
        ...details,
      },
    });
  }

  // Get test run summary
  async logTestRunComplete(summary: { totalSuites: number; totalTests: number; passed: number; failed: number; duration: number }) {

    if (summary.failed > 0) {

    }

    await this.sendLog({
      level: summary.failed > 0 ? 'error' : 'info',
      service: 'test-runner',
      category: 'test-run',
      message: `Test run completed: ${summary.passed} passed, ${summary.failed} failed`,
      metadata: {
        event: 'test-run-complete',
        summary,
      },
    });
  }
}

// Export singleton instance
export const testLogger = new TestLogger();

// Helper function to wrap test execution with logging
export async function runTestWithLogging<T>(
  testName: string,
  testFn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  try {
    const result = await testFn();
    await testLogger.logTest(testName, {
      status: 'pass',
      duration: Date.now() - startTime,
    });
    return result;
  } catch (error) {
    await testLogger.logTest(testName, {
      status: 'fail',
      duration: Date.now() - startTime,
      error,
    });
    throw error;
  }
}

// Helper to intercept console logs during tests
export function interceptConsoleForTests() {
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;
  
  console.log = (...args) => {
    originalLog(...args);
    testLogger.sendLog({
      level: 'debug',
      service: 'test-console',
      category: 'console',
      message: args.join(' '),
      metadata: { type: 'log' },
    });
  };
  
  console.error = (...args) => {
    originalError(...args);
    testLogger.sendLog({
      level: 'error',
      service: 'test-console',
      category: 'console',
      message: args.join(' '),
      metadata: { type: 'error' },
    });
  };
  
  console.warn = (...args) => {
    originalWarn(...args);
    testLogger.sendLog({
      level: 'warn',
      service: 'test-console',
      category: 'console',
      message: args.join(' '),
      metadata: { type: 'warn' },
    });
  };
  
  return () => {
    console.log = originalLog;
    console.error = originalError;
    console.warn = originalWarn;
  };
}