import * as dotenv from 'dotenv';
import * as path from 'path';

import { db } from '../src/db';
import { organization, organizationCode, organizationMember } from '../src/db/organization-schema';
import { hospitals } from '../src/db/healthcare-schema';
import { eq, desc, count } from 'drizzle-orm';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

async function checkOrganizations() {
  try {
    console.log('\n🏢 === ORGANIZATION DATABASE CHECK ===\n');

    // 1. Get all organizations
    const orgs = await db
      .select({
        id: organization.id,
        name: organization.name,
        type: organization.type,
        size: organization.size,
        status: organization.status,
        createdAt: organization.createdAt,
        createdBy: organization.createdBy
      })
      .from(organization)
      .orderBy(desc(organization.createdAt));

    console.log(`📊 Total Organizations: ${orgs.length}\n`);

    // 2. For each organization, get details
    for (const org of orgs) {
      console.log(`\n🏢 Organization: ${org.name}`);
      console.log(`   ID: ${org.id}`);
      console.log(`   Type: ${org.type}`);
      console.log(`   Size: ${org.size}`);
      console.log(`   Status: ${org.status}`);
      console.log(`   Created: ${org.createdAt?.toLocaleString()}`);

      // Get organization codes
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
        console.log(`\n   📋 Organization Codes:`);
        codes.forEach(code => {
          const status = code.isActive ? '✅ Active' : '❌ Inactive';
          const uses = code.maxUses ? `${code.currentUses}/${code.maxUses}` : `${code.currentUses}/∞`;
          const expires = code.expiresAt ? `Expires: ${code.expiresAt.toLocaleString()}` : 'No expiration';
          console.log(`      ${code.code} - ${status} - Type: ${code.type} - Uses: ${uses} - ${expires}`);
        });
      } else {
        console.log(`   📋 No organization codes generated`);
      }

      // Get member count
      const memberCount = await db
        .select({ count: count() })
        .from(organizationMember)
        .where(eq(organizationMember.organizationId, org.id));

      console.log(`   👥 Members: ${memberCount[0].count}`);

      // Get members with roles
      const members = await db
        .select({
          userId: organizationMember.userId,
          role: organizationMember.role,
          status: organizationMember.status,
          joinedAt: organizationMember.joinedAt
        })
        .from(organizationMember)
        .where(eq(organizationMember.organizationId, org.id))
        .orderBy(organizationMember.role);

      if (members.length > 0) {
        console.log(`   📊 Member Roles:`);
        const roleCounts: Record<string, number> = {};
        members.forEach(member => {
          roleCounts[member.role] = (roleCounts[member.role] || 0) + 1;
        });
        Object.entries(roleCounts).forEach(([role, count]) => {
          console.log(`      ${role}: ${count}`);
        });
      }

      // Get hospitals for healthcare organizations
      if (org.type === 'healthcare') {
        const hospitalList = await db
          .select({
            id: hospitals.id,
            name: hospitals.name,
            code: hospitals.code,
            isDefault: hospitals.isDefault,
            isActive: hospitals.isActive
          })
          .from(hospitals)
          .where(eq(hospitals.organizationId, org.id));

        if (hospitalList.length > 0) {
          console.log(`\n   🏥 Hospitals:`);
          hospitalList.forEach(hospital => {
            const defaultTag = hospital.isDefault ? ' (Default)' : '';
            const activeTag = hospital.isActive ? '✅' : '❌';
            console.log(`      ${activeTag} ${hospital.name} - Code: ${hospital.code}${defaultTag}`);
          });
        }
      }

      console.log('\n   ' + '─'.repeat(50));
    }

    // 3. Summary statistics
    console.log('\n📈 === SUMMARY STATISTICS ===\n');
    
    // Organization types
    const orgTypes = await db
      .select({
        type: organization.type,
        count: count()
      })
      .from(organization)
      .groupBy(organization.type);

    console.log('Organization Types:');
    orgTypes.forEach(({ type, count }) => {
      console.log(`   ${type}: ${count}`);
    });

    // Active codes
    const activeCodes = await db
      .select({ count: count() })
      .from(organizationCode)
      .where(eq(organizationCode.isActive, true));

    console.log(`\nActive Organization Codes: ${activeCodes[0].count}`);

    // Total members across all orgs
    const totalMembers = await db
      .select({ count: count() })
      .from(organizationMember)
      .where(eq(organizationMember.status, 'active'));

    console.log(`Total Active Members: ${totalMembers[0].count}`);

  } catch (error) {
    console.error('❌ Error checking organizations:', error);
  } finally {
    process.exit(0);
  }
}

// Run the check
checkOrganizations();