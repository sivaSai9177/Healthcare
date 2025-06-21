#!/usr/bin/env bun
/**
 * Fix OAuth user profile completion status
 */

import { db } from '@/src/db';
import { users } from '@/src/db/schema';
import { eq } from 'drizzle-orm';
import { log } from '@/lib/core/debug/logger';

async function fixOAuthUserProfile(email: string) {
  try {
    // Find user by email
    const userResult = await db.select().from(users).where(eq(users.email, email)).limit(1);
    const user = userResult[0];
    
    if (!user) {
      console.error(`User not found: ${email}`);
      return;
    }
    
    console.log('Current user status:', {
      id: user.id,
      email: user.email,
      role: user.role,
      needsProfileCompletion: user.needsProfileCompletion,
      organizationId: user.organizationId,
      defaultHospitalId: user.defaultHospitalId
    });
    
    // Check if user needs profile completion
    const needsCompletion = !user.role || user.role === 'user' || !user.organizationId || !user.defaultHospitalId;
    
    if (needsCompletion && !user.needsProfileCompletion) {
      console.log('Fixing user profile completion status...');
      
      await db.update(users)
        .set({ 
          needsProfileCompletion: true,
          role: 'user' // Ensure role is set to basic user
        })
        .where(eq(users.id, user.id));
      
      console.log('✅ User profile completion status fixed');
    } else if (needsCompletion) {
      console.log('✅ User already has needsProfileCompletion = true');
    } else {
      console.log('ℹ️  User has completed profile setup');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

// Get email from command line
const email = process.argv[2] || 'saipramod273@gmail.com';
fixOAuthUserProfile(email);