#!/usr/bin/env bun
import { db } from '@/src/db';
import { users, organization } from '@/src/db/schema';
import { healthcareUsers, hospitals } from '@/src/db/healthcare-schema';
import { eq, sql } from 'drizzle-orm';

async function checkUserHospital() {

  try {
    // Get user info
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        defaultHospitalId: users.defaultHospitalId,
        organizationId: users.organizationId,
      })
      .from(users)
      .where(eq(users.email, 'doremon@gmail.com'))
      .limit(1);
    
    if (!user) {

      return;
    }

    // Check healthcare_users table
    const [healthcareUser] = await db
      .select({
        hospitalId: healthcareUsers.hospitalId,
      })
      .from(healthcareUsers)
      .where(eq(healthcareUsers.userId, user.id))
      .limit(1);

    if (healthcareUser) {

    } else {

    }

    // Check if hospital exists
    const hospitalId = user.defaultHospitalId || healthcareUser?.hospitalId;
    if (hospitalId) {
      const [hospital] = await db
        .select({
          id: hospitals.id,
          name: hospitals.name,
          organizationId: hospitals.organizationId,
          isDefault: hospitals.isDefault,
        })
        .from(hospitals)
        .where(eq(hospitals.id, hospitalId))
        .limit(1);

      if (hospital) {

      } else {

      }
    } else {

    }
    
    // Summary

    const hasValidHospital = !!(user.defaultHospitalId || healthcareUser?.hospitalId);
    const hasOrganization = !!user.organizationId;

  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

checkUserHospital();