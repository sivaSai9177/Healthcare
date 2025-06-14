import { auditMiddleware } from './audit';
import { 
  rateLimitMiddleware,
  createRateLimiter,
  resetRateLimit,
  checkRateLimits,
  AUTH_RATE_LIMITS,
  API_RATE_LIMITS
} from './rate-limit';

// Re-export all middleware
export { auditMiddleware };
export { 
  rateLimitMiddleware,
  createRateLimiter,
  resetRateLimit,
  checkRateLimits,
  AUTH_RATE_LIMITS,
  API_RATE_LIMITS
};

/**
 * Compose multiple middlewares
 */
export function composeMiddleware(...middlewares: any[]) {
  return async (opts: any) => {
    let index = 0;
    
    async function next(): Promise<any> {
      if (index >= middlewares.length) {
        return opts.next();
      }
      
      const middleware = middlewares[index++];
      return middleware({ ...opts, next });
    }
    
    return next();
  };
}

/**
 * Create a middleware chain for auth endpoints
 */
export const authMiddlewareChain = composeMiddleware(
  rateLimitMiddleware(),
  auditMiddleware.auth
);

/**
 * Create a middleware chain for protected endpoints
 */
export const protectedMiddlewareChain = composeMiddleware(
  rateLimitMiddleware(),
  auditMiddleware.general
);

/**
 * Create a middleware chain for admin endpoints
 */
export const adminMiddlewareChain = composeMiddleware(
  rateLimitMiddleware({ max: 30 }), // Stricter rate limit for admin
  auditMiddleware.security,
  auditMiddleware.general
);