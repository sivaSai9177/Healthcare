#!/usr/bin/env bun
import { db } from '@/src/db';
import { eq, sql } from 'drizzle-orm';
import { user, healthcareUsers } from '@/src/db/schema';
import { betterAuth } from '@/lib/auth';

// Force local database connection
process.env.APP_ENV = 'local';
process.env.DATABASE_URL = 'postgresql://myexpo:myexpo123@localhost:5432/myexpo_dev';

async function fixNurseUserAuth() {

  try {
    // 1. Check if user exists
    const [nurseUser] = await db
      .select()
      .from(user)
      .where(eq(user.email, 'doremon@gmail.com'))
      .limit(1);
    
    if (!nurseUser) {

      // Create the user with Better Auth

      const newUser = await betterAuth.api.signUpEmail({
        body: {
          email: 'doremon@gmail.com',
          password: 'password123',
          name: 'Nurse Doremon',
        },
      });
      
      if (newUser) {

        // Update role and hospital
        await db.update(user)
          .set({
            role: 'nurse',
            defaultHospitalId: 'f155b026-01bd-4212-94f3-e7aedef2801d',
          })
          .where(eq(user.email, 'doremon@gmail.com'));
      }
    } else {

      // Update user to ensure correct role and hospital
      await db.update(user)
        .set({
          role: 'nurse',
          defaultHospitalId: 'f155b026-01bd-4212-94f3-e7aedef2801d',
        })
        .where(eq(user.id, nurseUser.id));

    }
    
    // 2. Check healthcare_users profile
    const [healthcareProfile] = await db
      .select()
      .from(healthcareUsers)
      .where(eq(healthcareUsers.userId, nurseUser?.id || ''))
      .limit(1);
    
    if (!healthcareProfile && nurseUser) {

      await db.insert(healthcareUsers).values({
        userId: nurseUser.id,
        hospitalId: 'f155b026-01bd-4212-94f3-e7aedef2801d',
        licenseNumber: `NUR-${nurseUser.id.substring(0, 8)}`,
        department: 'ICU',
        specialization: 'Critical Care',
        isOnDuty: false,
      });

    } else if (healthcareProfile) {

    }
    
    // 3. Test authentication with Better Auth

    const authResult = await betterAuth.api.signInEmail({
      body: {
        email: 'doremon@gmail.com',
        password: 'password123',
      },
    });
    
    if (authResult) {

    } else {

    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

fixNurseUserAuth();