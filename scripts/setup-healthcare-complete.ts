#!/usr/bin/env bun
import { db } from '@/src/db';
import { sql, eq } from 'drizzle-orm';
import { log } from '@/lib/core/debug/logger';
import { user } from '@/src/db/schema';

async function setupHealthcareComplete() {
  const DATABASE_URL = process.env.DATABASE_URL || process.env.LOCAL_DATABASE_URL || 'postgresql://myexpo:myexpo123@localhost:5432/myexpo_dev';
  const isLocal = DATABASE_URL.includes('localhost') || DATABASE_URL.includes('127.0.0.1');
  
  log.info('Setting up complete healthcare tables...', 'SETUP');
  log.info(`Environment: ${process.env.APP_ENV || 'local'}`, 'SETUP');
  log.info(`Database: ${isLocal ? 'Local PostgreSQL' : 'Neon Cloud'}`, 'SETUP');
  
  try {
    // Create hospitals table
    log.info('Creating hospitals table...', 'SETUP');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS hospitals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        address TEXT,
        contact_info JSONB,
        settings JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Create healthcare_users table
    log.info('Creating healthcare_users table...', 'SETUP');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS healthcare_users (
        user_id TEXT PRIMARY KEY REFERENCES "user"(id),
        hospital_id VARCHAR(255) NOT NULL,
        license_number VARCHAR(100),
        department VARCHAR(100),
        specialization VARCHAR(100),
        is_on_duty BOOLEAN DEFAULT false,
        shift_start_time TIMESTAMP,
        shift_end_time TIMESTAMP
      )
    `);
    
    // Create alerts table with all columns
    log.info('Creating alerts table...', 'SETUP');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS alerts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        room_number VARCHAR(10) NOT NULL,
        alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('cardiac_arrest', 'code_blue', 'fire', 'security', 'medical_emergency')),
        urgency_level INTEGER NOT NULL CHECK (urgency_level BETWEEN 1 AND 5),
        description TEXT,
        created_by TEXT REFERENCES "user"(id) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        status VARCHAR(20) DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'acknowledged', 'resolved')),
        acknowledged_by TEXT REFERENCES "user"(id),
        acknowledged_at TIMESTAMP,
        escalation_level INTEGER DEFAULT 1,
        current_escalation_tier INTEGER DEFAULT 1,
        next_escalation_at TIMESTAMP,
        resolved_at TIMESTAMP,
        hospital_id UUID REFERENCES hospitals(id) NOT NULL,
        patient_id UUID,
        handover_notes TEXT,
        response_metrics JSONB
      )
    `);
    
    // Create healthcare_audit_logs table with proper constraints
    log.info('Creating healthcare_audit_logs table...', 'SETUP');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS healthcare_audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT REFERENCES "user"(id) NOT NULL,
        action VARCHAR(100) NOT NULL CHECK (action IN (
          'alert_created', 'alert_acknowledged', 'alert_escalated', 'alert_resolved', 
          'alert_transferred', 'bulk_alert_acknowledged', 'user_login', 'user_logout', 
          'permission_changed', 'role_changed', 'patient_created', 'patient_updated', 
          'patient_discharged', 'vitals_recorded', 'care_team_assigned', 
          'shift_started', 'shift_ended'
        )),
        entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('alert', 'user', 'system', 'permission', 'patient')),
        entity_id UUID NOT NULL,
        timestamp TIMESTAMP DEFAULT NOW(),
        metadata JSONB,
        success BOOLEAN DEFAULT true,
        error_message TEXT,
        ip_address VARCHAR(45),
        user_agent TEXT,
        hospital_id UUID REFERENCES hospitals(id)
      )
    `);
    
    // Create alert_escalations table
    log.info('Creating alert_escalations table...', 'SETUP');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS alert_escalations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        alert_id UUID REFERENCES alerts(id) NOT NULL,
        from_role VARCHAR(50) NOT NULL,
        to_role VARCHAR(50) NOT NULL,
        escalated_at TIMESTAMP DEFAULT NOW(),
        reason VARCHAR(255)
      )
    `);
    
    // Create alert_acknowledgments table
    log.info('Creating alert_acknowledgments table...', 'SETUP');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS alert_acknowledgments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        alert_id UUID REFERENCES alerts(id) NOT NULL,
        user_id TEXT REFERENCES "user"(id) NOT NULL,
        acknowledged_at TIMESTAMP DEFAULT NOW(),
        response_time_seconds INTEGER,
        notes TEXT,
        urgency_assessment VARCHAR(20),
        response_action VARCHAR(20),
        estimated_response_time INTEGER,
        delegated_to TEXT REFERENCES "user"(id)
      )
    `);
    
    // Create departments table
    log.info('Creating departments table...', 'SETUP');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS departments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        hospital_id UUID REFERENCES hospitals(id) NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        head_doctor_id TEXT REFERENCES "user"(id),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Create shift_schedules table
    log.info('Creating shift_schedules table...', 'SETUP');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS shift_schedules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT REFERENCES "user"(id) NOT NULL,
        hospital_id UUID REFERENCES hospitals(id) NOT NULL,
        department_id UUID REFERENCES departments(id),
        shift_date TIMESTAMP NOT NULL,
        shift_start_time TIMESTAMP NOT NULL,
        shift_end_time TIMESTAMP NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Create alert_metrics table
    log.info('Creating alert_metrics table...', 'SETUP');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS alert_metrics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        hospital_id UUID REFERENCES hospitals(id) NOT NULL,
        date TIMESTAMP NOT NULL,
        alert_type VARCHAR(50) NOT NULL,
        total_alerts INTEGER DEFAULT 0,
        average_response_time INTEGER,
        average_resolution_time INTEGER,
        escalation_count INTEGER DEFAULT 0,
        acknowledged_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Create patient_alerts table
    log.info('Creating patient_alerts table...', 'SETUP');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS patient_alerts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        patient_id UUID NOT NULL,
        alert_id UUID REFERENCES alerts(id) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Create alert_timeline_events table
    log.info('Creating alert_timeline_events table...', 'SETUP');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS alert_timeline_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        alert_id UUID REFERENCES alerts(id) NOT NULL,
        event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
          'created', 'viewed', 'acknowledged', 'escalated', 
          'transferred', 'resolved', 'reopened', 'commented'
        )),
        event_time TIMESTAMP DEFAULT NOW(),
        user_id TEXT REFERENCES "user"(id),
        description TEXT,
        metadata JSONB
      )
    `);
    
    // Create indexes for performance
    log.info('Creating indexes...', 'SETUP');
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
      CREATE INDEX IF NOT EXISTS idx_alerts_hospital_id ON alerts(hospital_id);
      CREATE INDEX IF NOT EXISTS idx_healthcare_users_hospital_id ON healthcare_users(hospital_id);
      CREATE INDEX IF NOT EXISTS idx_healthcare_users_is_on_duty ON healthcare_users(is_on_duty);
      CREATE INDEX IF NOT EXISTS idx_healthcare_audit_logs_user_id ON healthcare_audit_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_healthcare_audit_logs_action ON healthcare_audit_logs(action);
      CREATE INDEX IF NOT EXISTS idx_alert_acknowledgments_response_action ON alert_acknowledgments(response_action);
      CREATE INDEX IF NOT EXISTS idx_alert_acknowledgments_delegated_to ON alert_acknowledgments(delegated_to);
    `);
    
    log.info('All healthcare tables created successfully!', 'SETUP');
    
    // Insert default hospital
    log.info('Inserting default hospital...', 'SETUP');
    await db.execute(sql`
      INSERT INTO hospitals (id, name, address, contact_info)
      VALUES (
        'f155b026-01bd-4212-94f3-e7aedef2801d',
        'Dubai Central Hospital',
        '123 Healthcare Blvd, Dubai, UAE',
        '{"phone": "+971-4-123-4567", "email": "admin@dubaihospital.ae"}'::jsonb
      ) ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        address = EXCLUDED.address,
        contact_info = EXCLUDED.contact_info
    `);
    
    // Create departments
    log.info('Creating departments...', 'SETUP');
    const departments = ['Emergency', 'ICU', 'Cardiology', 'General Medicine', 'Surgery'];
    for (const dept of departments) {
      await db.execute(sql`
        INSERT INTO departments (hospital_id, name)
        VALUES ('f155b026-01bd-4212-94f3-e7aedef2801d', ${dept})
        ON CONFLICT DO NOTHING
      `);
    }
    
    // Update user roles
    log.info('Updating user roles for healthcare demo...', 'SETUP');
    const userUpdates = [
      { email: 'johncena@gmail.com', role: 'operator', name: 'John Operator' },
      { email: 'doremon@gmail.com', role: 'nurse', name: 'Nurse Doremon' },
      { email: 'johndoe@gmail.com', role: 'doctor', name: 'Dr. John Doe' },
      { email: 'saipramod273@gmail.com', role: 'head_doctor', name: 'Dr. Saipramod (Head)' },
    ];
    
    for (const update of userUpdates) {
      try {
        await db.update(user)
          .set({ 
            role: update.role,
            name: update.name 
          })
          .where(eq(user.email, update.email));
        
        log.info(`Updated ${update.email} to role: ${update.role}`, 'SETUP');
      } catch (error) {
        log.error(`Failed to update ${update.email}`, 'SETUP', error);
      }
    }
    
    // Create healthcare profiles
    log.info('Creating healthcare user profiles...', 'SETUP');
    await db.execute(sql`
      INSERT INTO healthcare_users (user_id, hospital_id, license_number, department, specialization)
      SELECT 
        id,
        'f155b026-01bd-4212-94f3-e7aedef2801d',
        CASE 
          WHEN role = 'doctor' THEN 'DOC-' || SUBSTRING(id::text, 1, 8)
          WHEN role = 'nurse' THEN 'NUR-' || SUBSTRING(id::text, 1, 8)
          WHEN role = 'head_doctor' THEN 'HDR-' || SUBSTRING(id::text, 1, 8)
          ELSE NULL
        END,
        CASE 
          WHEN role = 'doctor' THEN 'Emergency'
          WHEN role = 'nurse' THEN 'ICU'
          WHEN role = 'head_doctor' THEN 'Cardiology'
          WHEN role = 'operator' THEN 'Control Room'
          ELSE 'General'
        END,
        CASE 
          WHEN role = 'doctor' THEN 'Emergency Medicine'
          WHEN role = 'nurse' THEN 'Critical Care'
          WHEN role = 'head_doctor' THEN 'Cardiology'
          ELSE NULL
        END
      FROM "user" 
      WHERE role IN ('operator', 'doctor', 'nurse', 'head_doctor')
      ON CONFLICT (user_id) DO UPDATE SET
        hospital_id = EXCLUDED.hospital_id,
        department = EXCLUDED.department,
        specialization = EXCLUDED.specialization
    `);
    
    log.info('Healthcare setup completed successfully!', 'SETUP');
    log.info('', 'SETUP');
    log.info('✅ All tables created with proper constraints', 'SETUP');
    log.info('✅ Audit logging supports shift events', 'SETUP');
    log.info('✅ Indexes created for performance', 'SETUP');
    log.info('', 'SETUP');
    log.info('DEMO CREDENTIALS:', 'SETUP');
    log.info('================', 'SETUP');
    log.info('Operator: johncena@gmail.com', 'SETUP');
    log.info('Nurse: doremon@gmail.com', 'SETUP');
    log.info('Doctor: johndoe@gmail.com', 'SETUP');
    log.info('Head Doctor: saipramod273@gmail.com', 'SETUP');
    
  } catch (error) {
    log.error('Failed to setup healthcare tables', 'SETUP', error);
    throw error;
  }
}

// Only run if called directly
if (require.main === module) {
  setupHealthcareComplete()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Setup failed:', error);
      process.exit(1);
    });
}

export { setupHealthcareComplete };