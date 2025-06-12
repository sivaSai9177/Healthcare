#!/usr/bin/env bun
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, and } from 'drizzle-orm';
import * as schema from '@/src/db/organization-schema';
import { v4 as uuidv4 } from 'uuid';
import { log } from '@/lib/core/logger';

// Get database URL from environment
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/expo_starter_db';

// Create postgres connection
const queryClient = postgres(DATABASE_URL);
const db = drizzle(queryClient, { schema });

async function testOrganizationAPI() {
  try {
    log.info('Testing Organization API...', 'TEST_ORG_API');
    
    // 1. Create a test user if not exists
    const testUserId = 'test-user-' + Date.now();
    const testUserEmail = `test${Date.now()}@example.com`;
    
    // 2. Create a test organization
    const testOrgId = uuidv4();
    const [newOrg] = await db.insert(schema.organization).values({
      id: testOrgId,
      name: 'Test Organization ' + Date.now(),
      slug: 'test-org-' + Date.now(),
      type: 'startup',
      size: '11-50',
      description: 'Test organization for API testing',
      website: 'https://test.example.com',
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    
    log.info('Created test organization', 'TEST_ORG_API', { orgId: newOrg.id, name: newOrg.name });
    
    // 3. Add test user as owner
    await db.insert(schema.organizationMember).values({
      id: uuidv4(),
      organizationId: testOrgId,
      userId: testUserId,
      role: 'owner',
      status: 'active',
      joinedAt: new Date(),
      lastActiveAt: new Date(),
    });
    
    log.info('Added test user as owner', 'TEST_ORG_API');
    
    // 4. Add some additional members
    const memberRoles: ('admin' | 'manager' | 'member' | 'guest')[] = ['admin', 'manager', 'member', 'member', 'guest'];
    for (let i = 0; i < 5; i++) {
      await db.insert(schema.organizationMember).values({
        id: uuidv4(),
        organizationId: testOrgId,
        userId: `test-member-${i}`,
        role: memberRoles[i],
        status: i === 4 ? 'pending' : 'active',
        joinedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000), // Stagger join dates
        lastActiveAt: new Date(Date.now() - i * 60 * 60 * 1000), // Stagger activity
      });
    }
    
    log.info('Added test members', 'TEST_ORG_API', { count: 5 });
    
    // 5. Create organization settings
    await db.insert(schema.organizationSettings).values({
      id: uuidv4(),
      organizationId: testOrgId,
      security: {
        require2FA: false,
        allowPublicSignup: true,
        sessionTimeout: 30,
        ipWhitelist: [],
        allowedDomains: ['example.com', 'test.com'],
      },
      notifications: {
        emailNotifications: true,
        pushNotifications: false,
        slackIntegration: false,
        webhookUrl: null,
      },
      features: {
        apiAccess: true,
        customBranding: false,
        advancedAnalytics: true,
        ssoEnabled: false,
      },
      member: {
        defaultRole: 'member',
        autoApprove: false,
        requireEmailVerification: true,
      },
      branding: {
        primaryColor: '#007AFF',
        logo: null,
        favicon: null,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    log.info('Created organization settings', 'TEST_ORG_API');
    
    // 6. Add some activity logs
    const activities = [
      { action: 'member.joined', category: 'member', entityType: 'user', entityName: 'John Doe' },
      { action: 'settings.updated', category: 'settings', entityType: 'settings', entityName: 'Security Settings' },
      { action: 'member.role_changed', category: 'member', entityType: 'user', entityName: 'Jane Smith' },
      { action: 'member.invited', category: 'member', entityType: 'invitation', entityName: 'bob@example.com' },
      { action: 'organization.updated', category: 'organization', entityType: 'organization', entityName: 'General Settings' },
    ];
    
    for (const activity of activities) {
      await db.insert(schema.organizationActivityLog).values({
        id: uuidv4(),
        organizationId: testOrgId,
        actorId: testUserId,
        actorName: 'Test User',
        actorEmail: testUserEmail,
        actorRole: 'owner',
        action: activity.action,
        category: activity.category,
        severity: 'info',
        entityType: activity.entityType,
        entityId: uuidv4(),
        entityName: activity.entityName,
        ipAddress: '127.0.0.1',
        userAgent: 'Test Script',
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random time in last 7 days
      });
    }
    
    log.info('Added activity logs', 'TEST_ORG_API', { count: activities.length });
    
    // 7. Generate a join code
    await db.insert(schema.organizationCode).values({
      id: uuidv4(),
      organizationId: testOrgId,
      code: 'TEST-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      type: 'join',
      createdBy: testUserId,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      maxUses: 10,
      usedCount: 0,
      metadata: {
        role: 'member',
        autoApprove: true,
      },
    });
    
    log.info('Generated join code', 'TEST_ORG_API');
    
    // 8. Query and display results
    const orgWithMembers = await db.query.organization.findFirst({
      where: eq(schema.organization.id, testOrgId),
      with: {
        members: true,
        settings: true,
        codes: true,
      },
    });
    
    log.info('Test organization created successfully!', 'TEST_ORG_API', {
      organizationId: testOrgId,
      name: newOrg.name,
      slug: newOrg.slug,
      memberCount: orgWithMembers?.members.length,
      hasSettings: !!orgWithMembers?.settings,
      activeCodes: orgWithMembers?.codes.length,
    });
    
    log.info('\n=== TEST ORGANIZATION CREATED ===', 'COMPONENT');
    log.info('Organization ID: ${testOrgId}', 'COMPONENT');
    log.info('Organization Name: ${newOrg.name}', 'COMPONENT');
    log.info('Organization Slug: ${newOrg.slug}', 'COMPONENT');
    log.info('Members: ${orgWithMembers?.members.length}', 'COMPONENT');
    log.info('\nUse this ID for testing: ${testOrgId}', 'COMPONENT');
    log.info('================================\n', 'COMPONENT');
    
  } catch (error) {
    log.error('Failed to test organization API', 'TEST_ORG_API', { error });
    console.error('Error:', error);
  } finally {
    await queryClient.end();
  }
}

// Run the test
testOrganizationAPI();