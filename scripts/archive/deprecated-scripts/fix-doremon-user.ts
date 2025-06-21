#!/usr/bin/env bun

import { db } from '@/src/db';
import { sql } from 'drizzle-orm';
import { log } from '@/lib/core/debug/unified-logger';

async function fixDoremonUser() {
  log.info('Checking doremon@gmail.com user...', 'DB_FIX');
  
  try {
    // First check if user exists
    const userResult = await db.execute(sql`
      SELECT id, email, role, default_hospital_id, "organizationId"
      FROM "user" 
      WHERE email = 'doremon@gmail.com'
    `);
    
    if (userResult.rows.length === 0) {
      log.error('User doremon@gmail.com does not exist!', 'DB_FIX');
      log.info('Please register this user through the app:', 'DB_FIX');
      log.info('1. Go to http://localhost:8081', 'DB_FIX');
      log.info('2. Click "Sign Up"', 'DB_FIX');
      log.info('3. Register with email: doremon@gmail.com', 'DB_FIX');
      log.info('4. Select role: Nurse', 'DB_FIX');
      return;
    }
    
    const user = userResult.rows[0];
    log.info('Found user:', 'DB_FIX', {
      id: user.id,
      email: user.email,
      role: user.role,
      defaultHospitalId: user.default_hospital_id,
      organizationId: user.organizationId
    });
    
    // Check if user has a hospital assigned
    if (!user.default_hospital_id) {
      log.warn('User has no default hospital assigned', 'DB_FIX');
      
      // Get first available hospital
      const hospitalResult = await db.execute(sql`
        SELECT id, name, organization_id
        FROM hospitals
        WHERE is_active = true
        ORDER BY is_default DESC, created_at ASC
        LIMIT 1
      `);
      
      if (hospitalResult.rows.length > 0) {
        const hospital = hospitalResult.rows[0];
        log.info('Assigning hospital:', 'DB_FIX', {
          hospitalId: hospital.id,
          hospitalName: hospital.name
        });
        
        // Update user with hospital and organization
        await db.execute(sql`
          UPDATE "user"
          SET 
            default_hospital_id = ${hospital.id},
            "organizationId" = ${hospital.organization_id},
            role = 'nurse'
          WHERE email = 'doremon@gmail.com'
        `);
        
        log.success('Updated user with hospital assignment', 'DB_FIX');
      } else {
        log.error('No hospitals found in database!', 'DB_FIX');
        return;
      }
    }
    
    // Check healthcare_users table
    const healthcareResult = await db.execute(sql`
      SELECT user_id, hospital_id, department
      FROM healthcare_users
      WHERE user_id = ${user.id}
    `);
    
    if (healthcareResult.rows.length === 0) {
      log.warn('User not in healthcare_users table', 'DB_FIX');
      
      // Get the hospital ID to use
      const hospitalId = user.default_hospital_id || (await db.execute(sql`
        SELECT id FROM hospitals WHERE is_active = true LIMIT 1
      `)).rows[0]?.id;
      
      if (hospitalId) {
        await db.execute(sql`
          INSERT INTO healthcare_users (user_id, hospital_id, department, is_on_duty)
          VALUES (${user.id}, ${hospitalId}, 'Emergency', false)
          ON CONFLICT (user_id) DO UPDATE SET
            hospital_id = EXCLUDED.hospital_id,
            department = EXCLUDED.department
        `);
        
        log.success('Added user to healthcare_users table', 'DB_FIX');
      }
    } else {
      log.info('User already in healthcare_users table', 'DB_FIX', healthcareResult.rows[0]);
    }
    
    // Check organization membership
    if (user.organizationId) {
      const memberResult = await db.execute(sql`
        SELECT user_id, role
        FROM organization_members
        WHERE user_id = ${user.id} AND organization_id = ${user.organizationId}
      `);
      
      if (memberResult.rows.length === 0) {
        await db.execute(sql`
          INSERT INTO organization_members (organization_id, user_id, role, joined_at)
          VALUES (${user.organizationId}, ${user.id}, 'member', NOW())
          ON CONFLICT (organization_id, user_id) DO NOTHING
        `);
        
        log.success('Added user to organization_members', 'DB_FIX');
      }
    }
    
    // Final verification
    const finalCheck = await db.execute(sql`
      SELECT 
        u.id,
        u.email,
        u.role,
        u.default_hospital_id,
        u."organizationId",
        h.name as hospital_name,
        hu.department,
        hu.is_on_duty
      FROM "user" u
      LEFT JOIN hospitals h ON h.id = u.default_hospital_id
      LEFT JOIN healthcare_users hu ON hu.user_id = u.id
      WHERE u.email = 'doremon@gmail.com'
    `);
    
    log.success('Final user state:', 'DB_FIX', finalCheck.rows[0]);
    
  } catch (error) {
    log.error('Failed to fix doremon user', 'DB_FIX', error);
  }
}

fixDoremonUser().catch(console.error);