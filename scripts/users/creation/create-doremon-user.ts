#!/usr/bin/env bun
import { db } from '@/src/db';
import { users } from '@/src/db/schema';
import { healthcareUsers, hospitals } from '@/src/db/healthcare-schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

async function createDoremonUser() {

  try {
    // First check if user already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, 'doremon@gmail.com'))
      .limit(1);
    
    if (existingUser) {

      return;
    }
    
    // Get hospital and organization
    const [hospital] = await db
      .select()
      .from(hospitals)
      .limit(1);
    
    if (!hospital) {

      return;
    }

    // Create new user
    const userId = uuidv4();
    const [newUser] = await db.insert(users).values({
      id: userId,
      email: 'doremon@gmail.com',
      name: 'Nurse Doremon',
      emailVerified: true,
      role: 'nurse',
      defaultHospitalId: hospital.id,
      organizationId: hospital.organizationId || '0d375139-d17c-4c39-aa74-7e8f6a37e235',
      organizationName: 'Ganesan Corp',
      isActive: true,
      needsProfileCompletion: false,
      failedLoginAttempts: 0,
      twoFactorEnabled: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    // Add to healthcare_users
    await db.insert(healthcareUsers).values({
      userId: newUser.id,
      hospitalId: hospital.id,
      department: 'Emergency',
      isOnDuty: true,
      shiftStartTime: new Date(),
    });

    // Verify alerts access
    const alerts = await db.execute<any>(`
      SELECT COUNT(*) as count 
      FROM alerts 
      WHERE hospital_id = '${hospital.id}' 
      AND status IN ('active', 'acknowledged');
    `);

  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

createDoremonUser();