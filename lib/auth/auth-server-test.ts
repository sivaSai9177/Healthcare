/**
 * Test version of auth-server without external dependencies
 */

// Set NODE_ENV to avoid React Native imports
import 'dotenv/config';
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { bearer, multiSession } from "better-auth/plugins";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from 'pg';
import * as schema from "@/src/db/schema";

process.env.NODE_ENV = 'production';

// Create database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const db = drizzle(pool);

// Simple logger
const logger = {
  auth: {
    info: (msg: string, data?: any) => console.log(`[AUTH] ${msg}`, data || ''),
    warn: (msg: string, data?: any) => console.warn(`[AUTH] ${msg}`, data || ''),
    error: (msg: string, data?: any) => console.error(`[AUTH] ${msg}`, data || ''),
  },
  system: {
    info: (msg: string, data?: any) => console.log(`[SYSTEM] ${msg}`, data || ''),
  }
};

// Create auth instance
export const auth = betterAuth({
  baseURL: 'http://localhost:8081',
  secret: process.env.BETTER_AUTH_SECRET || "test-secret",
  
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { ...schema },
  }),
  
  // Email and password configuration
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  
  // Social providers
  socialProviders: {
    google: (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) ? {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    } : undefined,
  },
  
  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  
  // Plugins
  plugins: [
    bearer(), // Enable Bearer token authentication for mobile
    multiSession({ 
      maximumSessions: 5 
    }),
  ],
  
  // CORS configuration
  cors: {
    origin: () => true, // Allow all origins in dev
    credentials: true,
  },
  
  // Logging
  logger: {
    level: "debug",
    disabled: false,
  },
  
  // Error handling
  onError: (error: any, request: Request) => {
    logger.auth.error('Authentication error', error);
    return {
      message: error.message,
      status: error.status || 500,
    };
  },
});

logger.system.info('Auth server initialized');

export type Auth = typeof auth;