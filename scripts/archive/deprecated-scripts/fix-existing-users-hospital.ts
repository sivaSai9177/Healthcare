#!/usr/bin/env tsx
/**
 * Script to add default hospital assignments for existing users
 * This fixes the "Hospital assignment required" error for users created before the hospital system
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, isNull, and, sql } from 'drizzle-orm';
import { logger } from '../lib/core/debug/unified-logger';
import { users } from '../src/db/schema';
import { organization, organizationMember } from '../src/db/organization-schema';
import { hospitals, healthcareUsers } from '../src/db/healthcare-schema';
import { exit } from 'process';

// Database URL from environment
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  logger.error('DATABASE_URL environment variable is not set');
  exit(1);
}

const sql_client = postgres(databaseUrl);
const db = drizzle(sql_client);

async function createDefaultHospital(organizationId: string, orgName: string) {
  try {
    // Check if organization already has a default hospital
    const existingHospital = await db
      .select()
      .from(hospitals)
      .where(and(
        eq(hospitals.organizationId, organizationId),
        eq(hospitals.isDefault, true)
      ))
      .limit(1);

    if (existingHospital.length > 0) {
      logger.info(`Organization ${orgName} already has default hospital`, {
        hospitalId: existingHospital[0].id,
        hospitalName: existingHospital[0].name,
      });
      return existingHospital[0].id;
    }

    // Create default hospital for the organization
    const newHospital = await db.insert(hospitals).values({
      organizationId,
      name: `${orgName} Hospital`,
      code: `${orgName.substring(0, 3).toUpperCase()}_HOSP`,
      address: '123 Healthcare Street, Medical City, MC 12345',
      contactInfo: {
        phone: '+1-555-0100',
        email: 'info@hospital.example.com',
        emergencyPhone: '+1-555-0911',
      },
      settings: {
        departments: ['Emergency', 'General', 'ICU', 'Surgery'],
        alertTypes: ['emergency', 'urgent', 'routine', 'code_blue'],
        shiftDuration: 8,
        timezone: 'America/New_York',
      },
      isActive: true,
      isDefault: true,
    }).returning();

    logger.info(`Created default hospital for organization ${orgName}`, {
      hospitalId: newHospital[0].id,
      hospitalName: newHospital[0].name,
    });

    return newHospital[0].id;
  } catch (error) {
    logger.error(`Failed to create hospital for organization ${orgName}`, error);
    throw error;
  }
}

async function createDefaultOrganization() {
  try {
    // Check if default organization exists
    const defaultOrg = await db
      .select()
      .from(organization)
      .where(eq(organization.slug, 'default-healthcare'))
      .limit(1);

    if (defaultOrg.length > 0) {
      logger.info('Default organization already exists', {
        orgId: defaultOrg[0].id,
        orgName: defaultOrg[0].name,
      });
      return defaultOrg[0];
    }

    // Create default organization
    const newOrg = await db.insert(organization).values({
      name: 'Default Healthcare Organization',
      slug: 'default-healthcare',
      type: 'healthcare',
      size: 'medium',
      industry: 'healthcare',
      email: 'admin@healthcare.example.com',
      phone: '+1-555-0000',
      address: '100 Medical Plaza, Healthcare City, HC 10000',
      timezone: 'America/New_York',
      language: 'en',
      currency: 'USD',
      plan: 'starter',
      status: 'active',
      metadata: {
        isDefault: true,
        createdBy: 'system-migration',
      },
    }).returning();

    logger.info('Created default organization', {
      orgId: newOrg[0].id,
      orgName: newOrg[0].name,
    });

    return newOrg[0];
  } catch (error) {
    logger.error('Failed to create default organization', error);
    throw error;
  }
}

async function main() {
  logger.info('Starting hospital assignment fix for existing users...');

  try {
    // Step 1: Create default organization if needed
    const defaultOrg = await createDefaultOrganization();
    
    // Step 2: Create default hospital for the organization
    const defaultHospitalId = await createDefaultHospital(defaultOrg.id, defaultOrg.name);

    // Step 3: Get all users who don't have healthcare_users records
    const usersWithoutHospital = await db
      .select({
        userId: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
      })
      .from(users)
      .leftJoin(healthcareUsers, eq(users.id, healthcareUsers.userId))
      .where(isNull(healthcareUsers.userId));

    logger.info(`Found ${usersWithoutHospital.length} users without hospital assignments`);

    // Step 4: Process each user
    for (const user of usersWithoutHospital) {
      try {
        // Check if user is already a member of any organization
        const userOrgMembership = await db
          .select()
          .from(organizationMember)
          .where(eq(organizationMember.userId, user.userId))
          .limit(1);

        let userOrganizationId = defaultOrg.id;
        let userHospitalId = defaultHospitalId;

        if (userOrgMembership.length > 0) {
          // User has an organization, create/get hospital for that org
          const userOrg = await db
            .select()
            .from(organization)
            .where(eq(organization.id, userOrgMembership[0].organizationId))
            .limit(1);

          if (userOrg.length > 0) {
            userOrganizationId = userOrg[0].id;
            userHospitalId = await createDefaultHospital(userOrg[0].id, userOrg[0].name);
          }
        } else {
          // Add user to default organization
          await db.insert(organizationMember).values({
            organizationId: defaultOrg.id,
            userId: user.userId,
            role: user.role === 'admin' ? 'admin' : 'member',
            status: 'active',
            permissions: {},
          });

          logger.info(`Added user ${user.email} to default organization`);
        }

        // Create healthcare_users record with hospital assignment
        await db.insert(healthcareUsers).values({
          userId: user.userId,
          hospitalId: userHospitalId,
          department: 'General',
          isOnDuty: false,
        });

        logger.info(`Assigned hospital to user ${user.email}`, {
          userId: user.userId,
          hospitalId: userHospitalId,
          organizationId: userOrganizationId,
        });

      } catch (error) {
        logger.error(`Failed to process user ${user.email}`, error);
      }
    }

    // Step 5: Verify the fix
    const remainingUsersWithoutHospital = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .leftJoin(healthcareUsers, eq(users.id, healthcareUsers.userId))
      .where(isNull(healthcareUsers.userId));

    logger.info('Hospital assignment fix completed', {
      processedUsers: usersWithoutHospital.length,
      remainingWithoutHospital: remainingUsersWithoutHospital[0].count,
    });

  } catch (error) {
    logger.error('Failed to fix hospital assignments', error);
    exit(1);
  } finally {
    await sql_client.end();
  }
}

// Run the script
main().catch((error) => {
  logger.error('Script failed', error);
  exit(1);
});