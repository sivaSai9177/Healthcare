import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { 
  setupTestDatabase, 
  cleanupTestDatabase, 
  closeTestDatabase,
  seedTestDatabase,
  createTestUser,
} from '../../setup/test-db';
import { 
  createAuthenticatedClient,
  cleanupTestSessions,
  mockEmailService,
} from '../../setup/test-api-client';
import { testConfig } from '../../setup/test-env';

describe('Organization API Integration Tests', () => {
  let adminAuth: any;
  let managerAuth: any;
  let operatorAuth: any;
  let testOrgData: any;

  beforeAll(async () => {
    // Setup test database
    await setupTestDatabase();
    testOrgData = await seedTestDatabase();

    // Create test users with different roles
    const adminUser = await createTestUser({
      email: 'admin@test.com',
      name: 'Admin User',
      role: 'admin',
      organizationId: testOrgData.organization.id,
      hospitalId: testOrgData.hospital.id,
    });

    const managerUser = await createTestUser({
      email: 'manager@test.com',
      name: 'Manager User',
      role: 'manager',
      organizationId: testOrgData.organization.id,
      hospitalId: testOrgData.hospital.id,
    });

    const operatorUser = await createTestUser({
      email: 'operator@test.com',
      name: 'Operator User',
      role: 'operator',
      organizationId: testOrgData.organization.id,
      hospitalId: testOrgData.hospital.id,
    });

    // Create authenticated clients
    adminAuth = await createAuthenticatedClient({
      email: adminUser.user.email,
      password: 'Test123!@#',
    });

    managerAuth = await createAuthenticatedClient({
      email: managerUser.user.email,
      password: 'Test123!@#',
    });

    operatorAuth = await createAuthenticatedClient({
      email: operatorUser.user.email,
      password: 'Test123!@#',
    });
  });

  afterAll(async () => {
    await cleanupTestSessions();
    await closeTestDatabase();
  });

  beforeEach(async () => {
    mockEmailService.clear();
  });

  describe('Organization Creation', () => {
    it('should create new organization as admin', async () => {
      const newOrg = {
        name: 'New Test Hospital',
        slug: 'new-test-hospital',
        type: 'hospital' as const,
        description: 'A new test hospital',
        metadata: {
          address: '456 New St',
          phone: '+1987654321',
        },
      };

      const response = await adminAuth.client.organization.create.mutate(newOrg);

      expect(response).toMatchObject({
        name: newOrg.name,
        slug: newOrg.slug,
        type: newOrg.type,
        description: newOrg.description,
      });
      expect(response.id).toBeDefined();
    });

    it('should prevent non-admins from creating organizations', async () => {
      const newOrg = {
        name: 'Unauthorized Hospital',
        slug: 'unauthorized-hospital',
        type: 'hospital' as const,
      };

      await expect(
        operatorAuth.client.organization.create.mutate(newOrg)
      ).rejects.toThrow(/permission|unauthorized/i);
    });

    it('should validate organization slug uniqueness', async () => {
      const duplicateOrg = {
        name: 'Duplicate Hospital',
        slug: testOrgData.organization.slug, // Use existing slug
        type: 'hospital' as const,
      };

      await expect(
        adminAuth.client.organization.create.mutate(duplicateOrg)
      ).rejects.toThrow(/already exists|duplicate/i);
    });
  });

  describe('Organization Retrieval', () => {
    it('should get current organization', async () => {
      const org = await operatorAuth.client.organization.getCurrent.query();

      expect(org).toMatchObject({
        id: testOrgData.organization.id,
        name: testOrgData.organization.name,
        slug: testOrgData.organization.slug,
      });
    });

    it('should list all accessible organizations', async () => {
      // Create another organization and add admin to it
      const secondOrg = await adminAuth.client.organization.create.mutate({
        name: 'Second Hospital',
        slug: 'second-hospital',
        type: 'hospital' as const,
      });

      const orgs = await adminAuth.client.organization.list.query();

      expect(orgs.length).toBeGreaterThanOrEqual(2);
      expect(orgs.map((o: any) => o.id)).toContain(testOrgData.organization.id);
      expect(orgs.map((o: any) => o.id)).toContain(secondOrg.id);
    });

    it('should get organization by ID', async () => {
      const org = await operatorAuth.client.organization.getById.query({
        id: testOrgData.organization.id,
      });

      expect(org).toMatchObject({
        id: testOrgData.organization.id,
        name: testOrgData.organization.name,
      });
    });

    it('should include member count in organization data', async () => {
      const org = await adminAuth.client.organization.getById.query({
        id: testOrgData.organization.id,
        include: ['memberCount'],
      });

      expect(org.memberCount).toBeGreaterThanOrEqual(3); // admin, manager, operator
    });
  });

  describe('Organization Updates', () => {
    it('should update organization as admin', async () => {
      const updates = {
        id: testOrgData.organization.id,
        name: 'Updated Test Hospital',
        description: 'Updated description',
        metadata: {
          website: 'https://updated-hospital.com',
        },
      };

      const response = await adminAuth.client.organization.update.mutate(updates);

      expect(response).toMatchObject({
        name: updates.name,
        description: updates.description,
      });
      expect(response.metadata).toMatchObject(updates.metadata);
    });

    it('should allow managers to update organization settings', async () => {
      const updates = {
        id: testOrgData.organization.id,
        settings: {
          alertSettings: {
            defaultPriority: 'medium',
            escalationTime: 15,
          },
        },
      };

      const response = await managerAuth.client.organization.updateSettings.mutate(updates);

      expect(response.settings).toMatchObject(updates.settings);
    });

    it('should prevent operators from updating organization', async () => {
      const updates = {
        id: testOrgData.organization.id,
        name: 'Unauthorized Update',
      };

      await expect(
        operatorAuth.client.organization.update.mutate(updates)
      ).rejects.toThrow(/permission|unauthorized/i);
    });
  });

  describe('Member Management', () => {
    it('should list organization members', async () => {
      const members = await operatorAuth.client.organization.listMembers.query({
        organizationId: testOrgData.organization.id,
      });

      expect(members.length).toBeGreaterThanOrEqual(3);
      expect(members.map((m: any) => m.user.email)).toContain('admin@test.com');
      expect(members.map((m: any) => m.user.email)).toContain('manager@test.com');
      expect(members.map((m: any) => m.user.email)).toContain('operator@test.com');
    });

    it('should invite new member as admin', async () => {
      const invite = {
        organizationId: testOrgData.organization.id,
        email: 'newmember@test.com',
        role: 'viewer' as const,
      };

      const response = await adminAuth.client.organization.inviteMember.mutate(invite);

      expect(response).toMatchObject({
        email: invite.email,
        role: invite.role,
        status: 'pending',
      });

      // Check invitation email was sent
      const inviteEmail = mockEmailService.getLastEmail(invite.email);
      expect(inviteEmail).toBeDefined();
      expect(inviteEmail?.subject).toContain('invitation');
    });

    it('should update member role as admin', async () => {
      const members = await adminAuth.client.organization.listMembers.query({
        organizationId: testOrgData.organization.id,
      });

      const operatorMember = members.find((m: any) => m.user.email === 'operator@test.com');

      const response = await adminAuth.client.organization.updateMemberRole.mutate({
        memberId: operatorMember.id,
        role: 'manager',
      });

      expect(response.role).toBe('manager');
    });

    it('should remove member as admin', async () => {
      // Create a test member to remove
      const testUser = await createTestUser({
        email: 'removeme@test.com',
        name: 'Remove Me',
        role: 'viewer',
        organizationId: testOrgData.organization.id,
      });

      const members = await adminAuth.client.organization.listMembers.query({
        organizationId: testOrgData.organization.id,
      });

      const memberToRemove = members.find((m: any) => m.user.email === 'removeme@test.com');

      await adminAuth.client.organization.removeMember.mutate({
        memberId: memberToRemove.id,
      });

      // Verify member was removed
      const updatedMembers = await adminAuth.client.organization.listMembers.query({
        organizationId: testOrgData.organization.id,
      });

      expect(updatedMembers.find((m: any) => m.user.email === 'removeme@test.com')).toBeUndefined();
    });

    it('should prevent self-removal', async () => {
      const members = await adminAuth.client.organization.listMembers.query({
        organizationId: testOrgData.organization.id,
      });

      const adminMember = members.find((m: any) => m.user.email === 'admin@test.com');

      await expect(
        adminAuth.client.organization.removeMember.mutate({
          memberId: adminMember.id,
        })
      ).rejects.toThrow(/cannot remove yourself/i);
    });
  });

  describe('Join Requests', () => {
    let newUserAuth: any;

    beforeEach(async () => {
      // Create a user not in any organization
      const newUser = await createTestUser({
        email: 'newuser@test.com',
        name: 'New User',
        role: 'viewer',
        organizationId: 'temp-org', // Will be cleaned up
      });

      newUserAuth = await createAuthenticatedClient({
        email: newUser.user.email,
        password: 'Test123!@#',
      });
    });

    it('should create join request', async () => {
      const request = {
        organizationId: testOrgData.organization.id,
        message: 'I would like to join this organization',
      };

      const response = await newUserAuth.client.organization.requestToJoin.mutate(request);

      expect(response).toMatchObject({
        organizationId: request.organizationId,
        userId: newUserAuth.user.id,
        status: 'pending',
        message: request.message,
      });
    });

    it('should list pending join requests as admin', async () => {
      // Create a join request first
      await newUserAuth.client.organization.requestToJoin.mutate({
        organizationId: testOrgData.organization.id,
        message: 'Please approve',
      });

      const requests = await adminAuth.client.organization.listJoinRequests.query({
        organizationId: testOrgData.organization.id,
        status: 'pending',
      });

      expect(requests.length).toBeGreaterThanOrEqual(1);
      expect(requests.some((r: any) => r.user.email === 'newuser@test.com')).toBe(true);
    });

    it('should approve join request as admin', async () => {
      // Create request
      const request = await newUserAuth.client.organization.requestToJoin.mutate({
        organizationId: testOrgData.organization.id,
      });

      // Approve request
      const response = await adminAuth.client.organization.approveJoinRequest.mutate({
        requestId: request.id,
        role: 'viewer',
      });

      expect(response.status).toBe('approved');

      // User should now be a member
      const members = await adminAuth.client.organization.listMembers.query({
        organizationId: testOrgData.organization.id,
      });

      expect(members.some((m: any) => m.user.email === 'newuser@test.com')).toBe(true);
    });

    it('should reject join request as admin', async () => {
      // Create request
      const request = await newUserAuth.client.organization.requestToJoin.mutate({
        organizationId: testOrgData.organization.id,
      });

      // Reject request
      const response = await adminAuth.client.organization.rejectJoinRequest.mutate({
        requestId: request.id,
        reason: 'Not eligible at this time',
      });

      expect(response.status).toBe('rejected');
    });
  });

  describe('Organization Deletion', () => {
    it('should soft delete organization as admin', async () => {
      // Create a temporary organization to delete
      const tempOrg = await adminAuth.client.organization.create.mutate({
        name: 'Temporary Hospital',
        slug: 'temp-hospital',
        type: 'hospital' as const,
      });

      const response = await adminAuth.client.organization.delete.mutate({
        id: tempOrg.id,
      });

      expect(response.success).toBe(true);

      // Should not be able to get deleted organization
      await expect(
        adminAuth.client.organization.getById.query({ id: tempOrg.id })
      ).rejects.toThrow();
    });

    it('should prevent deletion of organization with active members', async () => {
      await expect(
        adminAuth.client.organization.delete.mutate({
          id: testOrgData.organization.id,
        })
      ).rejects.toThrow(/has active members/i);
    });
  });

  describe('Organization Permissions', () => {
    it('should check member permissions', async () => {
      const permissions = await operatorAuth.client.organization.checkPermissions.query({
        organizationId: testOrgData.organization.id,
        permissions: ['read:alerts', 'write:alerts', 'delete:alerts'],
      });

      expect(permissions['read:alerts']).toBe(true);
      expect(permissions['write:alerts']).toBe(true);
      expect(permissions['delete:alerts']).toBe(false); // Operators can't delete
    });

    it('should update member permissions as admin', async () => {
      const members = await adminAuth.client.organization.listMembers.query({
        organizationId: testOrgData.organization.id,
      });

      const operatorMember = members.find((m: any) => m.user.email === 'operator@test.com');

      const response = await adminAuth.client.organization.updateMemberPermissions.mutate({
        memberId: operatorMember.id,
        permissions: ['read:*', 'write:alerts', 'write:patients', 'delete:own'],
      });

      expect(response.permissions).toContain('delete:own');
    });
  });
});