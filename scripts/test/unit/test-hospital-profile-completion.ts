#!/usr/bin/env tsx
import { exit } from 'process';
import { db } from '@/src/db';
import { users } from '@/src/db/schema';
import { hospitals } from '@/src/db/healthcare-schema';
import { eq } from 'drizzle-orm';

// Direct console logging for testing
const log = {
  info: (msg: string, category: string, data?: any) => {

  },
  warn: (msg: string, category: string, data?: any) => {
    console.warn(`[${category}] ${msg}`, data ? JSON.stringify(data, null, 2) : '');
  },
  error: (msg: string, category: string, error?: any) => {
    console.error(`[${category}] ${msg}`, error);
  },
};

async function testHospitalProfileCompletion() {
  log.info('Testing hospital selection in profile completion', 'TEST');
  
  try {
    // List all healthcare users
    const healthcareUsers = await db
      .select()
      .from(users)
      .where(eq(users.role, 'nurse'));
    
    log.info('Healthcare users found', 'TEST', {
      count: healthcareUsers.length,
      users: healthcareUsers.map(u => ({
        id: u.id,
        email: u.email,
        role: u.role,
        organizationId: u.organizationId,
        defaultHospitalId: u.defaultHospitalId,
        needsProfileCompletion: u.needsProfileCompletion,
      })),
    });
    
    // List all hospitals
    const allHospitals = await db
      .select()
      .from(hospitals);
    
    log.info('Hospitals in database', 'TEST', {
      count: allHospitals.length,
      hospitals: allHospitals.map(h => ({
        id: h.id,
        name: h.name,
        code: h.code,
        organizationId: h.organizationId,
        isDefault: h.isDefault,
      })),
    });
    
    // Test with doremon@gmail.com
    const [doremon] = await db
      .select()
      .from(users)
      .where(eq(users.email, 'doremon@gmail.com'))
      .limit(1);
    
    if (doremon) {
      log.info('Test user doremon@gmail.com', 'TEST', {
        id: doremon.id,
        role: doremon.role,
        organizationId: doremon.organizationId,
        defaultHospitalId: doremon.defaultHospitalId,
        needsProfileCompletion: doremon.needsProfileCompletion,
      });
      
      if (doremon.organizationId) {
        const orgHospitals = await db
          .select()
          .from(hospitals)
          .where(eq(hospitals.organizationId, doremon.organizationId));
        
        log.info('Hospitals available for doremon', 'TEST', {
          count: orgHospitals.length,
          hospitals: orgHospitals.map(h => ({
            id: h.id,
            name: h.name,
            isDefault: h.isDefault,
          })),
        });
      }
    } else {
      log.warn('Test user doremon@gmail.com not found', 'TEST');
    }
    
    log.info('Hospital profile completion test completed', 'TEST');
    
  } catch (error) {
    log.error('Error in hospital profile completion test', 'TEST', error);
  }
}

// Run the test
testHospitalProfileCompletion()
  .then(() => {
    log.info('Test completed successfully', 'TEST');
    exit(0);
  })
  .catch(error => {
    log.error('Test failed', 'TEST', error);
    exit(1);
  });