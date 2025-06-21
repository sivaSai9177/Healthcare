#!/usr/bin/env bun
/**
 * Fix existing sessions that are missing new security fields
 * This script updates sessions created before the security enhancement
 */

import { db } from '@/src/db';
import { session } from '@/src/db/schema';
import { isNull, or, eq } from 'drizzle-orm';
import chalk from 'chalk';

async function fixExistingSessions() {
  console.log(chalk.blue('🔧 Fixing existing sessions with missing fields...\n'));

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

    console.log(chalk.yellow(`Found ${incompleteSessions.length} sessions to update\n`));

    if (incompleteSessions.length === 0) {
      console.log(chalk.green('✅ All sessions have required fields!'));
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
        console.log(chalk.gray(`Updated session ${sess.id.substring(0, 8)}...`));
      } catch (error) {
        console.error(chalk.red(`Failed to update session ${sess.id}:`), error);
      }
    }

    console.log(chalk.green(`\n✅ Successfully updated ${updatedCount} sessions`));

    // Verify the update
    const stillIncomplete = await db
      .select({ count: session.id })
      .from(session)
      .where(
        or(
          isNull(session.city),
          isNull(session.deviceFingerprint)
        )
      );

    if (stillIncomplete.length > 0) {
      console.log(chalk.yellow(`⚠️  ${stillIncomplete.length} sessions still have missing fields`));
    }

  } catch (error) {
    console.error(chalk.red('❌ Error fixing sessions:'), error);
    process.exit(1);
  }
}

// Run the script
if (import.meta.main) {
  fixExistingSessions()
    .then(() => {
      console.log(chalk.blue('\n🎉 Session fix complete!'));
      process.exit(0);
    })
    .catch((error) => {
      console.error(chalk.red('Fatal error:'), error);
      process.exit(1);
    });
}

export { fixExistingSessions };