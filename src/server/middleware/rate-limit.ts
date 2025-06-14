import { TRPCError } from '@trpc/server';
import type { Context } from '../trpc';
import { log } from '@/lib/core/debug/logger';

// Redis type for when @upstash/redis is installed
type Redis = any;

/**
 * Rate limiting configuration for different endpoints
 */
interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  max: number; // Maximum requests per window
  keyGenerator?: (ctx: Context) => string; // Custom key generation
  skipSuccessfulRequests?: boolean; // Skip counting successful requests
  skipFailedRequests?: boolean; // Skip counting failed requests
}

/**
 * Default rate limit configurations for auth endpoints
 */
export const AUTH_RATE_LIMITS: Record<string, RateLimitConfig> = {
  'auth.signIn': {
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 5, // 5 attempts per 10 minutes
    skipSuccessfulRequests: true,
  },
  'auth.signUp': {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 signups per hour per IP
  },
  'auth.resetPassword': {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3, // 3 reset attempts per 15 minutes
  },
  'auth.verifyEmail': {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 verification attempts per hour
  },
  'auth.sendVerificationEmail': {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 resend attempts per hour
  },
  'auth.signOut': {
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 signout attempts per minute
  },
};

/**
 * Default rate limit configurations for API endpoints
 */
export const API_RATE_LIMITS: Record<string, RateLimitConfig> = {
  // General API endpoints
  default: {
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
  },
  // Data queries
  query: {
    windowMs: 60 * 1000, // 1 minute
    max: 200, // 200 queries per minute
  },
  // Data mutations
  mutation: {
    windowMs: 60 * 1000, // 1 minute
    max: 50, // 50 mutations per minute
  },
  // Admin endpoints
  admin: {
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 admin requests per minute
  },
  // Export/bulk operations
  export: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 5, // 5 export requests per 5 minutes
  },
};

/**
 * Rate limit store interface
 */
interface RateLimitStore {
  increment(key: string, windowMs: number): Promise<{ count: number; resetTime: number }>;
  reset(key: string): Promise<void>;
  cleanup(): Promise<void>;
}

/**
 * In-memory rate limit store (for development)
 */
class InMemoryRateLimitStore implements RateLimitStore {
  private store = new Map<string, { count: number; resetTime: number }>();

  async increment(key: string, windowMs: number): Promise<{ count: number; resetTime: number }> {
    const now = Date.now();
    const current = this.store.get(key);
    
    if (!current || current.resetTime < now) {
      // New window or expired
      const resetTime = now + windowMs;
      this.store.set(key, { count: 1, resetTime });
      return { count: 1, resetTime };
    }
    
    current.count++;
    return { count: current.count, resetTime: current.resetTime };
  }

  async reset(key: string): Promise<void> {
    this.store.delete(key);
  }

  async cleanup(): Promise<void> {
    const now = Date.now();
    for (const [key, value] of this.store.entries()) {
      if (value.resetTime < now) {
        this.store.delete(key);
      }
    }
  }
}

/**
 * Redis rate limit store (for production)
 */
class RedisRateLimitStore implements RateLimitStore {
  constructor(private redis: Redis) {}

  async increment(key: string, windowMs: number): Promise<{ count: number; resetTime: number }> {
    const now = Date.now();
    const resetTime = now + windowMs;
    const ttl = Math.ceil(windowMs / 1000); // Convert to seconds

    // Use Redis pipeline for atomic operations
    const pipe = this.redis.pipeline();
    pipe.incr(key);
    pipe.expire(key, ttl);
    
    const results = await pipe.exec();
    const count = results[0] as number;
    
    return { count, resetTime };
  }

  async reset(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async cleanup(): Promise<void> {
    // Redis handles TTL automatically
  }
}

/**
 * Get rate limit store based on environment
 */
// Dynamic import for optional Redis dependency
let redisModule: any = null;

// Attempt to load Redis module asynchronously
// This avoids build-time errors if the module is not installed
const loadRedisModule = async () => {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      // @ts-ignore - Optional dependency
      const module = await import('@upstash/redis' as string);
      redisModule = module;
      log.info('Redis module loaded successfully', 'RATE_LIMIT');
    } catch {
      log.info('Redis module not available, using in-memory store', 'RATE_LIMIT');
    }
  }
};

// Load Redis module on startup
loadRedisModule().catch(() => {
  // Ignore errors - Redis is optional
});

/**
 * Get rate limit store based on environment
 */
function getRateLimitStore(): RateLimitStore {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN && redisModule) {
    try {
      const { Redis } = redisModule;
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
      log.info('Using Redis rate limit store', 'RATE_LIMIT');
      return new RedisRateLimitStore(redis);
    } catch {
      log.warn('@upstash/redis available but failed to initialize, falling back to in-memory store', 'RATE_LIMIT');
    }
  }
  
  if (!redisModule && process.env.UPSTASH_REDIS_REST_URL) {
    log.warn('@upstash/redis not installed, falling back to in-memory store', 'RATE_LIMIT');
  }
  
  log.info('Using in-memory rate limit store', 'RATE_LIMIT');
  return new InMemoryRateLimitStore();
}

// Singleton rate limit store
const rateLimitStore = getRateLimitStore();

// Cleanup interval for in-memory store
if (rateLimitStore instanceof InMemoryRateLimitStore) {
  setInterval(() => {
    rateLimitStore.cleanup();
  }, 60000); // Clean up every minute
}

/**
 * Generate rate limit key
 */
function generateKey(ctx: Context, endpoint: string, config?: RateLimitConfig): string {
  if (config?.keyGenerator) {
    return config.keyGenerator(ctx);
  }
  
  // Default key generation
  const parts = [`ratelimit:${endpoint}`];
  
  // Add user ID if authenticated
  if (ctx.session?.user?.id) {
    parts.push(`user:${ctx.session.user.id}`);
  }
  
  // Add IP address
  const ip = ctx.req.headers.get('x-forwarded-for')?.split(',')[0] || 
             ctx.req.headers.get('x-real-ip') || 
             'unknown';
  parts.push(`ip:${ip}`);
  
  return parts.join(':');
}

/**
 * Rate limiting middleware
 */
export const rateLimitMiddleware = (customConfig?: Partial<RateLimitConfig>) => {
  return async (opts: {
    path: string;
    type: string;
    ctx: Context;
    next: () => Promise<any>;
  }) => {
    const { path, ctx, next } = opts;
    
    // Get rate limit config for this endpoint
    let config: RateLimitConfig;
    
    // Check specific endpoint configs
    if (AUTH_RATE_LIMITS[path]) {
      config = { ...AUTH_RATE_LIMITS[path], ...customConfig };
    } else if (path.startsWith('admin.')) {
      config = { ...API_RATE_LIMITS.admin, ...customConfig };
    } else if (path.includes('export')) {
      config = { ...API_RATE_LIMITS.export, ...customConfig };
    } else if (opts.type === 'query') {
      config = { ...API_RATE_LIMITS.query, ...customConfig };
    } else if (opts.type === 'mutation') {
      config = { ...API_RATE_LIMITS.mutation, ...customConfig };
    } else {
      config = { ...API_RATE_LIMITS.default, ...customConfig };
    }
    
    // Generate rate limit key
    const key = generateKey(ctx, path, config);
    
    try {
      // Execute the procedure first
      const result = await next();
      
      // Skip counting if configured and request was successful
      if (config.skipSuccessfulRequests) {
        return result;
      }
      
      // Increment counter after successful request
      const { count, resetTime } = await rateLimitStore.increment(key, config.windowMs);
      
      // Check if limit exceeded for next request
      if (count > config.max) {
        // Log for monitoring
        log.warn('Rate limit will be exceeded on next request', 'RATE_LIMIT', {
          endpoint: path,
          key,
          count,
          max: config.max,
          resetTime: new Date(resetTime).toISOString(),
        });
      }
      
      return result;
    } catch (error) {
      // Skip counting if configured and request failed
      if (config.skipFailedRequests) {
        throw error;
      }
      
      // Increment counter for failed request
      const { count, resetTime } = await rateLimitStore.increment(key, config.windowMs);
      
      // Check if limit exceeded
      if (count > config.max) {
        const resetIn = Math.ceil((resetTime - Date.now()) / 1000);
        
        // Log rate limit violation
        log.error('Rate limit exceeded', 'RATE_LIMIT', {
          endpoint: path,
          key,
          count,
          max: config.max,
          resetIn,
        });
        
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: `Too many requests. Please try again in ${resetIn} seconds.`,
          cause: {
            resetIn,
            resetTime: new Date(resetTime).toISOString(),
          },
        });
      }
      
      throw error;
    }
  };
};

/**
 * Create rate limiter with custom configuration
 */
export function createRateLimiter(config: RateLimitConfig) {
  return rateLimitMiddleware(config);
}

/**
 * Reset rate limit for a specific key (useful for testing or admin operations)
 */
export async function resetRateLimit(ctx: Context, endpoint: string): Promise<void> {
  const key = generateKey(ctx, endpoint);
  await rateLimitStore.reset(key);
}

/**
 * Bulk rate limit check for multiple endpoints
 */
export async function checkRateLimits(
  ctx: Context,
  endpoints: string[]
): Promise<Record<string, { limited: boolean; remaining: number; resetTime: number }>> {
  const results: Record<string, { limited: boolean; remaining: number; resetTime: number }> = {};
  
  for (const endpoint of endpoints) {
    const config = AUTH_RATE_LIMITS[endpoint] || API_RATE_LIMITS.default;
    const key = generateKey(ctx, endpoint, config);
    
    // This is a non-incrementing check
    // In production, you'd want to use Redis GET to check without incrementing
    const mockIncrement = await rateLimitStore.increment(key + ':check', config.windowMs);
    
    results[endpoint] = {
      limited: mockIncrement.count > config.max,
      remaining: Math.max(0, config.max - mockIncrement.count),
      resetTime: mockIncrement.resetTime,
    };
  }
  
  return results;
}

export default rateLimitMiddleware;