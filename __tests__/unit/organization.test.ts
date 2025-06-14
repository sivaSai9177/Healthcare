// Jest is globally available, no import needed
import { organizationRouter } from '@/src/server/routers/organization';
import { TRPCError } from '@trpc/server';
import { db } from '@/src/db';
import { organization, organizationMember, organizationSettings } from '@/src/db/organization-schema';
import { user } from '@/src/db/schema';
import { orgAccess } from '@/src/server/services/organization-access-control';

// Mock dependencies
jest.mock('@/src/db', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    transaction: jest.fn(),
  },
}));

jest.mock('@/lib/core/logger', () => ({
  log: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('@/src/server/services/organization-access-control', () => ({
  orgAccess: {
    canAccessOrganization: jest.fn(),
    getUserRole: jest.fn(),
    requirePermission: jest.fn(),
    canUpdateMemberRole: jest.fn(),
  },
}));

describe('Organization Router', () => {
  const mockUser = {
    id: 'user123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'user',
  };

  const mockOrganization = {
    id: 'org123',
    name: 'Test Organization',
    slug: 'test-org',
    type: 'business',
    size: 'small',
    status: 'active',
    timezone: 'UTC',
    language: 'en',
    currency: 'USD',
    plan: 'free',
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockContext = {
    user: mockUser,
    req: {
      headers: {
        get: jest.fn(() => '127.0.0.1'),
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new organization', async () => {
      const input = {
        name: 'New Organization',
        type: 'business' as const,
        size: 'small' as const,
        timezone: 'UTC',
        language: 'en',
        currency: 'USD',
      };

      const mockTransaction = jest.fn(async (callback) => {
        const tx = {
          insert: jest.fn().mockReturnThis(),
          values: jest.fn().mockReturnThis(),
          returning: jest.fn().mockResolvedValue([mockOrganization]),
        };
        
        return callback(tx);
      });

      (db.transaction as any).mockImplementation(mockTransaction);
      (db.select as any).mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      });

      const caller = organizationRouter.createCaller(mockContext as any);
      const result = await caller.create(input);

      expect(result).toMatchObject({
        ...mockOrganization,
        memberCount: 1,
        myRole: 'owner',
      });
      expect(mockTransaction).toHaveBeenCalled();
    });

    it('should throw error if slug already exists', async () => {
      const input = {
        name: 'New Organization',
        slug: 'existing-slug',
        type: 'business' as const,
        size: 'small' as const,
        timezone: 'UTC',
      };

      (db.select as any).mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([{ slug: 'existing-slug' }]),
      });

      const caller = organizationRouter.createCaller(mockContext as any);
      
      await expect(caller.create(input)).rejects.toThrow(TRPCError);
    });
  });

  describe('get', () => {
    it('should return organization details', async () => {
      (orgAccess.canAccessOrganization as any).mockResolvedValue(true);
      (orgAccess.getUserRole as any).mockResolvedValue('member');
      
      (db.select as any).mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockOrganization]),
      });

      const caller = organizationRouter.createCaller(mockContext as any);
      const result = await caller.get({ organizationId: 'org123' });

      expect(result).toMatchObject({
        ...mockOrganization,
        myRole: 'member',
      });
      expect(orgAccess.canAccessOrganization).toHaveBeenCalledWith(mockUser.id, 'org123');
    });

    it('should throw error if user cannot access organization', async () => {
      (orgAccess.canAccessOrganization as any).mockResolvedValue(false);

      const caller = organizationRouter.createCaller(mockContext as any);
      
      await expect(caller.get({ organizationId: 'org123' })).rejects.toThrow(TRPCError);
    });
  });

  describe('update', () => {
    it('should update organization details', async () => {
      (orgAccess.requirePermission as any).mockResolvedValue(undefined);
      (orgAccess.getUserRole as any).mockResolvedValue('admin');
      
      const updateData = {
        name: 'Updated Organization',
        industry: 'Technology',
      };

      (db.update as any).mockReturnValue({
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([{
          ...mockOrganization,
          ...updateData,
        }]),
      });

      const caller = organizationRouter.createCaller(mockContext as any);
      const result = await caller.update({
        organizationId: 'org123',
        data: updateData,
      });

      expect(result.name).toBe('Updated Organization');
      expect(result.industry).toBe('Technology');
      expect(orgAccess.requirePermission).toHaveBeenCalledWith(
        mockUser.id,
        'org123',
        'organization.update'
      );
    });
  });

  describe('delete', () => {
    it('should soft delete organization if user is owner', async () => {
      (orgAccess.getUserRole as any).mockResolvedValue('owner');
      
      (db.update as any).mockReturnValue({
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
      });

      const caller = organizationRouter.createCaller(mockContext as any);
      const result = await caller.delete({
        organizationId: 'org123',
        confirmDelete: true,
      });

      expect(result).toEqual({ success: true });
    });

    it('should throw error if user is not owner', async () => {
      (orgAccess.getUserRole as any).mockResolvedValue('admin');

      const caller = organizationRouter.createCaller(mockContext as any);
      
      await expect(caller.delete({
        organizationId: 'org123',
        confirmDelete: true,
      })).rejects.toThrow(TRPCError);
    });
  });

  describe('getMembers', () => {
    it('should return organization members', async () => {
      (orgAccess.requirePermission as any).mockResolvedValue(undefined);
      
      const mockMembers = [
        {
          member: {
            id: 'member1',
            userId: 'user1',
            organizationId: 'org123',
            role: 'admin',
            permissions: [],
            status: 'active',
            joinedAt: new Date(),
            lastActiveAt: null,
          },
          user: {
            id: 'user1',
            name: 'Admin User',
            email: 'admin@example.com',
            image: null,
          },
        },
      ];

      (db.select as any).mockReturnValue({
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockResolvedValue(mockMembers),
      });

      const caller = organizationRouter.createCaller(mockContext as any);
      const result = await caller.getMembers({
        organizationId: 'org123',
        page: 1,
        limit: 20,
      });

      expect(result.members).toHaveLength(1);
      expect(result.members[0]).toMatchObject({
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin',
      });
    });
  });

  describe('inviteMembers', () => {
    it('should create invitations for new members', async () => {
      (orgAccess.requirePermission as any).mockResolvedValue(undefined);
      
      (db.select as any).mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      });

      (db.insert as any).mockReturnValue({
        values: jest.fn().mockResolvedValue(undefined),
      });

      const caller = organizationRouter.createCaller(mockContext as any);
      const result = await caller.inviteMembers({
        organizationId: 'org123',
        invitations: [
          { email: 'new@example.com', role: 'member' },
          { email: 'another@example.com', role: 'admin' },
        ],
      });

      expect(result.sent).toBe(2);
      expect(result.failed).toHaveLength(0);
    });

    it('should handle existing members', async () => {
      (orgAccess.requirePermission as any).mockResolvedValue(undefined);
      
      // Mock existing user
      (db.select as any)
        .mockReturnValueOnce({
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue([{ id: 'existingUser' }]),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue([{ id: 'existingMember' }]),
        });

      const caller = organizationRouter.createCaller(mockContext as any);
      const result = await caller.inviteMembers({
        organizationId: 'org123',
        invitations: [
          { email: 'existing@example.com', role: 'member' },
        ],
      });

      expect(result.sent).toBe(0);
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0].reason).toBe('Already a member');
    });
  });

  describe('updateMemberRole', () => {
    it('should update member role', async () => {
      (orgAccess.canUpdateMemberRole as any).mockResolvedValue(true);
      
      (db.update as any).mockReturnValue({
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([{
          id: 'member1',
          userId: 'user1',
          role: 'admin',
        }]),
      });

      (db.select as any).mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([{
          id: 'user1',
          name: 'Test User',
          email: 'test@example.com',
          image: null,
        }]),
      });

      const caller = organizationRouter.createCaller(mockContext as any);
      const result = await caller.updateMemberRole({
        organizationId: 'org123',
        userId: 'user1',
        role: 'admin',
      });

      expect(result.role).toBe('admin');
      expect(orgAccess.canUpdateMemberRole).toHaveBeenCalledWith(
        mockUser.id,
        'user1',
        'org123',
        'admin'
      );
    });
  });

  describe('joinByCode', () => {
    it('should allow joining organization with valid code', async () => {
      const mockCode = {
        code: {
          id: 'code123',
          code: 'TEST-CODE',
          type: 'member',
          expiresAt: new Date(Date.now() + 86400000), // Tomorrow
          maxUses: null,
          currentUses: 0,
        },
        org: mockOrganization,
      };

      (db.select as any).mockReturnValue({
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn()
          .mockResolvedValueOnce([mockCode]) // Code exists
          .mockResolvedValueOnce([]), // User not already member
      });

      const mockTransaction = jest.fn(async (callback) => {
        const tx = {
          insert: jest.fn().mockReturnThis(),
          values: jest.fn().mockReturnThis(),
          update: jest.fn().mockReturnThis(),
          set: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
        };
        
        return callback(tx);
      });

      (db.transaction as any).mockImplementation(mockTransaction);

      const caller = organizationRouter.createCaller(mockContext as any);
      const result = await caller.joinByCode({
        code: 'TEST-CODE',
      });

      expect(result.organizationId).toBe('org123');
      expect(result.organization.myRole).toBe('member');
    });

    it('should reject expired codes', async () => {
      const mockCode = {
        code: {
          id: 'code123',
          code: 'TEST-CODE',
          type: 'member',
          expiresAt: new Date(Date.now() - 86400000), // Yesterday
          maxUses: null,
          currentUses: 0,
        },
        org: mockOrganization,
      };

      (db.select as any).mockReturnValue({
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockCode]),
      });

      const caller = organizationRouter.createCaller(mockContext as any);
      
      await expect(caller.joinByCode({ code: 'TEST-CODE' })).rejects.toThrow('Code has expired');
    });
  });
});

describe('Organization Access Control', () => {
  describe('Role Hierarchy', () => {
    it('should correctly compare role levels', () => {
      expect(orgAccess.isRoleHigherThan('owner', 'admin')).toBe(true);
      expect(orgAccess.isRoleHigherThan('admin', 'manager')).toBe(true);
      expect(orgAccess.isRoleHigherThan('manager', 'member')).toBe(true);
      expect(orgAccess.isRoleHigherThan('member', 'guest')).toBe(true);
      expect(orgAccess.isRoleHigherThan('guest', 'owner')).toBe(false);
    });
  });

  describe('Permissions', () => {
    it('should return correct permissions for each role', () => {
      const ownerPerms = orgAccess.getPermissionsForRole('owner');
      expect(ownerPerms).toContain('*');

      const adminPerms = orgAccess.getPermissionsForRole('admin');
      expect(adminPerms).toContain('organization.update');
      expect(adminPerms).toContain('members.invite');
      expect(adminPerms).not.toContain('*');

      const memberPerms = orgAccess.getPermissionsForRole('member');
      expect(memberPerms).toContain('organization.view');
      expect(memberPerms).not.toContain('organization.update');
    });
  });
});