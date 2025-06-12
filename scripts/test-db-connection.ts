#!/usr/bin/env bun
import { db } from '@/src/db';
import { users } from '@/src/db/schema';
import { hospitals, alerts } from '@/src/db/healthcare-schema';
import { patients } from '@/src/db/patient-schema';
import { sql } from 'drizzle-orm';
import { log } from '@/lib/core/debug/logger';

async function testDatabaseConnection() {
  log.info('Testing database connection...', 'TEST');
  
  try {
    // Test basic connection
    const result = await db.execute(sql`SELECT 1 as test`);
    log.info('Database connection successful', 'TEST');
    
    // Count records
    const userCount = await db.select({ count: sql<number>`count(*)` }).from(users);
    const hospitalCount = await db.select({ count: sql<number>`count(*)` }).from(hospitals);
    const patientCount = await db.select({ count: sql<number>`count(*)` }).from(patients);
    const alertCount = await db.select({ count: sql<number>`count(*)` }).from(alerts);
    
    log.info('Database statistics:', 'TEST', {
      users: userCount[0].count,
      hospitals: hospitalCount[0].count,
      patients: patientCount[0].count,
      alerts: alertCount[0].count,
    });
    
    // List users
    const userList = await db.select({ 
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role 
    }).from(users);
    
    log.info('Users in database:', 'TEST');
    userList.forEach(user => {
      log.info(`- ${user.name} (${user.email}) - Role: ${user.role}`, 'TEST');
    });
    
    // List patients
    const patientList = await db.select({ 
      id: patients.id,
      mrn: patients.mrn,
      name: patients.name,
      roomNumber: patients.roomNumber 
    }).from(patients);
    
    log.info('Patients in database:', 'TEST');
    patientList.forEach(patient => {
      log.info(`- ${patient.name} (MRN: ${patient.mrn}) - Room: ${patient.roomNumber}`, 'TEST');
    });
    
    log.info('Database test completed successfully!', 'TEST');
    
  } catch (error) {
    log.error('Database test failed', 'TEST', error);
    process.exit(1);
  }
}

// Run test
testDatabaseConnection()
  .then(() => process.exit(0))
  .catch(error => {
    log.error('Unexpected error', 'TEST', error);
    process.exit(1);
  });