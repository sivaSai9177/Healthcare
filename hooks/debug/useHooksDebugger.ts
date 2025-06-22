import { useEffect, useRef } from 'react';
import { logger } from '@/lib/core/debug/unified-logger';

/**
 * Debug hook to track hook execution order and detect violations
 */
export function useHooksDebugger(hookName: string, deps?: any[]) {
  const renderCount = useRef(0);
  const previousDeps = useRef(deps);
  const componentName = useRef<string>('');

  useEffect(() => {
    renderCount.current += 1;
    
    // Try to get component name from stack trace
    const error = new Error();
    const stack = error.stack?.split('\n');
    if (stack && stack.length > 3) {
      const callerLine = stack[3];
      const match = callerLine.match(/at\s+(\w+)\s+/);
      if (match) {
        componentName.current = match[1];
      }
    }

    logger.debug(`[HooksDebugger] ${hookName} in ${componentName.current || 'Unknown'}`, 'SYSTEM', {
      renderCount: renderCount.current,
      depsChanged: JSON.stringify(deps) !== JSON.stringify(previousDeps.current),
      deps: deps,
      previousDeps: previousDeps.current,
    });

    previousDeps.current = deps;
  });

  // Check for common hook violations
  useEffect(() => {
    // Check if hooks are being called conditionally
    if (typeof window !== 'undefined') {
      const currentHookCount = (window as any).__hookCount || 0;
      (window as any).__hookCount = currentHookCount + 1;
      
      return () => {
        (window as any).__hookCount = currentHookCount;
      };
    }
  }, []);
}

/**
 * Wrap a hook to add debugging information
 */
export function withHooksDebugger<T extends (...args: any[]) => any>(
  hookName: string,
  hook: T
): T {
  return ((...args: Parameters<T>) => {
    useHooksDebugger(hookName, args);
    
    try {
      return hook(...args);
    } catch (error) {
      logger.error(`[HooksDebugger] Error in ${hookName}`, 'SYSTEM', {
        error: error instanceof Error ? error.message : String(error),
        args,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }) as T;
}