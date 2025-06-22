import { 
  router, 
  protectedProcedure,
  publicProcedure,
  viewOrganizationProcedure,
  manageOrganizationProcedure,
  inviteMembersProcedure,
  manageMembersProcedure,
} from '../trpc';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { db } from '../../db';
import { 
  organization, 
  organizationMember, 
  organizationCode,
  organizationSettings,
  organizationActivityLog,
  organizationInvitation,
  organizationJoinRequest,
} from '../../db/organization-schema';
import { user } from '../../db/schema';
import { healthcareUsers } from '../../db/healthcare-schema';
import { eq, and, desc, sql, gte, lte, or } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { log } from '@/lib/core/debug/logger';
import { orgAccess } from '../services/organization-access-control';
import {
  CreateOrganizationSchema,
  UpdateOrganizationSchema,
  GetOrganizationSchema,
  DeleteOrganizationSchema,
  ListUserOrganizationsSchema,
  GetOrganizationMembersSchema,
  InviteMembersSchema,
  UpdateMemberRoleSchema,
  RemoveMemberSchema,
  GetOrganizationSettingsSchema,
  UpdateOrganizationSettingsSchema,
  GenerateOrganizationCodeSchema,
  JoinByCodeSchema,
  GetOrganizationMetricsSchema,
  GetActivityLogSchema,
  OrganizationResponseSchema,
  SendJoinRequestSchema,
  ListJoinRequestsSchema,
  ListUserJoinRequestsSchema,
  ReviewJoinRequestSchema,
  CancelJoinRequestSchema,
  SearchOrganizationsSchema,
  JoinRequestResponseSchema,
  type OrganizationRole,
  type JoinRequestStatus,
} from '../../../lib/validations/organization';

// Rate limiting store (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

const checkRateLimit = (identifier: string, maxRequests: number, windowMs: number) => {
  const now = Date.now();
  const current = rateLimitStore.get(identifier);
  
  if (!current || current.resetTime < now) {
    rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs });
    return;
  }
  
  if (current.count >= maxRequests) {
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: `Rate limit exceeded. Try again in ${Math.ceil((current.resetTime - now) / 1000)} seconds.`
    });
  }
  
  current.count++;
};

// Helper to generate unique organization code
const generateOrgCode = async (orgName: string): Promise<string> => {
  const prefix = orgName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 4)
    .padEnd(4, 'X');
  
  let attempts = 0;
  while (attempts < 10) {
    const suffix = nanoid(6).toUpperCase();
    const code = `${prefix}-${suffix}`;
    
    // Check if code exists
    const existing = await db
      .select()
      .from(organizationCode)
      .where(eq(organizationCode.code, code))
      .limit(1);
    
    if (existing.length === 0) {
      return code;
    }
    
    attempts++;
  }
  
  throw new Error('Failed to generate unique organization code');
};

// Helper to create activity log entry
const logActivity = async (
  organizationId: string,
  actorId: string | null,
  action: string,
  category: string,
  entityType?: string,
  entityId?: string,
  metadata?: Record<string, any>
) => {
  try {
    const actorData = actorId ? await db
      .select({ name: user.name, email: user.email, role: user.role })
      .from(user)
      .where(eq(user.id, actorId))
      .limit(1) : [];

    await db.insert(organizationActivityLog).values({
      organizationId,
      actorId,
      actorName: actorData.length > 0 ? actorData[0].name : null,
      actorEmail: actorData.length > 0 ? actorData[0].email : null,
      actorRole: actorData.length > 0 ? actorData[0].role : null,
      action,
      category,
      severity: 'info',
      entityType,
      entityId,
      metadata: metadata || {},
    });
  } catch (error) {
    log.error('Failed to create activity log', 'ORG_ACTIVITY', { error, action });
  }
};

// Helper to create slug from name
const createSlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
};

// Helper to transform organization data for response
const transformOrganizationResponse = (org: any) => {
  return {
    ...org,
    type: org.type as 'business' | 'nonprofit' | 'education' | 'personal',
    size: org.size as 'solo' | 'small' | 'medium' | 'large' | 'enterprise',
    status: org.status as 'active' | 'inactive' | 'suspended' | 'deleted',
    plan: org.plan as 'free' | 'starter' | 'pro' | 'enterprise',
  };
};

export const organizationRouter = router({
  // ==========================================
  // Organization CRUD Operations
  // ==========================================
  
  create: protectedProcedure
    .input(CreateOrganizationSchema)
    .output(OrganizationResponseSchema)
    .mutation(async ({ input, ctx }) => {
      // Rate limiting: 5 org creations per hour per user
      checkRateLimit(`org-create:${ctx.session.user.id}`, 5, 3600000);
      
      try {
        // Generate slug if not provided
        const slug = input.slug || createSlug(input.name);
        
        // Check if slug is unique
        const existingSlug = await db
          .select()
          .from(organization)
          .where(eq(organization.slug, slug))
          .limit(1);
        
        if (existingSlug.length > 0) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Organization slug already exists',
          });
        }
        
        // Start transaction
        const result = await db.transaction(async (tx) => {
          // Create organization
          const [newOrg] = await tx
            .insert(organization)
            .values({
              name: input.name,
              slug,
              type: input.type || 'business',
              size: input.size || 'small',
              industry: input.industry || null,
              website: input.website || null,
              description: input.description || null,
              email: input.email || null,
              phone: input.phone || null,
              address: input.address || null,
              timezone: input.timezone || 'UTC',
              language: input.language || 'en',
              currency: input.currency || 'USD',
              country: input.country || null,
              plan: 'free',
              status: 'active',
              metadata: input.metadata || {},
              createdBy: ctx.session.user.id,
            })
            .returning();
          
          // Add creator as owner
          await tx.insert(organizationMember).values({
            organizationId: newOrg.id,
            userId: ctx.session.user.id,
            role: 'owner',
            status: 'active',
          });
          
          // Create default settings
          await tx.insert(organizationSettings).values({
            organizationId: newOrg.id,
          });
          
          // Log creation
          await logActivity(
            newOrg.id,
            ctx.session.user.id,
            'organization.created',
            'organization',
            'organization',
            newOrg.id,
            { name: newOrg.name }
          );
          
          // Handle invitations if provided
          if (input.inviteEmails && input.inviteEmails.length > 0) {
            const invitations = input.inviteEmails.map(invite => ({
              organizationId: newOrg.id,
              email: invite.email,
              role: invite.role,
              token: nanoid(32),
              invitedBy: ctx.session.user.id,
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            }));
            
            await tx.insert(organizationInvitation).values(invitations);
            
            // TODO: Send invitation emails
            
            await logActivity(
              newOrg.id,
              ctx.session.user.id,
              'member.invited',
              'member',
              undefined,
              undefined,
              { count: invitations.length }
            );
          }
          
          return newOrg;
        });
        
        log.info('Organization created', 'ORG_CREATE', { 
          organizationId: result.id, 
          userId: ctx.session.user.id 
        });
        
        return {
          ...transformOrganizationResponse(result),
          memberCount: 1,
          myRole: 'owner' as OrganizationRole,
        };
      } catch (error) {
        log.error('Failed to create organization', 'ORG_CREATE', { 
          error, 
          userId: ctx.session.user.id 
        });
        
        if (error instanceof TRPCError) {
          throw error;
        }
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create organization',
        });
      }
    }),

  get: viewOrganizationProcedure
    .input(GetOrganizationSchema)
    .output(OrganizationResponseSchema)
    .query(async ({ input, ctx }) => {
      // Check access
      const canAccess = await orgAccess.canAccessOrganization(
        ctx.session.user.id,
        input.organizationId
      );
      
      if (!canAccess) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Organization not found',
        });
      }
      
      const [org] = await db
        .select()
        .from(organization)
        .where(eq(organization.id, input.organizationId))
        .limit(1);
      
      if (!org) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Organization not found',
        });
      }
      
      // Get member count
      const memberCountResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(organizationMember)
        .where(
          and(
            eq(organizationMember.organizationId, input.organizationId),
            eq(organizationMember.status, 'active')
          )
        );
      
      // Get user's role
      const userRole = await orgAccess.getUserRole(ctx.session.user.id, input.organizationId);
      
      return {
        ...transformOrganizationResponse(org),
        memberCount: Number(memberCountResult[0]?.count || 0),
        myRole: userRole || undefined,
      };
    }),

  update: manageOrganizationProcedure
    .input(UpdateOrganizationSchema)
    .output(OrganizationResponseSchema)
    .mutation(async ({ input, ctx }) => {
      // Check permission
      await orgAccess.requirePermission(
        ctx.session.user.id,
        input.organizationId,
        'organization.update'
      );
      
      const [updatedOrg] = await db
        .update(organization)
        .set({
          ...input.data,
          updatedAt: new Date(),
        })
        .where(eq(organization.id, input.organizationId))
        .returning();
      
      if (!updatedOrg) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Organization not found',
        });
      }
      
      await logActivity(
        input.organizationId,
        ctx.session.user.id,
        'organization.updated',
        'organization',
        'organization',
        input.organizationId,
        { changes: input.data }
      );
      
      const userRole = await orgAccess.getUserRole(ctx.session.user.id, input.organizationId);
      
      return {
        ...transformOrganizationResponse(updatedOrg),
        myRole: userRole || undefined,
      };
    }),

  delete: protectedProcedure
    .input(DeleteOrganizationSchema)
    .mutation(async ({ input, ctx }) => {
      // Only owner can delete organization
      const userRole = await orgAccess.getUserRole(ctx.session.user.id, input.organizationId);
      
      if (userRole !== 'owner') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only organization owner can delete the organization',
        });
      }
      
      // Soft delete
      await db
        .update(organization)
        .set({
          status: 'deleted',
          deletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(organization.id, input.organizationId));
      
      await logActivity(
        input.organizationId,
        ctx.session.user.id,
        'organization.deleted',
        'organization',
        'organization',
        input.organizationId
      );
      
      log.warn('Organization deleted', 'ORG_DELETE', {
        organizationId: input.organizationId,
        userId: ctx.session.user.id,
      });
      
      return { success: true };
    }),

  listUserOrganizations: protectedProcedure
    .input(ListUserOrganizationsSchema)
    .query(async ({ input, ctx }) => {
      const statusFilter = input.includeInactive 
        ? undefined 
        : eq(organization.status, 'active');
      
      const userOrgs = await db
        .select({
          organization: organization,
          member: organizationMember,
        })
        .from(organizationMember)
        .innerJoin(
          organization,
          eq(organizationMember.organizationId, organization.id)
        )
        .where(
          and(
            eq(organizationMember.userId, ctx.session.user.id),
            eq(organizationMember.status, 'active'),
            statusFilter
          )
        )
        .orderBy(desc(organizationMember.joinedAt));
      
      // Get user's default organization from database
      const [dbUser] = await db
        .select({ organizationId: user.organizationId })
        .from(user)
        .where(eq(user.id, ctx.session.user.id))
        .limit(1);

      return {
        organizations: userOrgs.map(({ organization: org, member }) => ({
          ...org,
          myRole: member.role as OrganizationRole,
        })),
        activeOrganizationId: dbUser?.organizationId || undefined,
      };
    }),

  // ==========================================
  // Member Management
  // ==========================================
  
  getMembers: viewOrganizationProcedure
    .input(GetOrganizationMembersSchema)
    .query(async ({ input, ctx }) => {
      // Check permission
      await orgAccess.requirePermission(
        ctx.session.user.id,
        input.organizationId,
        'members.view'
      );
      
      const { limit = 20, page = 1, search, role, status } = input;
      const offset = (page - 1) * limit;
      
      // Build query conditions
      const conditions = [
        eq(organizationMember.organizationId, input.organizationId),
      ];
      
      if (role) {
        conditions.push(eq(organizationMember.role, role));
      }
      
      if (status) {
        conditions.push(eq(organizationMember.status, status));
      }
      
      // Add search condition if provided
      if (search) {
        conditions.push(
          sql`${user.name} ILIKE ${`%${search}%`} OR ${user.email} ILIKE ${`%${search}%`}`
        );
      }
      
      // Get members with user data
      const members = await db
        .select({
          member: organizationMember,
          user: user,
        })
        .from(organizationMember)
        .innerJoin(user, eq(organizationMember.userId, user.id))
        .where(and(...conditions))
        .orderBy(desc(organizationMember.joinedAt))
        .limit(limit)
        .offset(offset);
      
      // Get total count
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(organizationMember)
        .innerJoin(user, eq(organizationMember.userId, user.id))
        .where(and(...conditions));
      
      const formattedMembers = members.map(({ member, user: userData }) => ({
        id: member.id,
        userId: member.userId,
        organizationId: member.organizationId,
        name: userData.name,
        email: userData.email,
        image: userData.image,
        role: member.role as OrganizationRole,
        permissions: member.permissions as string[],
        status: member.status as any,
        joinedAt: member.joinedAt,
        lastActiveAt: member.lastActiveAt,
        invitedBy: null, // TODO: Join with inviter data if needed
      }));
      
      return {
        members: formattedMembers,
        total: Number(countResult[0]?.count || 0),
      };
    }),

  // Get members with healthcare data
  getMembersWithHealthcare: protectedProcedure
    .input(GetOrganizationMembersSchema)
    .query(async ({ input, ctx }) => {
      // Check permission
      await orgAccess.requirePermission(
        ctx.session.user.id,
        input.organizationId,
        'members.view'
      );
      
      const { limit = 20, page = 1, search, role, status } = input;
      const offset = (page - 1) * limit;
      
      // Build query conditions
      const conditions = [
        eq(organizationMember.organizationId, input.organizationId),
      ];
      
      if (role) {
        conditions.push(eq(organizationMember.role, role));
      }
      
      if (status) {
        conditions.push(eq(organizationMember.status, status));
      }
      
      // Add search condition if provided
      if (search) {
        conditions.push(
          sql`${user.name} ILIKE ${`%${search}%`} OR ${user.email} ILIKE ${`%${search}%`}`
        );
      }
      
      // Get members with user and healthcare data
      const members = await db
        .select({
          member: organizationMember,
          user: user,
          healthcare: healthcareUsers,
        })
        .from(organizationMember)
        .innerJoin(user, eq(organizationMember.userId, user.id))
        .leftJoin(healthcareUsers, eq(user.id, healthcareUsers.userId))
        .where(and(...conditions))
        .orderBy(desc(organizationMember.joinedAt))
        .limit(limit)
        .offset(offset);
      
      // Get total count
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(organizationMember)
        .innerJoin(user, eq(organizationMember.userId, user.id))
        .where(and(...conditions));
      
      const formattedMembers = members.map(({ member, user: userData, healthcare }) => ({
        id: member.id,
        userId: member.userId,
        organizationId: member.organizationId,
        name: userData.name,
        email: userData.email,
        image: userData.image,
        role: member.role as OrganizationRole,
        healthcareRole: userData.role as string,
        permissions: member.permissions as string[],
        status: member.status as any,
        joinedAt: member.joinedAt,
        lastActiveAt: member.lastActiveAt,
        // Healthcare specific data
        isOnDuty: healthcare?.isOnDuty || false,
        department: healthcare?.department,
        specialization: healthcare?.specialization,
        shiftStartTime: healthcare?.shiftStartTime,
        avatar: userData.image,
      }));
      
      return {
        members: formattedMembers,
        total: Number(countResult[0]?.count || 0),
      };
    }),

  inviteMembers: inviteMembersProcedure
    .input(InviteMembersSchema)
    .mutation(async ({ input, ctx }) => {
      // Check permission
      await orgAccess.requirePermission(
        ctx.session.user.id,
        input.organizationId,
        'members.invite'
      );
      
      // Rate limiting: 50 invites per hour
      checkRateLimit(`org-invite:${input.organizationId}`, 50, 3600000);
      
      const results = {
        sent: 0,
        failed: [] as { email: string; reason: string }[],
      };
      
      for (const invite of input.invitations) {
        try {
          // Check if user already exists
          const [existingUser] = await db
            .select({ id: user.id })
            .from(user)
            .where(eq(user.email, invite.email))
            .limit(1);
          
          if (existingUser) {
            // Check if already a member
            const [existingMember] = await db
              .select()
              .from(organizationMember)
              .where(
                and(
                  eq(organizationMember.organizationId, input.organizationId),
                  eq(organizationMember.userId, existingUser.id)
                )
              )
              .limit(1);
            
            if (existingMember) {
              results.failed.push({
                email: invite.email,
                reason: 'Already a member',
              });
              continue;
            }
          }
          
          // Create invitation
          await db.insert(organizationInvitation).values({
            organizationId: input.organizationId,
            email: invite.email,
            role: invite.role,
            token: nanoid(32),
            invitedBy: ctx.session.user.id,
            message: invite.message,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          });
          
          // TODO: Send invitation email
          
          results.sent++;
        } catch (error) {
          log.error('Failed to create invitation', 'ORG_INVITE', { 
            error, 
            email: invite.email 
          });
          
          results.failed.push({
            email: invite.email,
            reason: 'Failed to create invitation',
          });
        }
      }
      
      if (results.sent > 0) {
        await logActivity(
          input.organizationId,
          ctx.session.user.id,
          'member.invited',
          'member',
          undefined,
          undefined,
          { count: results.sent, emails: input.invitations.map(i => i.email) }
        );
      }
      
      return results;
    }),

  updateMemberRole: manageMembersProcedure
    .input(UpdateMemberRoleSchema)
    .mutation(async ({ input, ctx }) => {
      // Check if actor can update this member's role
      const canUpdate = await orgAccess.canUpdateMemberRole(
        ctx.session.user.id,
        input.userId,
        input.organizationId,
        input.role
      );
      
      if (!canUpdate) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Cannot update this member\'s role',
        });
      }
      
      const [updatedMember] = await db
        .update(organizationMember)
        .set({
          role: input.role,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(organizationMember.organizationId, input.organizationId),
            eq(organizationMember.userId, input.userId)
          )
        )
        .returning();
      
      if (!updatedMember) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Member not found',
        });
      }
      
      await logActivity(
        input.organizationId,
        ctx.session.user.id,
        'member.role_changed',
        'member',
        'user',
        input.userId,
        { newRole: input.role }
      );
      
      // Get user data for response
      const [userData] = await db
        .select()
        .from(user)
        .where(eq(user.id, input.userId))
        .limit(1);
      
      return {
        id: updatedMember.id,
        userId: updatedMember.userId,
        organizationId: updatedMember.organizationId,
        name: userData.name,
        email: userData.email,
        image: userData.image,
        role: updatedMember.role as OrganizationRole,
        permissions: updatedMember.permissions as string[],
        status: updatedMember.status as any,
        joinedAt: updatedMember.joinedAt,
        lastActiveAt: updatedMember.lastActiveAt,
        invitedBy: null,
      };
    }),

  removeMember: manageMembersProcedure
    .input(RemoveMemberSchema)
    .mutation(async ({ input, ctx }) => {
      // Check permission
      await orgAccess.requirePermission(
        ctx.session.user.id,
        input.organizationId,
        'members.remove'
      );
      
      // Can't remove yourself
      if (ctx.session.user.id === input.userId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot remove yourself from the organization',
        });
      }
      
      // Check if target is owner
      const targetRole = await orgAccess.getUserRole(input.userId, input.organizationId);
      if (targetRole === 'owner') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Cannot remove organization owner',
        });
      }
      
      await db
        .delete(organizationMember)
        .where(
          and(
            eq(organizationMember.organizationId, input.organizationId),
            eq(organizationMember.userId, input.userId)
          )
        );
      
      await logActivity(
        input.organizationId,
        ctx.session.user.id,
        'member.removed',
        'member',
        'user',
        input.userId,
        { reason: input.reason }
      );
      
      return { success: true };
    }),

  // ==========================================
  // Organization Settings
  // ==========================================
  
  getSettings: viewOrganizationProcedure
    .input(GetOrganizationSettingsSchema)
    .query(async ({ input, ctx }) => {
      // Check permission
      await orgAccess.requirePermission(
        ctx.session.user.id,
        input.organizationId,
        'settings.view'
      );
      
      const [settings] = await db
        .select()
        .from(organizationSettings)
        .where(eq(organizationSettings.organizationId, input.organizationId))
        .limit(1);
      
      if (!settings) {
        // Return default settings if none exist
        return {
          organizationId: input.organizationId,
          security: {
            allowGuestAccess: false,
            require2FA: false,
            allowedDomains: [],
            passwordPolicy: {},
            sessionTimeout: 30,
          },
          notifications: {
            notificationEmail: null,
            emailNotifications: {},
            inAppNotifications: {},
          },
          features: {
            features: {},
            modules: {},
          },
          member: {
            maxMembers: null,
            autoApproveMembers: false,
            defaultMemberRole: 'member' as OrganizationRole,
          },
          branding: {
            primaryColor: null,
            secondaryColor: null,
          },
        };
      }
      
      return {
        organizationId: input.organizationId,
        security: {
          allowGuestAccess: settings.allowGuestAccess,
          require2FA: settings.require2FA,
          allowedDomains: settings.allowedDomains as string[],
          passwordPolicy: settings.passwordPolicy as any,
          sessionTimeout: settings.sessionTimeout || 30,
        },
        notifications: {
          notificationEmail: settings.notificationEmail,
          emailNotifications: (settings.notificationSettings as any)?.email || {},
          inAppNotifications: (settings.notificationSettings as any)?.inApp || {},
        },
        features: {
          features: settings.features as Record<string, boolean>,
          modules: settings.modules as Record<string, boolean>,
        },
        member: {
          maxMembers: settings.maxMembers,
          autoApproveMembers: settings.autoApproveMembers,
          defaultMemberRole: settings.defaultMemberRole as OrganizationRole,
        },
        branding: {
          primaryColor: settings.primaryColor,
          secondaryColor: settings.secondaryColor,
        },
      };
    }),

  updateSettings: manageOrganizationProcedure
    .input(UpdateOrganizationSettingsSchema)
    .mutation(async ({ input, ctx }) => {
      // Check permission
      await orgAccess.requirePermission(
        ctx.session.user.id,
        input.organizationId,
        'settings.update'
      );
      
      const updateData: any = {
        updatedAt: new Date(),
        updatedBy: ctx.session.user.id,
      };
      
      // Map settings to database columns
      if (input.settings.security) {
        const { security } = input.settings;
        if (security.allowGuestAccess !== undefined) updateData.allowGuestAccess = security.allowGuestAccess;
        if (security.require2FA !== undefined) updateData.require2FA = security.require2FA;
        if (security.allowedDomains !== undefined) updateData.allowedDomains = security.allowedDomains;
        if (security.passwordPolicy !== undefined) updateData.passwordPolicy = security.passwordPolicy;
        if (security.sessionTimeout !== undefined) updateData.sessionTimeout = security.sessionTimeout;
      }
      
      if (input.settings.member) {
        const { member } = input.settings;
        if (member.maxMembers !== undefined) updateData.maxMembers = member.maxMembers;
        if (member.autoApproveMembers !== undefined) updateData.autoApproveMembers = member.autoApproveMembers;
        if (member.defaultMemberRole !== undefined) updateData.defaultMemberRole = member.defaultMemberRole;
      }
      
      if (input.settings.branding) {
        const { branding } = input.settings;
        if (branding.primaryColor !== undefined) updateData.primaryColor = branding.primaryColor;
        if (branding.secondaryColor !== undefined) updateData.secondaryColor = branding.secondaryColor;
      }
      
      if (input.settings.notifications) {
        const existing = await db
          .select({ notificationSettings: organizationSettings.notificationSettings })
          .from(organizationSettings)
          .where(eq(organizationSettings.organizationId, input.organizationId))
          .limit(1);
        
        const currentSettings = existing[0]?.notificationSettings || {};
        const safeCurrentSettings = typeof currentSettings === 'object' && currentSettings !== null && !Array.isArray(currentSettings) ? currentSettings : {};
        updateData.notificationSettings = {
          ...safeCurrentSettings,
          email: input.settings.notifications.emailNotifications || (safeCurrentSettings as any).email || {},
          inApp: input.settings.notifications.inAppNotifications || (safeCurrentSettings as any).inApp || {},
        };
        
        if (input.settings.notifications.notificationEmail !== undefined) {
          updateData.notificationEmail = input.settings.notifications.notificationEmail;
        }
      }
      
      if (input.settings.features) {
        if (input.settings.features.features !== undefined) updateData.features = input.settings.features.features;
        if (input.settings.features.modules !== undefined) updateData.modules = input.settings.features.modules;
      }
      
      // Upsert settings
      await db
        .insert(organizationSettings)
        .values({
          organizationId: input.organizationId,
          ...updateData,
        })
        .onConflictDoUpdate({
          target: organizationSettings.organizationId,
          set: updateData,
        });
      
      await logActivity(
        input.organizationId,
        ctx.session.user.id,
        'settings.updated',
        'settings',
        'settings',
        input.organizationId,
        { changes: input.settings }
      );
      
      // Return updated settings
      return await organizationRouter.getSettings({ organizationId: input.organizationId });
    }),

  // ==========================================
  // Active Organization Management
  // ==========================================
  
  setActiveOrganization: protectedProcedure
    .input(z.object({
      organizationId: z.string().uuid(),
    }))
    .output(z.object({
      success: z.boolean(),
      organizationId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Verify user is a member of the organization
      const [membership] = await db
        .select()
        .from(organizationMember)
        .where(
          and(
            eq(organizationMember.organizationId, input.organizationId),
            eq(organizationMember.userId, ctx.session.user.id),
            eq(organizationMember.status, 'active')
          )
        )
        .limit(1);
      
      if (!membership) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You are not a member of this organization',
        });
      }
      
      // Update user's default organization
      await db
        .update(user)
        .set({
          organizationId: input.organizationId,
          updatedAt: new Date(),
        })
        .where(eq(user.id, ctx.session.user.id));
      
      await logActivity(
        input.organizationId,
        ctx.session.user.id,
        'organization.switched',
        'organization',
        'organization',
        input.organizationId
      );
      
      log.info('Active organization switched', 'ORG_SWITCH', {
        userId: ctx.session.user.id,
        organizationId: input.organizationId,
      });
      
      return {
        success: true,
        organizationId: input.organizationId,
      };
    }),

  // ==========================================
  // Organization Code System
  // ==========================================
  
  generateCode: inviteMembersProcedure
    .input(GenerateOrganizationCodeSchema)
    .mutation(async ({ input, ctx }) => {
      // Check permission
      await orgAccess.requirePermission(
        ctx.session.user.id,
        input.organizationId,
        'codes.generate'
      );
      
      // Get organization name for code prefix
      const [org] = await db
        .select({ name: organization.name })
        .from(organization)
        .where(eq(organization.id, input.organizationId))
        .limit(1);
      
      if (!org) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Organization not found',
        });
      }
      
      const code = await generateOrgCode(org.name);
      const expiresAt = new Date(Date.now() + input.expiresIn * 1000);
      
      await db.insert(organizationCode).values({
        organizationId: input.organizationId,
        code,
        type: input.type,
        maxUses: input.maxUses,
        expiresAt,
        createdBy: ctx.session.user.id,
      });
      
      await logActivity(
        input.organizationId,
        ctx.session.user.id,
        'code.generated',
        'security',
        'code',
        code,
        { type: input.type, maxUses: input.maxUses }
      );
      
      return { code, expiresAt };
    }),

  joinByCode: publicProcedure
    .input(JoinByCodeSchema)
    .mutation(async ({ input, ctx }) => {
      // Find valid code
      const [codeData] = await db
        .select({
          code: organizationCode,
          org: organization,
        })
        .from(organizationCode)
        .innerJoin(organization, eq(organizationCode.organizationId, organization.id))
        .where(
          and(
            eq(organizationCode.code, input.code),
            eq(organizationCode.isActive, true),
            eq(organization.status, 'active')
          )
        )
        .limit(1);
      
      if (!codeData) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Invalid or expired code',
        });
      }
      
      // Check expiration
      if (codeData.code.expiresAt && codeData.code.expiresAt < new Date()) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Code has expired',
        });
      }
      
      // Check usage limit
      if (codeData.code.maxUses && codeData.code.currentUses >= codeData.code.maxUses) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Code usage limit reached',
        });
      }
      
      // Check if already a member
      const [existingMember] = await db
        .select()
        .from(organizationMember)
        .where(
          and(
            eq(organizationMember.organizationId, codeData.org.id),
            eq(organizationMember.userId, ctx.session.user.id)
          )
        )
        .limit(1);
      
      if (existingMember) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Already a member of this organization',
        });
      }
      
      // Add user as member
      await db.transaction(async (tx) => {
        await tx.insert(organizationMember).values({
          organizationId: codeData.org.id,
          userId: ctx.session.user.id,
          role: codeData.code.type as OrganizationRole,
          status: 'active',
        });
        
        // Increment usage count
        await tx
          .update(organizationCode)
          .set({
            currentUses: sql`${organizationCode.currentUses} + 1`,
            updatedAt: new Date(),
          })
          .where(eq(organizationCode.id, codeData.code.id));
      });
      
      await logActivity(
        codeData.org.id,
        ctx.session.user.id,
        'member.joined',
        'member',
        'user',
        ctx.session.user.id,
        { method: 'code', code: input.code }
      );
      
      return {
        organizationId: codeData.org.id,
        organization: {
          ...codeData.org,
          myRole: codeData.code.type as OrganizationRole,
        },
      };
    }),

  // ==========================================
  // Metrics & Analytics
  // ==========================================
  
  getMetrics: viewOrganizationProcedure
    .input(GetOrganizationMetricsSchema)
    .query(async ({ input, ctx }) => {
      // Check permission
      await orgAccess.requirePermission(
        ctx.session.user.id,
        input.organizationId,
        'organization.view'
      );
      
      // Get member counts
      const memberStats = await db
        .select({
          total: sql<number>`count(*)`,
          activeCount: sql<number>`count(case when last_active_at > now() - interval '24 hours' then 1 end)`,
        })
        .from(organizationMember)
        .where(eq(organizationMember.organizationId, input.organizationId));
      
      // Get activity stats for the last 7 days
      const activityStats = await db
        .select({
          totalActions: sql<number>`count(*)`,
          uniqueActors: sql<number>`count(distinct actor_id)`,
        })
        .from(organizationActivityLog)
        .where(
          and(
            eq(organizationActivityLog.organizationId, input.organizationId),
            gte(organizationActivityLog.createdAt, sql`now() - interval '7 days'`)
          )
        );
      
      // Return comprehensive metrics
      if (!input.metric) {
        // Return all metrics
        return {
          memberCount: memberStats[0]?.total || 0,
          activeMembers: memberStats[0]?.activeCount || 0,
          storageUsed: Math.random() * 50 + 10, // Mock data
          storageLimit: 100, // Mock data
          weeklyActions: activityStats[0]?.totalActions || 0,
          weeklyActiveUsers: activityStats[0]?.uniqueActors || 0,
        };
      }
      
      // Return specific metric
      const metrics = {
        activity: {
          value: activityStats[0]?.totalActions || 0,
          change: 12.5, // Mock change
          changeType: 'increase' as const,
          unit: 'actions',
        },
        growth: {
          value: memberStats[0]?.total || 0,
          change: 8.3, // Mock change
          changeType: 'increase' as const,
          unit: 'members',
        },
        performance: {
          value: 120 + Math.random() * 40, // Mock response time
          change: -2.1,
          changeType: 'decrease' as const,
          unit: 'ms',
        },
        engagement: {
          value: memberStats[0]?.activeCount && memberStats[0]?.total 
            ? (memberStats[0].activeCount / memberStats[0].total) * 100
            : 0,
          change: 5.7, // Mock change
          changeType: 'increase' as const,
          unit: '%',
        },
      };
      
      return metrics[input.metric];
    }),

  getActivityLog: viewOrganizationProcedure
    .input(GetActivityLogSchema)
    .query(async ({ input, ctx }) => {
      // Check permission
      await orgAccess.requirePermission(
        ctx.session.user.id,
        input.organizationId,
        'activity.view'
      );
      
      const { limit = 20, page = 1 } = input;
      const offset = (page - 1) * limit;
      
      const conditions = [
        eq(organizationActivityLog.organizationId, input.organizationId),
      ];
      
      if (input.actorId) {
        conditions.push(eq(organizationActivityLog.actorId, input.actorId));
      }
      
      if (input.action) {
        conditions.push(eq(organizationActivityLog.action, input.action));
      }
      
      if (input.category) {
        conditions.push(eq(organizationActivityLog.category, input.category));
      }
      
      if (input.severity) {
        conditions.push(eq(organizationActivityLog.severity, input.severity));
      }
      
      if (input.startDate) {
        conditions.push(gte(organizationActivityLog.createdAt, input.startDate));
      }
      
      if (input.endDate) {
        conditions.push(lte(organizationActivityLog.createdAt, input.endDate));
      }
      
      const activities = await db
        .select()
        .from(organizationActivityLog)
        .where(and(...conditions))
        .orderBy(desc(organizationActivityLog.createdAt))
        .limit(limit)
        .offset(offset);
      
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(organizationActivityLog)
        .where(and(...conditions));
      
      const formattedActivities = activities.map(activity => ({
        id: activity.id,
        organizationId: activity.organizationId,
        actor: {
          id: activity.actorId,
          name: activity.actorName,
          email: activity.actorEmail,
          role: activity.actorRole,
        },
        action: activity.action,
        category: activity.category,
        severity: activity.severity,
        entity: {
          type: activity.entityType,
          id: activity.entityId,
          name: activity.entityName,
        },
        changes: activity.changes as Record<string, any>,
        metadata: activity.metadata as Record<string, any>,
        createdAt: activity.createdAt,
      }));
      
      return {
        activities: formattedActivities,
        total: Number(countResult[0]?.count || 0),
      };
    }),

  // ==========================================
  // Organization Join Requests
  // ==========================================

  // Search organizations (public endpoint for browsing)
  searchOrganizations: publicProcedure
    .input(SearchOrganizationsSchema)
    .query(async ({ input, ctx }) => {
      const { limit = 20, page = 1, query, type, size, industry } = input;
      const offset = (page - 1) * limit;
      
      const conditions = [
        eq(organization.status, 'active'), // Only show active organizations
      ];
      
      if (query) {
        conditions.push(
          sql`${organization.name} ILIKE ${`%${query}%`} OR ${organization.description} ILIKE ${`%${query}%`}`
        );
      }
      
      if (type) {
        conditions.push(eq(organization.type, type));
      }
      
      if (size) {
        conditions.push(eq(organization.size, size));
      }
      
      if (industry) {
        conditions.push(eq(organization.industry, industry));
      }
      
      // Get organizations
      const orgs = await db
        .select({
          organization: organization,
          memberCount: sql<number>`(
            SELECT COUNT(*) FROM ${organizationMember} 
            WHERE organization_id = ${organization.id} 
            AND status = 'active'
          )`,
        })
        .from(organization)
        .where(and(...conditions))
        .orderBy(desc(organization.createdAt))
        .limit(limit)
        .offset(offset);
      
      // Get user's existing memberships and pending requests
      const userMemberships = await db
        .select({ organizationId: organizationMember.organizationId })
        .from(organizationMember)
        .where(
          and(
            eq(organizationMember.userId, ctx.session.user.id),
            eq(organizationMember.status, 'active')
          )
        );
      
      const userRequests = await db
        .select({ 
          organizationId: organizationJoinRequest.organizationId,
          status: organizationJoinRequest.status,
        })
        .from(organizationJoinRequest)
        .where(eq(organizationJoinRequest.userId, ctx.session.user.id));
      
      const membershipSet = new Set(userMemberships.map(m => m.organizationId));
      const requestMap = new Map(userRequests.map(r => [r.organizationId, r.status]));
      
      // Format response
      const formattedOrgs = orgs.map(({ organization: org, memberCount }) => ({
        ...org,
        memberCount: Number(memberCount),
        isMember: membershipSet.has(org.id),
        joinRequestStatus: requestMap.get(org.id) || null,
      }));
      
      // Get total count
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(organization)
        .where(and(...conditions));
      
      return {
        organizations: formattedOrgs,
        total: Number(countResult[0]?.count || 0),
      };
    }),

  // Send join request
  sendJoinRequest: protectedProcedure
    .input(SendJoinRequestSchema)
    .output(JoinRequestResponseSchema)
    .mutation(async ({ input, ctx }) => {
      // Check if user is already a member
      const [existingMember] = await db
        .select()
        .from(organizationMember)
        .where(
          and(
            eq(organizationMember.organizationId, input.organizationId),
            eq(organizationMember.userId, ctx.session.user.id)
          )
        )
        .limit(1);
      
      if (existingMember) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'You are already a member of this organization',
        });
      }
      
      // Check if there's already a pending request
      const [existingRequest] = await db
        .select()
        .from(organizationJoinRequest)
        .where(
          and(
            eq(organizationJoinRequest.organizationId, input.organizationId),
            eq(organizationJoinRequest.userId, ctx.session.user.id),
            eq(organizationJoinRequest.status, 'pending')
          )
        )
        .limit(1);
      
      if (existingRequest) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'You already have a pending join request for this organization',
        });
      }
      
      // Check organization settings for auto-approval
      const [orgSettings] = await db
        .select()
        .from(organizationSettings)
        .where(eq(organizationSettings.organizationId, input.organizationId))
        .limit(1);
      
      const [userData] = await db
        .select({ email: user.email })
        .from(user)
        .where(eq(user.id, ctx.session.user.id))
        .limit(1);
      
      // Check if user's email domain is in allowed domains
      let autoApprove = orgSettings?.autoApproveMembers || false;
      if (orgSettings?.allowedDomains && userData?.email) {
        const emailDomain = userData.email.split('@')[1];
        const allowedDomains = orgSettings.allowedDomains as string[];
        if (allowedDomains.includes(emailDomain)) {
          autoApprove = true;
        }
      }
      
      // Create join request
      const [joinRequest] = await db
        .insert(organizationJoinRequest)
        .values({
          organizationId: input.organizationId,
          userId: ctx.session.user.id,
          requestedRole: input.requestedRole,
          message: input.message,
          status: autoApprove ? 'approved' : 'pending',
          autoApproved: autoApprove,
          reviewedBy: autoApprove ? 'system' : null,
          reviewedAt: autoApprove ? new Date() : null,
        })
        .returning();
      
      // If auto-approved, add as member
      if (autoApprove) {
        await db.insert(organizationMember).values({
          organizationId: input.organizationId,
          userId: ctx.session.user.id,
          role: input.requestedRole,
          status: 'active',
        });
        
        await logActivity(
          input.organizationId,
          ctx.session.user.id,
          'member.joined',
          'member',
          'user',
          ctx.session.user.id,
          { method: 'auto_approved_request' }
        );
      } else {
        await logActivity(
          input.organizationId,
          ctx.session.user.id,
          'member.join_request_sent',
          'member',
          'join_request',
          joinRequest.id,
          { requestedRole: input.requestedRole }
        );
      }
      
      // Get full data for response
      const [fullRequest] = await db
        .select({
          request: organizationJoinRequest,
          user: user,
          organization: organization,
        })
        .from(organizationJoinRequest)
        .innerJoin(user, eq(organizationJoinRequest.userId, user.id))
        .innerJoin(organization, eq(organizationJoinRequest.organizationId, organization.id))
        .where(eq(organizationJoinRequest.id, joinRequest.id))
        .limit(1);
      
      return {
        id: fullRequest.request.id,
        organizationId: fullRequest.request.organizationId,
        userId: fullRequest.request.userId,
        user: {
          id: fullRequest.user.id,
          name: fullRequest.user.name || '',
          email: fullRequest.user.email || '',
          image: fullRequest.user.image,
        },
        organization: {
          id: fullRequest.organization.id,
          name: fullRequest.organization.name,
          slug: fullRequest.organization.slug,
          logo: fullRequest.organization.logo,
        },
        requestedRole: fullRequest.request.requestedRole as OrganizationRole,
        message: fullRequest.request.message,
        status: fullRequest.request.status as JoinRequestStatus,
        reviewedBy: null,
        reviewedAt: fullRequest.request.reviewedAt,
        reviewNote: fullRequest.request.reviewNote,
        autoApproved: fullRequest.request.autoApproved,
        createdAt: fullRequest.request.createdAt!,
        updatedAt: fullRequest.request.updatedAt!,
      };
    }),

  // List join requests for an organization (admin view)
  listJoinRequests: manageMembersProcedure
    .input(ListJoinRequestsSchema)
    .query(async ({ input, ctx }) => {
      // Check permission
      await orgAccess.requirePermission(
        ctx.session.user.id,
        input.organizationId,
        'members.manage'
      );
      
      const { limit = 20, page = 1, status, search } = input;
      const offset = (page - 1) * limit;
      
      const conditions = [
        eq(organizationJoinRequest.organizationId, input.organizationId),
      ];
      
      if (status) {
        conditions.push(eq(organizationJoinRequest.status, status));
      }
      
      // Get requests with user data
      const requests = await db
        .select({
          request: organizationJoinRequest,
          user: user,
        })
        .from(organizationJoinRequest)
        .innerJoin(user, eq(organizationJoinRequest.userId, user.id))
        .where(and(...conditions))
        .orderBy(desc(organizationJoinRequest.createdAt))
        .limit(limit)
        .offset(offset);
      
      // Apply search filter if provided
      if (search) {
        // Create a new query with search conditions
        const searchConditions = and(
          ...conditions,
          sql`${user.name} ILIKE ${`%${search}%`} OR ${user.email} ILIKE ${`%${search}%`}`
        );
        
        const searchRequests = await db
          .select({
            request: organizationJoinRequest,
            user: user,
          })
          .from(organizationJoinRequest)
          .innerJoin(user, eq(organizationJoinRequest.userId, user.id))
          .where(searchConditions)
          .orderBy(desc(organizationJoinRequest.createdAt))
          .limit(limit)
          .offset(offset);
          
        requests.length = 0;
        requests.push(...searchRequests);
      }
      
      // Get organization data
      const [org] = await db
        .select()
        .from(organization)
        .where(eq(organization.id, input.organizationId))
        .limit(1);
      
      // Get reviewer data for requests
      const reviewerIds = requests
        .map(r => r.request.reviewedBy)
        .filter(Boolean) as string[];
      
      const reviewers = reviewerIds.length > 0 ? await db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
        })
        .from(user)
        .where(sql`${user.id} IN (${sql.join(reviewerIds, sql`, `)})`) : [];
      
      const reviewerMap = new Map(reviewers.map(r => [r.id, r]));
      
      // Format response
      const formattedRequests = requests.map(({ request, user: userData }) => ({
        id: request.id,
        organizationId: request.organizationId,
        userId: request.userId,
        user: {
          id: userData.id,
          name: userData.name || '',
          email: userData.email || '',
          image: userData.image,
        },
        organization: {
          id: org.id,
          name: org.name,
          slug: org.slug,
          logo: org.logo,
        },
        requestedRole: request.requestedRole as OrganizationRole,
        message: request.message,
        status: request.status as JoinRequestStatus,
        reviewedBy: request.reviewedBy ? reviewerMap.get(request.reviewedBy) || null : null,
        reviewedAt: request.reviewedAt,
        reviewNote: request.reviewNote,
        autoApproved: request.autoApproved,
        createdAt: request.createdAt!,
        updatedAt: request.updatedAt!,
      }));
      
      // Get total count
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(organizationJoinRequest)
        .where(and(...conditions));
      
      return {
        requests: formattedRequests,
        total: Number(countResult[0]?.count || 0),
      };
    }),

  // List user's join requests
  listUserJoinRequests: protectedProcedure
    .input(ListUserJoinRequestsSchema)
    .query(async ({ input, ctx }) => {
      const { limit = 20, page = 1, status } = input;
      const offset = (page - 1) * limit;
      
      const conditions = [
        eq(organizationJoinRequest.userId, ctx.session.user.id),
      ];
      
      if (status) {
        conditions.push(eq(organizationJoinRequest.status, status));
      }
      
      const requests = await db
        .select({
          request: organizationJoinRequest,
          organization: organization,
        })
        .from(organizationJoinRequest)
        .innerJoin(organization, eq(organizationJoinRequest.organizationId, organization.id))
        .where(and(...conditions))
        .orderBy(desc(organizationJoinRequest.createdAt))
        .limit(limit)
        .offset(offset);
      
      // Get user data
      const [userData] = await db
        .select()
        .from(user)
        .where(eq(user.id, ctx.session.user.id))
        .limit(1);
      
      // Get reviewer data for requests
      const reviewerIds = requests
        .map(r => r.request.reviewedBy)
        .filter(Boolean) as string[];
      
      const reviewers = reviewerIds.length > 0 ? await db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
        })
        .from(user)
        .where(sql`${user.id} IN (${sql.join(reviewerIds, sql`, `)})`) : [];
      
      const reviewerMap = new Map(reviewers.map(r => [r.id, r]));
      
      // Format response
      const formattedRequests = requests.map(({ request, organization: org }) => ({
        id: request.id,
        organizationId: request.organizationId,
        userId: request.userId,
        user: {
          id: userData.id,
          name: userData.name || '',
          email: userData.email || '',
          image: userData.image,
        },
        organization: {
          id: org.id,
          name: org.name,
          slug: org.slug,
          logo: org.logo,
        },
        requestedRole: request.requestedRole as OrganizationRole,
        message: request.message,
        status: request.status as JoinRequestStatus,
        reviewedBy: request.reviewedBy ? reviewerMap.get(request.reviewedBy) || null : null,
        reviewedAt: request.reviewedAt,
        reviewNote: request.reviewNote,
        autoApproved: request.autoApproved,
        createdAt: request.createdAt!,
        updatedAt: request.updatedAt!,
      }));
      
      // Get total count
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(organizationJoinRequest)
        .where(and(...conditions));
      
      return {
        requests: formattedRequests,
        total: Number(countResult[0]?.count || 0),
      };
    }),

  // Review join request (approve/reject)
  reviewJoinRequest: inviteMembersProcedure
    .input(ReviewJoinRequestSchema)
    .output(JoinRequestResponseSchema)
    .mutation(async ({ input, ctx }) => {
      // Get the request
      const [request] = await db
        .select()
        .from(organizationJoinRequest)
        .where(eq(organizationJoinRequest.id, input.requestId))
        .limit(1);
      
      if (!request) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Join request not found',
        });
      }
      
      if (request.status !== 'pending') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'This request has already been reviewed',
        });
      }
      
      // Check permission
      await orgAccess.requirePermission(
        ctx.session.user.id,
        request.organizationId,
        'members.manage'
      );
      
      const newStatus = input.action === 'approve' ? 'approved' : 'rejected';
      const approvedRole = input.approvedRole || request.requestedRole;
      
      // Update request
      await db
        .update(organizationJoinRequest)
        .set({
          status: newStatus,
          reviewedBy: ctx.session.user.id,
          reviewedAt: new Date(),
          reviewNote: input.reviewNote,
          updatedAt: new Date(),
        })
        .where(eq(organizationJoinRequest.id, input.requestId));
      
      // If approved, add as member
      if (input.action === 'approve') {
        await db.insert(organizationMember).values({
          organizationId: request.organizationId,
          userId: request.userId,
          role: approvedRole,
          status: 'active',
        });
        
        await logActivity(
          request.organizationId,
          ctx.session.user.id,
          'member.join_request_approved',
          'member',
          'join_request',
          request.id,
          { 
            approvedRole,
            requestedUserId: request.userId,
          }
        );
      } else {
        await logActivity(
          request.organizationId,
          ctx.session.user.id,
          'member.join_request_rejected',
          'member',
          'join_request',
          request.id,
          { 
            requestedUserId: request.userId,
            reason: input.reviewNote,
          }
        );
      }
      
      // Get full data for response
      const [fullRequest] = await db
        .select({
          request: organizationJoinRequest,
          user: user,
          organization: organization,
        })
        .from(organizationJoinRequest)
        .innerJoin(user, eq(organizationJoinRequest.userId, user.id))
        .innerJoin(organization, eq(organizationJoinRequest.organizationId, organization.id))
        .where(eq(organizationJoinRequest.id, input.requestId))
        .limit(1);
      
      const [reviewer] = await db
        .select()
        .from(user)
        .where(eq(user.id, ctx.session.user.id))
        .limit(1);
      
      return {
        id: fullRequest.request.id,
        organizationId: fullRequest.request.organizationId,
        userId: fullRequest.request.userId,
        user: {
          id: fullRequest.user.id,
          name: fullRequest.user.name || '',
          email: fullRequest.user.email || '',
          image: fullRequest.user.image,
        },
        organization: {
          id: fullRequest.organization.id,
          name: fullRequest.organization.name,
          slug: fullRequest.organization.slug,
          logo: fullRequest.organization.logo,
        },
        requestedRole: fullRequest.request.requestedRole as OrganizationRole,
        message: fullRequest.request.message,
        status: fullRequest.request.status as JoinRequestStatus,
        reviewedBy: {
          id: reviewer.id,
          name: reviewer.name || '',
          email: reviewer.email || '',
        },
        reviewedAt: fullRequest.request.reviewedAt,
        reviewNote: fullRequest.request.reviewNote,
        autoApproved: fullRequest.request.autoApproved,
        createdAt: fullRequest.request.createdAt!,
        updatedAt: fullRequest.request.updatedAt!,
      };
    }),

  // Cancel join request
  cancelJoinRequest: protectedProcedure
    .input(CancelJoinRequestSchema)
    .mutation(async ({ input, ctx }) => {
      // Get the request
      const [request] = await db
        .select()
        .from(organizationJoinRequest)
        .where(
          and(
            eq(organizationJoinRequest.id, input.requestId),
            eq(organizationJoinRequest.userId, ctx.session.user.id)
          )
        )
        .limit(1);
      
      if (!request) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Join request not found',
        });
      }
      
      if (request.status !== 'pending') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Only pending requests can be cancelled',
        });
      }
      
      // Update request
      await db
        .update(organizationJoinRequest)
        .set({
          status: 'cancelled',
          updatedAt: new Date(),
        })
        .where(eq(organizationJoinRequest.id, input.requestId));
      
      await logActivity(
        request.organizationId,
        ctx.session.user.id,
        'member.join_request_sent',
        'member',
        'join_request',
        request.id
      );
      
      return { success: true };
    }),
});
