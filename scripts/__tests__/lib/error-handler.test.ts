/**
 * Unit tests for Error Handler utility
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ScriptError,
  ValidationError,
  ConnectionError,
  PermissionError,
  NotFoundError,
  handleError,
  withErrorHandler,
  tryOrExit,
  retry,
  assert,
  assertDefined
} from '../../lib/error-handler';
import { EXIT_CODES } from '../../config/constants';

describe('Error Classes', () => {
  it('should create ScriptError with correct properties', () => {
    const error = new ScriptError('Test error', 'GENERAL_ERROR', { foo: 'bar' });
    
    expect(error.message).toBe('Test error');
    expect(error.code).toBe('GENERAL_ERROR');
    expect(error.details).toEqual({ foo: 'bar' });
    expect(error.name).toBe('ScriptError');
  });
  
  it('should create ValidationError', () => {
    const error = new ValidationError('Invalid input');
    
    expect(error.message).toBe('Invalid input');
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.name).toBe('ValidationError');
  });
  
  it('should create ConnectionError', () => {
    const error = new ConnectionError('Connection failed');
    
    expect(error.code).toBe('CONNECTION_ERROR');
  });
  
  it('should create PermissionError', () => {
    const error = new PermissionError('Access denied');
    
    expect(error.code).toBe('PERMISSION_ERROR');
  });
  
  it('should create NotFoundError', () => {
    const error = new NotFoundError('Resource not found');
    
    expect(error.code).toBe('NOT_FOUND');
  });
});

describe('handleError', () => {
  let processExitSpy: any;
  let consoleErrorSpy: any;
  
  beforeEach(() => {
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation();
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  it('should handle ScriptError with correct exit code', () => {
    const error = new ScriptError('Test', 'VALIDATION_ERROR');
    
    expect(() => handleError(error)).toThrow('process.exit called');
    expect(processExitSpy).toHaveBeenCalledWith(EXIT_CODES.VALIDATION_ERROR);
  });
  
  it('should handle standard Error', () => {
    const error = new Error('Standard error');
    
    expect(() => handleError(error)).toThrow('process.exit called');
    expect(processExitSpy).toHaveBeenCalledWith(EXIT_CODES.GENERAL_ERROR);
  });
  
  it('should determine exit code from error message', () => {
    const connectionError = new Error('Connection timeout');
    
    expect(() => handleError(connectionError)).toThrow('process.exit called');
    expect(processExitSpy).toHaveBeenCalledWith(EXIT_CODES.CONNECTION_ERROR);
  });
  
  it('should handle unknown errors', () => {
    expect(() => handleError('string error')).toThrow('process.exit called');
    expect(processExitSpy).toHaveBeenCalledWith(EXIT_CODES.GENERAL_ERROR);
  });
});

describe('withErrorHandler', () => {
  it('should wrap async functions', async () => {
    const successFn = async (x: number) => x * 2;
    const wrapped = withErrorHandler(successFn);
    
    const result = await wrapped(5);
    expect(result).toBe(10);
  });
  
  it('should handle errors in wrapped functions', async () => {
    const processExitSpy = vi.spyOn(process, 'exit').mockImplementation();
    
    const errorFn = async () => {
      throw new Error('Test error');
    };
    const wrapped = withErrorHandler(errorFn, 'Custom error message');
    
    try {
      await wrapped();
    } catch {
      // Expected
    }
    
    expect(processExitSpy).toHaveBeenCalled();
  });
});

describe('tryOrExit', () => {
  it('should return result on success', async () => {
    const result = await tryOrExit(
      async () => 'success',
      'Error message'
    );
    
    expect(result).toBe('success');
  });
  
  it('should exit on error', async () => {
    const processExitSpy = vi.spyOn(process, 'exit').mockImplementation();
    
    try {
      await tryOrExit(
        async () => { throw new Error('fail'); },
        'Custom error'
      );
    } catch {
      // Expected
    }
    
    expect(processExitSpy).toHaveBeenCalled();
  });
});

describe('retry', () => {
  it('should succeed on first try', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    
    const result = await retry(fn);
    
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });
  
  it('should retry on failure', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce('success');
    
    const result = await retry(fn, { retryDelay: 10 });
    
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });
  
  it('should throw after max retries', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('fail'));
    
    await expect(
      retry(fn, { maxRetries: 2, retryDelay: 10 })
    ).rejects.toThrow('fail');
    
    expect(fn).toHaveBeenCalledTimes(2);
  });
  
  it('should call onRetry callback', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce('success');
    
    const onRetry = vi.fn();
    
    await retry(fn, { retryDelay: 10, onRetry });
    
    expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error));
  });
  
  it('should use exponential backoff', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce('success');
    
    const start = Date.now();
    
    await retry(fn, {
      retryDelay: 10,
      backoffMultiplier: 2
    });
    
    const duration = Date.now() - start;
    
    // First retry: 10ms, second retry: 20ms
    expect(duration).toBeGreaterThanOrEqual(30);
  });
});

describe('assert', () => {
  it('should pass when condition is truthy', () => {
    expect(() => assert(true, 'Should pass')).not.toThrow();
    expect(() => assert(1, 'Should pass')).not.toThrow();
    expect(() => assert('value', 'Should pass')).not.toThrow();
  });
  
  it('should throw ScriptError when condition is falsy', () => {
    expect(() => assert(false, 'Should fail')).toThrow('Should fail');
    expect(() => assert(0, 'Should fail')).toThrow(ScriptError);
    expect(() => assert('', 'Should fail')).toThrow(ScriptError);
  });
  
  it('should use custom error code', () => {
    try {
      assert(false, 'Custom error', 'NOT_FOUND');
    } catch (error) {
      expect(error).toBeInstanceOf(ScriptError);
      expect((error as ScriptError).code).toBe('NOT_FOUND');
    }
  });
});

describe('assertDefined', () => {
  it('should pass for defined values', () => {
    expect(() => assertDefined('value', 'test')).not.toThrow();
    expect(() => assertDefined(0, 'test')).not.toThrow();
    expect(() => assertDefined(false, 'test')).not.toThrow();
    expect(() => assertDefined([], 'test')).not.toThrow();
  });
  
  it('should throw for null', () => {
    expect(() => assertDefined(null, 'test')).toThrow('test is required');
    expect(() => assertDefined(null, 'test')).toThrow(ValidationError);
  });
  
  it('should throw for undefined', () => {
    expect(() => assertDefined(undefined, 'test')).toThrow('test is required');
    expect(() => assertDefined(undefined, 'test')).toThrow(ValidationError);
  });
});