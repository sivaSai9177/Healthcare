import 'dotenv/config';
import { db } from '@/src/db';
import { users } from '@/src/db/schema';
import { eq } from 'drizzle-orm';
import { log } from '@/lib/core/debug/logger';

async function verifyUserOrganization() {
  const userEmail = process.argv[2];
  
  if (!userEmail) {
    console.error('Please provide a user email as argument');

    process.exit(1);
  }
  
  try {
    log.info(`Checking user: ${userEmail}`, 'VERIFY');
    
    // Get user by email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, userEmail))
      .limit(1);
    
    if (!user) {
      log.error(`User not found: ${userEmail}`, 'VERIFY');
      process.exit(1);
    }

  } catch (error) {
    log.error('Failed to verify user', 'VERIFY', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

// Run the verification
verifyUserOrganization().catch((error) => {
  log.error('Verification failed', 'VERIFY', error);
  process.exit(1);
});