// Re-export base schema
// Combined schema for migrations
import * as baseSchema from './schema';
import * as healthcareSchema from './healthcare-schema';
import * as patientSchema from './patient-schema';
import * as organizationSchema from './organization-schema';
import * as notificationSchema from './notification-schema';

export * from './schema';
export * from './healthcare-schema';
export * from './patient-schema';
export * from './organization-schema';
export * from './notification-schema';

export const schema = {
  ...baseSchema,
  ...healthcareSchema.healthcareTables,
  ...patientSchema,
  ...organizationSchema,
  ...notificationSchema,
};