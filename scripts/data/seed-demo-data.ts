#!/usr/bin/env bun
/**
 * Seed Demo Data Script
 * Populates the database with realistic demo data for presentation
 */

import { db } from '@/src/db';
import { 
  user as users,
  account,
} from '@/src/db/schema';
import {
  organization as organizations,
  organizationMember as organizationMembers,
} from '@/src/db/organization-schema';
import {
  hospitals,
  alerts,
  alertAcknowledgments,
  alertEscalations,
  healthcareAuditLogs as activityLogs,
} from '@/src/db/healthcare-schema';
import { patients } from '@/src/db/patient-schema';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { faker } from '@faker-js/faker';
import { format, subDays, subHours, addHours, subMinutes } from 'date-fns';

// Set seed for consistent data
faker.seed(12345);

const DEMO_PASSWORD = 'Demo123!';
const SALT_ROUNDS = 10;

// Demo data configuration
const DEMO_CONFIG = {
  hospitals: 3,
  departmentsPerHospital: 5,
  doctorsPerHospital: 15,
  nursesPerHospital: 30,
  patientsPerHospital: 50,
  activeAlertsPerHospital: 10,
  resolvedAlertsPerHospital: 20,
};

// Medical departments
const DEPARTMENTS = [
  'Emergency Department',
  'Intensive Care Unit',
  'Cardiology',
  'Neurology',
  'Pediatrics',
  'Surgery',
  'Oncology',
  'Orthopedics',
  'Obstetrics',
  'Psychiatry',
];

// Alert types (matching the schema constraints)
const ALERT_TYPES = [
  { type: 'cardiac_arrest', urgencyLevel: 5, description: 'Cardiac arrest - Code Blue' },
  { type: 'code_blue', urgencyLevel: 5, description: 'Medical emergency requiring immediate response' },
  { type: 'fire', urgencyLevel: 5, description: 'Fire emergency - Code Red' },
  { type: 'security', urgencyLevel: 4, description: 'Security alert' },
  { type: 'medical_emergency', urgencyLevel: 4, description: 'Medical emergency' },
];

// Medical conditions
const CONDITIONS = [
  'Hypertension',
  'Type 2 Diabetes',
  'Coronary Artery Disease',
  'Chronic Obstructive Pulmonary Disease',
  'Asthma',
  'Atrial Fibrillation',
  'Heart Failure',
  'Chronic Kidney Disease',
  'Hypothyroidism',
  'Osteoarthritis',
  'Depression',
  'Anxiety Disorder',
];

// Medications
const MEDICATIONS = [
  { name: 'Metformin', dosage: '500mg', frequency: 'Twice daily', route: 'PO' },
  { name: 'Lisinopril', dosage: '10mg', frequency: 'Once daily', route: 'PO' },
  { name: 'Atorvastatin', dosage: '40mg', frequency: 'Once daily', route: 'PO' },
  { name: 'Aspirin', dosage: '81mg', frequency: 'Once daily', route: 'PO' },
  { name: 'Levothyroxine', dosage: '75mcg', frequency: 'Once daily', route: 'PO' },
  { name: 'Amlodipine', dosage: '5mg', frequency: 'Once daily', route: 'PO' },
  { name: 'Insulin Glargine', dosage: '20 units', frequency: 'Once daily', route: 'SubQ' },
  { name: 'Furosemide', dosage: '40mg', frequency: 'Twice daily', route: 'PO' },
  { name: 'Warfarin', dosage: '5mg', frequency: 'Once daily', route: 'PO' },
  { name: 'Pantoprazole', dosage: '40mg', frequency: 'Once daily', route: 'PO' },
];

async function clearExistingData() {

  // Import all necessary tables
  const { healthcareUsers, departments, shiftSchedules, alertMetrics, patientAlerts, alertTimelineEvents } = await import('@/src/db/healthcare-schema');
  const { patientVitals } = await import('@/src/db/patient-schema');
  
  // Clear in dependency order (most dependent first)
  try {
    await db.delete(activityLogs).execute();
    await db.delete(alertTimelineEvents).execute();
    await db.delete(alertEscalations).execute();
    await db.delete(alertAcknowledgments).execute();
    await db.delete(patientAlerts).execute();
    await db.delete(alertMetrics).execute();
    await db.delete(alerts).execute();
    await db.delete(patientVitals).execute();
    await db.delete(patients).execute();
    await db.delete(shiftSchedules).execute();
    await db.delete(departments).execute();
    await db.delete(organizationMembers).execute();
    await db.delete(healthcareUsers).execute();
    await db.delete(account).execute();
    await db.delete(users).execute();
    await db.delete(hospitals).execute();
    await db.delete(organizations).execute();

  } catch (error) {
    console.error('Error clearing data:', error);
    throw error;
  }
}

async function createOrganizations() {

  const orgs = [
    {
      id: uuidv4(),
      name: 'Metro Health Network',
      slug: 'metro-health-network',
      type: 'business',
      size: 'enterprise',
      industry: 'Healthcare',
      website: 'https://metrohealth.example.com',
      description: 'Leading healthcare network with multiple facilities',
      logo: null,
      email: 'info@metrohealth.example.com',
      phone: '+1-555-0100',
      address: '123 Healthcare Blvd, New York, NY 10001',
      timezone: 'America/New_York',
      language: 'en',
      currency: 'USD',
      country: 'US',
      plan: 'enterprise',
      maxMembers: 1000,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: uuidv4(),
      name: 'Regional Medical Center',
      slug: 'regional-medical-center',
      type: 'business',
      size: 'large',
      industry: 'Healthcare',
      website: 'https://regionalmed.example.com',
      description: 'Comprehensive medical services for the region',
      logo: null,
      email: 'info@regionalmed.example.com',
      phone: '+1-555-0200',
      address: '456 Medical Ave, Chicago, IL 60601',
      timezone: 'America/Chicago',
      language: 'en',
      currency: 'USD',
      country: 'US',
      plan: 'pro',
      maxMembers: 500,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
  
  await db.insert(organizations).values(orgs);

  return orgs;
}

async function createHospitals(organizationIds: string[]) {

  const hospitalList = [];
  const hospitalNames = [
    'Central Medical Center',
    'St. Mary\'s Hospital',
    'University Hospital',
    'Children\'s Hospital',
    'Memorial Hospital',
  ];
  
  for (let i = 0; i < DEMO_CONFIG.hospitals; i++) {
    hospitalList.push({
      id: uuidv4(),
      name: hospitalNames[i] || faker.company.name() + ' Hospital',
      organizationId: organizationIds[i % organizationIds.length],
      code: faker.string.alphanumeric(6).toUpperCase(),
      address: faker.location.streetAddress() + ', ' + faker.location.city() + ', ' + faker.location.state({ abbreviated: true }) + ' ' + faker.location.zipCode(),
      contactInfo: {
        phone: faker.phone.number(),
        emergencyPhone: faker.phone.number(),
        email: faker.internet.email().toLowerCase(),
        totalBeds: faker.number.int({ min: 200, max: 500 }),
        occupiedBeds: faker.number.int({ min: 100, max: 400 }),
        departments: DEPARTMENTS.slice(0, DEMO_CONFIG.departmentsPerHospital),
      },
      settings: {
        defaultAlertTimeout: 300,
        escalationEnabled: true,
      },
      isActive: true,
      isDefault: i === 0, // First hospital is default for each org
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  
  await db.insert(hospitals).values(hospitalList);

  return hospitalList;
}

async function createUsers(hospitalIds: string[], organizationIds: string[]) {

  const userList = [];
  const accountList = [];
  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, SALT_ROUNDS);
  
  // Create system user first for system-generated logs
  const systemUserId = '00000000-0000-0000-0000-000000000000';
  const systemUser = {
    id: systemUserId,
    email: 'system@hospital.internal',
    name: 'System',
    role: 'admin' as const,
    defaultHospitalId: hospitalIds[0],
    isActive: true,
    emailVerified: true,
    needsProfileCompletion: false,
    department: 'System',
    jobTitle: 'Automated System',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  userList.push(systemUser);
  
  // Create admin user
  const adminUserId = uuidv4();
  const adminUser = {
    id: adminUserId,
    email: 'admin@hospital.demo',
    name: 'Admin User',
    role: 'admin' as const,
    defaultHospitalId: hospitalIds[0],
    isActive: true,
    emailVerified: true,
    needsProfileCompletion: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  userList.push(adminUser);
  
  // Create account for admin
  accountList.push({
    id: uuidv4(),
    accountId: adminUserId,
    providerId: 'credential',
    userId: adminUserId,
    password: hashedPassword,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  
  // Create doctors and nurses for each hospital
  for (const hospitalId of hospitalIds) {
    // Head doctor
    const headDoctorId = uuidv4();
    const headDoctor = {
      id: headDoctorId,
      email: `head.doctor.${hospitalId.slice(0, 8)}@hospital.demo`,
      name: faker.person.fullName(),
      role: 'head_doctor' as const,
      defaultHospitalId: hospitalId,
      isActive: true,
      emailVerified: true,
      needsProfileCompletion: false,
      department: faker.helpers.arrayElement(['Cardiology', 'Neurology', 'Surgery', 'Internal Medicine']),
      jobTitle: 'Head Doctor',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    userList.push(headDoctor);
    
    accountList.push({
      id: uuidv4(),
      accountId: headDoctorId,
      providerId: 'credential',
      userId: headDoctorId,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    // Regular doctors
    for (let i = 0; i < DEMO_CONFIG.doctorsPerHospital; i++) {
      const doctorId = uuidv4();
      const doctor = {
        id: doctorId,
        email: faker.internet.email().toLowerCase(),
        name: faker.person.fullName(),
        role: 'doctor' as const,
        defaultHospitalId: hospitalId,
        isActive: true,
        emailVerified: true,
        needsProfileCompletion: false,
        department: faker.helpers.arrayElement(['Cardiology', 'Neurology', 'Surgery', 'Internal Medicine', 'Pediatrics']),
        jobTitle: 'Doctor',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      userList.push(doctor);
      
      accountList.push({
        id: uuidv4(),
        accountId: doctorId,
        providerId: 'credential',
        userId: doctorId,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    
    // Nurses
    for (let i = 0; i < DEMO_CONFIG.nursesPerHospital; i++) {
      const nurseId = uuidv4();
      const nurse = {
        id: nurseId,
        email: faker.internet.email().toLowerCase(),
        name: faker.person.fullName(),
        role: 'nurse' as const,
        defaultHospitalId: hospitalId,
        isActive: true,
        emailVerified: true,
        needsProfileCompletion: false,
        department: faker.helpers.arrayElement(['Emergency', 'ICU', 'Pediatrics', 'Surgery', 'General']),
        jobTitle: 'Registered Nurse',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      userList.push(nurse);
      
      accountList.push({
        id: uuidv4(),
        accountId: nurseId,
        providerId: 'credential',
        userId: nurseId,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }
  
  // Create demo users with easy-to-remember credentials
  const demoUserData = [
    {
      email: 'doctor@demo.com',
      name: 'Dr. Demo Doctor',
      role: 'doctor' as const,
      department: 'Cardiology',
      jobTitle: 'Senior Doctor',
    },
    {
      email: 'nurse@demo.com',
      name: 'Nurse Demo',
      role: 'nurse' as const,
      department: 'ICU',
      jobTitle: 'ICU Nurse',
    },
    {
      email: 'head@demo.com',
      name: 'Dr. Head Doctor',
      role: 'head_doctor' as const,
      department: 'Surgery',
      jobTitle: 'Head of Surgery',
    },
  ];
  
  for (const userData of demoUserData) {
    const userId = uuidv4();
    const user = {
      id: userId,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      defaultHospitalId: hospitalIds[0],
      isActive: true,
      emailVerified: true,
      needsProfileCompletion: false,
      department: userData.department,
      jobTitle: userData.jobTitle,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    userList.push(user);
    
    accountList.push({
      id: uuidv4(),
      accountId: userId,
      providerId: 'credential',
      userId: userId,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  
  await db.insert(users).values(userList);

  await db.insert(account).values(accountList);

  // Create organization memberships
  const memberships = [];
  for (const user of userList) {
    const orgId = organizationIds[hospitalIds.indexOf(user.defaultHospitalId!) % organizationIds.length];
    memberships.push({
      id: uuidv4(),
      organizationId: orgId,
      userId: user.id,
      role: user.role === 'admin' ? 'admin' : user.role === 'head_doctor' ? 'manager' : 'member',
      permissions: [],
      status: 'active',
      joinedAt: new Date(),
      lastActiveAt: new Date(),
      notificationPreferences: {},
      updatedAt: new Date(),
    });
  }
  
  await db.insert(organizationMembers).values(memberships);

  return userList;
}

async function createPatients(hospitalIds: string[]) {

  const patientList = [];
  
  for (const hospitalId of hospitalIds) {
    for (let i = 0; i < DEMO_CONFIG.patientsPerHospital; i++) {
      const admittedDaysAgo = faker.number.int({ min: 0, max: 30 });
      const age = faker.number.int({ min: 18, max: 90 });
      
      const allergies = faker.helpers.maybe(() => 
        faker.helpers.arrayElements(['Penicillin', 'Sulfa', 'Latex', 'Iodine', 'Aspirin'], { min: 1, max: 2 }),
        { probability: 0.4 }
      ) || [];
      
      const patient = {
        id: uuidv4(),
        hospitalId,
        mrn: 'MRN-' + faker.string.numeric(6),
        name: faker.person.fullName(),
        dateOfBirth: subDays(new Date(), age * 365),
        gender: faker.helpers.arrayElement(['male', 'female', 'other']) as 'male' | 'female' | 'other',
        bloodType: faker.helpers.arrayElement(['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']),
        roomNumber: faker.helpers.arrayElement(['A', 'B', 'C']) + faker.number.int({ min: 100, max: 500 }),
        bedNumber: faker.helpers.arrayElement(['1', '2', 'A', 'B']),
        admissionDate: subDays(new Date(), admittedDaysAgo),
        dischargeDate: admittedDaysAgo < 3 ? null : faker.helpers.maybe(() => 
          addHours(subDays(new Date(), admittedDaysAgo), faker.number.int({ min: 24, max: 168 })),
          { probability: 0.3 }
        ),
        
        primaryDiagnosis: faker.helpers.arrayElement([
          'Acute Myocardial Infarction',
          'Pneumonia',
          'Acute Appendicitis',
          'Cerebrovascular Accident',
          'Diabetic Ketoacidosis',
          'Acute Renal Failure',
          'Sepsis',
          'Chronic Heart Failure Exacerbation',
        ]),
        
        secondaryDiagnoses: faker.helpers.arrayElements(CONDITIONS, { min: 1, max: 4 }),
        allergies,
        
        medications: faker.helpers.arrayElements(MEDICATIONS, { min: 2, max: 6 }),
        
        emergencyContact: {
          name: faker.person.fullName(),
          relationship: faker.helpers.arrayElement(['Spouse', 'Parent', 'Child', 'Sibling']),
          phone: faker.phone.number(),
        },
        
        flags: {
          dnr: faker.helpers.maybe(() => true, { probability: 0.05 }) || false,
          fallRisk: faker.helpers.maybe(() => true, { probability: 0.2 }) || false,
          allergyAlert: allergies && allergies.length > 0,
        },
        
        isActive: true,
        createdAt: subDays(new Date(), admittedDaysAgo),
        updatedAt: new Date(),
      };
      
      patientList.push(patient);
    }
  }
  
  await db.insert(patients).values(patientList);

  return patientList;
}

async function createAlerts(hospitalIds: string[], userList: any[], patientList: any[]) {

  const alertList = [];
  const acknowledgmentList = [];
  const escalationList = [];
  
  // Realistic response time distributions by urgency level
  const responseTimeDistributions = {
    5: { min: 1, max: 5, target: 3 }, // Critical - fast response
    4: { min: 2, max: 10, target: 5 }, // High - quick response
    3: { min: 5, max: 20, target: 10 }, // Medium - moderate response
    2: { min: 10, max: 30, target: 15 }, // Low - slower response
    1: { min: 15, max: 45, target: 25 }, // Minimal - lowest priority
  };
  
  for (const hospitalId of hospitalIds) {
    const hospitalPatients = patientList.filter(p => p.hospitalId === hospitalId);
    const hospitalStaff = userList.filter(u => u.defaultHospitalId === hospitalId && u.id !== '00000000-0000-0000-0000-000000000000');
    const nurses = hospitalStaff.filter(u => u.role === 'nurse');
    const doctors = hospitalStaff.filter(u => u.role === 'doctor' || u.role === 'head_doctor');
    
    // Active alerts - weighted towards lower urgency levels for realistic distribution
    for (let i = 0; i < DEMO_CONFIG.activeAlertsPerHospital; i++) {
      const alertType = faker.helpers.weightedArrayElement([
        { value: ALERT_TYPES[0], weight: 5 }, // cardiac_arrest - rare
        { value: ALERT_TYPES[1], weight: 8 }, // code_blue - uncommon
        { value: ALERT_TYPES[2], weight: 3 }, // fire - very rare
        { value: ALERT_TYPES[3], weight: 15 }, // security - occasional
        { value: ALERT_TYPES[4], weight: 25 }, // medical_emergency - common
      ]);
      const patient = faker.helpers.arrayElement(hospitalPatients);
      const createdBy = faker.helpers.arrayElement(nurses);
      const createdMinutesAgo = faker.number.int({ min: 5, max: 120 });
      
      const alert = {
        id: uuidv4(),
        hospitalId,
        patientId: patient.id,
        roomNumber: patient.roomNumber,
        alertType: alertType.type,
        urgencyLevel: alertType.urgencyLevel,
        description: `${alertType.description} for patient ${patient.name}`,
        status: faker.helpers.arrayElement(['active', 'acknowledged']) as 'active' | 'acknowledged' | 'resolved',
        
        createdBy: createdBy.id,
        createdAt: subMinutes(new Date(), createdMinutesAgo),
        
        escalationLevel: faker.number.int({ min: 0, max: 2 }),
        currentEscalationTier: 1,
        
        responseMetrics: {
          createdByName: createdBy.name,
          createdByRole: createdBy.role,
          patient: {
            name: patient.name,
            mrn: patient.mrn,
            age: Math.floor((Date.now() - patient.dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000)),
          },
        },
      };
      
      alertList.push(alert);
      
      // Add acknowledgments
      if (alert.status === 'acknowledged') {
        const acknowledgedBy = faker.helpers.arrayElement(doctors);
        const ack = {
          id: uuidv4(),
          alertId: alert.id,
          userId: acknowledgedBy.id,
          acknowledgedAt: subMinutes(new Date(), createdMinutesAgo - 5),
          responseTimeSeconds: 300, // 5 minutes
          notes: faker.helpers.maybe(() => 'On my way to assess the patient'),
          urgencyAssessment: faker.helpers.arrayElement(['critical', 'high', 'medium', 'low']),
          responseAction: faker.helpers.arrayElement(['immediate', 'urgent', 'scheduled', 'monitoring']),
          estimatedResponseTime: faker.number.int({ min: 5, max: 30 }),
        };
        acknowledgmentList.push(ack);
        
        // Update alert with acknowledgment info
        alert.acknowledgedBy = acknowledgedBy.id;
        alert.acknowledgedAt = ack.acknowledgedAt;
      }
      
      // Add escalations
      if (alert.escalationLevel > 0) {
        for (let level = 1; level <= alert.escalationLevel; level++) {
          const fromRole = level === 1 ? 'nurse' : level === 2 ? 'doctor' : 'head_doctor';
          const toRole = level === 1 ? 'doctor' : level === 2 ? 'head_doctor' : 'admin';
          
          const escalation = {
            id: uuidv4(),
            alertId: alert.id,
            from_role: fromRole,
            to_role: toRole,
            escalatedAt: subMinutes(new Date(), createdMinutesAgo - (level * 5)),
            reason: `Auto-escalated after ${level * 5} minutes without response`,
          };
          escalationList.push(escalation);
        }
      }
    }
    
    // Resolved alerts (historical) - create more data for better graphs
    const historicalDays = 30;
    const alertsPerDay = 15; // Average alerts per day
    
    for (let day = 0; day < historicalDays; day++) {
      const date = subDays(new Date(), day);
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const dayAlertCount = isWeekend 
        ? faker.number.int({ min: 8, max: 12 }) 
        : faker.number.int({ min: 12, max: 20 });
      
      for (let i = 0; i < dayAlertCount; i++) {
        const alertType = faker.helpers.weightedArrayElement([
          { value: ALERT_TYPES[0], weight: 3 }, // cardiac_arrest
          { value: ALERT_TYPES[1], weight: 5 }, // code_blue
          { value: ALERT_TYPES[2], weight: 1 }, // fire
          { value: ALERT_TYPES[3], weight: 20 }, // security
          { value: ALERT_TYPES[4], weight: 30 }, // medical_emergency
        ]);
        const patient = faker.helpers.arrayElement(hospitalPatients);
        const createdBy = faker.helpers.arrayElement(nurses);
        const resolvedBy = faker.helpers.arrayElement(doctors);
        
        // Create realistic time distribution throughout the day
        const hour = faker.helpers.weightedArrayElement([
          { value: 0, weight: 2 }, { value: 1, weight: 1 }, { value: 2, weight: 1 },
          { value: 3, weight: 1 }, { value: 4, weight: 1 }, { value: 5, weight: 2 },
          { value: 6, weight: 5 }, { value: 7, weight: 8 }, { value: 8, weight: 12 },
          { value: 9, weight: 15 }, { value: 10, weight: 14 }, { value: 11, weight: 13 },
          { value: 12, weight: 10 }, { value: 13, weight: 12 }, { value: 14, weight: 14 },
          { value: 15, weight: 15 }, { value: 16, weight: 13 }, { value: 17, weight: 10 },
          { value: 18, weight: 8 }, { value: 19, weight: 6 }, { value: 20, weight: 5 },
          { value: 21, weight: 4 }, { value: 22, weight: 3 }, { value: 23, weight: 2 },
        ]);
        
        const createdAt = new Date(date);
        createdAt.setHours(hour, faker.number.int({ min: 0, max: 59 }), faker.number.int({ min: 0, max: 59 }));
        
        // Calculate response times based on urgency level
        const responseConfig = responseTimeDistributions[alertType.urgencyLevel as keyof typeof responseTimeDistributions];
        const responseTimeMinutes = faker.number.float({ 
          min: responseConfig.min, 
          max: responseConfig.max,
          precision: 0.1
        });
      
        const acknowledgedAt = new Date(createdAt.getTime() + responseTimeMinutes * 60 * 1000);
        const resolutionTimeMinutes = faker.number.float({
          min: responseTimeMinutes + 5,
          max: responseTimeMinutes + 30,
          precision: 0.1
        });
        const resolvedAt = new Date(createdAt.getTime() + resolutionTimeMinutes * 60 * 1000);
        
        const alert = {
          id: uuidv4(),
          hospitalId,
          patientId: patient.id,
          roomNumber: patient.roomNumber,
          alertType: alertType.type,
          urgencyLevel: alertType.urgencyLevel,
          description: `${alertType.description} for patient ${patient.name}`,
          status: 'resolved' as const,
          
          createdBy: createdBy.id,
          createdAt,
          
          acknowledgedAt,
          acknowledgedBy: resolvedBy.id,
          
          resolvedAt,
          
          escalationLevel: responseTimeMinutes > responseConfig.target * 2 ? 1 : 0,
          currentEscalationTier: 1,
          
          handoverNotes: faker.helpers.arrayElement([
            'Patient stabilized, vitals normal',
            'Issue resolved, patient comfortable',
            'Medication administered, symptoms resolved',
            'Intervention completed successfully',
            'Condition improved, monitoring continues',
          ]),
          
          responseMetrics: {
            createdByName: createdBy.name,
            createdByRole: createdBy.role,
            resolvedByName: resolvedBy.name,
            resolvedByRole: resolvedBy.role,
            responseTimeMinutes: +responseTimeMinutes.toFixed(1),
            resolutionTimeMinutes: +resolutionTimeMinutes.toFixed(1),
            patient: {
              name: patient.name,
              mrn: patient.mrn,
              age: Math.floor((Date.now() - patient.dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000)),
            },
          },
        };
        
        alertList.push(alert);
        
        // Add acknowledgment record
        const ack = {
          id: uuidv4(),
          alertId: alert.id,
          userId: resolvedBy.id,
          acknowledgedAt,
          responseTimeSeconds: Math.floor(responseTimeMinutes * 60),
          notes: faker.helpers.maybe(() => faker.helpers.arrayElement([
            'Responding immediately',
            'On my way to assess',
            'Will evaluate patient condition',
            'Prioritizing based on urgency',
          ])),
          urgencyAssessment: alertType.urgencyLevel >= 4 ? 'critical' : 
                             alertType.urgencyLevel >= 3 ? 'high' : 
                             alertType.urgencyLevel >= 2 ? 'medium' : 'low',
          responseAction: alertType.urgencyLevel >= 4 ? 'immediate' : 
                          alertType.urgencyLevel >= 3 ? 'urgent' : 'scheduled',
          estimatedResponseTime: Math.ceil(responseTimeMinutes),
        };
        acknowledgmentList.push(ack);
        
        // Add escalation if needed
        if (alert.escalationLevel > 0) {
          const escalation = {
            id: uuidv4(),
            alertId: alert.id,
            from_role: 'nurse',
            to_role: 'doctor',
            escalatedAt: new Date(createdAt.getTime() + (responseConfig.target * 60 * 1000 * 1.5)),
            reason: `No response after ${Math.ceil(responseConfig.target * 1.5)} minutes`,
          };
          escalationList.push(escalation);
        }
      }
    }
  }
  
  await db.insert(alerts).values(alertList);

  if (acknowledgmentList.length > 0) {
    await db.insert(alertAcknowledgments).values(acknowledgmentList);

  }
  
  if (escalationList.length > 0) {
    await db.insert(alertEscalations).values(escalationList);

  }
  
  return { alertList, acknowledgmentList, escalationList };
}

async function createActivityLogs(userList: any[], alertList: any[], hospitalIds: string[]) {

  const logs = [];
  
  // More detailed action types with severity and weights for realistic distribution
  const actionTypes = [
    // Authentication events (higher frequency)
    { action: 'login', entityType: 'user', severity: 'info', weight: 30 },
    { action: 'logout', entityType: 'user', severity: 'info', weight: 25 },
    { action: 'login_failed', entityType: 'user', severity: 'warning', weight: 5 },
    { action: 'password_reset', entityType: 'user', severity: 'warning', weight: 2 },
    { action: 'account_locked', entityType: 'user', severity: 'error', weight: 1 },
    
    // Alert events (medium frequency)
    { action: 'alert_created', entityType: 'alert', severity: 'critical', weight: 15 },
    { action: 'alert_acknowledged', entityType: 'alert', severity: 'info', weight: 14 },
    { action: 'alert_resolved', entityType: 'alert', severity: 'info', weight: 13 },
    { action: 'alert_escalated', entityType: 'alert', severity: 'warning', weight: 3 },
    { action: 'alert_updated', entityType: 'alert', severity: 'info', weight: 8 },
    
    // Patient events (medium frequency)
    { action: 'patient_admitted', entityType: 'patient', severity: 'info', weight: 10 },
    { action: 'patient_discharged', entityType: 'patient', severity: 'info', weight: 8 },
    { action: 'patient_updated', entityType: 'patient', severity: 'info', weight: 20 },
    { action: 'patient_condition_critical', entityType: 'patient', severity: 'critical', weight: 2 },
    { action: 'patient_fall_risk', entityType: 'patient', severity: 'warning', weight: 3 },
    
    // System events (lower frequency)
    { action: 'backup_completed', entityType: 'system', severity: 'info', weight: 4 },
    { action: 'backup_failed', entityType: 'system', severity: 'error', weight: 1 },
    { action: 'system_maintenance', entityType: 'system', severity: 'warning', weight: 2 },
    { action: 'database_error', entityType: 'system', severity: 'error', weight: 1 },
    { action: 'api_error', entityType: 'system', severity: 'error', weight: 2 },
    
    // Permission events (lower frequency)
    { action: 'permission_changed', entityType: 'permission', severity: 'warning', weight: 2 },
    { action: 'role_assigned', entityType: 'permission', severity: 'info', weight: 3 },
    { action: 'data_export', entityType: 'system', severity: 'warning', weight: 2 },
    { action: 'settings_changed', entityType: 'system', severity: 'info', weight: 4 },
  ];
  
  // Create weighted selection function
  const selectWeightedAction = () => {
    const totalWeight = actionTypes.reduce((sum, type) => sum + type.weight, 0);
    let random = faker.number.int({ min: 0, max: totalWeight });
    
    for (const actionType of actionTypes) {
      random -= actionType.weight;
      if (random <= 0) return actionType;
    }
    return actionTypes[0];
  };
  
  // Generate logs for the past 30 days with realistic patterns
  for (let day = 0; day < 30; day++) {
    const date = subDays(new Date(), day);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    
    // Create realistic daily patterns
    // More logs on weekdays, fewer on weekends
    // More logs in recent days
    const baseLogsPerDay = day < 7 ? (isWeekend ? 60 : 120) : day < 14 ? (isWeekend ? 30 : 60) : (isWeekend ? 15 : 30);
    const logsPerDay = faker.number.int({ min: baseLogsPerDay * 0.8, max: baseLogsPerDay * 1.2 });
    
    for (let i = 0; i < logsPerDay; i++) {
      const user = faker.helpers.arrayElement(userList.filter(u => u.id !== '00000000-0000-0000-0000-000000000000'));
      const actionType = selectWeightedAction();
      const timestamp = new Date(date);
      
      // Use system user for system logs
      const logUserId = actionType.entityType === 'system' 
        ? '00000000-0000-0000-0000-000000000000' // System user ID
        : user.id;
      const logUserName = actionType.entityType === 'system' 
        ? 'System' 
        : user.name;
      const logUserRole = actionType.entityType === 'system' 
        ? 'system' 
        : user.role;
      
      // Create realistic hourly patterns (more activity during work hours)
      const hour = faker.helpers.weightedArrayElement([
        { value: 0, weight: 1 }, { value: 1, weight: 1 }, { value: 2, weight: 1 },
        { value: 3, weight: 1 }, { value: 4, weight: 1 }, { value: 5, weight: 2 },
        { value: 6, weight: 5 }, { value: 7, weight: 10 }, { value: 8, weight: 15 },
        { value: 9, weight: 20 }, { value: 10, weight: 18 }, { value: 11, weight: 17 },
        { value: 12, weight: 12 }, { value: 13, weight: 15 }, { value: 14, weight: 18 },
        { value: 15, weight: 20 }, { value: 16, weight: 18 }, { value: 17, weight: 15 },
        { value: 18, weight: 10 }, { value: 19, weight: 8 }, { value: 20, weight: 5 },
        { value: 21, weight: 3 }, { value: 22, weight: 2 }, { value: 23, weight: 1 },
      ]);
      
      timestamp.setHours(hour);
      timestamp.setMinutes(faker.number.int({ min: 0, max: 59 }));
      timestamp.setSeconds(faker.number.int({ min: 0, max: 59 }));
      
      let entityId: string;
      let metadata: any = {
        userName: logUserName,
        userRole: logUserRole,
        department: actionType.entityType === 'system' ? 'System' : faker.helpers.arrayElement(DEPARTMENTS),
      };
      
      // Add specific metadata based on action type
      switch (actionType.entityType) {
        case 'alert':
          const alert = faker.helpers.arrayElement(alertList);
          entityId = alert.id;
          metadata = {
            ...metadata,
            alertType: alert.alertType,
            urgencyLevel: alert.urgencyLevel,
            roomNumber: alert.roomNumber,
          };
          break;
          
        case 'patient':
          entityId = uuidv4();
          metadata = {
            ...metadata,
            patientName: faker.person.fullName(),
            mrn: `MRN${faker.string.numeric(8)}`,
            roomNumber: `${faker.helpers.arrayElement(['A', 'B', 'C'])}${faker.string.numeric(3)}`,
          };
          break;
          
        case 'user':
          entityId = user.id;
          metadata = {
            ...metadata,
            loginMethod: faker.helpers.arrayElement(['password', 'sso', 'biometric']),
            sessionDuration: actionType.action === 'logout' ? `${faker.number.int({ min: 5, max: 480 })} minutes` : undefined,
          };
          break;
          
        case 'system':
          entityId = uuidv4(); // Generate UUID for system logs
          metadata = {
            ...metadata,
            component: faker.helpers.arrayElement(['database', 'api', 'websocket', 'scheduler']),
            details: faker.lorem.sentence(),
          };
          break;
          
        case 'permission':
          entityId = faker.helpers.arrayElement(userList).id;
          metadata = {
            ...metadata,
            targetUser: faker.person.fullName(),
            changes: faker.lorem.sentence(),
          };
          break;
          
        default:
          entityId = uuidv4();
      }
      
      const log = {
        id: uuidv4(),
        userId: logUserId,
        action: actionType.action,
        entityType: actionType.entityType,
        entityId,
        metadata,
        severity: actionType.severity as 'info' | 'warning' | 'error' | 'critical',
        hospitalId: user.defaultHospitalId || hospitalIds[0],
        ipAddress: faker.internet.ip(),
        userAgent: faker.helpers.arrayElement([
          'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) Mobile/15E148 HospitalApp/1.0',
          'Mozilla/5.0 (Android 12; Mobile) HospitalApp/1.0',
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        ]),
        success: actionType.action.includes('failed') || actionType.action.includes('error') ? false : true,
        createdAt: timestamp,
      };
      
      logs.push(log);
    }
  }
  
  // Sort logs by timestamp (newest first)
  logs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  
  await db.insert(activityLogs).values(logs);

  return logs;
}

async function main() {
  try {

    // Clear existing data
    await clearExistingData();
    
    // Create data in order
    const orgs = await createOrganizations();
    const hospitalList = await createHospitals(orgs.map(o => o.id));
    const userList = await createUsers(hospitalList.map(h => h.id), orgs.map(o => o.id));
    const patientList = await createPatients(hospitalList.map(h => h.id));
    const { alertList } = await createAlerts(hospitalList.map(h => h.id), userList, patientList);
    await createActivityLogs(userList, alertList, hospitalList.map(h => h.id));

  } catch (error) {
    console.error('❌ Error seeding demo data:', error);
    process.exit(1);
  }
}

// Run the script
main();