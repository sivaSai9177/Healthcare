#!/usr/bin/env bun
/**
 * Unified Database Management Script
 * 
 * Consolidates all database operations: reset, migrate, backup, restore, health checks, fixes, and more
 * 
 * Usage:
 *   bun run scripts/database/manage-database-unified.ts [action] [options]
 * 
 * Actions:
 *   reset     - Reset database (drop all tables and recreate)
 *   migrate   - Run pending migrations
 *   push      - Push schema changes (development)
 *   backup    - Create database backup
 *   restore   - Restore from backup
 *   health    - Check database health
 *   info      - Show database information
 *   tables    - List all tables
 *   seed      - Seed demo data
 *   check     - Comprehensive table and schema checks
 *   fix       - Run specific fixes (hospital columns, user assignments, etc.)
 *   index     - Apply or rebuild indexes
 *   validate  - Validate schema integrity
 *   clean     - Clean orphaned data
 * 
 * Options:
 *   --help, -h             Show help
 *   --env                  Target environment (local, development, staging)
 *   --force                Skip confirmations
 *   --dry-run              Preview changes
 *   --file                 Backup/restore file path
 *   --schema               Include schema in backup
 *   --filter               Filter tables by pattern
 *   --fix-hospital-columns Fix hospital column types
 *   --fix-user-assignments Fix user hospital assignments
 *   --fix-organization-ids Fix organization ID references
 *   --healthcare           Include healthcare-specific data in seed
 */

import { 
  parseArgs, 
  printHelp, 
  logger, 
  handleError, 
  ensureCleanup,
  confirm,
  select,
  withSpinner,
  prompt
} from '../lib';
import { 
  config,
  validateEnvironment,
  getDatabase,
  closeDatabase,
  waitForDatabase,
  getDatabaseInfo,
  checkTables,
  resetDatabase,
  runMigrations,
  transaction
} from '../config';
import {
  checkDocker,
  stopServices,
  startServices,
  execInContainer
} from '../lib/docker-utils';
import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

type Action = 'reset' | 'migrate' | 'push' | 'backup' | 'restore' | 'health' | 'info' | 'tables' | 'seed' | 'check' | 'fix' | 'index' | 'validate' | 'clean';

interface Options {
  action?: Action;
  env?: string;
  force: boolean;
  dryRun: boolean;
  file?: string;
  schema: boolean;
  filter?: string;
  fixHospitalColumns?: boolean;
  fixUserAssignments?: boolean;
  fixOrganizationIds?: boolean;
  healthcare?: boolean;
}

async function main() {
  try {
    const args = parseArgs();
    
    if (args.help || args.h) {
      printHelp({
        usage: 'bun run scripts/database/manage-database-unified.ts [action] [options]',
        description: 'Unified database management for all database operations',
        options: [
          { flag: 'action', description: 'Action to perform' },
          { flag: '--help, -h', description: 'Show help' },
          { flag: '--env', description: 'Target environment', default: config.APP_ENV },
          { flag: '--force', description: 'Skip confirmations' },
          { flag: '--dry-run', description: 'Preview changes' },
          { flag: '--file', description: 'Backup/restore file path' },
          { flag: '--schema', description: 'Include schema in backup' },
          { flag: '--filter', description: 'Filter tables by pattern' },
          { flag: '--fix-hospital-columns', description: 'Fix hospital column types' },
          { flag: '--fix-user-assignments', description: 'Fix user hospital assignments' },
          { flag: '--fix-organization-ids', description: 'Fix organization ID references' },
          { flag: '--healthcare', description: 'Include healthcare-specific data in seed' },
        ],
        examples: [
          'bun run scripts/database/manage-database-unified.ts reset --env=local',
          'bun run scripts/database/manage-database-unified.ts migrate --dry-run',
          'bun run scripts/database/manage-database-unified.ts backup --schema',
          'bun run scripts/database/manage-database-unified.ts health',
          'bun run scripts/database/manage-database-unified.ts fix --fix-hospital-columns',
          'bun run scripts/database/manage-database-unified.ts check --filter=healthcare',
          'bun run scripts/database/manage-database-unified.ts index --dry-run',
        ],
      });
      process.exit(0);
    }
    
    // Parse options
    const action = args._[0] as Action || args.action as Action;
    const options: Options = {
      action,
      env: args.env as string || config.APP_ENV,
      force: Boolean(args.force),
      dryRun: Boolean(args['dry-run']),
      file: args.file as string,
      schema: Boolean(args.schema),
      filter: args.filter as string,
      fixHospitalColumns: Boolean(args['fix-hospital-columns']),
      fixUserAssignments: Boolean(args['fix-user-assignments']),
      fixOrganizationIds: Boolean(args['fix-organization-ids']),
      healthcare: Boolean(args.healthcare),
    };
    
    // Interactive mode if no action
    if (!options.action) {
      options.action = await select(
        'Select database action:',
        ['reset', 'migrate', 'push', 'backup', 'restore', 'health', 'info', 'tables', 'seed', 'check', 'fix', 'index', 'validate', 'clean'],
        0
      ) as Action;
    }
    
    // Validate environment
    await validateEnvironment(['DATABASE_URL']);
    
    // Execute action
    await execute(options);
    
    logger.success('Database operation completed successfully');
  } catch (error) {
    handleError(error);
  }
}

async function execute(options: Options) {
  const { action, env, dryRun } = options;
  
  // Show current environment
  logger.box(`Database Management\n\nEnvironment: ${env}\nDatabase: ${config.databaseUrl}`);
  
  if (dryRun) {
    logger.warn('Running in dry-run mode - no changes will be made');
  }
  
  switch (action) {
    case 'reset':
      await handleReset(options);
      break;
    case 'migrate':
      await handleMigrate(options);
      break;
    case 'push':
      await handlePush(options);
      break;
    case 'backup':
      await handleBackup(options);
      break;
    case 'restore':
      await handleRestore(options);
      break;
    case 'health':
      await handleHealth();
      break;
    case 'info':
      await handleInfo();
      break;
    case 'tables':
      await handleTables();
      break;
    case 'seed':
      await handleSeed(options);
      break;
    case 'check':
      await handleCheck(options);
      break;
    case 'fix':
      await handleFix(options);
      break;
    case 'index':
      await handleIndex(options);
      break;
    case 'validate':
      await handleValidate(options);
      break;
    case 'clean':
      await handleClean(options);
      break;
    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

async function handleReset(options: Options) {
  const { env, force, dryRun } = options;
  
  // Safety check for production
  if (['staging', 'production'].includes(env!) && !force) {
    logger.error(`⚠️  WARNING: This will reset the ${env?.toUpperCase()} database!`);
    logger.error('All data will be permanently deleted.');
    
    const confirmText = await prompt(
      `Type "${env}" to confirm`
    );
    
    if (confirmText !== env) {
      logger.info('Reset cancelled');
      process.exit(0);
    }
  }
  
  if (dryRun) {
    await previewReset();
    return;
  }
  
  // Execute reset based on environment
  if (env === 'local') {
    await resetLocalDatabase();
  } else {
    await resetCloudDatabase();
  }
  
  // Optionally seed data
  if (!['staging', 'production'].includes(env!)) {
    const shouldSeed = await confirm('Seed demo data?');
    if (shouldSeed) {
      await handleSeed(options);
    }
  }
}

async function previewReset() {
  await waitForDatabase();
  const tables = await checkTables();
  const dbInfo = await getDatabaseInfo();
  
  logger.info('Database reset preview:');
  logger.info(`  Current size: ${dbInfo.size}`);
  logger.info(`  Tables to drop: ${tables.length}`);
  
  if (tables.length > 0) {
    logger.separator();
    logger.info('Tables:');
    tables.forEach(table => logger.info(`  - ${table}`));
  }
}

async function resetLocalDatabase() {
  logger.info('📦 Resetting local Docker database...');
  
  // Check Docker
  if (!await checkDocker()) {
    throw new Error('Docker is not running');
  }
  
  // Stop and remove containers
  await withSpinner('Stopping containers', async () => {
    await stopServices(['postgres', 'redis']);
    
    // Remove volumes
    try {
      execSync('docker volume rm myexpo_local_postgres_data myexpo_local_redis_data', {
        stdio: 'ignore'
      });
    } catch {
      // Volumes might not exist
    }
  });
  
  // Start fresh containers
  await withSpinner('Starting fresh containers', async () => {
    await startServices(['postgres', 'redis']);
  });
  
  // Wait for database
  await withSpinner('Waiting for database', async () => {
    await waitForDatabase();
  });
  
  // Run migrations
  await withSpinner('Running migrations', async () => {
    await runMigrations();
  });
}

async function resetCloudDatabase() {
  logger.info('☁️  Resetting cloud database...');
  
  await waitForDatabase();
  
  await withSpinner('Resetting database', async () => {
    await resetDatabase();
  });
  
  await withSpinner('Running migrations', async () => {
    await runMigrations();
  });
}

async function handleMigrate(options: Options) {
  const { dryRun } = options;
  
  if (dryRun) {
    logger.info('Would run migrations using drizzle-kit');
    return;
  }
  
  await withSpinner('Running migrations', async () => {
    execSync('bun drizzle-kit migrate', {
      stdio: 'inherit',
      env: {
        ...process.env,
        DATABASE_URL: config.databaseUrl
      }
    });
  });
}

async function handlePush(options: Options) {
  const { dryRun, force } = options;
  
  if (!force && config.isProduction) {
    throw new Error('Cannot push schema changes to production. Use migrations instead.');
  }
  
  if (dryRun) {
    logger.info('Would push schema changes using drizzle-kit push');
    return;
  }
  
  await withSpinner('Pushing schema changes', async () => {
    execSync('bun drizzle-kit push', {
      stdio: 'inherit',
      env: {
        ...process.env,
        DATABASE_URL: config.databaseUrl
      }
    });
  });
}

async function handleBackup(options: Options) {
  const { file, schema: includeSchema } = options;
  
  // Create backups directory
  const backupsDir = join(process.cwd(), 'backups');
  if (!existsSync(backupsDir)) {
    mkdirSync(backupsDir);
  }
  
  // Generate filename if not provided
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = file || join(backupsDir, `backup-${config.APP_ENV}-${timestamp}.sql`);
  
  logger.info(`Creating backup: ${filename}`);
  
  if (config.APP_ENV === 'local') {
    // Docker backup
    await withSpinner('Creating backup', async () => {
      const cmd = includeSchema
        ? 'pg_dump -U $POSTGRES_USER -d $POSTGRES_DB'
        : 'pg_dump -U $POSTGRES_USER -d $POSTGRES_DB --data-only';
      
      execSync(
        `docker exec myexpo-postgres-local ${cmd} > ${filename}`,
        { stdio: 'inherit' }
      );
    });
  } else {
    // Cloud backup using connection string
    await withSpinner('Creating backup', async () => {
      const cmd = includeSchema
        ? `pg_dump "${config.databaseUrl}"`
        : `pg_dump "${config.databaseUrl}" --data-only`;
      
      execSync(`${cmd} > ${filename}`, { stdio: 'inherit' });
    });
  }
  
  logger.success(`Backup created: ${filename}`);
}

async function handleRestore(options: Options) {
  const { file, force } = options;
  
  if (!file) {
    throw new Error('Backup file required for restore (--file=path/to/backup.sql)');
  }
  
  if (!existsSync(file)) {
    throw new Error(`Backup file not found: ${file}`);
  }
  
  if (!force) {
    logger.warn('⚠️  This will overwrite the current database!');
    const confirmed = await confirm('Continue with restore?');
    if (!confirmed) {
      logger.info('Restore cancelled');
      return;
    }
  }
  
  logger.info(`Restoring from: ${file}`);
  
  // Reset database first
  await handleReset({ ...options, force: true });
  
  if (config.APP_ENV === 'local') {
    // Docker restore
    await withSpinner('Restoring backup', async () => {
      execSync(
        `docker exec -i myexpo-postgres-local psql -U $POSTGRES_USER -d $POSTGRES_DB < ${file}`,
        { stdio: 'inherit' }
      );
    });
  } else {
    // Cloud restore
    await withSpinner('Restoring backup', async () => {
      execSync(`psql "${config.databaseUrl}" < ${file}`, { stdio: 'inherit' });
    });
  }
  
  logger.success('Database restored successfully');
}

async function handleHealth() {
  logger.info('Checking database health...');
  
  // Connection test
  const connected = await waitForDatabase(3, 1000).then(() => true).catch(() => false);
  
  if (!connected) {
    logger.error('❌ Cannot connect to database');
    process.exit(1);
  }
  
  // Get database info
  const dbInfo = await getDatabaseInfo();
  const tables = await checkTables();
  
  // Run health checks
  const checks = {
    connection: connected,
    tables: tables.length > 0,
    size: dbInfo.size,
    version: dbInfo.version,
  };
  
  // Display results
  logger.separator();
  logger.info('Health Check Results:');
  logger.info(`  Connection: ${checks.connection ? '✅ Connected' : '❌ Failed'}`);
  logger.info(`  Tables: ${checks.tables ? `✅ ${tables.length} tables` : '❌ No tables'}`);
  logger.info(`  Database Size: ${checks.size}`);
  logger.info(`  PostgreSQL Version: ${checks.version.split(' ')[1]}`);
  
  // Check for common issues
  if (!checks.tables) {
    logger.warn('\n⚠️  No tables found. Run migrations or push schema.');
  }
  
  const healthy = checks.connection && checks.tables;
  
  logger.separator();
  logger[healthy ? 'success' : 'error'](
    healthy ? '✅ Database is healthy' : '❌ Database has issues'
  );
  
  process.exit(healthy ? 0 : 1);
}

async function handleInfo() {
  await waitForDatabase();
  
  const dbInfo = await getDatabaseInfo();
  const tables = await checkTables();
  
  logger.box('Database Information');
  
  logger.info('Connection Details:');
  logger.info(`  Environment: ${config.APP_ENV}`);
  logger.info(`  Database: ${dbInfo.database}`);
  logger.info(`  User: ${dbInfo.user}`);
  logger.info(`  Size: ${dbInfo.size}`);
  logger.info(`  Version: ${dbInfo.version}`);
  
  logger.separator();
  logger.info('Schema Statistics:');
  logger.info(`  Total Tables: ${tables.length}`);
  
  // Count by prefix
  const prefixes = tables.reduce((acc, table) => {
    const prefix = table.split('_')[0];
    acc[prefix] = (acc[prefix] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  Object.entries(prefixes).forEach(([prefix, count]) => {
    logger.info(`  ${prefix}: ${count} tables`);
  });
}

async function handleTables() {
  await waitForDatabase();
  
  const tables = await checkTables();
  
  if (tables.length === 0) {
    logger.warn('No tables found in database');
    return;
  }
  
  logger.info(`Found ${tables.length} tables:\n`);
  
  // Group tables by prefix
  const grouped = tables.reduce((acc, table) => {
    const prefix = table.includes('_') ? table.split('_')[0] : 'other';
    if (!acc[prefix]) acc[prefix] = [];
    acc[prefix].push(table);
    return acc;
  }, {} as Record<string, string[]>);
  
  Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([prefix, tables]) => {
      logger.info(`${prefix}:`);
      tables.forEach(table => logger.info(`  - ${table}`));
    });
}

async function handleSeed(options: Options) {
  const { dryRun, healthcare } = options;
  
  if (dryRun) {
    logger.info('Would seed database with demo data');
    if (healthcare) {
      logger.info('Would include healthcare-specific data');
    }
    return;
  }
  
  logger.info('Seeding database with demo data...');
  
  // Import and run seed scripts
  await withSpinner('Creating demo organizations', async () => {
    const setupOrg = await import('../setup/healthcare/setup-healthcare-local');
    await setupOrg.setupOrganizations();
  });
  
  await withSpinner('Creating demo users', async () => {
    const manageUsers = await import('../users/manage-users-unified');
    await manageUsers.createDemoUsers();
  });
  
  if (healthcare) {
    await withSpinner('Creating healthcare demo data', async () => {
      const healthcareData = await import('../data/create-test-healthcare-data');
      await healthcareData.default();
    });
  }
  
  await withSpinner('Creating demo data', async () => {
    const seedData = await import('../data/seed-demo-data');
    await seedData.default();
  });
  
  logger.success('Demo data seeded successfully');
}

async function handleCheck(options: Options) {
  const { filter } = options;
  
  logger.info('Running comprehensive database checks...');
  
  await waitForDatabase();
  const db = await getDatabase();
  const { sql } = await import('drizzle-orm');
  
  // Check all tables
  const tables = await checkTables();
  const filteredTables = filter 
    ? tables.filter(t => t.includes(filter))
    : tables;
  
  logger.separator();
  logger.info(`Total tables: ${tables.length}`);
  if (filter) {
    logger.info(`Filtered tables (containing "${filter}"): ${filteredTables.length}`);
  }
  
  // Check for missing expected tables
  const expectedTables = [
    'user', 'session', 'account', 'verification',
    'organizations', 'organization_members',
    'hospitals', 'healthcare_users', 'patients',
    'alerts', 'alert_escalations', 'alert_acknowledgments'
  ];
  
  const missingTables = expectedTables.filter(t => !tables.includes(t));
  if (missingTables.length > 0) {
    logger.warn('\n⚠️  Missing expected tables:');
    missingTables.forEach(t => logger.warn(`  - ${t}`));
  }
  
  // Check table sizes
  logger.separator();
  logger.info('Table sizes:');
  for (const table of filteredTables) {
    try {
      const result = await db.execute(sql`
        SELECT COUNT(*) as count,
               pg_size_pretty(pg_total_relation_size(${sql.identifier(table)})) as size
        FROM ${sql.identifier(table)}
      `);
      const { count, size } = result.rows[0];
      logger.info(`  ${table}: ${count} rows (${size})`);
    } catch (error) {
      logger.error(`  ${table}: Error getting stats`);
    }
  }
  
  // Check indexes
  logger.separator();
  logger.info('Checking indexes...');
  const indexes = await db.execute(sql`
    SELECT 
      schemaname,
      tablename,
      indexname,
      indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
    ORDER BY tablename, indexname
  `);
  
  const indexCount = indexes.rows.reduce((acc, idx) => {
    const table = idx.tablename;
    acc[table] = (acc[table] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  Object.entries(indexCount)
    .filter(([table]) => !filter || table.includes(filter))
    .forEach(([table, count]) => {
      logger.info(`  ${table}: ${count} indexes`);
    });
}

async function handleFix(options: Options) {
  const { fixHospitalColumns, fixUserAssignments, fixOrganizationIds, dryRun } = options;
  
  if (!fixHospitalColumns && !fixUserAssignments && !fixOrganizationIds) {
    // Interactive mode
    const fixes = await select(
      'Select fix to apply:',
      [
        'Fix hospital column types',
        'Fix user hospital assignments',
        'Fix organization ID references',
        'Run all fixes'
      ],
      0
    );
    
    switch (fixes) {
      case 'Fix hospital column types':
        options.fixHospitalColumns = true;
        break;
      case 'Fix user hospital assignments':
        options.fixUserAssignments = true;
        break;
      case 'Fix organization ID references':
        options.fixOrganizationIds = true;
        break;
      case 'Run all fixes':
        options.fixHospitalColumns = true;
        options.fixUserAssignments = true;
        options.fixOrganizationIds = true;
        break;
    }
  }
  
  await waitForDatabase();
  const db = await getDatabase();
  const { sql } = await import('drizzle-orm');
  
  if (options.fixHospitalColumns) {
    await withSpinner('Fixing hospital column types', async () => {
      if (dryRun) {
        logger.info('Would fix hospital column types');
        return;
      }
      
      try {
        // Fix default_hospital_id column type
        await db.execute(sql`
          ALTER TABLE "user" 
          DROP COLUMN IF EXISTS "default_hospital_id"
        `);
        
        await db.execute(sql`
          ALTER TABLE "user" 
          ADD COLUMN "default_hospital_id" uuid
        `);
        
        await db.execute(sql`
          ALTER TABLE "user"
          ADD CONSTRAINT "user_default_hospital_id_fkey" 
          FOREIGN KEY ("default_hospital_id") 
          REFERENCES "hospitals"("id") 
          ON DELETE SET NULL
        `);
        
        logger.success('Fixed hospital column types');
      } catch (error) {
        logger.error('Failed to fix hospital columns:', error);
      }
    });
  }
  
  if (options.fixUserAssignments) {
    await withSpinner('Fixing user hospital assignments', async () => {
      if (dryRun) {
        logger.info('Would fix user hospital assignments');
        return;
      }
      
      try {
        // Update users with their healthcare_users hospital assignment
        const result = await db.execute(sql`
          UPDATE "user" 
          SET "default_hospital_id" = (
            SELECT hospital_id 
            FROM healthcare_users 
            WHERE healthcare_users.user_id = "user".id
            LIMIT 1
          )
          WHERE "default_hospital_id" IS NULL
          AND id IN (SELECT user_id FROM healthcare_users)
        `);
        
        logger.success(`Fixed ${result.count} user hospital assignments`);
      } catch (error) {
        logger.error('Failed to fix user assignments:', error);
      }
    });
  }
  
  if (options.fixOrganizationIds) {
    await withSpinner('Fixing organization ID references', async () => {
      if (dryRun) {
        logger.info('Would fix organization ID references');
        return;
      }
      
      try {
        // Fix hospitals without organization_id
        const result = await db.execute(sql`
          UPDATE hospitals
          SET organization_id = (
            SELECT id FROM organizations 
            WHERE name = 'Default Healthcare Organization'
            LIMIT 1
          )
          WHERE organization_id IS NULL
        `);
        
        logger.success(`Fixed ${result.count} hospital organization references`);
      } catch (error) {
        logger.error('Failed to fix organization IDs:', error);
      }
    });
  }
}

async function handleIndex(options: Options) {
  const { dryRun } = options;
  
  logger.info('Managing database indexes...');
  
  const indexes = [
    // Alerts table indexes
    `CREATE INDEX IF NOT EXISTS idx_alerts_hospital_status ON alerts(hospital_id, status)`,
    `CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_alerts_urgency_level ON alerts(urgency_level DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_alerts_next_escalation ON alerts(next_escalation_at) WHERE status = 'active'`,
    `CREATE INDEX IF NOT EXISTS idx_alerts_acknowledged_by ON alerts(acknowledged_by) WHERE acknowledged_by IS NOT NULL`,
    
    // Alert escalations indexes
    `CREATE INDEX IF NOT EXISTS idx_alert_escalations_alert_id ON alert_escalations(alert_id)`,
    `CREATE INDEX IF NOT EXISTS idx_alert_escalations_escalated_at ON alert_escalations(escalated_at DESC)`,
    
    // Alert acknowledgments indexes
    `CREATE INDEX IF NOT EXISTS idx_alert_acknowledgments_alert_id ON alert_acknowledgments(alert_id)`,
    `CREATE INDEX IF NOT EXISTS idx_alert_acknowledgments_user_id ON alert_acknowledgments(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_alert_acknowledgments_response_time ON alert_acknowledgments(response_time_seconds)`,
    
    // Healthcare audit logs indexes
    `CREATE INDEX IF NOT EXISTS idx_healthcare_audit_logs_user_timestamp ON healthcare_audit_logs(user_id, timestamp DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_healthcare_audit_logs_entity ON healthcare_audit_logs(entity_type, entity_id)`,
    
    // Healthcare users indexes
    `CREATE INDEX IF NOT EXISTS idx_healthcare_users_hospital_id ON healthcare_users(hospital_id)`,
    `CREATE INDEX IF NOT EXISTS idx_healthcare_users_on_duty ON healthcare_users(is_on_duty) WHERE is_on_duty = true`,
    
    // Users table indexes
    `CREATE INDEX IF NOT EXISTS idx_users_role ON users(role) WHERE role IN ('operator', 'doctor', 'nurse', 'head_doctor')`,
    `CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id) WHERE organization_id IS NOT NULL`,
  ];
  
  if (dryRun) {
    logger.info('Would create the following indexes:');
    indexes.forEach(idx => {
      const match = idx.match(/CREATE INDEX .* (\w+) ON/);
      if (match) {
        logger.info(`  - ${match[1]}`);
      }
    });
    return;
  }
  
  await waitForDatabase();
  const db = await getDatabase();
  const { sql } = await import('drizzle-orm');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const indexSql of indexes) {
    try {
      await db.execute(sql.raw(indexSql));
      successCount++;
    } catch (error) {
      errorCount++;
      logger.error(`Failed to create index: ${error.message}`);
    }
  }
  
  logger.success(`Created ${successCount} indexes, ${errorCount} errors`);
}

async function handleValidate(options: Options) {
  logger.info('Validating database schema integrity...');
  
  await waitForDatabase();
  const db = await getDatabase();
  const { sql } = await import('drizzle-orm');
  
  const validationResults = [];
  
  // Check foreign key constraints
  logger.info('\nChecking foreign key constraints...');
  const fkConstraints = await db.execute(sql`
    SELECT
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name,
      tc.constraint_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
    ORDER BY tc.table_name
  `);
  
  logger.info(`Found ${fkConstraints.rows.length} foreign key constraints`);
  
  // Check for orphaned records
  logger.info('\nChecking for orphaned records...');
  
  const orphanChecks = [
    {
      name: 'Healthcare users without valid user',
      query: db.execute(sql`
        SELECT COUNT(*) as count
        FROM healthcare_users hu
        LEFT JOIN "user" u ON hu.user_id = u.id
        WHERE u.id IS NULL
      `)
    },
    {
      name: 'Alerts without valid hospital',
      query: db.execute(sql`
        SELECT COUNT(*) as count
        FROM alerts a
        LEFT JOIN hospitals h ON a.hospital_id = h.id
        WHERE h.id IS NULL
      `)
    },
    {
      name: 'Organization members without valid user',
      query: db.execute(sql`
        SELECT COUNT(*) as count
        FROM organization_members om
        LEFT JOIN "user" u ON om.user_id = u.id
        WHERE u.id IS NULL
      `)
    }
  ];
  
  for (const check of orphanChecks) {
    try {
      const result = await check.query;
      const count = result.rows[0].count;
      if (count > 0) {
        logger.warn(`  ⚠️  ${check.name}: ${count} orphaned records`);
        validationResults.push({ issue: check.name, count });
      } else {
        logger.success(`  ✅ ${check.name}: No orphaned records`);
      }
    } catch (error) {
      logger.error(`  ❌ ${check.name}: Error checking`);
    }
  }
  
  // Check data types
  logger.info('\nChecking column data types...');
  const columnTypes = await db.execute(sql`
    SELECT 
      table_name,
      column_name,
      data_type,
      is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name IN ('user', 'hospitals', 'alerts', 'healthcare_users')
    ORDER BY table_name, column_name
  `);
  
  // Validate UUID columns
  const uuidColumns = columnTypes.rows.filter(c => 
    c.column_name.endsWith('_id') && c.data_type !== 'uuid'
  );
  
  if (uuidColumns.length > 0) {
    logger.warn('\n⚠️  Non-UUID ID columns found:');
    uuidColumns.forEach(c => {
      logger.warn(`  - ${c.table_name}.${c.column_name}: ${c.data_type}`);
    });
  }
  
  // Summary
  logger.separator();
  if (validationResults.length === 0 && uuidColumns.length === 0) {
    logger.success('✅ Database schema validation passed!');
  } else {
    logger.warn(`⚠️  Found ${validationResults.length + uuidColumns.length} issues`);
  }
}

async function handleClean(options: Options) {
  const { force, dryRun } = options;
  
  if (!force && !dryRun) {
    const confirmed = await confirm(
      'This will remove orphaned data. Are you sure?'
    );
    if (!confirmed) {
      logger.info('Clean operation cancelled');
      return;
    }
  }
  
  logger.info('Cleaning orphaned data...');
  
  await waitForDatabase();
  const db = await getDatabase();
  const { sql } = await import('drizzle-orm');
  
  const cleanupTasks = [
    {
      name: 'Remove sessions for deleted users',
      query: db.execute(sql`
        DELETE FROM session
        WHERE user_id NOT IN (SELECT id FROM "user")
      `)
    },
    {
      name: 'Remove healthcare_users for deleted users',
      query: db.execute(sql`
        DELETE FROM healthcare_users
        WHERE user_id NOT IN (SELECT id FROM "user")
      `)
    },
    {
      name: 'Remove organization members for deleted users',
      query: db.execute(sql`
        DELETE FROM organization_members
        WHERE user_id NOT IN (SELECT id FROM "user")
      `)
    },
    {
      name: 'Remove alerts for deleted hospitals',
      query: db.execute(sql`
        DELETE FROM alerts
        WHERE hospital_id NOT IN (SELECT id FROM hospitals)
      `)
    }
  ];
  
  for (const task of cleanupTasks) {
    try {
      if (dryRun) {
        // For dry run, we need to manually construct the count query
        const tableName = task.name.match(/Remove .* from (.*)/);
        const countResult = await task.query;
        const count = 0; // We'll use the query result instead
        const count = result[0]?.count || 0;
        logger.info(`Would remove ${count} records: ${task.name}`);
      } else {
        const result = await task.query;
        logger.success(`Removed ${result.count} records: ${task.name}`);
      }
    } catch (error) {
      logger.error(`Failed: ${task.name} - ${error.message}`);
    }
  }
  
  if (!dryRun) {
    // Vacuum tables to reclaim space
    logger.info('\nVacuuming tables...');
    try {
      await db.execute(sql`VACUUM ANALYZE`);
      logger.success('Vacuum completed');
    } catch (error) {
      logger.warn('Vacuum failed (this is normal in some environments)');
    }
  }
}

// Cleanup handler
ensureCleanup(async () => {
  await closeDatabase();
});

// Run the script
main();