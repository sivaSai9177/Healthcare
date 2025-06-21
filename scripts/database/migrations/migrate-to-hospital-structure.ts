#!/usr/bin/env tsx
import { exit } from 'process';
import { db } from '@/src/db';
import { users } from '@/src/db/schema';
import { hospitals, healthcareUsers } from '@/src/db/healthcare-schema';
import { organization } from '@/src/db/organization-schema';
import { eq, and, isNull } from 'drizzle-orm';
import { log } from '@/lib/core/debug/unified-logger';

async function migrateToHospitalStructure() {
  log.info('Starting migration to hospital structure', 'MIGRATION');
  
  try {
    // Step 1: Ensure all organizations have at least one hospital
    log.info('Step 1: Checking organizations for hospitals', 'MIGRATION');
    
    const organizations = await db.select().from(organization);
    log.info(`Found ${organizations.length} organizations`, 'MIGRATION');
    
    for (const org of organizations) {
      // Check if organization has any hospitals
      const existingHospitals = await db
        .select()
        .from(hospitals)
        .where(eq(hospitals.organizationId, org.id));
      
      if (existingHospitals.length === 0) {
        // Create a default hospital
        const hospitalCode = `${org.slug || org.name.substring(0, 3).toUpperCase()}-001`.replace(/[^A-Z0-9]/g, '');
        
        const [newHospital] = await db.insert(hospitals).values({
          organizationId: org.id,
          name: `${org.name} Hospital`,
          code: hospitalCode,
          isDefault: true,
          isActive: true,
          address: org.address,
          settings: {
            timezone: org.timezone || 'UTC',
            language: org.language || 'en',
            currency: org.currency || 'USD',
          },
        }).returning();
        
        log.info(`Created default hospital for organization: ${org.name}`, 'MIGRATION', {
          hospitalId: newHospital.id,
          hospitalCode: newHospital.code,
        });
      } else {
        // Ensure at least one hospital is marked as default
        const hasDefault = existingHospitals.some(h => h.isDefault);
        if (!hasDefault && existingHospitals.length > 0) {
          await db
            .update(hospitals)
            .set({ isDefault: true })
            .where(eq(hospitals.id, existingHospitals[0].id));
          
          log.info(`Set default hospital for organization: ${org.name}`, 'MIGRATION');
        }
      }
    }
    
    // Step 2: Migrate healthcare users to have hospital assignments
    log.info('Step 2: Migrating healthcare users', 'MIGRATION');
    
    const healthcareRoles = ['doctor', 'nurse', 'head_doctor', 'operator'];
    const healthcareUsersToMigrate = await db
      .select()
      .from(users)
      .where(
        and(
          // @ts-ignore - role comparison
          users.role.in(healthcareRoles),
          isNull(users.defaultHospitalId)
        )
      );
    
    log.info(`Found ${healthcareUsersToMigrate.length} healthcare users without hospital assignment`, 'MIGRATION');
    
    for (const user of healthcareUsersToMigrate) {
      if (!user.organizationId) {
        log.warn(`User ${user.email} has no organization, skipping`, 'MIGRATION');
        continue;
      }
      
      // Find default hospital for user's organization
      const [defaultHospital] = await db
        .select()
        .from(hospitals)
        .where(
          and(
            eq(hospitals.organizationId, user.organizationId),
            eq(hospitals.isDefault, true)
          )
        )
        .limit(1);
      
      if (defaultHospital) {
        // Update user with default hospital
        await db
          .update(users)
          .set({
            defaultHospitalId: defaultHospital.id,
            updatedAt: new Date(),
          })
          .where(eq(users.id, user.id));
        
        // Create healthcare user profile if doesn't exist
        const [existingProfile] = await db
          .select()
          .from(healthcareUsers)
          .where(eq(healthcareUsers.userId, user.id))
          .limit(1);
        
        if (!existingProfile) {
          await db.insert(healthcareUsers).values({
            userId: user.id,
            hospitalId: defaultHospital.id,
            department: user.department,
            isOnDuty: false,
          });
        } else {
          // Update existing profile with hospital
          await db
            .update(healthcareUsers)
            .set({
              hospitalId: defaultHospital.id,
              updatedAt: new Date(),
            })
            .where(eq(healthcareUsers.userId, user.id));
        }
        
        log.info(`Assigned hospital to user: ${user.email}`, 'MIGRATION', {
          hospitalId: defaultHospital.id,
          hospitalName: defaultHospital.name,
        });
      } else {
        log.warn(`No default hospital found for organization ${user.organizationId}`, 'MIGRATION');
      }
    }
    
    // Step 3: Update alerts to use hospital IDs
    log.info('Step 3: Updating alerts table', 'MIGRATION');
    
    try {
      // Check if alerts table has hospitalId column
      const alertsCheck = await db.execute(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'alerts' 
        AND column_name = 'hospital_id'
      `);
      
      if (alertsCheck.rowCount === 0) {
        // Add hospital_id column if it doesn't exist
        await db.execute(`
          ALTER TABLE alerts 
          ADD COLUMN IF NOT EXISTS hospital_id UUID
        `);
        
        log.info('Added hospital_id column to alerts table', 'MIGRATION');
      }
      
      // Update alerts that have organizationId but no hospitalId
      await db.execute(`
        UPDATE alerts a
        SET hospital_id = h.id
        FROM hospitals h
        WHERE a.hospital_id IS NULL
        AND a.hospital_id::text = h.organization_id::text
        AND h.is_default = true
      `);
      
      log.info('Updated alerts with hospital IDs', 'MIGRATION');
    } catch (error) {
      log.error('Error updating alerts table', 'MIGRATION', error);
    }
    
    // Step 4: Summary
    log.info('Migration completed successfully', 'MIGRATION');
    
    // Print summary
    const hospitalCount = await db.select().from(hospitals);
    const usersWithHospitals = await db
      .select()
      .from(users)
      .where(
        and(
          // @ts-ignore
          users.role.in(healthcareRoles),
          users.defaultHospitalId.isNotNull()
        )
      );
    
    log.info('Migration Summary', 'MIGRATION', {
      totalHospitals: hospitalCount.length,
      healthcareUsersWithHospitals: usersWithHospitals.length,
      totalHealthcareUsers: healthcareUsersToMigrate.length + usersWithHospitals.length,
    });
    
  } catch (error) {
    log.error('Migration failed', 'MIGRATION', error);
    throw error;
  }
}

// Run the migration
migrateToHospitalStructure()
  .then(() => {
    log.info('Migration completed successfully', 'MIGRATION');
    exit(0);
  })
  .catch(error => {
    log.error('Migration failed', 'MIGRATION', error);
    exit(1);
  });