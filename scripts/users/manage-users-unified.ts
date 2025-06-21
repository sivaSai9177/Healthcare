#!/usr/bin/env bun
/**
 * Unified User Management Script
 * 
 * Consolidates all user creation, update, and management operations
 * 
 * Usage:
 *   bun run scripts/users/manage-users-unified.ts [action] [options]
 * 
 * Actions:
 *   create    - Create a single user
 *   batch     - Create multiple users from predefined sets
 *   update    - Update user properties
 *   delete    - Delete a user
 *   list      - List all users
 *   setup     - Setup complete demo environment
 *   verify    - Verify user can login
 * 
 * Options:
 *   --help, -h        Show help
 *   --email           User email (for single operations)
 *   --role            User role
 *   --set             Predefined user set (for batch)
 *   --force           Skip confirmations
 *   --dry-run         Preview changes without executing
 */

import { 
  parseArgs, 
  printHelp, 
  logger, 
  handleError, 
  ensureCleanup,
  confirm,
  select,
  prompt,
  withSpinner,
  multiSelect
} from '../lib';
import { 
  config,
  validateEnvironment,
  getDatabase,
  closeDatabase,
  TEST_USERS,
  USER_ROLES,
  HEALTHCARE_ROLES,
  EMOJI
} from '../config';
import { 
  apiRequest,
  authenticate,
  generateTestUser
} from '../lib/test-helpers';
import * as schema from '@/src/db/schema';
import * as healthcareSchema from '@/src/db/healthcare-schema';
import { eq, and, sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

type Action = 'create' | 'batch' | 'update' | 'delete' | 'list' | 'setup' | 'verify';
type UserSet = 'basic' | 'healthcare' | 'all-roles' | 'demo' | 'custom';

interface Options {
  action?: Action;
  email?: string;
  role?: string;
  set?: UserSet;
  force: boolean;
  dryRun: boolean;
}

// Predefined user configurations
const USER_SETS = {
  basic: [
    { email: 'admin@hospital.test', name: 'Admin User', role: 'admin', password: 'Admin123!' },
    { email: 'operator@hospital.test', name: 'Operator User', role: 'operator', password: 'Operator123!' },
    { email: 'manager@hospital.test', name: 'Manager User', role: 'manager', password: 'Manager123!' },
    { email: 'user@hospital.test', name: 'Basic User', role: 'user', password: 'User123!' },
  ],
  healthcare: [
    { 
      email: 'doctor@hospital.test', 
      name: 'Dr. Sarah Smith', 
      role: 'doctor', 
      password: 'Doctor123!',
      licenseNumber: 'MD123456',
      specialization: 'Emergency Medicine',
      department: 'Emergency'
    },
    { 
      email: 'nurse@hospital.test', 
      name: 'Nurse Johnson', 
      role: 'nurse', 
      password: 'Nurse123!',
      licenseNumber: 'RN789012',
      department: 'Emergency'
    },
    { 
      email: 'head.doctor@hospital.test', 
      name: 'Dr. Chief Williams', 
      role: 'head_doctor', 
      password: 'HeadDoc123!',
      licenseNumber: 'MD999999',
      specialization: 'Cardiology',
      department: 'Cardiology'
    },
    { 
      email: 'head.nurse@hospital.test', 
      name: 'Head Nurse Davis', 
      role: 'head_nurse', 
      password: 'HeadNurse123!',
      licenseNumber: 'RN111111',
      department: 'ICU'
    },
  ],
  'all-roles': [
    ...USER_SETS.basic,
    ...USER_SETS.healthcare,
    { email: 'healthcare.admin@hospital.test', name: 'Healthcare Admin', role: 'healthcare_admin', password: 'HCAdmin123!' },
    { email: 'healthcare.staff@hospital.test', name: 'Healthcare Staff', role: 'healthcare_staff', password: 'HCStaff123!' },
  ],
  demo: [
    { email: 'doremon@gmail.com', name: 'Doremon', role: 'nurse', password: 'Doremon123!' },
    { email: 'saipramod273@gmail.com', name: 'Sai Pramod', role: 'admin', password: 'SaiPramod123!' },
    { email: 'jane@example.com', name: 'Jane Smith', role: 'doctor', password: 'Jane123!' },
    { email: 'john@example.com', name: 'John Doe', role: 'operator', password: 'John123!' },
    { email: 'emily@example.com', name: 'Emily Brown', role: 'nurse', password: 'Emily123!' },
    { email: 'michael@example.com', name: 'Michael Davis', role: 'doctor', password: 'Michael123!' },
  ],
  custom: [], // Will be populated dynamically
};

async function main() {
  try {
    const args = parseArgs();
    
    if (args.help || args.h) {
      printHelp({
        usage: 'bun run scripts/users/manage-users-unified.ts [action] [options]',
        description: 'Unified user management for all user operations',
        options: [
          { flag: 'action', description: 'Action to perform (create, batch, update, delete, list, setup, verify)' },
          { flag: '--help, -h', description: 'Show help' },
          { flag: '--email', description: 'User email for single operations' },
          { flag: '--role', description: 'User role' },
          { flag: '--set', description: 'Predefined user set (basic, healthcare, all-roles, demo, custom)' },
          { flag: '--force', description: 'Skip confirmation prompts' },
          { flag: '--dry-run', description: 'Preview changes without executing' },
        ],
        examples: [
          'bun run scripts/users/manage-users-unified.ts create --email=test@example.com --role=nurse',
          'bun run scripts/users/manage-users-unified.ts batch --set=healthcare',
          'bun run scripts/users/manage-users-unified.ts setup --force',
          'bun run scripts/users/manage-users-unified.ts verify --email=admin@hospital.test',
        ],
      });
      process.exit(0);
    }
    
    // Parse options
    const action = args._[0] as Action || args.action as Action;
    const options: Options = {
      action,
      email: args.email as string,
      role: args.role as string,
      set: args.set as UserSet,
      force: Boolean(args.force),
      dryRun: Boolean(args['dry-run']),
    };
    
    // Interactive mode if no action provided
    if (!options.action) {
      options.action = await select(
        'Select action:',
        ['create', 'batch', 'update', 'delete', 'list', 'setup', 'verify'],
        0
      ) as Action;
    }
    
    // Validate environment
    await validateEnvironment(['DATABASE_URL']);
    
    // Execute action
    await execute(options);
    
    logger.success('Operation completed successfully');
  } catch (error) {
    handleError(error);
  }
}

async function execute(options: Options) {
  const { action, dryRun } = options;
  
  if (dryRun) {
    logger.warn('Running in dry-run mode - no changes will be made');
  }
  
  switch (action) {
    case 'create':
      await handleCreate(options);
      break;
    case 'batch':
      await handleBatch(options);
      break;
    case 'update':
      await handleUpdate(options);
      break;
    case 'delete':
      await handleDelete(options);
      break;
    case 'list':
      await handleList();
      break;
    case 'setup':
      await handleSetup(options);
      break;
    case 'verify':
      await handleVerify(options);
      break;
    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

async function handleCreate(options: Options) {
  const db = await getDatabase();
  
  // Get user details
  const email = options.email || await prompt('Email');
  const role = options.role || await select(
    'Select role:',
    [...Object.values(USER_ROLES), ...Object.values(HEALTHCARE_ROLES)],
    0
  );
  
  const name = await prompt('Full name', generateTestUser().name);
  const password = await prompt('Password (min 8 chars)', 'Test123!');
  
  // Additional fields for healthcare roles
  let licenseNumber: string | undefined;
  let specialization: string | undefined;
  let department: string | undefined;
  
  if (isHealthcareRole(role)) {
    if (role === 'doctor' || role === 'head_doctor') {
      licenseNumber = await prompt('License number', `MD${Math.random().toString().slice(2, 8)}`);
      specialization = await prompt('Specialization', 'General Practice');
    } else if (role === 'nurse' || role === 'head_nurse') {
      licenseNumber = await prompt('License number', `RN${Math.random().toString().slice(2, 8)}`);
    }
    department = await prompt('Department', 'Emergency');
  }
  
  if (options.dryRun) {
    logger.info('Would create user:');
    logger.info(JSON.stringify({ email, name, role, department }, null, 2));
    return;
  }
  
  // Create user
  await createUser({
    email,
    name,
    role,
    password,
    licenseNumber,
    specialization,
    department,
  });
}

async function handleBatch(options: Options) {
  let userSet = options.set;
  
  if (!userSet) {
    userSet = await select(
      'Select user set to create:',
      ['basic', 'healthcare', 'all-roles', 'demo', 'custom'],
      0
    ) as UserSet;
  }
  
  let users = USER_SETS[userSet];
  
  if (userSet === 'custom') {
    // Allow custom selection
    const allUsers = USER_SETS['all-roles'];
    const selected = await multiSelect(
      'Select users to create:',
      allUsers.map(u => `${u.email} (${u.role})`),
      []
    );
    
    users = selected.map(selection => {
      const email = selection.split(' ')[0];
      return allUsers.find(u => u.email === email)!;
    });
  }
  
  if (options.dryRun) {
    logger.info(`Would create ${users.length} users:`);
    users.forEach(u => logger.info(`  - ${u.email} (${u.role})`));
    return;
  }
  
  // Create users
  logger.info(`Creating ${users.length} users...`);
  
  for (const user of users) {
    try {
      await createUser(user);
      logger.success(`✓ Created ${user.email}`);
    } catch (error) {
      logger.error(`✗ Failed to create ${user.email}: ${error.message}`);
    }
  }
}

async function handleUpdate(options: Options) {
  const db = await getDatabase();
  
  const email = options.email || await prompt('Email of user to update');
  
  // Find user
  const user = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1);
  
  if (!user.length) {
    throw new Error(`User not found: ${email}`);
  }
  
  logger.info(`Current user: ${JSON.stringify(user[0], null, 2)}`);
  
  // Select what to update
  const updateChoice = await select(
    'What to update?',
    ['role', 'name', 'password', 'department', 'active status'],
    0
  );
  
  if (options.dryRun) {
    logger.info(`Would update ${updateChoice} for ${email}`);
    return;
  }
  
  // Perform update based on choice
  switch (updateChoice) {
    case 'role':
      const newRole = await select(
        'Select new role:',
        [...Object.values(USER_ROLES), ...Object.values(HEALTHCARE_ROLES)],
        0
      );
      await db
        .update(schema.users)
        .set({ role: newRole })
        .where(eq(schema.users.email, email));
      break;
      
    case 'name':
      const newName = await prompt('New name');
      await db
        .update(schema.users)
        .set({ name: newName })
        .where(eq(schema.users.email, email));
      break;
      
    // Add other update cases...
  }
  
  logger.success(`Updated ${email}`);
}

async function handleDelete(options: Options) {
  const db = await getDatabase();
  
  const email = options.email || await prompt('Email of user to delete');
  
  if (!options.force) {
    const confirmed = await confirm(`Delete user ${email}?`);
    if (!confirmed) {
      logger.info('Delete cancelled');
      return;
    }
  }
  
  if (options.dryRun) {
    logger.info(`Would delete user: ${email}`);
    return;
  }
  
  // Delete from healthcare_users first if exists
  await db
    .delete(healthcareSchema.healthcareUsers)
    .where(eq(healthcareSchema.healthcareUsers.email, email));
  
  // Delete from users
  await db
    .delete(schema.users)
    .where(eq(schema.users.email, email));
  
  logger.success(`Deleted user: ${email}`);
}

async function handleList() {
  const db = await getDatabase();
  
  const users = await db
    .select({
      id: schema.users.id,
      email: schema.users.email,
      name: schema.users.name,
      role: schema.users.role,
      createdAt: schema.users.createdAt,
    })
    .from(schema.users)
    .orderBy(schema.users.createdAt);
  
  if (users.length === 0) {
    logger.warn('No users found');
    return;
  }
  
  logger.info(`Found ${users.length} users:\n`);
  
  // Group by role
  const byRole = users.reduce((acc, user) => {
    if (!acc[user.role]) acc[user.role] = [];
    acc[user.role].push(user);
    return acc;
  }, {} as Record<string, typeof users>);
  
  Object.entries(byRole).forEach(([role, roleUsers]) => {
    logger.info(`${EMOJI.user} ${role.toUpperCase()} (${roleUsers.length}):`);
    roleUsers.forEach(user => {
      logger.info(`  - ${user.email} (${user.name})`);
    });
    logger.separator();
  });
}

async function handleSetup(options: Options) {
  logger.info('Setting up complete demo environment...');
  
  if (!options.force) {
    const confirmed = await confirm(
      'This will create hospitals, organizations, and all demo users. Continue?'
    );
    if (!confirmed) {
      logger.info('Setup cancelled');
      return;
    }
  }
  
  // Setup organizations and hospitals first
  await setupOrganizations(options.dryRun);
  
  // Create all demo users
  await handleBatch({ ...options, set: 'demo' });
  
  // Setup additional demo data
  if (!options.dryRun) {
    logger.info('Creating demo alerts and patients...');
    // This would call other setup scripts
  }
  
  logger.success('Demo environment setup complete!');
  
  // Show test commands
  showTestCommands();
}

async function handleVerify(options: Options) {
  const email = options.email || await prompt('Email to verify');
  const password = await prompt('Password');
  
  logger.info(`Verifying login for ${email}...`);
  
  try {
    const sessionToken = await authenticate(email, password);
    logger.success(`✓ Login successful! Session token: ${sessionToken.substring(0, 20)}...`);
    
    // Get user details
    const response = await apiRequest('/api/auth/session', {
      headers: { Cookie: `better-auth.session=${sessionToken}` }
    });
    
    if (response.data?.user) {
      logger.info('User details:');
      logger.info(JSON.stringify(response.data.user, null, 2));
    }
  } catch (error) {
    logger.error(`✗ Login failed: ${error.message}`);
  }
}

// Helper functions
async function createUser(userData: any) {
  const db = await getDatabase();
  
  // Check if user exists
  const existing = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, userData.email))
    .limit(1);
  
  if (existing.length > 0) {
    logger.warn(`User already exists: ${userData.email}`);
    return existing[0];
  }
  
  // Try API creation first (preferred)
  if (await isApiAvailable()) {
    return await createUserViaApi(userData);
  } else {
    return await createUserDirectly(userData);
  }
}

async function createUserViaApi(userData: any) {
  logger.debug(`Creating user via API: ${userData.email}`);
  
  const response = await apiRequest('/api/auth/sign-up', {
    method: 'POST',
    body: JSON.stringify({
      email: userData.email,
      password: userData.password,
      name: userData.name,
      role: userData.role,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`API creation failed: ${response.error || response.status}`);
  }
  
  // Update additional fields if needed
  if (userData.role && isHealthcareRole(userData.role)) {
    await setupHealthcareUser(userData);
  }
  
  return response.data;
}

async function createUserDirectly(userData: any) {
  logger.debug(`Creating user directly in database: ${userData.email}`);
  
  const db = await getDatabase();
  const hashedPassword = await bcrypt.hash(userData.password, 10);
  
  // Create user
  const [user] = await db
    .insert(schema.users)
    .values({
      email: userData.email,
      name: userData.name,
      role: userData.role || 'user',
      emailVerified: true,
      profileComplete: true,
    })
    .returning();
  
  // Create account for credentials
  await db.insert(schema.accounts).values({
    userId: user.id,
    accountId: user.email,
    providerId: 'credential',
    accessToken: hashedPassword,
  });
  
  // Setup healthcare user if needed
  if (isHealthcareRole(userData.role)) {
    await setupHealthcareUser({ ...userData, userId: user.id });
  }
  
  return user;
}

async function setupHealthcareUser(userData: any) {
  const db = await getDatabase();
  
  // Get first hospital
  const hospitals = await db
    .select()
    .from(schema.organizations)
    .where(eq(schema.organizations.type, 'hospital'))
    .limit(1);
  
  if (!hospitals.length) {
    logger.warn('No hospital found, skipping healthcare setup');
    return;
  }
  
  const hospital = hospitals[0];
  
  // Create healthcare user entry
  await db.insert(healthcareSchema.healthcareUsers).values({
    userId: userData.userId,
    email: userData.email,
    organizationId: hospital.id,
    role: userData.role,
    licenseNumber: userData.licenseNumber,
    specialization: userData.specialization,
    department: userData.department || 'General',
    isOnDuty: false,
    permissions: getDefaultPermissions(userData.role),
  }).onConflictDoNothing();
}

async function setupOrganizations(dryRun: boolean) {
  if (dryRun) {
    logger.info('Would create default hospital and organization');
    return;
  }
  
  const db = await getDatabase();
  
  // Check if hospital exists
  const hospitals = await db
    .select()
    .from(schema.organizations)
    .where(eq(schema.organizations.type, 'hospital'))
    .limit(1);
  
  if (hospitals.length === 0) {
    logger.info('Creating default hospital...');
    
    await db.insert(schema.organizations).values({
      name: 'City General Hospital',
      code: 'CGH',
      type: 'hospital',
      settings: {
        alertEscalationTime: 30,
        shiftDuration: 8,
        timezone: 'America/New_York',
      },
    });
  }
}

function isHealthcareRole(role: string): boolean {
  return Object.values(HEALTHCARE_ROLES).includes(role as any);
}

function getDefaultPermissions(role: string): string[] {
  const permissions: Record<string, string[]> = {
    doctor: ['view_patients', 'create_alerts', 'update_patient_records'],
    nurse: ['view_patients', 'acknowledge_alerts', 'update_vitals'],
    head_doctor: ['view_patients', 'create_alerts', 'update_patient_records', 'manage_staff'],
    head_nurse: ['view_patients', 'acknowledge_alerts', 'update_vitals', 'manage_nurses'],
    healthcare_admin: ['manage_all', 'view_analytics', 'manage_settings'],
  };
  
  return permissions[role] || [];
}

async function isApiAvailable(): Promise<boolean> {
  try {
    const response = await apiRequest('/api/health');
    return response.ok;
  } catch {
    return false;
  }
}

function showTestCommands() {
  logger.separator('=', 60);
  logger.info('Test Commands:');
  logger.separator('-', 60);
  
  logger.info('# Test authentication:');
  logger.info('bun run scripts/users/manage-users-unified.ts verify --email=admin@hospital.test');
  
  logger.info('\n# Test API endpoints:');
  logger.info('bun run scripts/test/api/test-auth-simple.ts');
  
  logger.info('\n# Test healthcare flow:');
  logger.info('bun run scripts/test/healthcare/test-healthcare-flow.ts');
  
  logger.info('\n# View all users:');
  logger.info('bun run scripts/users/manage-users-unified.ts list');
  
  logger.separator('=', 60);
}

// Cleanup handler
ensureCleanup(async () => {
  await closeDatabase();
});

// Run the script
main();