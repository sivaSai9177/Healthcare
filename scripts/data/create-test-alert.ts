#!/usr/bin/env bun
import { db } from '@/src/db';
import { alerts } from '@/src/db/healthcare-schema';
import { users } from '@/src/db/schema';
import { eq } from 'drizzle-orm';

async function createTestAlert() {

  try {
    // Get the nurse user we just created
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, 'nagarajarao.sirigiri@gmail.com'))
      .limit(1);
    
    if (!user || !user.defaultHospitalId) {

      return;
    }

    // Create a test alert
    const [newAlert] = await db.insert(alerts).values({
      roomNumber: '101',
      alertType: 'medical_emergency',
      urgencyLevel: 2,
      description: 'Patient requires immediate assistance - chest pain reported',
      createdBy: user.id,
      hospitalId: user.defaultHospitalId,
      status: 'active',
      currentEscalationTier: 1,
      escalationLevel: 1,
    }).returning();

    // Create another alert for testing
    const [alert2] = await db.insert(alerts).values({
      roomNumber: '205',
      alertType: 'code_blue',
      urgencyLevel: 1,
      description: 'Code Blue - Cardiac arrest',
      createdBy: user.id,
      hospitalId: user.defaultHospitalId,
      status: 'active',
      currentEscalationTier: 1,
      escalationLevel: 1,
    }).returning();

  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

createTestAlert();