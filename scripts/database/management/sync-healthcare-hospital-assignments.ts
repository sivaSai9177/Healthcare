import { db } from '@/src/db';
import { users } from '@/src/db/schema';
import { healthcareUsers } from '@/src/db/healthcare-schema';
import { eq, and, isNull, or } from 'drizzle-orm';
import { logger } from '@/lib/core/debug/unified-logger';

async function syncHealthcareHospitalAssignments() {

  try {
    // Get all healthcare users who have a hospital in healthcare_users but not in user table
    const healthcareRoles = ['nurse', 'doctor', 'healthcare_admin', 'head_nurse', 'head_doctor'];
    
    const usersToUpdate = await db
      .select({
        userId: users.id,
        userEmail: users.email,
        userRole: users.role,
        currentDefaultHospitalId: users.defaultHospitalId,
        healthcareHospitalId: healthcareUsers.hospitalId,
      })
      .from(users)
      .innerJoin(healthcareUsers, eq(users.id, healthcareUsers.userId))
      .where(
        and(
          or(
            ...healthcareRoles.map(role => eq(users.role, role))
          ),
          isNull(users.defaultHospitalId)
        )
      );

    // Update each user
    for (const user of usersToUpdate) {

      await db
        .update(users)
        .set({
          defaultHospitalId: user.healthcareHospitalId,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.userId));
      
      logger.info('Updated user hospital assignment', 'SYNC', {
        userId: user.userId,
        email: user.userEmail,
        role: user.userRole,
        hospitalId: user.healthcareHospitalId,
      });
    }

    // Verify the sync
    const verifyCount = await db
      .select({
        count: users.id,
      })
      .from(users)
      .innerJoin(healthcareUsers, eq(users.id, healthcareUsers.userId))
      .where(
        and(
          or(
            ...healthcareRoles.map(role => eq(users.role, role))
          ),
          isNull(users.defaultHospitalId)
        )
      );

  } catch (error) {
    console.error('Error syncing healthcare hospital assignments:', error);
    process.exit(1);
  }
}

// Run the sync
syncHealthcareHospitalAssignments()
  .then(() => {

    process.exit(0);
  })
  .catch((error) => {
    console.error('Sync failed:', error);
    process.exit(1);
  });