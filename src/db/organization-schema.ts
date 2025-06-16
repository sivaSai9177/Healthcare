import { boolean, integer, pgTable, text, timestamp, uuid, varchar, jsonb, index, uniqueIndex } from "drizzle-orm/pg-core";
import { user } from "./schema";

// Organizations table - Core organization data
export const organization = pgTable("organization", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).unique(), // URL-friendly identifier
  type: varchar("type", { length: 50 }).notNull(), // business, nonprofit, education, personal
  size: varchar("size", { length: 50 }).notNull(), // solo, small, medium, large, enterprise
  industry: varchar("industry", { length: 100 }),
  website: varchar("website", { length: 255 }),
  description: text("description"),
  logo: text("logo"), // URL to logo image
  
  // Contact information
  email: varchar("email", { length: 254 }),
  phone: varchar("phone", { length: 50 }),
  address: text("address"),
  
  // Localization
  timezone: varchar("timezone", { length: 100 }).notNull().default("UTC"),
  language: varchar("language", { length: 10 }).notNull().default("en"),
  currency: varchar("currency", { length: 10 }).notNull().default("USD"),
  country: varchar("country", { length: 2 }), // ISO country code
  
  // Subscription/Plan information
  plan: varchar("plan", { length: 50 }).notNull().default("free"), // free, starter, pro, enterprise
  planExpiresAt: timestamp("plan_expires_at"),
  trialEndsAt: timestamp("trial_ends_at"),
  
  // Status and metadata
  status: varchar("status", { length: 50 }).notNull().default("active"), // active, inactive, suspended, deleted
  metadata: jsonb("metadata").default({}), // Flexible storage for custom fields
  
  // Audit fields
  createdBy: text("created_by").references(() => user.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"), // Soft delete
}, (table) => {
  return {
    nameIdx: index("idx_organization_name").on(table.name),
    slugIdx: uniqueIndex("idx_organization_slug").on(table.slug),
    statusIdx: index("idx_organization_status").on(table.status),
    createdAtIdx: index("idx_organization_created_at").on(table.createdAt),
  };
});

// Organization members - Many-to-many relationship between users and organizations
export const organizationMember = pgTable("organization_member", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  
  // Role within organization
  role: varchar("role", { length: 50 }).notNull().default("member"), // owner, admin, manager, member, guest
  permissions: jsonb("permissions").default([]), // Array of specific permissions
  
  // Member status
  status: varchar("status", { length: 50 }).notNull().default("active"), // active, inactive, pending, suspended
  
  // Invitation tracking
  invitedBy: text("invited_by").references(() => user.id),
  invitedAt: timestamp("invited_at"),
  inviteToken: text("invite_token"), // For email invitations
  inviteExpiresAt: timestamp("invite_expires_at"),
  
  // Activity tracking
  joinedAt: timestamp("joined_at").defaultNow(),
  lastActiveAt: timestamp("last_active_at"),
  
  // Member preferences
  notificationPreferences: jsonb("notification_preferences").default({}),
  
  // Audit
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => {
  return {
    // Ensure one membership per user per org
    uniqueMemberIdx: uniqueIndex("idx_unique_org_member").on(table.organizationId, table.userId),
    orgIdx: index("idx_member_org_id").on(table.organizationId),
    userIdx: index("idx_member_user_id").on(table.userId),
    roleIdx: index("idx_member_role").on(table.role),
    statusIdx: index("idx_member_status").on(table.status),
  };
});

// Organization invitation codes - For easy joining
export const organizationCode = pgTable("organization_code", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
  
  code: varchar("code", { length: 12 }).notNull().unique(), // e.g., "ACME-2024-XYZ"
  type: varchar("type", { length: 50 }).notNull().default("general"), // general, admin, member, guest
  
  // Usage limits
  maxUses: integer("max_uses"), // null = unlimited
  currentUses: integer("current_uses").notNull().default(0),
  
  // Validity
  isActive: boolean("is_active").notNull().default(true),
  expiresAt: timestamp("expires_at"),
  
  // Metadata
  createdBy: text("created_by").references(() => user.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => {
  return {
    codeIdx: uniqueIndex("idx_org_code").on(table.code),
    orgIdx: index("idx_code_org_id").on(table.organizationId),
    activeIdx: index("idx_code_active").on(table.isActive),
  };
});

// Organization settings - Configuration and preferences
export const organizationSettings = pgTable("organization_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().unique().references(() => organization.id, { onDelete: "cascade" }),
  
  // Security settings
  allowGuestAccess: boolean("allow_guest_access").notNull().default(false),
  require2FA: boolean("require_2fa").notNull().default(false),
  allowedDomains: jsonb("allowed_domains").default([]), // Email domains for auto-join
  passwordPolicy: jsonb("password_policy").default({}), // min length, complexity, etc.
  sessionTimeout: integer("session_timeout").default(30), // minutes
  
  // Member management
  maxMembers: integer("max_members"), // null = unlimited based on plan
  autoApproveMembers: boolean("auto_approve_members").notNull().default(false),
  defaultMemberRole: varchar("default_member_role", { length: 50 }).notNull().default("member"),
  
  // Feature flags
  features: jsonb("features").default({}), // Feature toggles
  modules: jsonb("modules").default({}), // Enabled modules
  
  // Notification preferences
  notificationEmail: varchar("notification_email", { length: 254 }),
  notificationSettings: jsonb("notification_settings").default({}),
  
  // Branding
  primaryColor: varchar("primary_color", { length: 7 }), // Hex color
  secondaryColor: varchar("secondary_color", { length: 7 }),
  customCss: text("custom_css"),
  
  // Integrations
  integrations: jsonb("integrations").default({}), // Third-party integrations config
  webhooks: jsonb("webhooks").default([]), // Webhook endpoints
  
  // Audit
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  updatedBy: text("updated_by").references(() => user.id),
}, (table) => {
  return {
    orgIdx: uniqueIndex("idx_settings_org_id").on(table.organizationId),
  };
});

// Organization activity log - Comprehensive audit trail
export const organizationActivityLog = pgTable("organization_activity_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
  
  // Actor information
  actorId: text("actor_id").references(() => user.id),
  actorName: varchar("actor_name", { length: 100 }), // Snapshot for history
  actorEmail: varchar("actor_email", { length: 254 }), // Snapshot for history
  actorRole: varchar("actor_role", { length: 50 }),
  
  // Action details
  action: varchar("action", { length: 100 }).notNull(), // e.g., member.invited, settings.updated
  category: varchar("category", { length: 50 }).notNull(), // member, settings, billing, security
  severity: varchar("severity", { length: 20 }).notNull().default("info"), // info, warning, error, critical
  
  // Target information
  entityType: varchar("entity_type", { length: 50 }), // user, organization, member, etc.
  entityId: uuid("entity_id"),
  entityName: varchar("entity_name", { length: 255 }), // Human-readable identifier
  
  // Change tracking
  changes: jsonb("changes").default({}), // What changed
  previousState: jsonb("previous_state"), // State before change
  newState: jsonb("new_state"), // State after change
  
  // Additional context
  metadata: jsonb("metadata").default({}), // Extra contextual data
  ipAddress: varchar("ip_address", { length: 45 }), // IPv4 or IPv6
  userAgent: text("user_agent"),
  
  // Timestamp
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => {
  return {
    orgIdx: index("idx_activity_org_id").on(table.organizationId),
    actorIdx: index("idx_activity_actor_id").on(table.actorId),
    actionIdx: index("idx_activity_action").on(table.action),
    categoryIdx: index("idx_activity_category").on(table.category),
    createdAtIdx: index("idx_activity_created_at").on(table.createdAt.desc()),
    // Composite index for common queries
    orgCreatedIdx: index("idx_activity_org_created").on(table.organizationId, table.createdAt.desc()),
  };
});

// Organization invitations - Track pending invitations
export const organizationInvitation = pgTable("organization_invitation", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
  
  // Invitation details
  email: varchar("email", { length: 254 }).notNull(),
  role: varchar("role", { length: 50 }).notNull().default("member"),
  token: text("token").notNull().unique(), // Secure random token
  
  // Status tracking
  status: varchar("status", { length: 50 }).notNull().default("pending"), // pending, accepted, expired, cancelled
  
  // Metadata
  invitedBy: text("invited_by").references(() => user.id),
  message: text("message"), // Personal message from inviter
  
  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
  acceptedAt: timestamp("accepted_at"),
  acceptedBy: text("accepted_by").references(() => user.id),
}, (table) => {
  return {
    tokenIdx: uniqueIndex("idx_invitation_token").on(table.token),
    emailIdx: index("idx_invitation_email").on(table.email),
    orgIdx: index("idx_invitation_org_id").on(table.organizationId),
    statusIdx: index("idx_invitation_status").on(table.status),
  };
});

// Organization join requests - Track user requests to join organizations
export const organizationJoinRequest = pgTable("organization_join_request", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  
  // Request details
  requestedRole: varchar("requested_role", { length: 50 }).notNull().default("member"),
  message: text("message"), // Why they want to join
  
  // Status tracking
  status: varchar("status", { length: 50 }).notNull().default("pending"), // pending, approved, rejected, cancelled
  
  // Review details
  reviewedBy: text("reviewed_by").references(() => user.id),
  reviewedAt: timestamp("reviewed_at"),
  reviewNote: text("review_note"), // Admin's note on approval/rejection
  
  // Auto-approval settings
  autoApproved: boolean("auto_approved").notNull().default(false),
  
  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => {
  return {
    // Ensure one active request per user per org
    uniqueRequestIdx: uniqueIndex("idx_unique_join_request").on(table.organizationId, table.userId),
    orgIdx: index("idx_request_org_id").on(table.organizationId),
    userIdx: index("idx_request_user_id").on(table.userId),
    statusIdx: index("idx_request_status").on(table.status),
    createdAtIdx: index("idx_request_created_at").on(table.createdAt.desc()),
  };
});

// Type exports for TypeScript
export type Organization = typeof organization.$inferSelect;
export type NewOrganization = typeof organization.$inferInsert;
export type OrganizationMember = typeof organizationMember.$inferSelect;
export type NewOrganizationMember = typeof organizationMember.$inferInsert;
export type OrganizationCode = typeof organizationCode.$inferSelect;
export type NewOrganizationCode = typeof organizationCode.$inferInsert;
export type OrganizationSettings = typeof organizationSettings.$inferSelect;
export type NewOrganizationSettings = typeof organizationSettings.$inferInsert;
export type OrganizationActivityLog = typeof organizationActivityLog.$inferSelect;
export type NewOrganizationActivityLog = typeof organizationActivityLog.$inferInsert;
export type OrganizationInvitation = typeof organizationInvitation.$inferSelect;
export type NewOrganizationInvitation = typeof organizationInvitation.$inferInsert;
export type OrganizationJoinRequest = typeof organizationJoinRequest.$inferSelect;
export type NewOrganizationJoinRequest = typeof organizationJoinRequest.$inferInsert;