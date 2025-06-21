#!/usr/bin/env tsx
import { exit } from 'process';
import { db } from '@/src/db';
import { users, organizations, organizationMembers } from '@/src/db/schema';
import { hospitals, healthcareUsers } from '@/src/db/healthcare-schema';
import { eq } from 'drizzle-orm';
import { log } from '@/lib/core/debug/unified-logger';

async function testProfileCompletionWithHospital() {
  log.info('Testing profile completion with hospital selection', 'TEST');
  
  try {
    // Find a test healthcare user
    const [testUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, 'nurse@example.com'))
      .limit(1);
    
    if (!testUser) {
      log.error('Test user not found. Please create nurse@example.com first', 'TEST');
      return;
    }
    
    log.info('Found test user', 'TEST', {
      id: testUser.id,
      email: testUser.email,
      role: testUser.role,
      organizationId: testUser.organizationId,
      defaultHospitalId: testUser.defaultHospitalId,
    });
    
    // Check if user has organization
    if (testUser.organizationId) {
      const [org] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, testUser.organizationId))
        .limit(1);
      
      log.info('User organization', 'TEST', {
        id: org?.id,
        name: org?.name,
      });
      
      // Check hospitals in organization
      const orgHospitals = await db
        .select()
        .from(hospitals)
        .where(eq(hospitals.organizationId, testUser.organizationId));
      
      log.info('Organization hospitals', 'TEST', {
        count: orgHospitals.length,
        hospitals: orgHospitals.map(h => ({
          id: h.id,
          name: h.name,
          code: h.code,
          isDefault: h.isDefault,
        })),
      });
    }
    
    // Check if user has healthcare profile
    if (testUser.id) {
      const [healthcareProfile] = await db
        .select()
        .from(healthcareUsers)
        .where(eq(healthcareUsers.userId, testUser.id))
        .limit(1);
      
      log.info('Healthcare profile', 'TEST', {
        exists: !!healthcareProfile,
        hospitalId: healthcareProfile?.hospitalId,
        department: healthcareProfile?.department,
      });
      
      if (healthcareProfile?.hospitalId) {
        const [hospital] = await db
          .select()
          .from(hospitals)
          .where(eq(hospitals.id, healthcareProfile.hospitalId))
          .limit(1);
        
        log.info('Assigned hospital', 'TEST', {
          id: hospital?.id,
          name: hospital?.name,
          code: hospital?.code,
        });
      }
    }
    
    log.info('Profile completion test completed', 'TEST');
    
  } catch (error) {
    log.error('Error testing profile completion', 'TEST', error);
  }
}

// Run the test
testProfileCompletionWithHospital()
  .then(() => {
    log.info('Test completed successfully', 'TEST');
    exit(0);
  })
  .catch(error => {
    log.error('Test failed', 'TEST', error);
    exit(1);
  });