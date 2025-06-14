#!/usr/bin/env bun
/**
 * Script to organize root directory for production readiness
 * Moves documentation files to appropriate locations
 */

import { promises as fs } from 'fs';
import path from 'path';

// Files to move to docs/archive/implementation
const IMPLEMENTATION_FILES = [
  'ALERT_ACKNOWLEDGMENT_IMPLEMENTATION.md',
  'ALERT_ACKNOWLEDGMENT_GUIDE.md',
  'ANIMATION_TESTING_SUMMARY.md',
  'E2E_TEST_IMPLEMENTATION_GUIDE.md',
  'FIXES_APPLIED_SUMMARY.md',
  'HARDCODED_COLORS_AUDIT.md',
  'HEALTHCARE_API_IMPLEMENTATION_COMPLETE.md',
  'HEALTHCARE_SETUP_SUMMARY.md',
  'HOSPITAL_ALERT_AUDIT_REPORT.md',
  'HOSPITAL_ALERT_IMPLEMENTATION_PLAN.md',
  'HOSPITAL_MVP_COMPLETE.md',
  'IMPLEMENTATION_STATUS_AND_NEXT_STEPS.md',
  'LINT_PROGRESS_SUMMARY.md',
  'MIGRATION_CLEANUP_SUMMARY.md',
  'MIGRATION_COMPLETE.md',
  'NAVIGATION_ANIMATIONS_COMPLETE.md',
  'NAVIGATION_IMPLEMENTATION_STATUS.md',
  'NOTIFICATION_SERVICE_IMPLEMENTATION_PLAN.md',
  'RUNTIME_ERROR_FIXES_SUMMARY.md',
  'RUNTIME_FIXES_SUMMARY.md',
  'TESTING_SUMMARY.md',
  'TYPE_ERROR_FIXES_PLAN.md',
  'UNIVERSAL_COMPONENTS_STATUS.md',
];

// Files to move to docs/archive/project-status
const STATUS_FILES = [
  'PROJECT_STATUS_JAN_12_2025.md',
  'PROJECT_AUDIT_JAN_2025.md',
  'SPRINT_STATUS_UPDATE_JAN_12_2025.md',
  'TASK_MANAGER_UPDATE_JAN_2025.md',
  'DEVELOPMENT_PRIORITIES_JAN_2025.md',
  'NEXT_SPRINT_PLAN_JAN_2025.md',
  'THEME_CONSISTENCY_AUDIT_PLAN.md',
  'THEME_CONSISTENCY_AUDIT_PROGRESS.md',
];

// Files to move to docs/archive/guides
const GUIDE_FILES = [
  'CLAUDE_AGENT_SCRIPT_GUIDE.md',
  'E2E_TEST_PLAN_HEALTHCARE.md',
  'E2E_AUTH_TEST_PLAN.md',
  'E2E_TEST_RESULTS.md',
  'EXPO_GO_AUTH_GUIDE.md',
  'IOS_NAVIGATION_FIX.md',
  'OAUTH_LOCAL_SETUP.md',
  'OPTIMIZATION_GUIDE.md',
  'QUICK_START_NOTIFICATION_SERVICE.md',
  'SCRIPTS_GUIDE_UNIFIED.md',
  'SCRIPTS_GUIDE.md',
  'SPRINT_QUICK_REFERENCE.md',
];

// Files to move to docs/modules
const MODULE_FILES = [
  'HOSPITAL_ALERT_ARCHITECTURE.md',
  'HOSPITAL_ALERT_PRD.md',
  'HOSPITAL_ALERT_PROJECT_STRUCTURE.md',
  'HOSPITAL_ALERT_SCREENS_IMPLEMENTED.md',
  'HOSPITAL_ALERT_STARTUP_GUIDE.md',
  'HOSPITAL_MVP_STATUS.md',
  'HOSPITAL_MVP_TASK_PLAN.md',
  'MODULE_SPRINT_PLANNING.md',
  'MODULE_WORKFLOW_DOCUMENTATION.md',
  'NOTIFICATION_SYSTEM.md',
];

// Files to keep in root
const KEEP_IN_ROOT = [
  'README.md',
  'CHANGELOG.md',
  'LICENSE',
  'CONTRIBUTING.md',
  '.env.example',
  'package.json',
  'tsconfig.json',
  'app.json',
  'eas.json',
  'tailwind.config.ts',
  'drizzle.config.ts',
  'metro.config.js',
  'babel.config.js',
  'webpack.config.js',
  'jest.config.js',
];

// Config files to move
const CONFIG_FILES = [
  { from: 'babel-plugin-add-module-helpers.js', to: 'config/babel/' },
  { from: 'babel-plugin-transform-import-meta.js', to: 'config/babel/' },
  { from: 'jest.react-native-mock.js', to: 'config/jest/' },
  { from: 'jest.setup.js', to: 'config/jest/' },
  { from: 'web-overrides.js', to: 'config/webpack/' },
  { from: 'setup-babel-helpers.js', to: 'config/babel/' },
  { from: 'reanimated.config.js', to: 'config/' },
];

async function ensureDirectory(dir: string) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (error) {
    console.error(`Error creating directory ${dir}:`, error);
  }
}

async function moveFile(from: string, to: string) {
  try {
    await fs.rename(from, to);
// TODO: Replace with structured logging - console.log(`✓ Moved ${from} → ${to}`);
  } catch (error) {
    if ((error as any).code !== 'ENOENT') {
      console.error(`✗ Error moving ${from}:`, error);
    }
  }
}

async function main() {
// TODO: Replace with structured logging - console.log('🧹 Organizing root directory for production...\n');

  // Ensure directories exist
  await ensureDirectory('docs/archive/implementation');
  await ensureDirectory('docs/archive/project-status');
  await ensureDirectory('docs/archive/guides');
  await ensureDirectory('docs/modules');
  await ensureDirectory('docs/sprints/current');
  await ensureDirectory('docs/sprints/completed');
  await ensureDirectory('config/babel');
  await ensureDirectory('config/jest');
  await ensureDirectory('config/webpack');

  // Move implementation files
// TODO: Replace with structured logging - console.log('📦 Moving implementation files to archive...');
  for (const file of IMPLEMENTATION_FILES) {
    await moveFile(file, `docs/archive/implementation/${file}`);
  }

  // Move status files
// TODO: Replace with structured logging - console.log('\n📊 Moving status files to archive...');
  for (const file of STATUS_FILES) {
    await moveFile(file, `docs/archive/project-status/${file}`);
  }

  // Move guide files
// TODO: Replace with structured logging - console.log('\n📚 Moving guide files to archive...');
  for (const file of GUIDE_FILES) {
    await moveFile(file, `docs/archive/guides/${file}`);
  }

  // Move module files
// TODO: Replace with structured logging - console.log('\n🏥 Moving module documentation...');
  for (const file of MODULE_FILES) {
    await moveFile(file, `docs/modules/${file}`);
  }

  // Move config files
// TODO: Replace with structured logging - console.log('\n⚙️  Moving config files...');
  for (const config of CONFIG_FILES) {
    await moveFile(config.from, path.join(config.to, config.from));
  }

  // List remaining .md files in root
// TODO: Replace with structured logging - console.log('\n📄 Remaining .md files in root:');
  const files = await fs.readdir('.');
  const mdFiles = files.filter(f => f.endsWith('.md') && !KEEP_IN_ROOT.includes(f));
  
  if (mdFiles.length > 0) {
// TODO: Replace with structured logging - console.log('Consider moving these files:');
// TODO: Replace with structured logging - mdFiles.forEach(file => console.log(`  - ${file}`));
  } else {
// TODO: Replace with structured logging - console.log('✅ Root directory is clean!');
  }

// TODO: Replace with structured logging - console.log('\n✨ Organization complete!');
}

main().catch(console.error);