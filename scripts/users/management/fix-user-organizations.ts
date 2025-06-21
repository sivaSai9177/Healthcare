#!/usr/bin/env node

/**
 * Fix users without organizationId by linking them to the demo hospital
 */

import { db } from '../src/db';
import { user as users } from '../src/db/schema';
import { organization, organizationMember } from '../src/db/organization-schema';
import { healthcareUsers } from '../src/db/healthcare-schema';
import { eq, isNull, and } from 'drizzle-orm';

const DEMO_HOSPITAL_ID = 'f155b026-01bd-4212-94f3-e7aedef2801d';
const DEMO_ORG_NAME = 'Demo General Hospital';

async function fixUserOrganizations() {

  try {
    // First, ensure the demo organization exists
    const [demoOrg] = await db
      .select()
      .from(organization)
      .where(eq(organization.id, DEMO_HOSPITAL_ID))
      .limit(1);
    
    if (!demoOrg) {

      await db.insert(organization).values({
        id: DEMO_HOSPITAL_ID,
        name: DEMO_ORG_NAME,
        slug: 'demo-general-hospital',
        description: 'Demo hospital for testing healthcare features',
        type: 'healthcare',
        status: 'active',
        settings: {
          features: {
            healthcare: true,
            alerts: true,
            shifts: true,
            escalation: true,
          },
        },
        metadata: {
          isDemo: true,
          maxAlerts: 100,
          maxMembers: 50,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

    } else {

    }
    
    // Find all users without organizationId
    const usersWithoutOrg = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
      })
      .from(users)
      .where(isNull(users.organizationId));

    if (usersWithoutOrg.length === 0) {

      return;
    }
    
    // Update users with healthcare roles
    for (const user of usersWithoutOrg) {
      const isHealthcareRole = ['doctor', 'nurse', 'head_doctor', 'operator', 'admin'].includes(user.role);
      
      if (isHealthcareRole) {

        // Update user's organizationId
        await db
          .update(users)
          .set({
            organizationId: DEMO_HOSPITAL_ID,
            updatedAt: new Date(),
          })
          .where(eq(users.id, user.id));
        
        // Check if user is already a member of the organization
        const [existingMember] = await db
          .select()
          .from(organizationMember)
          .where(
            and(
              eq(organizationMember.userId, user.id),
              eq(organizationMember.organizationId, DEMO_HOSPITAL_ID)
            )
          )
          .limit(1);
        
        if (!existingMember) {
          // Add user as organization member
          const orgRole = user.role === 'admin' ? 'admin' : 
                         user.role === 'head_doctor' ? 'manager' : 'member';
          
          await db.insert(organizationMember).values({
            organizationId: DEMO_HOSPITAL_ID,
            userId: user.id,
            role: orgRole,
            status: 'active',
            joinedAt: new Date(),
          });

        } else {

        }
        
        // Update healthcare user's hospitalId if needed
        const [healthcareUser] = await db
          .select()
          .from(healthcareUsers)
          .where(eq(healthcareUsers.userId, user.id))
          .limit(1);
        
        if (healthcareUser && healthcareUser.hospitalId !== DEMO_HOSPITAL_ID) {
          await db
            .update(healthcareUsers)
            .set({
              hospitalId: DEMO_HOSPITAL_ID,
              updatedAt: new Date(),
            })
            .where(eq(healthcareUsers.userId, user.id));

        } else if (!healthcareUser) {
          // Create healthcare profile
          await db.insert(healthcareUsers).values({
            userId: user.id,
            hospitalId: DEMO_HOSPITAL_ID,
            department: 'General',
            isOnDuty: false,
            specialization: user.role === 'doctor' || user.role === 'head_doctor' ? 'General Medicine' : null,
          });

        }
      } else {

      }
    }
    
    // Verify the fixes
    const remainingWithoutOrg = await db
      .select({ count: users.id })
      .from(users)
      .where(
        and(
          isNull(users.organizationId),
          eq(users.role, 'doctor')
        )
      );

  } catch (error) {
    console.error('\n❌ Error fixing user organizations:', error);
    process.exit(1);
  }
}

// Run the script
fixUserOrganizations()
  .then(() => {

    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });