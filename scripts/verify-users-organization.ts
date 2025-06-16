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
    
    console.log('\nUser Organization Status:');
    console.log('========================');
    
    users.forEach(u => {
      console.log(`\nEmail: ${u.email}`);
      console.log(`Name: ${u.name || 'Not set'}`);
      console.log(`Role: ${u.role || 'Not set'}`);
      console.log(`OrganizationId: ${u.organizationId || 'NOT SET'}`);
      console.log(`OrganizationName: ${u.organizationName || 'Not set'}`);
      
      if (!u.organizationId) {
        console.log('⚠️  WARNING: User has no organizationId!');
      }
    });
    
    // Summary
    const usersWithOrg = users.filter(u => u.organizationId).length;
    const usersWithoutOrg = users.filter(u => !u.organizationId).length;
    
    console.log('\n\nSummary:');
    console.log('========');
    console.log(`Total users: ${users.length}`);
    console.log(`Users with organizationId: ${usersWithOrg}`);
    console.log(`Users without organizationId: ${usersWithoutOrg}`);
    
    if (usersWithoutOrg > 0) {
      console.log('\n⚠️  Some users do not have organizationId set!');
      console.log('Run the healthcare setup script to fix this:');
      console.log('bun run healthcare:setup:complete');
    } else {
      console.log('\n✅ All users have organizationId set!');
    }
    
  } catch (error) {
    log.error('Failed to verify users', 'VERIFY', error);
    process.exit(1);
  }
  
  process.exit(0);
}

verifyUsersOrganization();