import * as dotenv from 'dotenv';
import * as path from 'path';

import { db } from '../src/db';
import { organization, organizationCode, organizationMember } from '../src/db/organization-schema';
import { hospitals } from '../src/db/healthcare-schema';
import { user } from '../src/db/schema';
import { eq, desc, count, sql } from 'drizzle-orm';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

async function checkExistingData() {
  try {
    console.log('\n🔍 === CHECKING EXISTING DATABASE DATA ===\n');

    // 1. Check existing users
    console.log('👥 EXISTING USERS:');
    console.log('==================');
    
    const users = await db
      .select({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organizationId,
        needsProfileCompletion: user.needsProfileCompletion,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt
      })
      .from(user)
      .orderBy(user.role, user.createdAt);

    const roleGroups: Record<string, typeof users> = {};
    users.forEach(u => {
      if (!roleGroups[u.role]) roleGroups[u.role] = [];
      roleGroups[u.role].push(u);
    });

    Object.entries(roleGroups).forEach(([role, users]) => {
      console.log(`\n${role.toUpperCase()} (${users.length}):`);
      users.forEach(u => {
        const orgStatus = u.organizationId ? '✅ Has Org' : '❌ No Org';
        const profileStatus = u.needsProfileCompletion ? '⚠️ Needs Completion' : '✅ Complete';
        console.log(`  - ${u.email} | ${u.name || 'No name'} | ${orgStatus} | ${profileStatus}`);
      });
    });

    // 2. Check existing organizations
    console.log('\n\n🏢 EXISTING ORGANIZATIONS:');
    console.log('==========================');
    
    const orgs = await db
      .select({
        id: organization.id,
        name: organization.name,
        type: organization.type,
        size: organization.size,
        status: organization.status,
        createdAt: organization.createdAt
      })
      .from(organization)
      .orderBy(desc(organization.createdAt));

    for (const org of orgs) {
      console.log(`\n🏢 ${org.name}`);
      console.log(`   ID: ${org.id}`);
      console.log(`   Type: ${org.type} | Size: ${org.size} | Status: ${org.status}`);
      
      // Get member count
      const members = await db
        .select({
          count: count()
        })
        .from(organizationMember)
        .where(eq(organizationMember.organizationId, org.id));
      
      console.log(`   Members: ${members[0].count}`);

      // Get active codes
      const codes = await db
        .select({
          code: organizationCode.code,
          type: organizationCode.type,
          maxUses: organizationCode.maxUses,
          currentUses: organizationCode.currentUses,
          expiresAt: organizationCode.expiresAt,
          isActive: organizationCode.isActive
        })
        .from(organizationCode)
        .where(eq(organizationCode.organizationId, org.id));

      if (codes.length > 0) {
        console.log(`   📋 Organization Codes:`);
        codes.forEach(code => {
          if (code.isActive) {
            const uses = code.maxUses ? `${code.currentUses}/${code.maxUses}` : `${code.currentUses}/∞`;
            const expires = code.expiresAt ? 
              (code.expiresAt < new Date() ? '❌ EXPIRED' : `⏰ ${code.expiresAt.toLocaleDateString()}`) 
              : '♾️ No expiration';
            console.log(`      ${code.code} (${code.type}) - Uses: ${uses} - ${expires}`);
          }
        });
      }

      // Get hospitals if healthcare org
      if (org.type === 'healthcare') {
        const hospitalList = await db
          .select({
            name: hospitals.name,
            code: hospitals.code,
            isDefault: hospitals.isDefault,
            isActive: hospitals.isActive
          })
          .from(hospitals)
          .where(eq(hospitals.organizationId, org.id));

        if (hospitalList.length > 0) {
          console.log(`   🏥 Hospitals:`);
          hospitalList.forEach(h => {
            const status = h.isActive ? '✅' : '❌';
            const defaultTag = h.isDefault ? ' ⭐ DEFAULT' : '';
            console.log(`      ${status} ${h.name} (${h.code})${defaultTag}`);
          });
        }
      }
    }

    // 3. Summary statistics
    console.log('\n\n📊 SUMMARY STATISTICS:');
    console.log('======================');
    
    const stats = await db.execute(sql`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM users WHERE needs_profile_completion = true) as incomplete_profiles,
        (SELECT COUNT(*) FROM users WHERE organization_id IS NOT NULL) as users_with_org,
        (SELECT COUNT(*) FROM organization) as total_orgs,
        (SELECT COUNT(*) FROM organization WHERE type = 'healthcare') as healthcare_orgs,
        (SELECT COUNT(*) FROM organization_code WHERE is_active = true) as active_codes,
        (SELECT COUNT(*) FROM hospitals WHERE is_active = true) as active_hospitals
    `);

    const s = stats.rows[0] as any;
    console.log(`Total Users: ${s.total_users}`);
    console.log(`Incomplete Profiles: ${s.incomplete_profiles}`);
    console.log(`Users with Organizations: ${s.users_with_org}`);
    console.log(`Total Organizations: ${s.total_orgs}`);
    console.log(`Healthcare Organizations: ${s.healthcare_orgs}`);
    console.log(`Active Organization Codes: ${s.active_codes}`);
    console.log(`Active Hospitals: ${s.active_hospitals}`);

    // 4. Users without organizations (who might need them)
    console.log('\n\n⚠️  USERS NEEDING ORGANIZATIONS:');
    console.log('===================================');
    
    const usersNeedingOrgs = await db
      .select({
        email: user.email,
        name: user.name,
        role: user.role
      })
      .from(user)
      .where(sql`${user.organizationId} IS NULL AND ${user.role} IN ('doctor', 'nurse', 'operator', 'head_doctor', 'admin')`)
      .orderBy(user.role);

    if (usersNeedingOrgs.length > 0) {
      usersNeedingOrgs.forEach(u => {
        console.log(`❗ ${u.role}: ${u.email} - Needs organization assignment`);
      });
    } else {
      console.log('✅ All healthcare/admin users have organizations');
    }

  } catch (error) {
    console.error('❌ Error checking data:', error);
  } finally {
    process.exit(0);
  }
}

// Run the check
checkExistingData();