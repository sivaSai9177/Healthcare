import 'dotenv/config';
import { db } from '@/src/db';
import { users, healthcareUsers, hospitals } from '@/src/db/schema';
import { eq, isNull } from 'drizzle-orm';
import { log } from '@/lib/core/debug/logger';

async function updateUsersWithOrganization() {
  log.info('Starting user organization update', 'MIGRATION');
  
  try {
    // First, get the default healthcare organization (hospital)
    const [defaultHospital] = await db
      .select()
      .from(hospitals)
      .limit(1);
    
    if (!defaultHospital) {
      throw new Error('No hospital found in database. Please run setup-healthcare-complete.ts first.');
    }
    
    log.info(`Using default hospital: ${defaultHospital.name} (${defaultHospital.id})`, 'MIGRATION');
    
    // Get all users without organizationId
    const usersWithoutOrg = await db
      .select()
      .from(users)
      .where(isNull(users.organizationId));
    
    log.info(`Found ${usersWithoutOrg.length} users without organizationId`, 'MIGRATION');
    
    // Update each user with the default hospital as their organization
    let updatedCount = 0;
    let errorCount = 0;
    
    for (const user of usersWithoutOrg) {
      try {
        // Update user with organizationId
        await db
          .update(users)
          .set({ 
            organizationId: defaultHospital.id,
            updatedAt: new Date()
          })
          .where(eq(users.id, user.id));
        
        // If user has a healthcare role, ensure they have a healthcare_users record
        if (['doctor', 'nurse', 'operator', 'head_doctor'].includes(user.role)) {
          // Check if healthcare user record exists
          const [existingHealthcareUser] = await db
            .select()
            .from(healthcareUsers)
            .where(eq(healthcareUsers.userId, user.id))
            .limit(1);
          
          if (!existingHealthcareUser) {
            // Create healthcare user record
            await db.insert(healthcareUsers).values({
              userId: user.id,
              hospitalId: defaultHospital.id,
              isOnDuty: false,
              // Set default values based on role
              department: user.role === 'operator' ? 'Operations' : 'General',
              specialization: user.role === 'doctor' || user.role === 'head_doctor' ? 'General Medicine' : null,
            });
            
            log.info(`Created healthcare user record for ${user.email} (${user.role})`, 'MIGRATION');
          } else if (existingHealthcareUser.hospitalId !== defaultHospital.id) {
            // Update hospitalId to match organizationId
            await db
              .update(healthcareUsers)
              .set({ hospitalId: defaultHospital.id })
              .where(eq(healthcareUsers.userId, user.id));
            
            log.info(`Updated hospitalId for healthcare user ${user.email}`, 'MIGRATION');
          }
        }
        
        updatedCount++;
        log.info(`Updated user ${user.email} with organizationId ${defaultHospital.id}`, 'MIGRATION');
      } catch (error) {
        errorCount++;
        log.error(`Failed to update user ${user.email}`, 'MIGRATION', error);
      }
    }
    
    log.info(`Migration completed: ${updatedCount} users updated, ${errorCount} errors`, 'MIGRATION');
    
    // Verify the update
    const remainingUsersWithoutOrg = await db
      .select({ count: { $count: users.id } })
      .from(users)
      .where(isNull(users.organizationId));
    
    log.info(`Remaining users without organizationId: ${remainingUsersWithoutOrg[0].count}`, 'MIGRATION');
    
  } catch (error) {
    log.error('Failed to update users with organization', 'MIGRATION', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

// Run the migration
updateUsersWithOrganization().catch((error) => {
  log.error('Migration failed', 'MIGRATION', error);
  process.exit(1);
});