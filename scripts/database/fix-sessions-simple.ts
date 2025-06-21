#!/usr/bin/env bun
/**
 * Fix existing sessions that are missing new security fields
 * Simple version without React Native dependencies
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { session } from '@/src/db/schema';
import { isNull, or, eq } from 'drizzle-orm';

// Database URL from environment
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://myexpo:myexpo123@localhost:5432/myexpo_dev';

async function fixExistingSessions() {
  console.log('🔧 Fixing existing sessions with missing fields...\n');

  // Create database connection
  const client = postgres(DATABASE_URL);
  const db = drizzle(client);

  try {
    // Find sessions with missing security fields
    const incompleteSessions = await db
      .select({
        id: session.id,
        userId: session.userId,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        city: session.city,
        country: session.country,
        deviceFingerprint: session.deviceFingerprint,
        platform: session.platform,
      })
      .from(session)
      .where(
        or(
          isNull(session.city),
          isNull(session.country),
          isNull(session.deviceFingerprint),
          isNull(session.platform),
          isNull(session.deviceId),
          isNull(session.deviceName)
        )
      );

    console.log(`Found ${incompleteSessions.length} sessions to update\n`);

    if (incompleteSessions.length === 0) {
      console.log('✅ All sessions have required fields!');
      await client.end();
      return;
    }

    // Update each session with default values
    let updatedCount = 0;
    for (const sess of incompleteSessions) {
      try {
        // Detect platform from user agent if possible
        let platform = sess.platform;
        if (!platform && sess.userAgent) {
          if (sess.userAgent.includes('iPhone') || sess.userAgent.includes('iPad')) {
            platform = 'ios';
          } else if (sess.userAgent.includes('Android')) {
            platform = 'android';
          } else {
            platform = 'web';
          }
        }

        await db
          .update(session)
          .set({
            // Set default values for missing fields
            city: sess.city || 'Unknown',
            country: sess.country || 'Unknown',
            deviceFingerprint: sess.deviceFingerprint || `legacy-${sess.id}`,
            platform: platform || 'unknown',
            deviceId: `device-${sess.id}`,
            deviceName: platform ? `${platform} Device` : 'Unknown Device',
            timezone: 'UTC',
            trustScore: 50, // Lower trust score for legacy sessions
            loginMethod: 'legacy',
            sessionType: 'regular',
          })
          .where(eq(session.id, sess.id));

        updatedCount++;
        console.log(`Updated session ${sess.id.substring(0, 8)}...`);
      } catch (error) {
        console.error(`Failed to update session ${sess.id}:`, error);
      }
    }

    console.log(`\n✅ Successfully updated ${updatedCount} sessions`);

    // Close connection
    await client.end();

  } catch (error) {
    console.error('❌ Error fixing sessions:', error);
    await client.end();
    process.exit(1);
  }
}

// Run the script
fixExistingSessions()
  .then(() => {
    console.log('\n🎉 Session fix complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });