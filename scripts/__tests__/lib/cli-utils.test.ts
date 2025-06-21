/**
 * Unit tests for CLI utilities
 */

import { describe, it, expect, vi } from 'vitest';
import {
  parseArgs,
  requireArgs,
  formatDuration,
  measureTime
} from '../../lib/cli-utils';
import { ValidationError } from '../../lib/error-handler';

describe('parseArgs', () => {
  it('should parse long options with values', () => {
    const args = parseArgs(['--name', 'John', '--age', '30']);
    
    expect(args).toEqual({
      _: [],
      name: 'John',
      age: 30
    });
  });
  
  it('should parse long options with equals sign', () => {
    const args = parseArgs(['--name=John', '--age=30']);
    
    expect(args).toEqual({
      _: [],
      name: 'John',
      age: 30
    });
  });
  
  it('should parse boolean flags', () => {
    const args = parseArgs(['--verbose', '--force']);
    
    expect(args).toEqual({
      _: [],
      verbose: true,
      force: true
    });
  });
  
  it('should parse short options', () => {
    const args = parseArgs(['-v', '-f', '-n', 'test']);
    
    expect(args).toEqual({
      _: [],
      v: true,
      f: true,
      n: 'test'
    });
  });
  
  it('should parse multiple short flags', () => {
    const args = parseArgs(['-vfd']);
    
    expect(args).toEqual({
      _: [],
      v: true,
      f: true,
      d: true
    });
  });
  
  it('should parse positional arguments', () => {
    const args = parseArgs(['create', 'user', '--name', 'John']);
    
    expect(args).toEqual({
      _: ['create', 'user'],
      name: 'John'
    });
  });
  
  it('should parse boolean values correctly', () => {
    const args = parseArgs(['--enabled=true', '--disabled=false']);
    
    expect(args).toEqual({
      _: [],
      enabled: true,
      disabled: false
    });
  });
  
  it('should parse comma-separated arrays', () => {
    const args = parseArgs(['--tags=one,two,three']);
    
    expect(args).toEqual({
      _: [],
      tags: ['one', 'two', 'three']
    });
  });
  
  it('should handle empty arguments', () => {
    const args = parseArgs([]);
    
    expect(args).toEqual({ _: [] });
  });
});

describe('requireArgs', () => {
  it('should pass when all required args are present', () => {
    const args = { _: [], name: 'John', age: 30 };
    
    expect(() => requireArgs(args, ['name', 'age'])).not.toThrow();
  });
  
  it('should throw when required args are missing', () => {
    const args = { _: [], name: 'John' };
    
    expect(() => requireArgs(args, ['name', 'age'])).toThrow(ValidationError);
  });
  
  it('should include usage in error message', () => {
    const args = { _: [] };
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation();
    
    try {
      requireArgs(args, ['name'], 'script --name <name>');
    } catch {
      // Expected
    }
    
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('script --name <name>')
    );
  });
});

describe('formatDuration', () => {
  it('should format milliseconds', () => {
    expect(formatDuration(500)).toBe('500ms');
    expect(formatDuration(999)).toBe('999ms');
  });
  
  it('should format seconds', () => {
    expect(formatDuration(1000)).toBe('1.0s');
    expect(formatDuration(1500)).toBe('1.5s');
    expect(formatDuration(59999)).toBe('60.0s');
  });
  
  it('should format minutes and seconds', () => {
    expect(formatDuration(60000)).toBe('1m 0s');
    expect(formatDuration(90000)).toBe('1m 30s');
    expect(formatDuration(3599000)).toBe('59m 59s');
  });
  
  it('should format hours and minutes', () => {
    expect(formatDuration(3600000)).toBe('1h 0m');
    expect(formatDuration(5400000)).toBe('1h 30m');
    expect(formatDuration(7260000)).toBe('2h 1m');
  });
});

describe('measureTime', () => {
  it('should measure execution time', async () => {
    const fn = vi.fn().mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
      return 'result';
    });
    
    const result = await measureTime('Test operation', fn);
    
    expect(result).toBe('result');
    expect(fn).toHaveBeenCalledTimes(1);
  });
  
  it('should log duration on success', async () => {
    const loggerSpy = vi.spyOn(console, 'error').mockImplementation();
    
    await measureTime('Test', async () => 'done');
    
    // Logger.debug outputs to console.error in test env
    expect(loggerSpy).toHaveBeenCalledWith(
      expect.stringContaining('Test completed in')
    );
  });
  
  it('should log duration on failure', async () => {
    const loggerSpy = vi.spyOn(console, 'error').mockImplementation();
    
    try {
      await measureTime('Test', async () => {
        throw new Error('fail');
      });
    } catch {
      // Expected
    }
    
    expect(loggerSpy).toHaveBeenCalledWith(
      expect.stringContaining('Test failed after')
    );
  });
  
  it('should rethrow errors', async () => {
    const error = new Error('Test error');
    
    await expect(
      measureTime('Test', async () => {
        throw error;
      })
    ).rejects.toThrow('Test error');
  });
});