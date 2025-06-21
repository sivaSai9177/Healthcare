#!/usr/bin/env bun
import { db } from '@/src/db';
import { users } from '@/src/db/schema';
import { healthcareUsers, hospitals } from '@/src/db/healthcare-schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

// Test users for each role
const testUsers = [
  {
    email: 'doremon@gmail.com',
    name: 'Doremon Test',
    role: 'nurse',
    department: 'Emergency',
  },
  {
    email: 'saipramod273@gmail.com', 
    name: 'Sai Pramod',
    role: 'doctor',
    department: 'Cardiology',
  },
  {
    email: 'operator@test.com',
    name: 'Test Operator',
    role: 'operator',
    department: 'Operations',
  },
  {
    email: 'headdoctor@test.com',
    name: 'Head Doctor',
    role: 'head_doctor',
    department: 'Administration',
  },
  {
    email: 'headnurse@test.com',
    name: 'Head Nurse',
    role: 'head_nurse',
    department: 'Nursing',
  },
  {
    email: 'admin@test.com',
    name: 'Admin User',
    role: 'admin',
    department: null,
  },
  {
    email: 'manager@test.com',
    name: 'Manager User',
    role: 'manager',
    department: null,
  },
  {
    email: 'regularuser@test.com',
    name: 'Regular User',
    role: 'user',
    department: null,
  }
];

async function createTestUsersAllRoles() {

  try {
    // Get first organization and hospital
    const [org] = await db.execute<any>(`SELECT id, name FROM organization LIMIT 1;`);
    if (!org) {

      return;
    }
    
    const [hospital] = await db
      .select()
      .from(hospitals)
      .where(eq(hospitals.organizationId, org.id))
      .limit(1);
    
    if (!hospital) {

      return;
    }

    for (const testUser of testUsers) {

      try {
        // Check if user already exists
        const [existingUser] = await db
          .select()
          .from(users)
          .where(eq(users.email, testUser.email))
          .limit(1);
        
        if (existingUser) {

          // Update user
          await db
            .update(users)
            .set({
              role: testUser.role,
              defaultHospitalId: ['nurse', 'doctor', 'operator', 'head_doctor', 'head_nurse'].includes(testUser.role) 
                ? hospital.id 
                : null,
              organizationId: org.id,
              updatedAt: new Date(),
            })
            .where(eq(users.id, existingUser.id));
          
          // Handle healthcare_users entry
          if (['nurse', 'doctor', 'operator', 'head_doctor', 'head_nurse'].includes(testUser.role)) {
            const [healthcareEntry] = await db
              .select()
              .from(healthcareUsers)
              .where(eq(healthcareUsers.userId, existingUser.id))
              .limit(1);
            
            if (!healthcareEntry) {
              await db.insert(healthcareUsers).values({
                userId: existingUser.id,
                hospitalId: hospital.id,
                department: testUser.department,
                isOnDuty: true,
                shiftStart: new Date().toISOString(),
                currentLocation: 'Main Floor',
              });

            }
          }
        } else {
          // Create new user
          const userId = uuidv4();
          await db.insert(users).values({
            id: userId,
            email: testUser.email,
            emailVerified: true,
            name: testUser.name,
            role: testUser.role,
            defaultHospitalId: ['nurse', 'doctor', 'operator', 'head_doctor', 'head_nurse'].includes(testUser.role) 
              ? hospital.id 
              : null,
            organizationId: org.id,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          
          // Add healthcare users to healthcare_users table
          if (['nurse', 'doctor', 'operator', 'head_doctor', 'head_nurse'].includes(testUser.role)) {
            await db.insert(healthcareUsers).values({
              userId: userId,
              hospitalId: hospital.id,
              department: testUser.department,
              isOnDuty: true,
              shiftStart: new Date().toISOString(),
              currentLocation: 'Main Floor',
            });
          }

        }
      } catch (error) {

      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

createTestUsersAllRoles();