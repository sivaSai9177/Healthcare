// Shared profile validation schemas for client and server
import { z } from 'zod';

export const UserRoleSchema = z.enum(['admin', 'manager', 'user', 'guest', 'operator', 'nurse', 'doctor', 'head_doctor']);

export const CompleteProfileInputSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: UserRoleSchema,
  organizationId: z.string().optional(),
  organizationName: z.string().optional(),
  organizationCode: z.string().min(4).max(12).regex(/^[A-Z0-9]+$/, 'Organization code must contain only uppercase letters and numbers').optional(),
  department: z.string().optional(),
  phoneNumber: z.string().optional(),
  jobTitle: z.string().optional(),
  bio: z.string().optional(),
  acceptTerms: z.literal(true).optional(),
  acceptPrivacy: z.literal(true).optional(),
});

export type CompleteProfileInput = z.infer<typeof CompleteProfileInputSchema>;
export type UserRole = z.infer<typeof UserRoleSchema>;