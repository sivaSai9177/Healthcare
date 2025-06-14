#!/usr/bin/env bun

/**
 * Test script for window logger functionality
 * Run this to verify the module logger is working correctly
 */

import { getModuleLogger, windowDebugger } from '../lib/core/debug/window-logger';

// Test basic module logger
console.log('=== Testing Module Logger ===\n');

const testLogger = getModuleLogger('TestModule');

// Test all log levels
testLogger.info('This is an info message');
testLogger.debug('This is a debug message', { data: 'test data' });
testLogger.warn('This is a warning message');
testLogger.error('This is an error message', new Error('Test error'));

// Test timing
testLogger.time('test-operation');
setTimeout(() => {
  testLogger.timeEnd('test-operation');
}, 100);

// Test grouping
testLogger.group('Test Group');
testLogger.info('Message inside group');
testLogger.debug('Debug inside group');
testLogger.groupEnd();

// Test window debugger API
console.log('\n=== Testing Window Debugger API ===\n');

// List modules
console.log('Registered modules:', windowDebugger.listModules());

// Test enabling/disabling
windowDebugger.disableModule('TestModule');
testLogger.info('This should not appear (module disabled)');

windowDebugger.enableModule('TestModule');
testLogger.info('This should appear (module re-enabled)');

// Test log history
console.log('\nLog history count:', windowDebugger.getHistory().length);
console.log('Error count:', windowDebugger.getErrors().length);

// Export logs
const exportedLogs = windowDebugger.exportHistory();
console.log('\nExported logs preview:');
console.log(exportedLogs.split('\n').slice(0, 5).join('\n'));
console.log('...');

console.log('\n✅ Window logger test complete!');
console.log('In the browser, you can access the debugger via: window.debugger');
console.log('Try: window.debugger.help()');

// Keep process alive briefly for async operations
setTimeout(() => {
  process.exit(0);
}, 200);