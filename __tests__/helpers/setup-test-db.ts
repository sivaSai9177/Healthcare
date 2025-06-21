import { db } from '@/src/db';
import { sql } from 'drizzle-orm';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

export async function setupTestDatabase() {
  try {
    // Test the connection
    await db.execute(sql`SELECT 1`);
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

export async function cleanupTestDatabase() {
  try {
    // Clean up test data after tests
    // This is a placeholder - implement based on your needs
    return true;
  } catch (error) {
    console.error('Database cleanup failed:', error);
    return false;
  }
}

// Helper to check if we're in CI environment
export function isCI() {
  return process.env.CI === 'true';
}

// Helper to skip tests if database is not available
export function skipIfNoDatabase() {
  if (!process.env.DATABASE_URL) {

    return true;
  }
  return false;
}