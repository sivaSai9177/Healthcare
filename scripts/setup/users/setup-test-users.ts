#!/usr/bin/env bun
import { db } from '@/src/db';
import { sql } from 'drizzle-orm';
import { log } from '@/lib/core/debug/logger';
import crypto from 'crypto';

async function setupTestUsers() {
  log.info('Setting up test users and healthcare data...', 'SETUP');
  
  try {
    // Start transaction
    await db.execute(sql`BEGIN`);
    
    // 1. Create organization
    log.info('Creating organization...', 'SETUP');
    await db.execute(sql`
      INSERT INTO organization (id, name, slug, created_by, owner_id, is_active)
      VALUES (
        '0d375139-d17c-4c39-aa74-7e8f6a37e235',
        'Dubai Healthcare Network',
        'dubai-healthcare',
        'system',
        'system',
        true
      )
    `);
    
    // 2. Create hospital with organization_id
    log.info('Creating hospital...', 'SETUP');
    await db.execute(sql`
      INSERT INTO hospitals (id, name, address, contact_info, organization_id, code, is_main_branch)
      VALUES (
        'f155b026-01bd-4212-94f3-e7aedef2801d',
        'Dubai Central Hospital',
        '123 Healthcare Blvd, Dubai, UAE',
        '{"phone": "+971-4-123-4567", "email": "admin@dubaihospital.ae"}'::jsonb,
        '0d375139-d17c-4c39-aa74-7e8f6a37e235',
        'HOSP-001',
        true
      )
    `);
    
    // 3. Create test users with proper password hash
    const password = 'Test@123456'; // Common password for all test users
    // Using a simple hash for testing - in production use bcrypt
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    
    const testUsers = [
      {
        id: 'admin-001',
        email: 'admin@demo.com',
        name: 'Admin User',
        role: 'admin'
      },
      {
        id: 'operator-001',
        email: 'operator@demo.com',
        name: 'John Cena',
        role: 'operator'
      },
      {
        id: 'nurse-001',
        email: 'doremon@gmail.com',
        name: 'Nurse Doremon',
        role: 'nurse'
      },
      {
        id: 'doctor-001',
        email: 'johndoe@gmail.com',
        name: 'Dr. John Doe',
        role: 'doctor'
      },
      {
        id: 'head-doctor-001',
        email: 'saipramod273@gmail.com',
        name: 'Dr. Sai Pramod',
        role: 'head_doctor'
      }
    ];
    
    log.info('Creating test users...', 'SETUP');
    for (const user of testUsers) {
      await db.execute(sql`
        INSERT INTO "user" (
          id, email, name, role, 
          email_verified, image, 
          created_at, updated_at,
          organization_id, default_hospital_id,
          needs_profile_completion
        )
        VALUES (
          ${user.id},
          ${user.email},
          ${user.name},
          ${user.role},
          true,
          null,
          NOW(),
          NOW(),
          '0d375139-d17c-4c39-aa74-7e8f6a37e235',
          'f155b026-01bd-4212-94f3-e7aedef2801d',
          false
        )
      `);
      
      // Create account for authentication
      await db.execute(sql`
        INSERT INTO account (
          id, user_id, provider_id, account_id,
          password, salt, access_token,
          created_at, updated_at
        )
        VALUES (
          ${user.id + '-account'},
          ${user.id},
          'credential',
          ${user.email},
          ${hashedPassword},
          'salt',
          null,
          NOW(),
          NOW()
        )
      `);
      
      // Create healthcare user profile
      if (user.role !== 'admin') {
        await db.execute(sql`
          INSERT INTO healthcare_users (
            user_id, hospital_id, license_number,
            department, specialization, is_on_duty
          )
          VALUES (
            ${user.id},
            'f155b026-01bd-4212-94f3-e7aedef2801d',
            ${user.role.toUpperCase() + '-' + Math.random().toString(36).substr(2, 9)},
            ${user.role === 'operator' ? 'Emergency Response' : 
              user.role === 'nurse' ? 'General Ward' :
              user.role === 'doctor' ? 'Internal Medicine' : 'Administration'},
            ${user.role === 'operator' ? 'Emergency Dispatch' :
              user.role === 'nurse' ? 'Critical Care' :
              user.role === 'doctor' ? 'General Practice' : 'Hospital Management'},
            true
          )
        `);
      }
      
      // Add to organization members
      await db.execute(sql`
        INSERT INTO organization_member (
          id, organization_id, user_id, role,
          created_at, is_active
        )
        VALUES (
          ${user.id + '-member'},
          '0d375139-d17c-4c39-aa74-7e8f6a37e235',
          ${user.id},
          ${user.role === 'admin' ? 'admin' : 'member'},
          NOW(),
          true
        )
      `);
      
      log.info(`Created user: ${user.email} (${user.role})`, 'SETUP');
    }
    
    // 4. Create some test alerts
    log.info('Creating test alerts...', 'SETUP');
    await db.execute(sql`
      INSERT INTO alerts (
        id, room_number, alert_type, urgency_level,
        description, created_by, hospital_id,
        status, created_at
      )
      VALUES 
      (
        gen_random_uuid(),
        '101',
        'code_blue',
        5,
        'Patient in cardiac arrest - immediate response required',
        'nurse-001',
        'f155b026-01bd-4212-94f3-e7aedef2801d',
        'active',
        NOW()
      ),
      (
        gen_random_uuid(),
        '203',
        'nurse_assistance',
        3,
        'Patient needs assistance with mobility',
        'nurse-001',
        'f155b026-01bd-4212-94f3-e7aedef2801d',
        'active',
        NOW() - INTERVAL '10 minutes'
      )
    `);
    
    // 5. Create departments
    log.info('Creating departments...', 'SETUP');
    await db.execute(sql`
      INSERT INTO departments (
        id, hospital_id, name, description,
        head_doctor_id, is_active
      )
      VALUES
      (
        gen_random_uuid(),
        'f155b026-01bd-4212-94f3-e7aedef2801d',
        'Emergency',
        'Emergency Department',
        'head-doctor-001',
        true
      ),
      (
        gen_random_uuid(),
        'f155b026-01bd-4212-94f3-e7aedef2801d',
        'General Ward',
        'General Patient Care',
        'head-doctor-001',
        true
      )
    `);
    
    // Commit transaction
    await db.execute(sql`COMMIT`);
    
    log.info('✅ Test data setup complete!', 'SETUP');
    log.info('', 'SETUP');
    log.info('Test Credentials:', 'SETUP');
    log.info('================', 'SETUP');
    log.info('Email                    | Password     | Role', 'SETUP');
    log.info('-----------------------------------------', 'SETUP');
    log.info('admin@demo.com          | Test@123456  | Admin', 'SETUP');
    log.info('operator@demo.com       | Test@123456  | Operator', 'SETUP');
    log.info('doremon@gmail.com       | Test@123456  | Nurse', 'SETUP');
    log.info('johndoe@gmail.com       | Test@123456  | Doctor', 'SETUP');
    log.info('saipramod273@gmail.com  | Test@123456  | Head Doctor', 'SETUP');
    log.info('', 'SETUP');
    log.info('Organization: Dubai Healthcare Network', 'SETUP');
    log.info('Hospital: Dubai Central Hospital', 'SETUP');
    
  } catch (error) {
    await db.execute(sql`ROLLBACK`);
    log.error('Setup failed:', 'SETUP', error);
    throw error;
  }
}

// Run the setup
setupTestUsers().catch(console.error);