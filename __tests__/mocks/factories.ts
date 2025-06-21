/**
 * Mock data factories for tests
 */

import { faker } from '@faker-js/faker';
import type { Alert, User, Hospital, Patient, Organization } from '@/types';

// Alert factory
export const createMockAlert = (overrides: Partial<Alert> = {}): Alert => ({
  id: faker.string.uuid(),
  roomNumber: faker.number.int({ min: 100, max: 999 }).toString(),
  alertType: faker.helpers.arrayElement(['NURSE_CALL', 'EMERGENCY', 'ASSISTANCE', 'CODE_BLUE', 'FALL_RISK'] as const),
  urgency: faker.number.int({ min: 1, max: 5 }),
  patientId: faker.string.uuid(),
  hospitalId: faker.string.uuid(),
  description: faker.lorem.sentence(),
  status: faker.helpers.arrayElement(['ACTIVE', 'ACKNOWLEDGED', 'RESOLVED', 'ESCALATED'] as const),
  createdAt: faker.date.recent().toISOString(),
  updatedAt: faker.date.recent().toISOString(),
  createdBy: faker.string.uuid(),
  acknowledgedBy: null,
  acknowledgedAt: null,
  resolvedBy: null,
  resolvedAt: null,
  escalatedAt: null,
  responseTime: null,
  ...overrides,
});

// User factory
export const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: faker.string.uuid(),
  email: faker.internet.email(),
  name: faker.person.fullName(),
  role: faker.helpers.arrayElement(['NURSE', 'DOCTOR', 'ADMIN', 'OPERATOR'] as const),
  hospitalId: faker.string.uuid(),
  organizationId: faker.string.uuid(),
  profileCompleted: true,
  emailVerified: true,
  createdAt: faker.date.past().toISOString(),
  updatedAt: faker.date.recent().toISOString(),
  ...overrides,
});

// Hospital factory
export const createMockHospital = (overrides: Partial<Hospital> = {}): Hospital => ({
  id: faker.string.uuid(),
  name: faker.company.name() + ' Hospital',
  organizationId: faker.string.uuid(),
  address: faker.location.streetAddress(),
  city: faker.location.city(),
  state: faker.location.state(),
  zipCode: faker.location.zipCode(),
  phone: faker.phone.number(),
  createdAt: faker.date.past().toISOString(),
  updatedAt: faker.date.recent().toISOString(),
  ...overrides,
});

// Patient factory
export const createMockPatient = (overrides: Partial<Patient> = {}): Patient => ({
  id: faker.string.uuid(),
  hospitalId: faker.string.uuid(),
  roomNumber: faker.number.int({ min: 100, max: 999 }).toString(),
  name: faker.person.fullName(),
  age: faker.number.int({ min: 18, max: 90 }),
  gender: faker.helpers.arrayElement(['male', 'female', 'other'] as const),
  admissionDate: faker.date.recent().toISOString(),
  diagnosis: faker.lorem.sentence(),
  assignedNurseId: faker.string.uuid(),
  assignedDoctorId: faker.string.uuid(),
  status: faker.helpers.arrayElement(['stable', 'critical', 'observation'] as const),
  createdAt: faker.date.past().toISOString(),
  updatedAt: faker.date.recent().toISOString(),
  ...overrides,
});

// Organization factory
export const createMockOrganization = (overrides: Partial<Organization> = {}): Organization => ({
  id: faker.string.uuid(),
  name: faker.company.name() + ' Healthcare',
  type: faker.helpers.arrayElement(['hospital', 'clinic', 'emergency'] as const),
  contactEmail: faker.internet.email(),
  contactPhone: faker.phone.number(),
  address: faker.location.streetAddress(),
  city: faker.location.city(),
  state: faker.location.state(),
  zipCode: faker.location.zipCode(),
  createdAt: faker.date.past().toISOString(),
  updatedAt: faker.date.recent().toISOString(),
  ...overrides,
});

// Session factory
export const createMockSession = (overrides: any = {}) => ({
  user: createMockUser(),
  token: faker.string.alphanumeric(32),
  expiresAt: faker.date.future().toISOString(),
  ...overrides,
});

// WebSocket message factory
export const createMockWebSocketMessage = (type: string, data: any = {}) => ({
  type,
  data,
  timestamp: new Date().toISOString(),
  id: faker.string.uuid(),
});

// API response factory
export const createMockApiResponse = <T>(data: T, overrides: any = {}) => ({
  data,
  success: true,
  message: 'Success',
  ...overrides,
});

// Error factory
export const createMockError = (message = 'Test error', code = 'TEST_ERROR') => ({
  message,
  code,
  statusCode: 500,
  details: {},
});