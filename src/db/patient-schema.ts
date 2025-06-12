import { pgTable, uuid, varchar, integer, timestamp, text, check, boolean, jsonb } from 'drizzle-orm/pg-core';
import { users } from './schema';
import { hospitals, departments } from './healthcare-schema';
import { sql } from 'drizzle-orm';

// Patients table
export const patients = pgTable('patients', {
  id: uuid('id').primaryKey().defaultRandom(),
  mrn: varchar('mrn', { length: 20 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  dateOfBirth: timestamp('date_of_birth').notNull(),
  gender: varchar('gender', { length: 20 }).notNull(),
  bloodType: varchar('blood_type', { length: 5 }),
  roomNumber: varchar('room_number', { length: 10 }),
  bedNumber: varchar('bed_number', { length: 10 }),
  admissionDate: timestamp('admission_date').notNull(),
  dischargeDate: timestamp('discharge_date'),
  primaryDiagnosis: text('primary_diagnosis'),
  secondaryDiagnoses: jsonb('secondary_diagnoses'),
  allergies: jsonb('allergies'),
  medications: jsonb('medications'),
  emergencyContact: jsonb('emergency_contact'),
  insuranceInfo: jsonb('insurance_info'),
  flags: jsonb('flags').default('{}'), // DNR, fall risk, allergy alert, etc.
  hospitalId: uuid('hospital_id').references(() => hospitals.id).notNull(),
  departmentId: uuid('department_id').references(() => departments.id),
  primaryDoctorId: text('primary_doctor_id').references(() => users.id),
  attendingNurseId: text('attending_nurse_id').references(() => users.id),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  genderCheck: check('gender_check', sql`${table.gender} IN ('male', 'female', 'other', 'unknown')`),
  bloodTypeCheck: check('blood_type_check', sql`${table.bloodType} IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', NULL)`),
}));

// Patient vitals table for time-series data
export const patientVitals = pgTable('patient_vitals', {
  id: uuid('id').primaryKey().defaultRandom(),
  patientId: uuid('patient_id').references(() => patients.id).notNull(),
  recordedAt: timestamp('recorded_at').defaultNow(),
  recordedBy: text('recorded_by').references(() => users.id).notNull(),
  heartRate: integer('heart_rate'), // bpm
  bloodPressureSystolic: integer('blood_pressure_systolic'), // mmHg
  bloodPressureDiastolic: integer('blood_pressure_diastolic'), // mmHg
  temperature: varchar('temperature', { length: 10 }), // Celsius
  respiratoryRate: integer('respiratory_rate'), // breaths per minute
  oxygenSaturation: integer('oxygen_saturation'), // percentage
  bloodGlucose: integer('blood_glucose'), // mg/dL
  pain: integer('pain'), // 0-10 scale
  notes: text('notes'),
  metadata: jsonb('metadata'), // Additional measurements
});

// Care team assignments
export const careTeamAssignments = pgTable('care_team_assignments', {
  id: uuid('id').primaryKey().defaultRandom(),
  patientId: uuid('patient_id').references(() => patients.id).notNull(),
  userId: text('user_id').references(() => users.id).notNull(),
  role: varchar('role', { length: 50 }).notNull(), // primary_doctor, attending_nurse, specialist, etc.
  assignedAt: timestamp('assigned_at').defaultNow(),
  unassignedAt: timestamp('unassigned_at'),
  isActive: boolean('is_active').default(true),
  notes: text('notes'),
}, (table) => ({
  roleCheck: check('role_check', sql`${table.role} IN ('primary_doctor', 'attending_nurse', 'specialist', 'resident', 'intern')`),
}));

// Type exports for TypeScript
export type Patient = typeof patients.$inferSelect;
export type NewPatient = typeof patients.$inferInsert;
export type PatientVital = typeof patientVitals.$inferSelect;
export type NewPatientVital = typeof patientVitals.$inferInsert;
export type CareTeamAssignment = typeof careTeamAssignments.$inferSelect;
export type NewCareTeamAssignment = typeof careTeamAssignments.$inferInsert;