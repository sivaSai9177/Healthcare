#!/usr/bin/env bun

import { db } from '../src/db';
import { user as userTable } from '../src/db/schema';
import { healthcareUsers, hospitals } from '../src/db/healthcare-schema';
import { eq, and, sql } from 'drizzle-orm';

async function testHealthcareQueries() {

  try {
    // Test 1: Get doremon user with healthcare info

    const userQuery = await db
      .select({
        id: userTable.id,
        email: userTable.email,
        role: userTable.role,
        defaultHospitalId: userTable.defaultHospitalId,
        healthcareHospitalId: healthcareUsers.hospitalId,
        isOnDuty: healthcareUsers.isOnDuty,
      })
      .from(userTable)
      .leftJoin(healthcareUsers, eq(userTable.id, healthcareUsers.userId))
      .where(eq(userTable.email, 'doremon@gmail.com'))
      .limit(1);
    
    if (userQuery.length > 0) {

    } else {

      return;
    }
    
    const hospitalId = userQuery[0].defaultHospitalId || userQuery[0].healthcareHospitalId;
    
    if (!hospitalId) {

      return;
    }
    
    // Test 2: Get on-duty staff

    const onDutyStaff = await db
      .select({
        id: userTable.id,
        name: userTable.name,
        role: userTable.role,
        department: healthcareUsers.department,
        isOnDuty: healthcareUsers.isOnDuty,
      })
      .from(healthcareUsers)
      .innerJoin(userTable, eq(healthcareUsers.userId, userTable.id))
      .where(
        and(
          eq(healthcareUsers.hospitalId, hospitalId),
          eq(healthcareUsers.isOnDuty, true)
        )
      );

    // Test 3: Check hospitals table structure

    const hospitalQuery = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'hospitals'
      ORDER BY ordinal_position
    `);

    hospitalQuery.rows.forEach((col: any) => {

    });
    
    // Test 4: Get hospital info if exists

    try {
      const hospitalInfo = await db.execute(sql`
        SELECT * FROM hospitals WHERE id = ${hospitalId}::uuid LIMIT 1
      `);
      
      if (hospitalInfo.rows.length > 0) {

      } else {

      }
    } catch (err) {

    }
    
  } catch (error) {
    console.error('❌ Query test failed:', error);
  }
}

testHealthcareQueries().catch(console.error);