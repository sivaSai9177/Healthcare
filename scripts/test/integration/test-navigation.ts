#!/usr/bin/env bun

/**
 * Test navigation paths after migration
 * This script verifies all route paths resolve correctly
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const appDir = join(__dirname, '..', 'app');

interface RouteTest {
  path: string;
  expectedFile: string;
  description: string;
}

const routeTests: RouteTest[] = [
  // Public routes
  {
    path: '/(public)/auth/login',
    expectedFile: 'app/(public)/auth/login.tsx',
    description: 'Login screen'
  },
  {
    path: '/(public)/auth/register',
    expectedFile: 'app/(public)/auth/register.tsx',
    description: 'Register screen'
  },
  {
    path: '/(public)/auth/forgot-password',
    expectedFile: 'app/(public)/auth/forgot-password.tsx',
    description: 'Forgot password screen'
  },
  {
    path: '/(public)/auth/verify-email',
    expectedFile: 'app/(public)/auth/verify-email.tsx',
    description: 'Email verification screen'
  },
  {
    path: '/(public)/auth/complete-profile',
    expectedFile: 'app/(public)/auth/complete-profile.tsx',
    description: 'Profile completion screen'
  },
  
  // App routes
  {
    path: '/(app)/(tabs)/home',
    expectedFile: 'app/(app)/(tabs)/home.tsx',
    description: 'Home tab screen'
  },
  {
    path: '/(app)/(tabs)/alerts',
    expectedFile: 'app/(app)/(tabs)/alerts.tsx',
    description: 'Alerts tab screen'
  },
  {
    path: '/(app)/(tabs)/patients',
    expectedFile: 'app/(app)/(tabs)/patients.tsx',
    description: 'Patients tab screen'
  },
  {
    path: '/(app)/(tabs)/settings',
    expectedFile: 'app/(app)/(tabs)/settings.tsx',
    description: 'Settings tab screen'
  },
  
  // Alert features
  {
    path: '/(app)/alerts/[id]',
    expectedFile: 'app/(app)/alerts/[id].tsx',
    description: 'Alert detail screen'
  },
  {
    path: '/(app)/alerts/history',
    expectedFile: 'app/(app)/alerts/history.tsx',
    description: 'Alert history screen'
  },
  {
    path: '/(app)/alerts/escalation-queue',
    expectedFile: 'app/(app)/alerts/escalation-queue.tsx',
    description: 'Escalation queue screen'
  },
  
  // Organization
  {
    path: '/(app)/organization/dashboard',
    expectedFile: 'app/(app)/organization/dashboard.tsx',
    description: 'Organization dashboard'
  },
  {
    path: '/(app)/organization/settings',
    expectedFile: 'app/(app)/organization/settings.tsx',
    description: 'Organization settings'
  },
  
  // Admin
  {
    path: '/(app)/admin/audit',
    expectedFile: 'app/(app)/admin/audit.tsx',
    description: 'Audit logs'
  },
  {
    path: '/(app)/admin/system',
    expectedFile: 'app/(app)/admin/system.tsx',
    description: 'System settings'
  },
  {
    path: '/(app)/admin/users',
    expectedFile: 'app/(app)/admin/users.tsx',
    description: 'User management'
  },
  {
    path: '/(app)/admin/organizations',
    expectedFile: 'app/(app)/admin/organizations.tsx',
    description: 'Organization management'
  },
  
  // Security
  {
    path: '/(app)/security/2fa',
    expectedFile: 'app/(app)/security/2fa.tsx',
    description: '2FA settings'
  },
  {
    path: '/(app)/security/change-password',
    expectedFile: 'app/(app)/security/change-password.tsx',
    description: 'Change password'
  },
  
  // Other features
  {
    path: '/(app)/shifts/handover',
    expectedFile: 'app/(app)/shifts/handover.tsx',
    description: 'Shift handover'
  },
  {
    path: '/(app)/profile',
    expectedFile: 'app/(app)/profile.tsx',
    description: 'User profile'
  },
  {
    path: '/(app)/support',
    expectedFile: 'app/(app)/support.tsx',
    description: 'Support screen'
  },
  
  // Modals
  {
    path: '/(modals)/create-alert',
    expectedFile: 'app/(modals)/create-alert.tsx',
    description: 'Create alert modal'
  },
  {
    path: '/(modals)/escalation-details',
    expectedFile: 'app/(modals)/escalation-details.tsx',
    description: 'Escalation details modal'
  }
];

let passCount = 0;
let failCount = 0;

for (const test of routeTests) {
  const filePath = join(__dirname, '..', test.expectedFile);
  const exists = fs.existsSync(filePath);
  
  if (exists) {

    passCount++;
  } else {

    failCount++;
  }
}

if (failCount > 0) {

} else {

}

// Check for old route references

const oldRoutePatterns = [
  { pattern: /\/(auth)\//g, name: 'Old auth routes' },
  { pattern: /\/(healthcare)\//g, name: 'Old healthcare routes' },
  { pattern: /\/(home)\//g, name: 'Old home routes' },
  { pattern: /\/(organization)\//g, name: 'Old organization routes' },
  { pattern: /\/(admin)\//g, name: 'Old admin routes' },
  { pattern: /\/(manager)\//g, name: 'Old manager routes' }
];

function checkDirectory(dir: string, patterns: typeof oldRoutePatterns) {
  const files = fs.readdirSync(dir);
  const issues: string[] = [];
  
  for (const file of files) {
    const filePath = join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      issues.push(...checkDirectory(filePath, patterns));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      const content = fs.readFileSync(filePath, 'utf-8');
      
      for (const { pattern, name } of patterns) {
        const matches = content.match(pattern);
        if (matches) {
          issues.push(`${filePath}: Found ${matches.length} ${name}`);
        }
      }
    }
  }
  
  return issues;
}

const issues = checkDirectory(appDir, oldRoutePatterns);

if (issues.length > 0) {

  issues.forEach(issue => {});
} else {

}

process.exit(failCount > 0 || issues.length > 0 ? 1 : 0);