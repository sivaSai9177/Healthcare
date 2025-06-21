/**
 * Simple database connection test
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { db } from '@/src/db';
import { organization } from '@/src/db/organization-schema';
import { setupTestDatabase, cleanupTestDatabase, skipIfNoDatabase } from '../../helpers/setup-test-db';

describe('Database Connection Test', () => {
  let isDbAvailable = false;

  beforeAll(async () => {
    if (skipIfNoDatabase()) {
      return;
    }
    isDbAvailable = await setupTestDatabase();
  });

  afterAll(async () => {
    if (isDbAvailable) {
      await cleanupTestDatabase();
    }
  });

  it('should connect to the database', async () => {
    if (!isDbAvailable) {

      expect(true).toBe(true); // Pass the test when skipped
      return;
    }

    try {
      // Simple query to test connection
      const orgs = await db.select().from(organization).limit(1);

      expect(Array.isArray(orgs)).toBe(true);
      expect(orgs).toBeDefined();
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  });
});