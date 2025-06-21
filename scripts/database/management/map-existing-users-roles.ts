#!/usr/bin/env bun
import { db } from '@/src/db';
import { users } from '@/src/db/schema';
import { healthcareUsers, hospitals } from '@/src/db/healthcare-schema';
import { eq } from 'drizzle-orm';

async function mapExistingUsersRoles() {

  try {
    // First, list all existing users
    const allUsers = await db
      .select()
      .from(users)
      .orderBy(users.createdAt);

    allUsers.forEach((user, index) => {

    });

    if (allUsers.length < 2) {

      return;
    }
    
    // Get hospital for healthcare roles
    const [hospital] = await db
      .select()
      .from(hospitals)
      .limit(1);
    
    if (!hospital) {

      return;
    }

    // Map users to roles for testing
    const roleMappings = [
      { email: 'doremon@gmail.com', role: 'nurse', department: 'Emergency' },
      { email: 'saipramod273@gmail.com', role: 'doctor', department: 'Cardiology' },
    ];
    
    // If we have the exact emails requested, use them
    for (const mapping of roleMappings) {
      const user = allUsers.find(u => u.email === mapping.email);
      if (user) {

        // Update user role
        await db
          .update(users)
          .set({
            role: mapping.role,
            defaultHospitalId: hospital.id,
            updatedAt: new Date(),
          })
          .where(eq(users.id, user.id));
        
        // Check if already in healthcare_users
        const [existingHealthcare] = await db
          .select()
          .from(healthcareUsers)
          .where(eq(healthcareUsers.userId, user.id))
          .limit(1);
        
        if (!existingHealthcare) {
          await db.insert(healthcareUsers).values({
            userId: user.id,
            hospitalId: hospital.id,
            department: mapping.department,
            isOnDuty: true,
            shiftStart: new Date().toISOString(),
            currentLocation: 'Main Floor',
          });

        } else {
          await db
            .update(healthcareUsers)
            .set({
              hospitalId: hospital.id,
              department: mapping.department,
              isOnDuty: true,
            })
            .where(eq(healthcareUsers.userId, user.id));

        }
      } else {

      }
    }
    
    // If the requested emails don't exist, map existing users
    if (!allUsers.some(u => u.email === 'doremon@gmail.com')) {

      // Assign first user as nurse
      if (allUsers[0]) {

        await db
          .update(users)
          .set({
            role: 'nurse',
            defaultHospitalId: hospital.id,
            updatedAt: new Date(),
          })
          .where(eq(users.id, allUsers[0].id));
        
        // Add/update healthcare_users
        const [existing] = await db
          .select()
          .from(healthcareUsers)
          .where(eq(healthcareUsers.userId, allUsers[0].id))
          .limit(1);
        
        if (!existing) {
          await db.insert(healthcareUsers).values({
            userId: allUsers[0].id,
            hospitalId: hospital.id,
            department: 'Emergency',
            isOnDuty: true,
            shiftStart: new Date().toISOString(),
            currentLocation: 'Ward A',
          });
        }

      }
      
      // Assign second user as doctor if available
      if (allUsers[1]) {

        await db
          .update(users)
          .set({
            role: 'doctor',
            defaultHospitalId: hospital.id,
            updatedAt: new Date(),
          })
          .where(eq(users.id, allUsers[1].id));
        
        // Add/update healthcare_users
        const [existing] = await db
          .select()
          .from(healthcareUsers)
          .where(eq(healthcareUsers.userId, allUsers[1].id))
          .limit(1);
        
        if (!existing) {
          await db.insert(healthcareUsers).values({
            userId: allUsers[1].id,
            hospitalId: hospital.id,
            department: 'Cardiology',
            isOnDuty: true,
            shiftStart: new Date().toISOString(),
            currentLocation: 'ICU',
          });
        }

      }
    }
    
    // Show final user list with roles and permissions

    const updatedUsers = await db
      .select({
        email: users.email,
        role: users.role,
        hospitalId: users.defaultHospitalId,
      })
      .from(users)
      .orderBy(users.email);
    
    for (const user of updatedUsers) {

      // Show permissions based on role
      switch (user.role) {
        case 'nurse':

          break;
        case 'doctor':

          break;
        case 'operator':

          break;
        case 'head_nurse':
        case 'head_doctor':

          break;
        case 'admin':

          break;
        case 'manager':

          break;
        default:

      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

mapExistingUsersRoles();