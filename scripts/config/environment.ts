#!/usr/bin/env bun
/**
 * Environment Configuration and Validation
 * 
 * Centralizes environment variable handling with:
 * - Type-safe access to env vars
 * - Validation and defaults
 * - Environment-specific configs
 */

import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';
import { existsSync } from 'fs';

// Load environment files based on APP_ENV
const APP_ENV = process.env.APP_ENV || 'local';

// Find project root (look for package.json)
let projectRoot = process.cwd();
while (!existsSync(path.join(projectRoot, 'package.json')) && projectRoot !== '/') {
  projectRoot = path.dirname(projectRoot);
}

const envFiles = [
  `.env.${APP_ENV}`,
  `.env.${APP_ENV}.local`,
  '.env.local',
  '.env'
];

// Load env files in order of precedence
for (const file of envFiles) {
  const filePath = path.resolve(projectRoot, file);
  if (existsSync(filePath)) {
    dotenv.config({ path: filePath });
  }
}

// Environment variable schema
const envSchema = z.object({
  // App Configuration
  APP_ENV: z.enum(['local', 'development', 'staging', 'production', 'test']).default('local'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Database
  DATABASE_URL: z.string().url().optional(),
  POSTGRES_USER: z.string().default('myexpo'),
  POSTGRES_PASSWORD: z.string().default('myexpo123'),
  POSTGRES_DB: z.string().default('myexpo_dev'),
  POSTGRES_HOST: z.string().default('localhost'),
  POSTGRES_PORT: z.coerce.number().default(5432),
  
  // Redis
  REDIS_URL: z.string().optional(),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  
  // Auth
  BETTER_AUTH_SECRET: z.string().min(32).optional(),
  BETTER_AUTH_URL: z.string().url().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  
  // Services
  API_PORT: z.coerce.number().default(3000),
  WS_PORT: z.coerce.number().default(3002),
  EMAIL_PORT: z.coerce.number().default(3001),
  LOGGING_PORT: z.coerce.number().default(3003),
  
  // Email
  EMAIL_HOST: z.string().default('smtp.gmail.com'),
  EMAIL_PORT_SMTP: z.coerce.number().default(587),
  EMAIL_USER: z.string().email().optional(),
  EMAIL_PASS: z.string().optional(),
  EMAIL_FROM: z.string().default('noreply@hospital-alert-system.com'),
  
  // URLs
  APP_URL: z.string().url().optional(),
  API_URL: z.string().url().optional(),
  EXPO_PUBLIC_API_URL: z.string().url().optional(),
  
  // PostHog
  POSTHOG_API_KEY: z.string().optional(),
  POSTHOG_API_HOST: z.string().url().optional(),
  
  // Feature Flags
  ENABLE_ANALYTICS: z.coerce.boolean().default(false),
  ENABLE_LOGGING: z.coerce.boolean().default(true),
  ENABLE_EMAIL: z.coerce.boolean().default(false),
});

// Parse and validate environment
let env: z.infer<typeof envSchema>;

try {
  env = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('❌ Invalid environment variables:');
    error.errors.forEach(err => {
      console.error(`  - ${err.path.join('.')}: ${err.message}`);
    });
    process.exit(1);
  }
  throw error;
}

// Build derived values
const config = {
  ...env,
  
  // Computed database URL
  databaseUrl: env.DATABASE_URL || 
    `postgresql://${env.POSTGRES_USER}:${env.POSTGRES_PASSWORD}@${env.POSTGRES_HOST}:${env.POSTGRES_PORT}/${env.POSTGRES_DB}`,
  
  // Computed Redis URL
  redisUrl: env.REDIS_URL || `redis://${env.REDIS_HOST}:${env.REDIS_PORT}`,
  
  // Service URLs
  apiUrl: env.API_URL || env.EXPO_PUBLIC_API_URL || `http://localhost:${env.API_PORT}`,
  wsUrl: `ws://localhost:${env.WS_PORT}`,
  
  // Environment checks
  isLocal: env.APP_ENV === 'local',
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test' || env.APP_ENV === 'test',
  
  // Feature flags
  features: {
    analytics: env.ENABLE_ANALYTICS,
    logging: env.ENABLE_LOGGING,
    email: env.ENABLE_EMAIL,
  }
} as const;

// Validation function for scripts
export async function validateEnvironment(required: (keyof typeof config)[] = []) {
  const missing = required.filter(key => !config[key]);
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      `Please check your .env.${APP_ENV} file`
    );
  }
  
  return config;
}

// Environment-specific helpers
export function requireAuth() {
  if (!config.BETTER_AUTH_SECRET) {
    throw new Error('BETTER_AUTH_SECRET is required for auth operations');
  }
  if (!config.BETTER_AUTH_URL) {
    throw new Error('BETTER_AUTH_URL is required for auth operations');
  }
}

export function requireEmail() {
  if (!config.features.email) {
    throw new Error('Email is disabled. Set ENABLE_EMAIL=true');
  }
  if (!config.EMAIL_USER || !config.EMAIL_PASS) {
    throw new Error('EMAIL_USER and EMAIL_PASS are required for email operations');
  }
}

export function requireDatabase() {
  // Database URL is always computed, so just validate connection
  return config.databaseUrl;
}

// Export config and env type
export { config, env };
export type Environment = typeof config;
export type EnvVars = z.infer<typeof envSchema>;

// Re-export APP_ENV for convenience
export { APP_ENV };