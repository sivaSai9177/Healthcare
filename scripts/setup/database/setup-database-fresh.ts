#!/usr/bin/env bun
import { db } from '@/src/db';
import { sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

async function setupDatabaseFresh() {

  try {
    // Step 1: Create core tables

    // Create user table

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "user" (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        email_verified BOOLEAN DEFAULT false,
        image TEXT,
        role TEXT DEFAULT 'user',
        organization_id UUID,
        default_hospital_id UUID,
        needs_profile_completion BOOLEAN DEFAULT true,
        phone_number TEXT,
        department TEXT,
        organization_name TEXT,
        job_title TEXT,
        bio TEXT,
        is_active BOOLEAN DEFAULT true,
        last_login_at TIMESTAMP,
        password_changed_at TIMESTAMP,
        failed_login_attempts INTEGER DEFAULT 0,
        locked_until TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        created_by TEXT,
        updated_by TEXT,
        deleted_at TIMESTAMP,
        two_factor_enabled BOOLEAN DEFAULT false
      )
    `);

    // Create organization table

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS organization (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE,
        type VARCHAR(50) DEFAULT 'company',
        size VARCHAR(50) DEFAULT 'small',
        industry VARCHAR(100),
        website VARCHAR(255),
        description TEXT,
        logo TEXT,
        email VARCHAR(255),
        phone VARCHAR(50),
        address TEXT,
        timezone VARCHAR(50) DEFAULT 'UTC',
        language VARCHAR(10) DEFAULT 'en',
        currency VARCHAR(10) DEFAULT 'USD',
        country VARCHAR(2),
        plan VARCHAR(50) DEFAULT 'free',
        plan_expires_at TIMESTAMP,
        trial_ends_at TIMESTAMP,
        status VARCHAR(50) DEFAULT 'active',
        metadata JSONB,
        created_by TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        deleted_at TIMESTAMP
      )
    `);

    // Create session table for auth

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS session (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Step 2: Create healthcare tables

    // Create hospitals table

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS hospitals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(50) NOT NULL,
        address TEXT,
        contact_info JSONB,
        settings JSONB,
        is_active BOOLEAN DEFAULT true,
        is_default BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create healthcare_users table

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS healthcare_users (
        user_id TEXT PRIMARY KEY REFERENCES "user"(id),
        hospital_id UUID NOT NULL,
        license_number VARCHAR(100),
        department VARCHAR(100),
        specialization VARCHAR(100),
        is_on_duty BOOLEAN DEFAULT false,
        shift_start_time TIMESTAMP,
        shift_end_time TIMESTAMP,
        current_location VARCHAR(100),
        shift_notes TEXT
      )
    `);

    // Create alerts table

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS alerts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        room_number VARCHAR(10) NOT NULL,
        alert_type VARCHAR(50) NOT NULL,
        urgency_level INTEGER NOT NULL CHECK (urgency_level BETWEEN 1 AND 5),
        description TEXT,
        created_by TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        status VARCHAR(20) DEFAULT 'active',
        acknowledged_by TEXT,
        acknowledged_at TIMESTAMP,
        escalation_level INTEGER DEFAULT 1,
        current_escalation_tier INTEGER DEFAULT 1,
        next_escalation_at TIMESTAMP,
        resolved_at TIMESTAMP,
        hospital_id UUID NOT NULL,
        patient_id UUID,
        handover_notes TEXT,
        response_metrics JSONB
      )
    `);

    // Create other healthcare tables

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS alert_acknowledgments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        alert_id UUID NOT NULL,
        user_id TEXT NOT NULL,
        acknowledged_at TIMESTAMP DEFAULT NOW(),
        response_time_seconds INTEGER,
        notes TEXT,
        urgency_assessment VARCHAR(50),
        response_action VARCHAR(100),
        estimated_response_time INTEGER,
        delegated_to TEXT
      )
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS alert_timeline_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        alert_id UUID NOT NULL,
        event_type VARCHAR(50) NOT NULL,
        user_id TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        description TEXT,
        metadata JSONB
      )
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS healthcare_audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL,
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(50),
        entity_id VARCHAR(255),
        hospital_id UUID,
        metadata JSONB,
        ip_address VARCHAR(50),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Step 3: Create indexes

    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_user_email ON "user"(email)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_user_org ON "user"(organization_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_alerts_hospital ON alerts(hospital_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_healthcare_users_hospital ON healthcare_users(hospital_id)`);

    // Step 4: Insert demo data

    // Create demo organization
    const orgId = uuidv4();
    await db.execute(sql`
      INSERT INTO organization (id, name, slug, type, size, industry, status)
      VALUES (
        ${orgId},
        'Demo Hospital Organization',
        'demo-hospital',
        'healthcare',
        'large',
        'Healthcare',
        'active'
      )
    `);

    // Create demo hospital
    const hospitalId = uuidv4();
    await db.execute(sql`
      INSERT INTO hospitals (id, organization_id, name, code, is_default, is_active)
      VALUES (
        ${hospitalId},
        ${orgId},
        'Demo General Hospital',
        'DGH',
        true,
        true
      )
    `);

    // Create demo users
    const users = [
      { id: uuidv4(), email: 'doremon@gmail.com', name: 'Nurse Doremon', role: 'nurse' },
      { id: uuidv4(), email: 'saipramod273@gmail.com', name: 'Dr. Sai Pramod', role: 'doctor' },
      { id: uuidv4(), email: 'operator@demo.com', name: 'Test Operator', role: 'operator' },
      { id: uuidv4(), email: 'admin@demo.com', name: 'Admin User', role: 'admin' },
    ];
    
    for (const user of users) {
      await db.execute(sql`
        INSERT INTO "user" (id, email, name, role, email_verified, organization_id, default_hospital_id, is_active, needs_profile_completion)
        VALUES (
          ${user.id},
          ${user.email},
          ${user.name},
          ${user.role},
          true,
          ${orgId},
          ${['nurse', 'doctor', 'operator'].includes(user.role) ? hospitalId : null},
          true,
          false
        )
      `);
      
      // Add healthcare users
      if (['nurse', 'doctor', 'operator'].includes(user.role)) {
        await db.execute(sql`
          INSERT INTO healthcare_users (user_id, hospital_id, department, is_on_duty)
          VALUES (
            ${user.id},
            ${hospitalId},
            ${user.role === 'nurse' ? 'Emergency' : user.role === 'doctor' ? 'Cardiology' : 'Operations'},
            true
          )
        `);
      }

    }
    
    // Create sample alerts
    const alerts = [
      { room: '101', type: 'medical_emergency', urgency: 2, desc: 'Patient requires immediate assistance' },
      { room: '205', type: 'code_blue', urgency: 1, desc: 'Cardiac arrest - Code Blue' },
      { room: '312', type: 'medical_emergency', urgency: 3, desc: 'Patient monitoring alert' },
    ];
    
    const nurseUserId = users.find(u => u.role === 'nurse')?.id;
    
    for (const alert of alerts) {
      await db.execute(sql`
        INSERT INTO alerts (room_number, alert_type, urgency_level, description, created_by, hospital_id, status)
        VALUES (
          ${alert.room},
          ${alert.type},
          ${alert.urgency},
          ${alert.desc},
          ${nurseUserId},
          ${hospitalId},
          'active'
        )
      `);
    }

  } catch (error) {
    console.error('\n❌ Setup failed:', error);
  }
  
  process.exit(0);
}

setupDatabaseFresh();