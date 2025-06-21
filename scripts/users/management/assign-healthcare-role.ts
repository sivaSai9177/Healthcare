#!/usr/bin/env bun
import { db } from '@/src/db';
import { users } from '@/src/db/schema';
import { healthcareUsers, hospitals } from '@/src/db/healthcare-schema';
import { eq } from 'drizzle-orm';

async function assignHealthcareRole() {

  try {
    // Get the first admin user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, 'nagarajarao.sirigiri@gmail.com'))
      .limit(1);
    
    if (!user) {

      return;
    }

    // Get hospital for this organization
    const [hospital] = await db
      .select()
      .from(hospitals)
      .where(eq(hospitals.organizationId, user.organizationId!))
      .limit(1);
    
    if (!hospital) {

      return;
    }

    // Update user to have nurse role and hospital assignment
    await db
      .update(users)
      .set({
        role: 'nurse',
        defaultHospitalId: hospital.id,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    // Check if user exists in healthcare_users
    const [existingHealthcareUser] = await db
      .select()
      .from(healthcareUsers)
      .where(eq(healthcareUsers.userId, user.id))
      .limit(1);
    
    if (!existingHealthcareUser) {
      // Add to healthcare_users table
      await db.insert(healthcareUsers).values({
        userId: user.id,
        hospitalId: hospital.id,
        department: 'Emergency',
        isOnDuty: true,
        shiftStart: new Date().toISOString(),
        currentLocation: 'Ward A',
      });

    } else {

    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

assignHealthcareRole();