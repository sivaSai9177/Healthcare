#!/usr/bin/env bun
/**
 * Enhanced Unified User Management Script
 * Handles creation, updating, and management of test users with full healthcare support
 */

import { TEST_USERS, TEST_USER_BY_ROLE, getApiUrl, type TestUser } from '../config/test-users';
import { initScript, waitForService, prettyJson } from '../config/utils';

// Import database and schemas directly from server-db to avoid React Native issues
import { 
  db,
  user as userTable, 
  account,
  organization, 
  organizationMember,
  healthcareUsers, 
  hospitals 
} from '../../src/db/server-db';
import { eq, and, sql } from 'drizzle-orm';
import chalk from 'chalk';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { randomUUID } from 'crypto';

interface UserAction {
  action: 'create' | 'update' | 'delete' | 'list' | 'setup-demo' | 'setup-mvp' | 'setup-healthcare' | 'verify';
  email?: string;
  role?: string;
  useApi?: boolean;
  complete?: boolean; // Include complete healthcare setup
}

interface HealthcareUserData extends TestUser {
  department?: string;
  licenseNumber?: string;
  specialization?: string;
  isOnDuty?: boolean;
  hospitalId?: string;
  shiftStart?: Date;
  shiftEnd?: Date;
}

// Healthcare departments and specializations
const DEPARTMENTS = {
  nurse: ['ICU', 'Emergency', 'General Ward', 'Pediatrics', 'Surgery'],
  doctor: ['Emergency', 'Cardiology', 'Surgery', 'Internal Medicine', 'Pediatrics'],
  head_doctor: ['Administration', 'Surgery', 'Emergency'],
  head_nurse: ['ICU', 'Emergency', 'General Ward'],
};

const SPECIALIZATIONS = {
  doctor: ['Cardiologist', 'Surgeon', 'Internist', 'Pediatrician', 'Emergency Medicine'],
  head_doctor: ['Chief of Medicine', 'Chief of Surgery', 'Medical Director'],
};

// Complete test user data with healthcare info
const HEALTHCARE_TEST_USERS: HealthcareUserData[] = [
  {
    email: 'operator@hospital.com',
    password: 'password123',
    name: 'Test Operator',
    role: 'operator',
    department: 'Operations',
  },
  {
    email: 'doremon@gmail.com',
    password: 'password123',
    name: 'Nurse Doremon',
    role: 'nurse',
    department: 'ICU',
    licenseNumber: 'RN-2024-001',
    isOnDuty: true,
  },
  {
    email: 'nurse@hospital.com',
    password: 'password123',
    name: 'Test Nurse',
    role: 'nurse',
    department: 'Emergency',
    licenseNumber: 'RN-2024-002',
    isOnDuty: false,
  },
  {
    email: 'doctor@hospital.com',
    password: 'password123',
    name: 'Dr. Test',
    role: 'doctor',
    department: 'Cardiology',
    licenseNumber: 'MD-2024-001',
    specialization: 'Cardiologist',
  },
  {
    email: 'headdoctor@hospital.com',
    password: 'password123',
    name: 'Dr. Chief',
    role: 'head_doctor',
    department: 'Administration',
    licenseNumber: 'MD-2024-100',
    specialization: 'Chief of Medicine',
  },
  {
    email: 'admin@hospital.com',
    password: 'password123',
    name: 'Admin User',
    role: 'admin',
    department: 'Administration',
  },
  {
    email: 'manager@hospital.com',
    password: 'password123',
    name: 'Manager User',
    role: 'admin', // Using admin role since manager is not in the schema
    department: 'Operations',
  },
];

// Additional MVP test users
const MVP_TEST_USERS: HealthcareUserData[] = [
  {
    email: 'admin@healthalerts.mvp.test',
    password: 'securepassword123',
    name: 'MVP Admin',
    role: 'admin',
  },
  {
    email: 'doctor@healthalerts.mvp.test',
    password: 'doctorpass123',
    name: 'Dr. MVP',
    role: 'doctor',
    department: 'Emergency',
    licenseNumber: 'MD-MVP-001',
    specialization: 'Emergency Medicine',
  },
  {
    email: 'nurse@healthalerts.mvp.test',
    password: 'nursepass123',
    name: 'Nurse MVP',
    role: 'nurse',
    department: 'ICU',
    licenseNumber: 'RN-MVP-001',
  },
];

async function createOrganizationAndHospital() {

  try {
    // Check if organization exists
    const existingOrg = await db.select().from(organization)
      .where(eq(organization.slug, 'test-hospital'))
      .limit(1);
    
    let org = existingOrg[0];
    
    if (!org) {
      // Create organization
      const [newOrg] = await db.insert(organization).values({
        name: 'Test Hospital Organization',
        slug: 'test-hospital',
        type: 'healthcare',
        size: 'large',
        description: 'Test hospital for development',
      }).returning();
      org = newOrg;

    } else {

    }
    
    // Check if hospital exists
    const existingHosp = await db.select().from(hospitals)
      .where(eq(hospitals.organizationId, org.id))
      .limit(1);
    
    let hosp = existingHosp[0];
    
    if (!hosp) {
      // Create hospital
      const [newHosp] = await db.insert(hospitals).values({
        organizationId: org.id,
        name: 'General Hospital',
        code: 'GH001',
        address: '123 Medical Center Dr, Health City, HC 12345',
        contactInfo: {
          phone: '+1 (555) 123-4567',
          email: 'info@generalhospital.com',
          emergencyPhone: '+1 (555) 911-1111',
        },
        settings: {
          alertEscalationTime: 300, // 5 minutes
          maxActiveAlerts: 100,
          departments: ['ICU', 'Emergency', 'Surgery', 'Cardiology', 'General Ward'],
        },
        isActive: true,
        isDefault: true,
      }).returning();
      hosp = newHosp;

    } else {

    }
    
    return { organization: org, hospital: hosp };
  } catch (error) {
    console.error(chalk.red('❌ Error creating organization/hospital:'), error);
    throw error;
  }
}

async function createUserViaApi(userData: HealthcareUserData) {
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
        console.error(chalk.red(`❌ Failed to create user: ${error}`));
      }
    }
  } catch (error) {
    console.error(chalk.red(`❌ Error creating user ${userData.email}:`), error);
  }
}

async function createUserDirectly(userData: HealthcareUserData, orgId?: string, hospitalId?: string) {

  try {
    // Check if user exists
    const existing = await db.select().from(userTable).where(eq(userTable.email, userData.email)).limit(1);
    
    if (existing.length > 0) {

      return existing[0];
    }
    
    // Hash password
    const hashedPassword = await Bun.password.hash(userData.password);
    
    // Create user
    const [newUser] = await db.insert(userTable).values({
      id: randomUUID(),
      email: userData.email,
      name: userData.name,
      role: userData.role as any,
      emailVerified: true,
      image: `https://api.dicebear.com/7.x/initials/svg?seed=${userData.name}`,
      needsProfileCompletion: false,
      defaultHospitalId: hospitalId,
    }).returning();

    // Create account for credential login
    await db.insert(account).values({
      id: randomUUID(),
      userId: newUser.id,
      providerId: 'credential',
      accountId: newUser.email,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    // Add to organization if specified
    if (orgId) {
      await db.insert(organizationMember).values({
        id: randomUUID(),
        userId: newUser.id,
        organizationId: orgId,
        role: userData.role === 'admin' ? 'owner' : 'member',
        joinedAt: new Date(),
      });

    }
    
    // Create healthcare profile if healthcare role
    if (['nurse', 'doctor', 'head_doctor', 'head_nurse'].includes(userData.role || '')) {
      await db.insert(healthcareUsers).values({
        id: randomUUID(),
        userId: newUser.id,
        hospitalId: hospitalId || 'default-hospital',
        department: userData.department || DEPARTMENTS[userData.role as keyof typeof DEPARTMENTS]?.[0],
        licenseNumber: userData.licenseNumber || `${userData.role?.toUpperCase()}-${Date.now()}`,
        specialization: userData.specialization || SPECIALIZATIONS[userData.role as keyof typeof SPECIALIZATIONS]?.[0],
        isOnDuty: userData.isOnDuty ?? false,
        shiftStartTime: userData.shiftStart || new Date(),
        shiftEndTime: userData.shiftEnd || new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours later
      });

    }
    
    return newUser;
  } catch (error) {
    console.error(chalk.red(`❌ Error creating user ${userData.email}:`), error);
  }
}

async function setupDemoUsers(useApi: boolean = false, complete: boolean = false) {

  let orgId: string | undefined;
  let hospitalId: string | undefined;
  
  if (complete) {
    // Create organization and hospital first
    const setup = await createOrganizationAndHospital();
    orgId = setup.organization.id;
    hospitalId = setup.hospital.id;

  }
  
  if (useApi && complete) {

    useApi = false;
  }
  
  if (useApi) {
    // Wait for API to be ready
    const apiUrl = getApiUrl();
    const isReady = await waitForService(`${apiUrl}/api/auth/health`);
    if (!isReady) {
      console.error(chalk.red('❌ API is not available. Please start the server first.'));
      return;
    }
  }
  
  const usersToCreate = complete ? HEALTHCARE_TEST_USERS : TEST_USERS;
  
  for (const userData of usersToCreate) {
    if (useApi) {
      await createUserViaApi(userData as HealthcareUserData);
    } else {
      await createUserDirectly(userData as HealthcareUserData, orgId, hospitalId);
    }
  }

  usersToCreate.forEach(user => {
    const role = chalk.cyan(`(${user.role})`);
    const dept = (user as HealthcareUserData).department ? chalk.blue(` - ${(user as HealthcareUserData).department}`) : '';

  });

  if (complete) {

  }
}

async function setupMvpUsers() {

  // Create organization and hospital
  const setup = await createOrganizationAndHospital();
  
  // Create MVP users
  for (const userData of MVP_TEST_USERS) {
    await createUserDirectly(userData, setup.organization.id, setup.hospital.id);
  }

  MVP_TEST_USERS.forEach(user => {
    const role = chalk.cyan(`(${user.role})`);
    const dept = user.department ? chalk.blue(` - ${user.department}`) : '';

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
      defaultHospitalId: userTable.defaultHospitalId,
    })
    .from(userTable)
    .orderBy(userTable.createdAt);
    
    if (users.length === 0) {

      return;
    }

    for (const [index, user] of users.entries()) {

      // Check for healthcare profile
      if (['nurse', 'doctor', 'head_doctor', 'head_nurse'].includes(user.role || '')) {
        const healthcareProfiles = await db.select().from(healthcareUsers)
          .where(eq(healthcareUsers.userId, user.id))
          .limit(1);
        
        const healthcareProfile = healthcareProfiles[0];
        
        if (healthcareProfile) {

        }
      }

    }
  } catch (error) {
    console.error(chalk.red('❌ Error listing users:'), error);
  }
}

async function verifyUser(email: string) {

  try {
    // Get user with all related data
    const userData = await db.select()
      .from(userTable)
      .where(eq(userTable.email, email))
      .limit(1);
    
    if (userData.length === 0) {

      return;
    }
    
    const user = userData[0];

    // Check organization membership
    const orgMemberships = await db.query.organizationMember.findMany({
      where: eq(organizationMember.userId, user.id),
      with: {
        organization: true,
      },
    });
    
    if (orgMemberships.length > 0) {

      orgMemberships.forEach(membership => {

      });
    }
    
    // Check healthcare profile
    if (['nurse', 'doctor', 'head_doctor', 'head_nurse'].includes(user.role || '')) {
      const healthcareProfile = await db.query.healthcareUsers.findFirst({
        where: eq(healthcareUsers.userId, user.id),
      });
      
      if (healthcareProfile) {

        // Check hospital
        const hospitalData = await db.query.hospitals.findFirst({
          where: eq(hospitals.id, healthcareProfile.hospitalId),
        });
        
        if (hospitalData) {

        }
      }
    }
    
    // Check what user can access

    const role = user.role || 'user';
    const permissions = {
      nurse: ['View alerts', 'Acknowledge alerts', 'Create basic alerts'],
      doctor: ['View alerts', 'Acknowledge alerts', 'Create medical alerts', 'Escalate alerts'],
      head_doctor: ['All doctor permissions', 'Override alerts', 'View analytics'],
      operator: ['Create all alerts', 'View all alerts', 'Basic analytics'],
      admin: ['Full system access', 'User management', 'System configuration'],
    };
    
    const userPermissions = permissions[role as keyof typeof permissions] || ['Basic access'];
    userPermissions.forEach(perm => {

    });
    
    // Check active alerts if healthcare role
    if (['nurse', 'doctor', 'head_doctor', 'operator'].includes(role)) {
      const alertCount = await db.execute(
        sql`SELECT COUNT(*) as count FROM alerts WHERE status = 'active' AND hospital_id = ${user.defaultHospitalId || 'none'}`
      );

    }
    
  } catch (error) {
    console.error(chalk.red('❌ Error verifying user:'), error);
  }
}

async function updateUserRole(email: string, newRole: string) {

  try {
    const result = await db.update(userTable)
      .set({ role: newRole as any })
      .where(eq(userTable.email, email))
      .returning();
    
    if (result.length > 0) {

      // If changing to/from healthcare role, handle healthcare profile
      const healthcareRoles = ['nurse', 'doctor', 'head_doctor', 'head_nurse'];
      const user = result[0];
      
      if (healthcareRoles.includes(newRole) && !healthcareRoles.includes(result[0].role || '')) {
        // Create healthcare profile

        await db.insert(healthcareUsers).values({
          userId: user.id,
          hospitalId: user.defaultHospitalId || 'default-hospital',
          department: DEPARTMENTS[newRole as keyof typeof DEPARTMENTS]?.[0] || 'General',
          licenseNumber: `${newRole.toUpperCase()}-${Date.now()}`,
          isOnDuty: false,
        });

      } else if (!healthcareRoles.includes(newRole) && healthcareRoles.includes(result[0].role || '')) {
        // Remove healthcare profile

        await db.delete(healthcareUsers).where(eq(healthcareUsers.userId, user.id));

      }
    } else {

    }
  } catch (error) {
    console.error(chalk.red(`❌ Error updating user:`), error);
  }
}

async function deleteUser(email: string) {

  try {
    // Get user first
    const userData = await db.select().from(userTable).where(eq(userTable.email, email)).limit(1);
    
    if (userData.length === 0) {

      return;
    }
    
    const user = userData[0];
    
    // Delete in order: healthcare profile, organization memberships, accounts, then user
    if (['nurse', 'doctor', 'head_doctor', 'head_nurse'].includes(user.role || '')) {
      await db.delete(healthcareUsers).where(eq(healthcareUsers.userId, user.id));

    }
    
    await db.delete(organizationMember).where(eq(organizationMember.userId, user.id));

    await db.delete(account).where(eq(account.userId, user.id));

    await db.delete(userTable).where(eq(userTable.email, email));

  } catch (error) {
    console.error(chalk.red(`❌ Error deleting user:`), error);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const action = args[0] as UserAction['action'];
  
  if (!action) {

    process.exit(1);
  }
  
  const useApi = args.includes('--api');
  const complete = args.includes('--complete');
  
  switch (action) {
    case 'setup-demo':
      await setupDemoUsers(useApi, complete);
      break;
      
    case 'setup-healthcare':
      await setupDemoUsers(false, true); // Always use direct mode with complete setup
      break;
      
    case 'setup-mvp':
      await setupMvpUsers();
      break;
      
    case 'create':
      const email = args[1];
      if (!email) {
        console.error(chalk.red('❌ Email is required for create action'));
        process.exit(1);
      }
      
      const userData: HealthcareUserData = {
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
        console.error(chalk.red('❌ Email and role are required for update action'));
        process.exit(1);
      }
      
      await updateUserRole(updateEmail, newRole);
      break;
      
    case 'delete':
      const deleteEmail = args[1];
      
      if (!deleteEmail) {
        console.error(chalk.red('❌ Email is required for delete action'));
        process.exit(1);
      }
      
      await deleteUser(deleteEmail);
      break;
      
    case 'list':
      await listUsers();
      break;
      
    case 'verify':
      const verifyEmail = args[1];
      
      if (!verifyEmail) {
        console.error(chalk.red('❌ Email is required for verify action'));
        process.exit(1);
      }
      
      await verifyUser(verifyEmail);
      break;
      
    default:
      console.error(chalk.red(`❌ Unknown action: ${action}`));
      process.exit(1);
  }
}

initScript(
  {
    name: 'Enhanced User Management',
    description: 'Create, update, and manage test users with full healthcare support',
    requiresDatabase: true,
  },
  main
);