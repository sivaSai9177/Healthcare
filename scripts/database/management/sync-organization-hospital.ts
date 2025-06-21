#!/usr/bin/env bun
import { db } from '@/src/db';
import { user, healthcareUsers } from '@/src/db/schema';
import { eq, isNotNull } from 'drizzle-orm';
import { log } from '@/lib/core/debug/logger';

async function syncOrganizationHospital() {
  log.info('Syncing user organizationId with healthcare hospitalId...', 'SYNC');
  
  try {
    // Get all healthcare users
    const healthcareStaff = await db
      .select({
        userId: healthcareUsers.userId,
        hospitalId: healthcareUsers.hospitalId,
        userEmail: user.email,
        userName: user.name,
        userOrgId: user.organizationId,
      })
      .from(healthcareUsers)
      .innerJoin(user, eq(healthcareUsers.userId, user.id));

    let syncNeeded = 0;
    let alreadySynced = 0;
    
    for (const staff of healthcareStaff) {

      if (staff.userOrgId !== staff.hospitalId) {

        // Update user's organizationId to match their hospitalId
        await db
          .update(user)
          .set({ organizationId: staff.hospitalId })
          .where(eq(user.id, staff.userId));

        syncNeeded++;
      } else {

        alreadySynced++;
      }
    }
    
    // Also check for users with organizationId but no healthcare profile
    const usersWithOrg = await db
      .select({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organizationId,
      })
      .from(user)
      .where(isNotNull(user.organizationId));
    
    const healthcareUserIds = healthcareStaff.map(s => s.userId);
    const missingProfiles = usersWithOrg.filter(u => 
      !healthcareUserIds.includes(u.id) && 
      ['doctor', 'nurse', 'head_doctor', 'operator'].includes(u.role || '')
    );
    
    if (missingProfiles.length > 0) {

      for (const u of missingProfiles) {

        // Create healthcare profile
        await db.insert(healthcareUsers).values({
          userId: u.id,
          hospitalId: u.organizationId!,
          isOnDuty: false,
        });

      }
    }

    log.info('Organization-Hospital sync completed', 'SYNC', {
      total: healthcareStaff.length,
      synced: alreadySynced,
      updated: syncNeeded,
      profilesCreated: missingProfiles.length,
    });
    
  } catch (error) {
    log.error('Failed to sync organization-hospital', 'SYNC', error);
    process.exit(1);
  }
  
  process.exit(0);
}

syncOrganizationHospital();