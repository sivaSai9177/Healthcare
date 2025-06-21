#!/usr/bin/env bun
import { db } from '@/src/db';
import { sql } from 'drizzle-orm';
import { log } from '@/lib/core/debug/logger';

async function setupTestUsers() {
  const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8081';
  
  log.info('Setting up test users and healthcare data...', 'SETUP');
  
  try {
    // Start transaction
    await db.execute(sql`BEGIN`);
    
    // 1. Create organization
    log.info('Creating organization...', 'SETUP');
    await db.execute(sql`
      INSERT INTO organization (id, name, slug, type, size, status)
      VALUES (
        '0d375139-d17c-4c39-aa74-7e8f6a37e235',
        'Dubai Healthcare Network',
        'dubai-healthcare',
        'healthcare',
        'large',
        'active'
      )
      ON CONFLICT (id) DO NOTHING
    `);
    
    // 2. Create hospital with organization_id
    log.info('Creating hospital...', 'SETUP');
    await db.execute(sql`
      INSERT INTO hospitals (id, name, address, contact_info, organization_id, code, is_default)
      VALUES (
        'f155b026-01bd-4212-94f3-e7aedef2801d',
        'Dubai Central Hospital',
        '123 Healthcare Blvd, Dubai, UAE',
        '{"phone": "+971-4-123-4567", "email": "admin@dubaihospital.ae"}'::jsonb,
        '0d375139-d17c-4c39-aa74-7e8f6a37e235',
        'HOSP-001',
        true
      )
      ON CONFLICT (id) DO NOTHING
    `);
    
    // Commit transaction
    await db.execute(sql`COMMIT`);
    
    // 3. Create test users via Better Auth API
    const password = 'Test@123456'; // Common password for all test users
    
    const testUsers = [
      {
        email: 'admin@demo.com',
        name: 'Admin User',
        role: 'admin',
        department: 'Administration'
      },
      {
        email: 'operator@demo.com',
        name: 'John Cena',
        role: 'operator',
        department: 'Emergency Response'
      },
      {
        email: 'doremon@gmail.com',
        name: 'Nurse Doremon',
        role: 'nurse',
        department: 'General Ward'
      },
      {
        email: 'johndoe@gmail.com',
        name: 'Dr. John Doe',
        role: 'doctor',
        department: 'Internal Medicine'
      },
      {
        email: 'saipramod273@gmail.com',
        name: 'Dr. Sai Pramod',
        role: 'head_doctor',
        department: 'Administration'
      }
    ];
    
    log.info('Creating test users via API...', 'SETUP');
    
    for (const user of testUsers) {
      try {
        // Create user via auth API
        const response = await fetch(`${API_URL}/api/auth/sign-up/email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: user.email,
            password: password,
            name: user.name
          })
        });
        
        if (!response.ok) {
          const error = await response.text();
          log.warn(`Failed to create ${user.email}: ${error}`, 'SETUP');
          continue;
        }
        
        const result = await response.json();
        const userId = result.user.id;
        
        // Update user with role and organization
        await db.execute(sql`
          UPDATE "user" 
          SET 
            role = ${user.role},
            organization_id = '0d375139-d17c-4c39-aa74-7e8f6a37e235',
            default_hospital_id = 'f155b026-01bd-4212-94f3-e7aedef2801d',
            needs_profile_completion = false,
            email_verified = true
          WHERE id = ${userId}
        `);
        
        // Create healthcare user profile
        if (user.role !== 'admin') {
          await db.execute(sql`
            INSERT INTO healthcare_users (
              user_id, hospital_id, license_number,
              department, specialization, is_on_duty
            )
            VALUES (
              ${userId},
              'f155b026-01bd-4212-94f3-e7aedef2801d',
              ${user.role.toUpperCase() + '-' + Math.random().toString(36).substr(2, 9)},
              ${user.department},
              ${user.role === 'operator' ? 'Emergency Dispatch' :
                user.role === 'nurse' ? 'Critical Care' :
                user.role === 'doctor' ? 'General Practice' : 'Hospital Management'},
              true
            )
            ON CONFLICT (user_id) DO NOTHING
          `);
        }
        
        // Add to organization members
        await db.execute(sql`
          INSERT INTO organization_member (
            id, organization_id, user_id, role,
            created_at, is_active
          )
          VALUES (
            gen_random_uuid(),
            '0d375139-d17c-4c39-aa74-7e8f6a37e235',
            ${userId},
            ${user.role === 'admin' ? 'admin' : 'member'},
            NOW(),
            true
          )
          ON CONFLICT DO NOTHING
        `);
        
        log.info(`✅ Created user: ${user.email} (${user.role})`, 'SETUP');
      } catch (error) {
        log.error(`Failed to create user ${user.email}:`, 'SETUP', error);
      }
    }
    
    // 4. Create some test alerts
    log.info('Creating test alerts...', 'SETUP');
    
    // Get nurse user ID
    const nurseResult = await db.execute(sql`
      SELECT id FROM "user" WHERE email = 'doremon@gmail.com' LIMIT 1
    `);
    
    if (nurseResult.rows.length > 0) {
      const nurseId = nurseResult.rows[0].id;
      
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
          ${nurseId},
          'f155b026-01bd-4212-94f3-e7aedef2801d',
          'active',
          NOW()
        ),
        (
          gen_random_uuid(),
          '203',
          'medical_emergency',
          3,
          'Patient needs immediate medical assistance',
          ${nurseId},
          'f155b026-01bd-4212-94f3-e7aedef2801d',
          'active',
          NOW() - INTERVAL '10 minutes'
        )
      `);
    }
    
    // 5. Create departments
    log.info('Creating departments...', 'SETUP');
    
    // Get head doctor ID
    const headDoctorResult = await db.execute(sql`
      SELECT id FROM "user" WHERE email = 'saipramod273@gmail.com' LIMIT 1
    `);
    
    if (headDoctorResult.rows.length > 0) {
      const headDoctorId = headDoctorResult.rows[0].id;
      
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
          ${headDoctorId},
          true
        ),
        (
          gen_random_uuid(),
          'f155b026-01bd-4212-94f3-e7aedef2801d',
          'General Ward',
          'General Patient Care',
          ${headDoctorId},
          true
        )
        ON CONFLICT DO NOTHING
      `);
    }
    
    log.info('', 'SETUP');
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