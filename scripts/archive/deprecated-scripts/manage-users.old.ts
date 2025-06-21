#!/usr/bin/env bun
/**
 * Unified User Management Script
 * Handles creation, updating, and management of test users
 */

import { TEST_USERS, TEST_USER_BY_ROLE, getApiUrl, type TestUser } from '../config/test-users';
import { initScript, waitForService, prettyJson } from '../config/utils';
import { db } from '@/src/db';
import { user as userTable, organization, organizationMember } from '@/src/db/schema';
import { eq } from 'drizzle-orm';

interface UserAction {
  action: 'create' | 'update' | 'delete' | 'list' | 'setup-demo';
  email?: string;
  role?: string;
  useApi?: boolean;
}

async function createUserViaApi(userData: TestUser) {
  const apiUrl = getApiUrl();

  try {
    const response = await fetch(`${apiUrl}/api/auth/sign-up/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: userData.email,
        password: userData.password,
        name: userData.name,
      }),
    });
    
    if (response.ok) {
      const data = await response.json();

      return data;
    } else {
      const error = await response.text();
      if (error.includes('already exists')) {

      } else {
        console.error(`❌ Failed to create user: ${error}`);
      }
    }
  } catch (error) {
    console.error(`❌ Error creating user ${userData.email}:`, error);
  }
}

async function createUserDirectly(userData: TestUser) {

  try {
    // Check if user exists
    const existing = await db.select().from(userTable).where(eq(userTable.email, userData.email)).limit(1);
    
    if (existing.length > 0) {

      return existing[0];
    }
    
    // Create user
    const [newUser] = await db.insert(userTable).values({
      email: userData.email,
      name: userData.name,
      role: userData.role as any,
      emailVerified: true,
    }).returning();

    // Add to default organization if specified
    if (userData.organizationId) {
      await db.insert(organizationMember).values({
        userId: newUser.id,
        organizationId: userData.organizationId,
        role: 'member',
      });

    }
    
    return newUser;
  } catch (error) {
    console.error(`❌ Error creating user ${userData.email}:`, error);
  }
}

async function setupDemoUsers(useApi: boolean = true) {

  if (useApi) {
    // Wait for API to be ready
    const apiUrl = getApiUrl();
    const isReady = await waitForService(`${apiUrl}/api/auth/health`);
    if (!isReady) {
      console.error('❌ API is not available. Please start the server first.');
      return;
    }
  }
  
  for (const userData of TEST_USERS) {
    if (useApi) {
      await createUserViaApi(userData);
    } else {
      await createUserDirectly(userData);
    }
  }

  TEST_USERS.forEach(user => {

  });
}

async function listUsers() {

  try {
    const users = await db.select({
      id: userTable.id,
      email: userTable.email,
      name: userTable.name,
      role: userTable.role,
      createdAt: userTable.createdAt,
      emailVerified: userTable.emailVerified,
    })
    .from(userTable)
    .orderBy(userTable.createdAt);
    
    if (users.length === 0) {

      return;
    }

    users.forEach((user, index) => {

    });
  } catch (error) {
    console.error('❌ Error listing users:', error);
  }
}

async function updateUserRole(email: string, newRole: string) {

  try {
    const result = await db.update(userTable)
      .set({ role: newRole as any })
      .where(eq(userTable.email, email))
      .returning();
    
    if (result.length > 0) {

    } else {

    }
  } catch (error) {
    console.error(`❌ Error updating user:`, error);
  }
}

async function deleteUser(email: string) {

  try {
    // Delete organization memberships first
    const userData = await db.select().from(userTable).where(eq(userTable.email, email)).limit(1);
    
    if (userData.length === 0) {

      return;
    }
    
    await db.delete(organizationMember).where(eq(organizationMember.userId, userData[0].id));
    
    // Delete user
    await db.delete(userTable).where(eq(userTable.email, email));

  } catch (error) {
    console.error(`❌ Error deleting user:`, error);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const action = args[0] as UserAction['action'];
  
  if (!action) {

    process.exit(1);
  }
  
  const useApi = args.includes('--api');
  
  switch (action) {
    case 'setup-demo':
      await setupDemoUsers(useApi);
      break;
      
    case 'create':
      const email = args[1];
      if (!email) {
        console.error('❌ Email is required for create action');
        process.exit(1);
      }
      
      const userData: TestUser = {
        email,
        password: 'password123',
        name: email.split('@')[0],
        role: 'operator',
      };
      
      if (useApi) {
        await createUserViaApi(userData);
      } else {
        await createUserDirectly(userData);
      }
      break;
      
    case 'update':
      const updateEmail = args[1];
      const newRole = args[2];
      
      if (!updateEmail || !newRole) {
        console.error('❌ Email and role are required for update action');
        process.exit(1);
      }
      
      await updateUserRole(updateEmail, newRole);
      break;
      
    case 'delete':
      const deleteEmail = args[1];
      
      if (!deleteEmail) {
        console.error('❌ Email is required for delete action');
        process.exit(1);
      }
      
      await deleteUser(deleteEmail);
      break;
      
    case 'list':
      await listUsers();
      break;
      
    default:
      console.error(`❌ Unknown action: ${action}`);
      process.exit(1);
  }
}

initScript(
  {
    name: 'User Management',
    description: 'Create, update, and manage test users',
    requiresDatabase: true,
  },
  main
);