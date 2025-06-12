import { TRPCError } from '@trpc/server';
import { db } from '../../db';
import { organizationMember } from '../../db/organization-schema';
import { eq, and } from 'drizzle-orm';
import type { OrganizationRole } from '../../../lib/validations/organization';
import { log } from '@/lib/core/debug/logger';

// Role hierarchy for permission checking
const ROLE_HIERARCHY: Record<OrganizationRole, number> = {
  owner: 5,
  admin: 4,
  manager: 3,
  member: 2,
  guest: 1,
};

// Permission definitions by role
const ROLE_PERMISSIONS: Record<OrganizationRole, string[]> = {
  owner: ['*'], // All permissions
  admin: [
    'organization.update',
    'organization.delete',
    'members.view',
    'members.invite',
    'members.remove',
    'members.update_role',
    'settings.view',
    'settings.update',
    'codes.generate',
    'codes.revoke',
    'activity.view',
    'billing.view',
    'billing.update',
  ],
  manager: [
    'organization.view',
    'members.view',
    'members.invite',
    'members.update_role', // Limited to roles below manager
    'settings.view',
    'codes.generate',
    'activity.view',
  ],
  member: [
    'organization.view',
    'members.view',
    'activity.view',
  ],
  guest: [
    'organization.view',
    'members.view', // Limited view
  ],
};

export class OrganizationAccessControl {
  /**
   * Check if a user is a member of an organization
   */
  static async isMember(userId: string, organizationId: string): Promise<boolean> {
    try {
      const membership = await db
        .select()
        .from(organizationMember)
        .where(
          and(
            eq(organizationMember.userId, userId),
            eq(organizationMember.organizationId, organizationId),
            eq(organizationMember.status, 'active')
          )
        )
        .limit(1);

      return membership.length > 0;
    } catch (error) {
      log.error('Error checking organization membership', 'ORG_ACCESS', { 
        error, 
        userId, 
        organizationId 
      });
      return false;
    }
  }

  /**
   * Get user's role in an organization
   */
  static async getUserRole(
    userId: string, 
    organizationId: string
  ): Promise<OrganizationRole | null> {
    try {
      const membership = await db
        .select({ role: organizationMember.role })
        .from(organizationMember)
        .where(
          and(
            eq(organizationMember.userId, userId),
            eq(organizationMember.organizationId, organizationId),
            eq(organizationMember.status, 'active')
          )
        )
        .limit(1);

      if (membership.length === 0) {
        return null;
      }

      return membership[0].role as OrganizationRole;
    } catch (error) {
      log.error('Error getting user role', 'ORG_ACCESS', { 
        error, 
        userId, 
        organizationId 
      });
      return null;
    }
  }

  /**
   * Check if a user has a specific permission in an organization
   */
  static async hasPermission(
    userId: string,
    organizationId: string,
    permission: string
  ): Promise<boolean> {
    try {
      const role = await this.getUserRole(userId, organizationId);
      
      if (!role) {
        return false;
      }

      const permissions = ROLE_PERMISSIONS[role];
      
      // Check for wildcard permission (owner)
      if (permissions.includes('*')) {
        return true;
      }

      // Check for specific permission
      return permissions.includes(permission);
    } catch (error) {
      log.error('Error checking permission', 'ORG_ACCESS', { 
        error, 
        userId, 
        organizationId, 
        permission 
      });
      return false;
    }
  }

  /**
   * Check if a user has at least a specific role level
   */
  static async hasMinimumRole(
    userId: string,
    organizationId: string,
    requiredRole: OrganizationRole
  ): Promise<boolean> {
    try {
      const userRole = await this.getUserRole(userId, organizationId);
      
      if (!userRole) {
        return false;
      }

      const userLevel = ROLE_HIERARCHY[userRole];
      const requiredLevel = ROLE_HIERARCHY[requiredRole];

      return userLevel >= requiredLevel;
    } catch (error) {
      log.error('Error checking minimum role', 'ORG_ACCESS', { 
        error, 
        userId, 
        organizationId, 
        requiredRole 
      });
      return false;
    }
  }

  /**
   * Check if a user can update another user's role
   */
  static async canUpdateMemberRole(
    actorId: string,
    targetUserId: string,
    organizationId: string,
    newRole: OrganizationRole
  ): Promise<boolean> {
    try {
      // Get both users' roles
      const [actorRole, targetRole] = await Promise.all([
        this.getUserRole(actorId, organizationId),
        this.getUserRole(targetUserId, organizationId),
      ]);

      if (!actorRole || !targetRole) {
        return false;
      }

      const actorLevel = ROLE_HIERARCHY[actorRole];
      const targetLevel = ROLE_HIERARCHY[targetRole];
      const newLevel = ROLE_HIERARCHY[newRole];

      // Can't modify your own role
      if (actorId === targetUserId) {
        return false;
      }

      // Must have higher role than target
      if (actorLevel <= targetLevel) {
        return false;
      }

      // Can't promote to role higher than your own
      if (newLevel >= actorLevel) {
        return false;
      }

      // Only owner can create/modify other owners
      if (targetRole === 'owner' || newRole === 'owner') {
        return actorRole === 'owner';
      }

      return true;
    } catch (error) {
      log.error('Error checking role update permission', 'ORG_ACCESS', { 
        error, 
        actorId, 
        targetUserId, 
        organizationId, 
        newRole 
      });
      return false;
    }
  }

  /**
   * Throw an error if user doesn't have permission
   */
  static async requirePermission(
    userId: string,
    organizationId: string,
    permission: string,
    customMessage?: string
  ): Promise<void> {
    const hasPermission = await this.hasPermission(userId, organizationId, permission);
    
    if (!hasPermission) {
      log.warn('Permission denied', 'ORG_ACCESS', { 
        userId, 
        organizationId, 
        permission 
      });
      
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: customMessage || `Permission denied: ${permission}`,
      });
    }
  }

  /**
   * Throw an error if user doesn't have minimum role
   */
  static async requireMinimumRole(
    userId: string,
    organizationId: string,
    requiredRole: OrganizationRole,
    customMessage?: string
  ): Promise<void> {
    const hasRole = await this.hasMinimumRole(userId, organizationId, requiredRole);
    
    if (!hasRole) {
      log.warn('Insufficient role', 'ORG_ACCESS', { 
        userId, 
        organizationId, 
        requiredRole 
      });
      
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: customMessage || `Requires at least ${requiredRole} role`,
      });
    }
  }

  /**
   * Get all permissions for a role
   */
  static getPermissionsForRole(role: OrganizationRole): string[] {
    return ROLE_PERMISSIONS[role] || [];
  }

  /**
   * Check if one role is higher than another
   */
  static isRoleHigherThan(role1: OrganizationRole, role2: OrganizationRole): boolean {
    return ROLE_HIERARCHY[role1] > ROLE_HIERARCHY[role2];
  }

  /**
   * Get the role hierarchy level
   */
  static getRoleLevel(role: OrganizationRole): number {
    return ROLE_HIERARCHY[role];
  }

  /**
   * Validate that a user can access organization data
   * This is a more lenient check than permission checking
   */
  static async canAccessOrganization(
    userId: string,
    organizationId: string
  ): Promise<boolean> {
    // Check if user is a member
    const isMember = await this.isMember(userId, organizationId);
    
    if (isMember) {
      return true;
    }

    // In the future, we might add checks for:
    // - Public organizations
    // - Guest access with special tokens
    // - System admins
    
    return false;
  }

  /**
   * Log an access attempt for audit purposes
   */
  static async logAccessAttempt(
    userId: string,
    organizationId: string,
    action: string,
    allowed: boolean,
    metadata?: Record<string, any>
  ): Promise<void> {
    const level = allowed ? 'info' : 'warn';
    log[level]('Organization access attempt', 'ORG_ACCESS', {
      userId,
      organizationId,
      action,
      allowed,
      ...metadata,
    });
  }
}

// Export singleton instance for convenience
export const orgAccess = OrganizationAccessControl;