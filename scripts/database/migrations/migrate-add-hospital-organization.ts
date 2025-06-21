import { db } from '@/src/db';
import { hospitals, alerts } from '@/src/db/healthcare-schema';
import { users, organization } from '@/src/db/schema';
import { eq, isNull } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { log } from '@/lib/core/debug/unified-logger';

async function migrateHospitalOrganization() {
  try {
    log.info('Starting hospital-organization migration', 'MIGRATION');

    // Step 1: Get all organizations
    const organizations = await db.select().from(organization);
    log.info(`Found ${organizations.length} organizations`, 'MIGRATION');

    // Step 2: For each organization, create a default hospital if none exists
    for (const org of organizations) {
      // Check if organization already has a hospital
      const existingHospitals = await db
        .select()
        .from(hospitals)
        .where(eq(hospitals.organizationId, org.id));

      if (existingHospitals.length === 0) {
        // Create a default hospital for this organization
        const hospitalCode = org.slug || org.name.substring(0, 3).toUpperCase() + '-001';
        const [newHospital] = await db.insert(hospitals).values({
          organizationId: org.id,
          name: `${org.name} Hospital`,
          code: hospitalCode,
          isDefault: true,
          isActive: true,
          address: org.address,
          settings: {
            timezone: org.timezone,
            language: org.language,
            currency: org.currency,
          },
        }).returning();

        log.info(`Created default hospital for organization: ${org.name}`, 'MIGRATION', {
          organizationId: org.id,
          hospitalId: newHospital.id,
          hospitalName: newHospital.name,
        });

        // Step 3: Update all users in this organization to have this as default hospital
        await db
          .update(users)
          .set({ defaultHospitalId: newHospital.id })
          .where(eq(users.organizationId, org.id));

        log.info(`Updated users with default hospital`, 'MIGRATION', {
          organizationId: org.id,
          hospitalId: newHospital.id,
        });

        // Step 4: Migrate alerts - if alerts have hospitalId matching organizationId, update them
        // This handles the case where we were using organizationId as hospitalId
        const updatedAlerts = await db
          .update(alerts)
          .set({ hospitalId: newHospital.id })
          .where(eq(alerts.hospitalId, org.id))
          .returning();

        if (updatedAlerts.length > 0) {
          log.info(`Migrated ${updatedAlerts.length} alerts to new hospital`, 'MIGRATION', {
            organizationId: org.id,
            hospitalId: newHospital.id,
          });
        }
      } else {
        log.info(`Organization ${org.name} already has ${existingHospitals.length} hospitals`, 'MIGRATION');
        
        // Ensure there's a default hospital
        const defaultHospital = existingHospitals.find(h => h.isDefault);
        if (!defaultHospital && existingHospitals.length > 0) {
          // Set the first hospital as default
          await db
            .update(hospitals)
            .set({ isDefault: true })
            .where(eq(hospitals.id, existingHospitals[0].id));
          
          log.info(`Set default hospital for organization: ${org.name}`, 'MIGRATION');
        }
      }
    }

    // Step 5: Handle any orphaned alerts (alerts without valid hospitalId)
    const orphanedAlerts = await db
      .select()
      .from(alerts)
      .leftJoin(hospitals, eq(alerts.hospitalId, hospitals.id))
      .where(isNull(hospitals.id));

    if (orphanedAlerts.length > 0) {
      log.warn(`Found ${orphanedAlerts.length} orphaned alerts`, 'MIGRATION');
      // You might want to handle these based on your business logic
    }

    log.info('Hospital-organization migration completed successfully', 'MIGRATION');
  } catch (error) {
    log.error('Migration failed', 'MIGRATION', error);
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateHospitalOrganization()
    .then(() => {

      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

export { migrateHospitalOrganization };