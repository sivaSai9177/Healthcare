import { db } from '@/src/db';
import { hospitals } from '@/src/db/healthcare-schema';
import { organization } from '@/src/db/organization-schema';
import { users } from '@/src/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { log } from '@/lib/core/debug/unified-logger';

async function ensureOrganizationHospitals() {
  try {
    log.info('Starting organization-hospital verification', 'SETUP');

    // Get all organizations
    const organizations = await db.select().from(organization);
    log.info(`Found ${organizations.length} organizations to check`, 'SETUP');

    let hospitalsCreated = 0;
    let hospitalsExisting = 0;

    for (const org of organizations) {
      // Check if organization has any hospitals
      const existingHospitals = await db
        .select()
        .from(hospitals)
        .where(eq(hospitals.organizationId, org.id));

      if (existingHospitals.length === 0) {
        // Create a default hospital
        const hospitalCode = (org.slug || org.name.substring(0, 3).toUpperCase()).replace(/[^A-Z0-9]/g, '') + '-001';
        
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

        log.info(`Created default hospital for organization`, 'SETUP', {
          organizationName: org.name,
          hospitalId: newHospital.id,
          hospitalCode: newHospital.code,
        });

        // Update users in this organization to have default hospital
        const updateResult = await db
          .update(users)
          .set({ defaultHospitalId: newHospital.id })
          .where(
            and(
              eq(users.organizationId, org.id),
              isNull(users.defaultHospitalId)
            )
          );

        hospitalsCreated++;
      } else {
        hospitalsExisting++;

        // Ensure there's a default hospital
        const defaultHospital = existingHospitals.find(h => h.isDefault);
        if (!defaultHospital) {
          // Set the first hospital as default
          await db
            .update(hospitals)
            .set({ isDefault: true })
            .where(eq(hospitals.id, existingHospitals[0].id));
          
          log.info(`Set default hospital for organization`, 'SETUP', {
            organizationName: org.name,
            hospitalId: existingHospitals[0].id,
          });
        }

        // Update users without a default hospital
        const hospitalForUsers = defaultHospital || existingHospitals[0];
        await db
          .update(users)
          .set({ defaultHospitalId: hospitalForUsers.id })
          .where(
            and(
              eq(users.organizationId, org.id),
              isNull(users.defaultHospitalId)
            )
          );
      }
    }

    log.info('Organization-hospital verification completed', 'SETUP', {
      organizationsProcessed: organizations.length,
      hospitalsCreated,
      hospitalsExisting,
    });

    return {
      success: true,
      organizationsProcessed: organizations.length,
      hospitalsCreated,
      hospitalsExisting,
    };
  } catch (error) {
    log.error('Failed to ensure organization hospitals', 'SETUP', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  ensureOrganizationHospitals()
    .then((result) => {

      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Setup failed:', error);
      process.exit(1);
    });
}

export { ensureOrganizationHospitals };