#!/usr/bin/env node

/**
 * Fix users without organizationId and invite them to the demo hospital
 */

import { db } from '../src/db';
import { user as users } from '../src/db/schema';
import { organization, organizationMember, organizationInvitation } from '../src/db/organization-schema';
import { healthcareUsers } from '../src/db/healthcare-schema';
import { eq, inArray, isNull } from 'drizzle-orm';
import { log } from '@/lib/core/debug/logger';
import { nanoid } from 'nanoid';

const DEMO_HOSPITAL_ID = 'f155b026-01bd-4212-94f3-e7aedef2801d';
const DEMO_ORG_NAME = 'Demo General Hospital';

// Users to fix (from your query)
const USER_IDS_TO_FIX = [
  'a46aff15-504c-4a66-9743-15236bfde56a',
  'c9ee98ad-04c6-4b8e-8e67-86bc60b017d2',
  'd9df4085-3f0c-4505-a92e-d5aef896b186',
  'f5b5f3a5-36c5-4577-baaa-5df8d4d3758b'
];

async function fixUsersAndInvite() {

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

    }
    
    // Get the specific users
    const usersToFix = await db
      .select()
      .from(users)
      .where(inArray(users.id, USER_IDS_TO_FIX));

    for (const user of usersToFix) {

      // Check if user already has an organizationId
      if (user.organizationId) {

        continue;
      }
      
      // Update user's organizationId
      await db
        .update(users)
        .set({
          organizationId: DEMO_HOSPITAL_ID,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      // Check if user is already a member
      const [existingMember] = await db
        .select()
        .from(organizationMember)
        .where(
          eq(organizationMember.userId, user.id)
        )
        .limit(1);
      
      if (!existingMember) {
        // Determine organization role based on user role
        const orgRole = user.role === 'admin' ? 'admin' : 
                       user.role === 'head_doctor' ? 'manager' : 'member';
        
        // Add as member
        await db.insert(organizationMember).values({
          organizationId: DEMO_HOSPITAL_ID,
          userId: user.id,
          role: orgRole,
          status: 'active',
          joinedAt: new Date(),
        });

      } else {

      }
      
      // Create healthcare profile if needed
      if (['doctor', 'nurse', 'head_doctor', 'operator'].includes(user.role)) {
        const [healthcareUser] = await db
          .select()
          .from(healthcareUsers)
          .where(eq(healthcareUsers.userId, user.id))
          .limit(1);
        
        if (!healthcareUser) {
          await db.insert(healthcareUsers).values({
            userId: user.id,
            hospitalId: DEMO_HOSPITAL_ID,
            department: 'General',
            isOnDuty: false,
            specialization: user.role === 'doctor' || user.role === 'head_doctor' ? 'General Medicine' : null,
          });

        } else {
          // Update hospitalId if different
          if (healthcareUser.hospitalId !== DEMO_HOSPITAL_ID) {
            await db
              .update(healthcareUsers)
              .set({
                hospitalId: DEMO_HOSPITAL_ID,
                updatedAt: new Date(),
              })
              .where(eq(healthcareUsers.userId, user.id));

          }
        }
      }
      
      // Create invitation record for tracking
      const invitationToken = nanoid(32);
      await db.insert(organizationInvitation).values({
        organizationId: DEMO_HOSPITAL_ID,
        email: user.email,
        role: 'member',
        token: invitationToken,
        invitedBy: user.id, // Self-invitation for migration
        status: 'accepted', // Auto-accept since we're migrating
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        acceptedAt: new Date(),
        metadata: {
          migrated: true,
          originalRole: user.role,
        },
      });

    }
    
    // Also fix any other users without organizationId who are healthcare roles
    const otherUsersWithoutOrg = await db
      .select()
      .from(users)
      .where(isNull(users.organizationId));

    for (const user of otherUsersWithoutOrg) {
      if (['doctor', 'nurse', 'head_doctor', 'operator', 'admin'].includes(user.role)) {

        // Update organizationId
        await db
          .update(users)
          .set({
            organizationId: DEMO_HOSPITAL_ID,
            updatedAt: new Date(),
          })
          .where(eq(users.id, user.id));
        
        // Add as member if not already
        const [existingMember] = await db
          .select()
          .from(organizationMember)
          .where(
            eq(organizationMember.userId, user.id)
          )
          .limit(1);
        
        if (!existingMember) {
          const orgRole = user.role === 'admin' ? 'admin' : 
                         user.role === 'head_doctor' ? 'manager' : 'member';
          
          await db.insert(organizationMember).values({
            organizationId: DEMO_HOSPITAL_ID,
            userId: user.id,
            role: orgRole,
            status: 'active',
            joinedAt: new Date(),
          });
        }

      }
    }

  } catch (error) {
    console.error('\n❌ Error fixing users:', error);
    process.exit(1);
  }
}

// Run the script
fixUsersAndInvite()
  .then(() => {

    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });