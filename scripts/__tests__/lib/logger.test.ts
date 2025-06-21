/**
 * Unit tests for Logger utility
 */

import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test';
import { Logger, createLogger } from '../../lib/logger';
import { COLORS, EMOJI } from '../../config/constants';

describe('Logger', () => {
  let consoleSpy: any;
  let originalLog: any;
  let originalError: any;
  
  beforeEach(() => {
    originalLog = console.log;
    originalError = console.error;
    
    consoleSpy = {
      log: mock(() => {}),
      error: mock(() => {}),
    };
    
    console.log = consoleSpy.log;
    console.error = consoleSpy.error;
  });
  
  afterEach(() => {
    console.log = originalLog;
    console.error = originalError;
  });
  
  describe('Basic logging', () => {
    it('should log info messages', () => {
      const logger = new Logger({ name: 'Test' });
      logger.info('Test message');
      
      expect(consoleSpy.log).toHaveBeenCalled();
      const output = consoleSpy.log.mock.calls[0][0];
      expect(output).toContain('Test message');
      expect(output).toContain('[Test]');
      expect(output).toContain('[INFO]');
    });
    
    it('should log error messages to console.error', () => {
      const logger = new Logger({ name: 'Test' });
      logger.error('Error message');
      
      expect(consoleSpy.error).toHaveBeenCalled();
      const output = consoleSpy.error.mock.calls[0][0];
      expect(output).toContain('Error message');
      expect(output).toContain('[ERROR]');
    });
    
    it('should respect log levels', () => {
      const logger = new Logger({ name: 'Test', level: 'WARN' });
      
      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warn message');
      logger.error('Error message');
      
      expect(consoleSpy.log).toHaveBeenCalledTimes(1); // Only warn
      expect(consoleSpy.error).toHaveBeenCalledTimes(1); // Only error
    });
  });
  
  describe('Formatting', () => {
    it('should include timestamps', () => {
      const logger = new Logger({ name: 'Test' });
      logger.info('Test');
      
      const output = consoleSpy.log.mock.calls[0][0];
      const isoDatePattern = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
      expect(output).toMatch(isoDatePattern);
    });
    
    it('should format data as JSON', () => {
      const logger = new Logger({ name: 'Test' });
      const data = { foo: 'bar', count: 42 };
      
      logger.info('Test with data', data);
      
      const output = consoleSpy.log.mock.calls[0][0];
      expect(output).toContain('"foo": "bar"');
      expect(output).toContain('"count": 42');
    });
    
    it('should apply colors based on level', () => {
      const logger = new Logger({ name: 'Test' });
      
      logger.info('Info');
      logger.warn('Warn');
      logger.error('Error');
      
      const infoOutput = consoleSpy.log.mock.calls[0][0];
      const warnOutput = consoleSpy.log.mock.calls[1][0];
      const errorOutput = consoleSpy.error.mock.calls[0][0];
      
      expect(infoOutput).toContain(COLORS.blue);
      expect(warnOutput).toContain(COLORS.yellow);
      expect(errorOutput).toContain(COLORS.red);
    });
  });
  
  describe('Special methods', () => {
    it('should show success messages with emoji', () => {
      const logger = new Logger({ name: 'Test' });
      logger.success('Operation completed');
      
      const output = consoleSpy.log.mock.calls[0][0];
      expect(output).toContain(EMOJI.success);
      expect(output).toContain('Operation completed');
      expect(output).toContain(COLORS.green);
    });
    
    it('should show loading messages', () => {
      const logger = new Logger({ name: 'Test' });
      logger.loading('Processing...');
      
      const output = consoleSpy.log.mock.calls[0][0];
      expect(output).toContain(EMOJI.loading);
      expect(output).toContain('Processing...');
    });
    
    it('should create progress bars', () => {
      const logger = new Logger({ name: 'Test' });
      
      // Mock process.stdout.write
      const originalWrite = process.stdout.write;
      const writeSpy = mock(() => {});
      process.stdout.write = writeSpy as any;
      
      logger.progress(50, 100, 'Half way');
      
      expect(writeSpy).toHaveBeenCalled();
      const output = writeSpy.mock.calls[0][0] as string;
      expect(output).toContain('50%');
      expect(output).toContain('Half way');
      
      // Restore
      process.stdout.write = originalWrite;
    });
    
    it('should draw separators', () => {
      const logger = new Logger({ name: 'Test' });
      logger.separator('-', 10);
      
      const output = consoleSpy.log.mock.calls[0][0];
      expect(output).toContain('----------');
    });
    
    it('should draw boxes', () => {
      const logger = new Logger({ name: 'Test' });
      logger.box('Title\nContent');
      
      expect(consoleSpy.log).toHaveBeenCalledTimes(4); // Top, 2 lines, bottom
      const calls = consoleSpy.log.mock.calls.map(c => c[0]);
      
      expect(calls[0]).toContain('┌');
      expect(calls[1]).toContain('│ Title');
      expect(calls[2]).toContain('│ Content');
      expect(calls[3]).toContain('└');
    });
    
    it('should format tables', () => {
      const logger = new Logger({ name: 'Test' });
      logger.table(
        ['Name', 'Age'],
        [['Alice', '30'], ['Bob', '25']]
      );
      
      const calls = consoleSpy.log.mock.calls;
      expect(calls.length).toBeGreaterThan(3);
      
      // Check header
      expect(calls[1][0]).toContain('Name');
      expect(calls[1][0]).toContain('Age');
      
      // Check data
      expect(calls[3][0]).toContain('Alice');
      expect(calls[3][0]).toContain('30');
    });
  });
  
  describe('Factory function', () => {
    it('should create logger instances with options', () => {
      const logger = createLogger({
        name: 'CustomLogger',
        level: 'DEBUG'
      });
      
      logger.debug('Debug message');
      
      expect(consoleSpy.log).toHaveBeenCalled();
      const output = consoleSpy.log.mock.calls[0][0];
      expect(output).toContain('[CustomLogger]');
      expect(output).toContain('[DEBUG]');
    });
  });
});