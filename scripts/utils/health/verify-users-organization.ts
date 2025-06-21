#!/usr/bin/env bun
import { db } from '@/src/db';
import { user } from '@/src/db/schema';
import { log } from '@/lib/core/debug/logger';

async function verifyUsersOrganization() {
  log.info('Verifying user organizationIds...', 'VERIFY');
  
  try {
    // Get all users
    const users = await db.select({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: user.organizationId,
      organizationName: user.organizationName,
    }).from(user);

    users.forEach(u => {

      if (!u.organizationId) {

      }
    });
    
    // Summary
    const usersWithOrg = users.filter(u => u.organizationId).length;
    const usersWithoutOrg = users.filter(u => !u.organizationId).length;

    if (usersWithoutOrg > 0) {

    } else {

    }
    
  } catch (error) {
    log.error('Failed to verify users', 'VERIFY', error);
    process.exit(1);
  }
  
  process.exit(0);
}

verifyUsersOrganization();