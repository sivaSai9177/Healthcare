#!/usr/bin/env bun

/**
 * Setup test users for MVP testing
 */

import { db } from '@/src/db';
import { users, accounts, organizations, organizationMembers, hospitals } from '@/src/db/schema';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import chalk from 'chalk';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

// Test users
const TEST_USERS = [
  {
    email: 'admin@mvp.test',
    password: 'Admin123!@#',
    name: 'MVP Admin',
    role: 'admin',
  },
  {
    email: 'doctor@mvp.test',
    password: 'Doctor123!@#',
    name: 'Dr. MVP Test',
    role: 'doctor',
  },
  {
    email: 'nurse@mvp.test',
    password: 'Nurse123!@#',
    name: 'Nurse MVP',
    role: 'nurse',
  },
  {
    email: 'operator@mvp.test',
    password: 'Operator123!@#',
    name: 'Operator MVP',
    role: 'operator',
  }
];

async function setupTestData() {

  try {
    // 1. Create test organization

    const [testOrg] = await db.insert(organizations).values({
      id: crypto.randomUUID(),
      name: 'MVP Test Hospital',
      type: 'hospital',
      description: 'Test hospital for MVP demonstration',
      slug: 'mvp-test-hospital',
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    // 2. Create test hospital

    const [testHospital] = await db.insert(hospitals).values({
      id: crypto.randomUUID(),
      name: 'MVP Medical Center',
      address: '123 Demo Street',
      phoneNumber: '555-0123',
      email: 'contact@mvp-medical.test',
      organizationId: testOrg.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    // 3. Create test users

    for (const userData of TEST_USERS) {
      // Check if user already exists
      const existing = await db.select().from(users).where(eq(users.email, userData.email)).execute();
      
      if (existing.length > 0) {

        // Update hospital assignment
        await db.update(users)
          .set({ 
            defaultHospitalId: testHospital.id,
            updatedAt: new Date()
          })
          .where(eq(users.email, userData.email));
          
        // Add to organization
        const existingMembership = await db.select()
          .from(organizationMembers)
          .where(eq(organizationMembers.userId, existing[0].id))
          .execute();
          
        if (existingMembership.length === 0) {
          await db.insert(organizationMembers).values({
            id: crypto.randomUUID(),
            userId: existing[0].id,
            organizationId: testOrg.id,
            role: userData.role === 'admin' ? 'owner' : 'member',
            joinedAt: new Date(),
          });
        }
        
        continue;
      }
      
      // Create new user
      const userId = crypto.randomUUID();
      const hashedPassword = await Bun.password.hash(userData.password);
      
      await db.insert(users).values({
        id: userId,
        email: userData.email,
        emailVerified: true,
        name: userData.name,
        role: userData.role as any,
        defaultHospitalId: testHospital.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      // Create account for password login
      await db.insert(accounts).values({
        id: crypto.randomUUID(),
        userId,
        accountId: userData.email,
        providerId: 'credential',
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      // Add to organization
      await db.insert(organizationMembers).values({
        id: crypto.randomUUID(),
        userId,
        organizationId: testOrg.id,
        role: userData.role === 'admin' ? 'owner' : 'member',
        joinedAt: new Date(),
      });

    }
    
    // 4. Display test credentials

    TEST_USERS.forEach(user => {

    });

  } catch (error) {
    console.error(chalk.red('\n❌ Error setting up test data:'), error);
    process.exit(1);
  }
}

// Run setup
setupTestData();