#!/usr/bin/env tsx
/**
 * Simple hospital assignment fix using existing database setup
 */

import { db } from '../src/db';
import { eq, isNull, and } from 'drizzle-orm';
import { users } from '../src/db/schema';
import { organization, organizationMember } from '../src/db/organization-schema';
import { hospitals, healthcareUsers } from '../src/db/healthcare-schema';

async function main() {

  try {
    // 1. Create or get default organization

    let defaultOrg = await db
      .select()
      .from(organization)
      .where(eq(organization.slug, 'default-healthcare'))
      .limit(1);

    if (defaultOrg.length === 0) {
      const newOrg = await db.insert(organization).values({
        name: 'Default Healthcare Organization',
        slug: 'default-healthcare',
        type: 'healthcare',
        size: 'medium',
        status: 'active',
      }).returning();
      defaultOrg = newOrg;

    } else {

    }

    const orgId = defaultOrg[0].id;

    // 2. Create or get default hospital

    let defaultHospital = await db
      .select()
      .from(hospitals)
      .where(and(
        eq(hospitals.organizationId, orgId),
        eq(hospitals.isDefault, true)
      ))
      .limit(1);

    if (defaultHospital.length === 0) {
      const newHospital = await db.insert(hospitals).values({
        organizationId: orgId,
        name: 'Main Hospital',
        code: 'MAIN',
        isDefault: true,
        isActive: true,
        settings: {
          departments: ['Emergency', 'General', 'ICU'],
          alertTypes: ['emergency', 'urgent', 'routine'],
        },
      }).returning();
      defaultHospital = newHospital;

    } else {

    }

    const hospitalId = defaultHospital[0].id;

    // 3. Get users without hospital assignments

    const usersWithoutHospital = await db
      .select({
        userId: users.id,
        email: users.email,
        name: users.name,
      })
      .from(users)
      .leftJoin(healthcareUsers, eq(users.id, healthcareUsers.userId))
      .where(isNull(healthcareUsers.userId));

    // 4. Assign hospital to each user
    if (usersWithoutHospital.length > 0) {

      for (const user of usersWithoutHospital) {
        // Check if user is in an organization
        const membership = await db
          .select()
          .from(organizationMember)
          .where(eq(organizationMember.userId, user.userId))
          .limit(1);

        // If not in any organization, add to default
        if (membership.length === 0) {
          await db.insert(organizationMember).values({
            organizationId: orgId,
            userId: user.userId,
            role: 'member',
            status: 'active',
          });
        }

        // Create healthcare user record
        await db.insert(healthcareUsers).values({
          userId: user.userId,
          hospitalId: hospitalId,
          department: 'General',
          isOnDuty: false,
        });

      }
    }

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

main();