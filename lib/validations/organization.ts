import { z } from 'zod';
import { 
  emailSchema, 
  nameSchema, 
  urlSchema, 
  phoneSchema,
  timezoneSchema,
  trimAndLowercase,
  trimAndUppercase,
  paginationSchema,
  metadataSchema,
} from './common';

// ========================================
// Organization Core Schemas
// ========================================

// Organization types enum
export const OrganizationTypeSchema = z.enum(
  ['business', 'nonprofit', 'education', 'personal'],
  {
    errorMap: () => ({ message: 'Invalid organization type' })
  }
);

// Organization size enum
export const OrganizationSizeSchema = z.enum(
  ['solo', 'small', 'medium', 'large', 'enterprise'],
  {
    errorMap: () => ({ message: 'Invalid organization size' })
  }
);

// Organization status enum
export const OrganizationStatusSchema = z.enum(
  ['active', 'inactive', 'suspended', 'deleted'],
  {
    errorMap: () => ({ message: 'Invalid organization status' })
  }
);

// Organization plan enum
export const OrganizationPlanSchema = z.enum(
  ['free', 'starter', 'pro', 'enterprise'],
  {
    errorMap: () => ({ message: 'Invalid organization plan' })
  }
);

// Member role enum with hierarchy
export const OrganizationRoleSchema = z.enum(
  ['owner', 'admin', 'manager', 'member', 'guest'],
  {
    errorMap: () => ({ message: 'Invalid organization role' })
  }
);

// Member status enum
export const MemberStatusSchema = z.enum(
  ['active', 'inactive', 'pending', 'suspended'],
  {
    errorMap: () => ({ message: 'Invalid member status' })
  }
);

// Language code validation (ISO 639-1)
export const LanguageCodeSchema = z.string()
  .length(2, 'Language code must be 2 characters')
  .toLowerCase()
  .regex(/^[a-z]{2}$/, 'Invalid language code format');

// Currency code validation (ISO 4217)
export const CurrencyCodeSchema = z.string()
  .length(3, 'Currency code must be 3 characters')
  .toUpperCase()
  .regex(/^[A-Z]{3}$/, 'Invalid currency code format');

// Country code validation (ISO 3166-1 alpha-2)
export const CountryCodeSchema = z.string()
  .length(2, 'Country code must be 2 characters')
  .toUpperCase()
  .regex(/^[A-Z]{2}$/, 'Invalid country code format');

// Organization slug validation
export const OrganizationSlugSchema = z.string()
  .min(3, 'Slug must be at least 3 characters')
  .max(50, 'Slug cannot exceed 50 characters')
  .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens')
  .refine(val => !val.startsWith('-') && !val.endsWith('-'), 'Slug cannot start or end with a hyphen')
  .refine(val => !val.includes('--'), 'Slug cannot contain consecutive hyphens');

// ========================================
// Organization CRUD Schemas
// ========================================

// Create organization input
export const CreateOrganizationSchema = z.object({
  name: z.string()
    .min(2, 'Organization name must be at least 2 characters')
    .max(255, 'Organization name cannot exceed 255 characters')
    .trim()
    .refine(val => !/<[^>]*>/g.test(val), 'Name cannot contain HTML tags'),
  
  slug: OrganizationSlugSchema.optional(), // Auto-generated if not provided
  type: OrganizationTypeSchema,
  size: OrganizationSizeSchema,
  
  industry: z.string()
    .max(100, 'Industry cannot exceed 100 characters')
    .trim()
    .optional(),
  
  website: urlSchema.optional(),
  description: z.string()
    .max(1000, 'Description cannot exceed 1000 characters')
    .trim()
    .optional(),
  
  // Contact information
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  address: z.string()
    .max(500, 'Address cannot exceed 500 characters')
    .trim()
    .optional(),
  
  // Localization
  timezone: timezoneSchema,
  language: LanguageCodeSchema.default('en'),
  currency: CurrencyCodeSchema.default('USD'),
  country: CountryCodeSchema.optional(),
  
  // Initial member invitations
  inviteEmails: z.array(
    z.object({
      email: emailSchema,
      role: OrganizationRoleSchema.default('member'),
      message: z.string().max(500).optional(),
    })
  ).max(50, 'Cannot invite more than 50 members at once').optional(),
  
  // Metadata
  metadata: metadataSchema.optional(),
}).strict();

// Update organization input
export const UpdateOrganizationSchema = z.object({
  organizationId: z.string().uuid('Invalid organization ID'),
  data: z.object({
    name: z.string()
      .min(2, 'Organization name must be at least 2 characters')
      .max(255, 'Organization name cannot exceed 255 characters')
      .trim()
      .optional(),
    
    industry: z.string()
      .max(100, 'Industry cannot exceed 100 characters')
      .trim()
      .optional(),
    
    website: urlSchema.optional(),
    description: z.string()
      .max(1000, 'Description cannot exceed 1000 characters')
      .trim()
      .optional(),
    
    // Contact information
    email: emailSchema.optional(),
    phone: phoneSchema.optional(),
    address: z.string()
      .max(500, 'Address cannot exceed 500 characters')
      .trim()
      .optional(),
    
    // Localization
    timezone: timezoneSchema.optional(),
    language: LanguageCodeSchema.optional(),
    currency: CurrencyCodeSchema.optional(),
    country: CountryCodeSchema.optional(),
    
    // Status (admin only)
    status: OrganizationStatusSchema.optional(),
    
    // Metadata
    metadata: metadataSchema.optional(),
  }).strict(),
}).strict();

// Get organization input
export const GetOrganizationSchema = z.object({
  organizationId: z.string().uuid('Invalid organization ID'),
}).strict();

// Delete organization input
export const DeleteOrganizationSchema = z.object({
  organizationId: z.string().uuid('Invalid organization ID'),
  confirmDelete: z.literal(true, {
    errorMap: () => ({ message: 'Must confirm deletion' })
  }),
}).strict();

// List user organizations (no input needed, uses session)
export const ListUserOrganizationsSchema = z.object({
  includeInactive: z.boolean().default(false),
}).strict();

// ========================================
// Member Management Schemas
// ========================================

// Get organization members input
export const GetOrganizationMembersSchema = z.object({
  organizationId: z.string().uuid('Invalid organization ID'),
  search: z.string()
    .max(100, 'Search query too long')
    .trim()
    .optional(),
  role: OrganizationRoleSchema.optional(),
  status: MemberStatusSchema.optional(),
  ...paginationSchema.shape,
}).strict();

// Invite members input
export const InviteMembersSchema = z.object({
  organizationId: z.string().uuid('Invalid organization ID'),
  invitations: z.array(
    z.object({
      email: emailSchema,
      role: OrganizationRoleSchema.default('member'),
      message: z.string()
        .max(500, 'Message cannot exceed 500 characters')
        .trim()
        .optional(),
    })
  )
  .min(1, 'At least one invitation required')
  .max(50, 'Cannot invite more than 50 members at once')
  .refine(
    invites => {
      const emails = invites.map(i => i.email);
      return new Set(emails).size === emails.length;
    },
    'Duplicate email addresses found'
  ),
}).strict();

// Update member role input
export const UpdateMemberRoleSchema = z.object({
  organizationId: z.string().uuid('Invalid organization ID'),
  userId: z.string().min(1, 'User ID required'),
  role: OrganizationRoleSchema,
}).strict();

// Remove member input
export const RemoveMemberSchema = z.object({
  organizationId: z.string().uuid('Invalid organization ID'),
  userId: z.string().min(1, 'User ID required'),
  reason: z.string()
    .max(500, 'Reason cannot exceed 500 characters')
    .optional(),
}).strict();

// ========================================
// Organization Settings Schemas
// ========================================

// Security settings schema
export const SecuritySettingsSchema = z.object({
  allowGuestAccess: z.boolean(),
  require2FA: z.boolean(),
  allowedDomains: z.array(
    z.string()
      .max(253, 'Domain too long')
      .regex(/^[a-z0-9.-]+\.[a-z]{2,}$/i, 'Invalid domain format')
  ).max(100, 'Cannot have more than 100 allowed domains'),
  passwordPolicy: z.object({
    minLength: z.number().min(8).max(128).default(12),
    requireUppercase: z.boolean().default(true),
    requireLowercase: z.boolean().default(true),
    requireNumbers: z.boolean().default(true),
    requireSpecialChars: z.boolean().default(true),
    maxAge: z.number().min(0).max(365).optional(), // days
  }).optional(),
  sessionTimeout: z.number()
    .min(5, 'Session timeout must be at least 5 minutes')
    .max(1440, 'Session timeout cannot exceed 24 hours'),
}).partial();

// Notification settings schema
export const NotificationSettingsSchema = z.object({
  notificationEmail: emailSchema.optional(),
  emailNotifications: z.object({
    newMember: z.boolean(),
    memberLeft: z.boolean(),
    roleChanged: z.boolean(),
    securityAlert: z.boolean(),
    weeklyReport: z.boolean(),
    monthlyReport: z.boolean(),
  }).partial(),
  inAppNotifications: z.object({
    newMember: z.boolean(),
    memberLeft: z.boolean(),
    roleChanged: z.boolean(),
    securityAlert: z.boolean(),
  }).partial(),
}).partial();

// Feature settings schema
export const FeatureSettingsSchema = z.object({
  features: z.record(z.boolean()),
  modules: z.record(z.boolean()),
}).partial();

// Get settings input
export const GetOrganizationSettingsSchema = z.object({
  organizationId: z.string().uuid('Invalid organization ID'),
}).strict();

// Update settings input
export const UpdateOrganizationSettingsSchema = z.object({
  organizationId: z.string().uuid('Invalid organization ID'),
  settings: z.object({
    security: SecuritySettingsSchema.optional(),
    notifications: NotificationSettingsSchema.optional(),
    features: FeatureSettingsSchema.optional(),
    member: z.object({
      maxMembers: z.number().min(1).max(10000).optional(),
      autoApproveMembers: z.boolean().optional(),
      defaultMemberRole: OrganizationRoleSchema.optional(),
    }).optional(),
    branding: z.object({
      primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color').optional(),
      secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color').optional(),
    }).optional(),
  }).strict(),
}).strict();

// ========================================
// Organization Code System Schemas
// ========================================

// Generate organization code input
export const GenerateOrganizationCodeSchema = z.object({
  organizationId: z.string().uuid('Invalid organization ID'),
  type: OrganizationRoleSchema.default('member'),
  maxUses: z.number()
    .min(1, 'Max uses must be at least 1')
    .max(1000, 'Max uses cannot exceed 1000')
    .optional(),
  expiresIn: z.number()
    .min(3600, 'Code must be valid for at least 1 hour')
    .max(2592000, 'Code cannot be valid for more than 30 days')
    .default(604800), // 7 days in seconds
}).strict();

// Join by code input
export const JoinByCodeSchema = z.object({
  code: z.string()
    .min(4, 'Code too short')
    .max(12, 'Code too long')
    .toUpperCase()
    .regex(/^[A-Z0-9-]+$/, 'Invalid code format'),
}).strict();

// ========================================
// Organization Metrics & Analytics Schemas
// ========================================

// Metric types
export const MetricTypeSchema = z.enum(
  ['activity', 'growth', 'performance', 'engagement'],
  {
    errorMap: () => ({ message: 'Invalid metric type' })
  }
);

// Time periods
export const TimePeriodSchema = z.enum(
  ['day', 'week', 'month', 'quarter', 'year'],
  {
    errorMap: () => ({ message: 'Invalid time period' })
  }
);

// Get metrics input
export const GetOrganizationMetricsSchema = z.object({
  organizationId: z.string().uuid('Invalid organization ID'),
  metric: MetricTypeSchema,
  period: TimePeriodSchema.default('month'),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
}).strict();

// Activity log filters
export const ActivityLogActionSchema = z.enum([
  'member.invited',
  'member.joined',
  'member.removed',
  'member.role_changed',
  'member.suspended',
  'member.join_request_sent',
  'member.join_request_approved',
  'member.join_request_rejected',
  'settings.updated',
  'settings.security_changed',
  'organization.created',
  'organization.updated',
  'organization.deleted',
  'code.generated',
  'code.used',
  'billing.updated',
  'integration.added',
  'integration.removed',
]);

// Get activity log input
export const GetActivityLogSchema = z.object({
  organizationId: z.string().uuid('Invalid organization ID'),
  actorId: z.string().optional(),
  action: ActivityLogActionSchema.optional(),
  category: z.enum(['member', 'settings', 'billing', 'security', 'integration']).optional(),
  severity: z.enum(['info', 'warning', 'error', 'critical']).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  ...paginationSchema.shape,
}).strict();

// ========================================
// Response Schemas
// ========================================

// Organization response
export const OrganizationResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string().nullable(),
  type: OrganizationTypeSchema,
  size: OrganizationSizeSchema,
  industry: z.string().nullable(),
  website: z.string().nullable(),
  description: z.string().nullable(),
  logo: z.string().nullable(),
  
  email: z.string().nullable(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  
  timezone: z.string(),
  language: z.string(),
  currency: z.string(),
  country: z.string().nullable(),
  
  plan: OrganizationPlanSchema,
  planExpiresAt: z.date().nullable(),
  trialEndsAt: z.date().nullable(),
  
  status: OrganizationStatusSchema,
  metadata: z.record(z.any()),
  
  memberCount: z.number().optional(),
  myRole: OrganizationRoleSchema.optional(),
  
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Member response
export const OrganizationMemberResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  organizationId: z.string(),
  
  // User details (joined from user table)
  name: z.string(),
  email: z.string(),
  image: z.string().nullable(),
  
  role: OrganizationRoleSchema,
  permissions: z.array(z.string()),
  status: MemberStatusSchema,
  
  joinedAt: z.date(),
  lastActiveAt: z.date().nullable(),
  
  invitedBy: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
  }).nullable(),
});

// Activity log response
export const ActivityLogResponseSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  
  actor: z.object({
    id: z.string().nullable(),
    name: z.string().nullable(),
    email: z.string().nullable(),
    role: z.string().nullable(),
  }),
  
  action: z.string(),
  category: z.string(),
  severity: z.string(),
  
  entity: z.object({
    type: z.string().nullable(),
    id: z.string().nullable(),
    name: z.string().nullable(),
  }),
  
  changes: z.record(z.any()),
  metadata: z.record(z.any()),
  
  createdAt: z.date(),
});

// ========================================
// Organization Join Request Schemas
// ========================================

// Join request status enum
export const JoinRequestStatusSchema = z.enum(
  ['pending', 'approved', 'rejected', 'cancelled'],
  {
    errorMap: () => ({ message: 'Invalid join request status' })
  }
);

// Send join request input
export const SendJoinRequestSchema = z.object({
  organizationId: z.string().uuid('Invalid organization ID'),
  requestedRole: OrganizationRoleSchema.default('member'),
  message: z.string()
    .min(10, 'Message must be at least 10 characters')
    .max(1000, 'Message cannot exceed 1000 characters')
    .trim()
    .optional(),
}).strict();

// List join requests input (for admins)
export const ListJoinRequestsSchema = z.object({
  organizationId: z.string().uuid('Invalid organization ID'),
  status: JoinRequestStatusSchema.optional(),
  search: z.string().max(100).trim().optional(),
  ...paginationSchema.shape,
}).strict();

// List user's join requests
export const ListUserJoinRequestsSchema = z.object({
  status: JoinRequestStatusSchema.optional(),
  ...paginationSchema.shape,
}).strict();

// Review join request input
export const ReviewJoinRequestSchema = z.object({
  requestId: z.string().uuid('Invalid request ID'),
  action: z.enum(['approve', 'reject']),
  reviewNote: z.string()
    .max(500, 'Review note cannot exceed 500 characters')
    .trim()
    .optional(),
  approvedRole: OrganizationRoleSchema.optional(), // Can override requested role
}).strict();

// Cancel join request input
export const CancelJoinRequestSchema = z.object({
  requestId: z.string().uuid('Invalid request ID'),
}).strict();

// Search organizations input
export const SearchOrganizationsSchema = z.object({
  query: z.string()
    .min(2, 'Search query must be at least 2 characters')
    .max(100, 'Search query too long')
    .trim()
    .optional(),
  type: OrganizationTypeSchema.optional(),
  size: OrganizationSizeSchema.optional(),
  industry: z.string().max(100).trim().optional(),
  hasOpenRequests: z.boolean().optional(), // Filter orgs with open join requests
  ...paginationSchema.shape,
}).strict();

// Join request response
export const JoinRequestResponseSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  userId: z.string(),
  
  // User details
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    image: z.string().nullable(),
  }),
  
  // Organization details
  organization: z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string().nullable(),
    logo: z.string().nullable(),
  }),
  
  requestedRole: OrganizationRoleSchema,
  message: z.string().nullable(),
  status: JoinRequestStatusSchema,
  
  // Review details
  reviewedBy: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
  }).nullable(),
  reviewedAt: z.date().nullable(),
  reviewNote: z.string().nullable(),
  
  autoApproved: z.boolean(),
  
  createdAt: z.date(),
  updatedAt: z.date(),
});

// ========================================
// Type Exports
// ========================================

export type OrganizationType = z.infer<typeof OrganizationTypeSchema>;
export type OrganizationSize = z.infer<typeof OrganizationSizeSchema>;
export type OrganizationRole = z.infer<typeof OrganizationRoleSchema>;
export type CreateOrganizationInput = z.infer<typeof CreateOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof UpdateOrganizationSchema>;
export type InviteMembersInput = z.infer<typeof InviteMembersSchema>;
export type OrganizationResponse = z.infer<typeof OrganizationResponseSchema>;
export type OrganizationMemberResponse = z.infer<typeof OrganizationMemberResponseSchema>;
export type ActivityLogResponse = z.infer<typeof ActivityLogResponseSchema>;
export type JoinRequestStatus = z.infer<typeof JoinRequestStatusSchema>;
export type SendJoinRequestInput = z.infer<typeof SendJoinRequestSchema>;
export type ReviewJoinRequestInput = z.infer<typeof ReviewJoinRequestSchema>;
export type JoinRequestResponse = z.infer<typeof JoinRequestResponseSchema>;