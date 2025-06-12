#!/usr/bin/env bun
import { db } from '@/src/db';
import { users } from '@/src/db/schema';
import { organization as organizations, organizationMember as organizationMembers } from '@/src/db/organization-schema';
import { hospitals, healthcareUsers, departments } from '@/src/db/healthcare-schema';
import { patients } from '@/src/db/patient-schema';
import { log } from '@/lib/core/debug/logger';
import { nanoid } from 'nanoid';

async function createTestData() {
  log.info('Creating test healthcare data...', 'SETUP');

  try {
    // 1. Create test organization
    log.info('Creating test organization...', 'SETUP');
    const [testOrg] = await db.insert(organizations).values({
      name: 'Test Hospital Organization',
      type: 'healthcare',
      size: 'large',
      industry: 'Healthcare',
      status: 'active',
      plan: 'enterprise',
    }).returning();
    log.info('Organization created', 'SETUP', { id: testOrg.id });

    // 2. Create test hospital
    log.info('Creating test hospital...', 'SETUP');
    const [testHospital] = await db.insert(hospitals).values({
      name: 'City General Hospital',
      address: '123 Medical Center Dr, Healthcare City, HC 12345',
      contactInfo: {
        phone: '555-0100',
        email: 'info@citygeneralhospital.com',
        emergencyPhone: '555-0911',
      },
      settings: {
        enableAlerts: true,
        escalationTimeouts: [2, 3, 2], // minutes for each tier
      },
    }).returning();
    log.info('Hospital created', 'SETUP', { id: testHospital.id });

    // 3. Create departments
    log.info('Creating departments...', 'SETUP');
    const [emergencyDept] = await db.insert(departments).values({
      hospitalId: testHospital.id,
      name: 'Emergency Department',
      description: '24/7 Emergency care unit',
    }).returning();

    const [icuDept] = await db.insert(departments).values({
      hospitalId: testHospital.id,
      name: 'Intensive Care Unit',
      description: 'Critical care unit',
    }).returning();
    log.info('Departments created', 'SETUP');

    // 4. Create test users with different roles
    const testUsers = [
      {
        id: nanoid(),
        name: 'Dr. Sarah Johnson',
        email: 'sarah.johnson@hospital.com',
        emailVerified: true,
        role: 'doctor',
        organizationId: testOrg.id,
        needsProfileCompletion: false,
      },
      {
        id: nanoid(),
        name: 'Nurse Emily Davis',
        email: 'emily.davis@hospital.com',
        emailVerified: true,
        role: 'nurse',
        organizationId: testOrg.id,
        needsProfileCompletion: false,
      },
      {
        id: nanoid(),
        name: 'Dr. Michael Chen',
        email: 'michael.chen@hospital.com',
        emailVerified: true,
        role: 'head_doctor',
        organizationId: testOrg.id,
        needsProfileCompletion: false,
      },
      {
        id: nanoid(),
        name: 'Operator John Smith',
        email: 'john.smith@hospital.com',
        emailVerified: true,
        role: 'operator',
        organizationId: testOrg.id,
        needsProfileCompletion: false,
      },
    ];

    log.info('Creating test users...', 'SETUP');
    const createdUsers = await db.insert(users).values(testUsers).returning();
    log.info('Users created', 'SETUP', { count: createdUsers.length });

    // 5. Create healthcare user profiles
    log.info('Creating healthcare user profiles...', 'SETUP');
    for (const user of createdUsers) {
      await db.insert(healthcareUsers).values({
        userId: user.id,
        hospitalId: testHospital.id,
        licenseNumber: `LIC-${nanoid(8)}`,
        department: user.role === 'doctor' || user.role === 'head_doctor' ? 'Emergency Department' : 'General',
        specialization: user.role === 'doctor' ? 'Emergency Medicine' : null,
        isOnDuty: true,
      });

      // Add to organization
      await db.insert(organizationMembers).values({
        organizationId: testOrg.id,
        userId: user.id,
        role: user.role === 'head_doctor' ? 'admin' : 'member',
        status: 'active',
      });
    }
    log.info('Healthcare profiles created', 'SETUP');

    // 6. Create test patients
    log.info('Creating test patients...', 'SETUP');
    const testPatients = [
      {
        mrn: 'MRN-001',
        name: 'Alice Thompson',
        dateOfBirth: new Date('1975-03-15'),
        gender: 'female' as const,
        bloodType: 'A+' as const,
        roomNumber: '101',
        bedNumber: 'A',
        admissionDate: new Date(),
        primaryDiagnosis: 'Chest pain - under observation',
        allergies: ['Penicillin', 'Sulfa drugs'],
        hospitalId: testHospital.id,
        departmentId: emergencyDept.id,
        primaryDoctorId: createdUsers.find(u => u.role === 'doctor')?.id,
        attendingNurseId: createdUsers.find(u => u.role === 'nurse')?.id,
      },
      {
        mrn: 'MRN-002',
        name: 'Robert Martinez',
        dateOfBirth: new Date('1960-07-22'),
        gender: 'male' as const,
        bloodType: 'O-' as const,
        roomNumber: '205',
        bedNumber: 'B',
        admissionDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        primaryDiagnosis: 'Post-operative recovery - appendectomy',
        allergies: [],
        medications: [
          { name: 'Morphine', dosage: '2mg', frequency: 'q4h PRN' },
          { name: 'Cefazolin', dosage: '1g', frequency: 'q8h' },
        ],
        hospitalId: testHospital.id,
        departmentId: icuDept.id,
        primaryDoctorId: createdUsers.find(u => u.role === 'head_doctor')?.id,
        attendingNurseId: createdUsers.find(u => u.role === 'nurse')?.id,
      },
    ];

    const createdPatients = await db.insert(patients).values(testPatients).returning();
    log.info('Patients created', 'SETUP', { count: createdPatients.length });

    // Summary
    log.info('Test data creation completed!', 'SETUP');
    log.info('Summary:', 'SETUP', {
      organization: testOrg.name,
      hospital: testHospital.name,
      departments: 2,
      users: createdUsers.length,
      patients: createdPatients.length,
    });

    log.info('You can now test the healthcare API endpoints', 'SETUP');
    log.info('Test users:', 'SETUP');
    createdUsers.forEach(user => {
      log.info(`- ${user.name} (${user.email}) - Role: ${user.role}`, 'SETUP');
    });

  } catch (error) {
    log.error('Failed to create test data', 'SETUP', error);
    throw error;
  }
}

// Run the setup
createTestData()
  .then(() => {
    log.info('Healthcare test data setup completed!', 'SETUP');
    process.exit(0);
  })
  .catch(error => {
    log.error('Setup failed', 'SETUP', error);
    process.exit(1);
  });