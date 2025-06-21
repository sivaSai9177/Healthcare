#!/usr/bin/env node
/**
 * Test script for shift management flow
 * Sets up a test doctor/nurse and verifies shift functionality
 */

// Force local environment before any imports
import { db } from '../src/db';
import { users } from '../src/db/schema';
import { healthcareUsers } from '../src/db/healthcare-schema';
import { eq } from 'drizzle-orm';
import { betterAuth } from '../lib/auth/auth-server';

process.env.APP_ENV = 'local';
process.env.DATABASE_URL = 'postgresql://myexpo:myexpo123@localhost:5432/myexpo_dev';
process.env.BETTER_AUTH_URL = 'http://localhost:8081';
process.env.BETTER_AUTH_SECRET = 'BoworVUCWLUtLNgxSCJYu3xGTtJL0yc2';

async function testShiftFlow() {

  try {
    // Test user email
    const testEmail = 'doctor.test@example.com';
    
    // Check if user exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, testEmail))
      .limit(1);
    
    let userId: string;
    
    if (existingUser) {

      userId = existingUser.id;
      
      // Update role if needed
      if (existingUser.role !== 'doctor') {
        await db
          .update(users)
          .set({ role: 'doctor' })
          .where(eq(users.id, userId));

      }
    } else {
      // Create test user

      const { user, session } = await betterAuth.api.signUpEmail({
        body: {
          email: testEmail,
          password: 'test123456',
          name: 'Dr. Test User',
        },
      });
      
      if (!user) {
        throw new Error('Failed to create user');
      }
      
      userId = user.id;
      
      // Update role to doctor
      await db
        .update(users)
        .set({ 
          role: 'doctor',
          emailVerified: true,
        })
        .where(eq(users.id, userId));

    }
    
    // Check if healthcare user entry exists
    const [existingHealthcareUser] = await db
      .select()
      .from(healthcareUsers)
      .where(eq(healthcareUsers.userId, userId))
      .limit(1);
    
    if (!existingHealthcareUser) {
      // Create healthcare user entry
      await db.insert(healthcareUsers).values({
        userId: userId,
        hospitalId: 'f155b026-01bd-4212-94f3-e7aedef2801d', // Demo hospital ID
        department: 'Emergency',
        specialization: 'Emergency Medicine',
        licenseNumber: 'TEST12345',
        isOnDuty: false,
      });

    } else {

    }
    
    // Display current shift status

    const [currentStatus] = await db
      .select({
        name: users.name,
        email: users.email,
        role: users.role,
        isOnDuty: healthcareUsers.isOnDuty,
        shiftStartTime: healthcareUsers.shiftStartTime,
        shiftEndTime: healthcareUsers.shiftEndTime,
        department: healthcareUsers.department,
      })
      .from(users)
      .innerJoin(healthcareUsers, eq(users.id, healthcareUsers.userId))
      .where(eq(users.id, userId))
      .limit(1);
    
    if (currentStatus) {

      if (currentStatus.isOnDuty && currentStatus.shiftStartTime) {
        const duration = Date.now() - new Date(currentStatus.shiftStartTime).getTime();
        const hours = Math.floor(duration / (1000 * 60 * 60));
        const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));

      }
    }
    
    // Check other on-duty staff

    const onDutyStaff = await db
      .select({
        name: users.name,
        role: users.role,
        department: healthcareUsers.department,
        shiftStartTime: healthcareUsers.shiftStartTime,
      })
      .from(healthcareUsers)
      .innerJoin(users, eq(healthcareUsers.userId, users.id))
      .where(eq(healthcareUsers.isOnDuty, true));
    
    if (onDutyStaff.length === 0) {

    } else {
      onDutyStaff.forEach(staff => {

      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

testShiftFlow();