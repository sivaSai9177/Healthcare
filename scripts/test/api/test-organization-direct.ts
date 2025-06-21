#!/usr/bin/env bun

import { db } from '../src/db';
import { 
  organization, 
  organizationMember, 
  organizationSettings,
  organizationCode,
  organizationActivityLog 
} from '../src/db/organization-schema';
import { user } from '../src/db/schema';
import { eq } from 'drizzle-orm';

async function testOrganizationDirect() {
  // TODO: Replace with structured logging - /* console.log('🧪 Testing Organization System Directly...\n') */;

  try {
    // 1. Get a test user
    const [testUser] = await db
      .select()
      .from(user)
      .where(eq(user.email, 'saipramod273@gmail.com'))
      .limit(1);

    if (!testUser) {
      console.error('❌ Test user not found');
      return;
    }

    // TODO: Replace with structured logging - /* console.log('✅ Found test user:', testUser.email, '(', testUser.role, ') */');

    // 2. Create an organization
    // TODO: Replace with structured logging - /* console.log('\n📋 Creating organization...') */;
    const [newOrg] = await db.insert(organization).values({
      name: 'Test Healthcare Organization',
      slug: 'test-healthcare-' + Date.now(),
      type: 'business',
      size: 'medium',
      industry: 'Healthcare',
      timezone: 'America/New_York',
      language: 'en',
      currency: 'USD',
      plan: 'pro',
      status: 'active',
      createdBy: testUser.id,
    }).returning();

    // TODO: Replace with structured logging
    // /* console.log('✅ Organization created:', {
    //   id: newOrg.id,
    //   name: newOrg.name,
    //   slug: newOrg.slug,
    // }) */;

    // 3. Add creator as owner
    const [ownerMember] = await db.insert(organizationMember).values({
      organizationId: newOrg.id,
      userId: testUser.id,
      role: 'owner',
      status: 'active',
    }).returning();

    // TODO: Replace with structured logging - /* console.log('✅ Added owner member') */;

    // 4. Create default settings
    await db.insert(organizationSettings).values({
      organizationId: newOrg.id,
      allowGuestAccess: false,
      require2FA: false,
      defaultMemberRole: 'member',
    });

    // TODO: Replace with structured logging - /* console.log('✅ Created default settings') */;

    // 5. Log the creation activity
    await db.insert(organizationActivityLog).values({
      organizationId: newOrg.id,
      actorId: testUser.id,
      actorName: testUser.name,
      actorEmail: testUser.email,
      actorRole: 'owner',
      action: 'organization.created',
      category: 'organization',
      severity: 'info',
      entityType: 'organization',
      entityId: newOrg.id,
      metadata: { name: newOrg.name },
    });

// TODO: Replace with structured logging - /* console.log('✅ Logged creation activity') */;

    // 6. Generate an org code
    const [orgCode] = await db.insert(organizationCode).values({
      organizationId: newOrg.id,
      code: 'TEST-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      type: 'member',
      maxUses: 10,
      isActive: true,
      createdBy: testUser.id,
    }).returning();

// TODO: Replace with structured logging - /* console.log('✅ Generated org code:', orgCode.code) */;

    // 7. Query organization with members
    // TODO: Replace with structured logging - /* console.log('\n📊 Querying organization data...') */;
    
    const orgWithMembers = await db
      .select({
        org: organization,
        member: organizationMember,
        user: user,
      })
      .from(organization)
      .leftJoin(organizationMember, eq(organization.id, organizationMember.organizationId))
      .leftJoin(user, eq(organizationMember.userId, user.id))
      .where(eq(organization.id, newOrg.id));

    // TODO: Replace with structured logging - /* console.log('✅ Organization members:', orgWithMembers.length) */;
    orgWithMembers.forEach(row => {
      if (row.user) {
        // TODO: Replace with structured logging - /* console.log('  -', row.user.name, '(', row.member?.role, ') */');
      }
    });

    // 8. Query activity log
    const activities = await db
      .select()
      .from(organizationActivityLog)
      .where(eq(organizationActivityLog.organizationId, newOrg.id))
      .orderBy(organizationActivityLog.createdAt);

    // TODO: Replace with structured logging - /* console.log('\n📋 Activity log:') */;
    activities.forEach(activity => {
      // TODO: Replace with structured logging - /* console.log('  -', activity.action, 'by', activity.actorName) */;
    });

    // TODO: Replace with structured logging - /* console.log('\n🎉 All tests passed! Organization system is working correctly.') */;
    // TODO: Replace with structured logging - /* console.log('\n🔗 You can now access the organization dashboard at:') */;
    // TODO: Replace with structured logging - /* console.log('   http://localhost:8081/(home) *//organization-dashboard');
    // TODO: Replace with structured logging - /* console.log('\n📝 Organization ID:', newOrg.id) */;
    // TODO: Replace with structured logging - /* console.log('📝 Join Code:', orgCode.code) */;

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testOrganizationDirect().catch(console.error);