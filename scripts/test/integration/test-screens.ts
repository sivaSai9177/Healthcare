#!/usr/bin/env tsx
/**
 * Healthcare Screen Navigation Test
 * Opens each screen in sequence for manual testing
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const screens = [
  { name: 'Login', path: '/(public)/auth/login', delay: 3000 },
  { name: 'Dashboard', path: '/home', delay: 3000 },
  { name: 'Alerts', path: '/alerts', delay: 3000 },
  { name: 'Patients', path: '/patients', delay: 3000 },
  { name: 'Settings', path: '/settings', delay: 3000 },
  { name: 'Create Alert Modal', path: '/create-alert', delay: 3000 },
  { name: 'Profile Completion', path: '/(public)/auth/complete-profile', delay: 3000 },
];

async function openScreen(path: string) {
  try {
    // Use expo-router's deep linking
    const url = `exp://localhost:8081${path}`;

    // Open in simulator/device
    await execAsync(`npx uri-scheme open "${url}" --ios`);
  } catch (error) {
    console.error(`Failed to open ${path}:`, error);
  }
}

async function runScreenTests() {

  for (const screen of screens) {

    await openScreen(screen.path);
    
    // Wait before opening next screen
    await new Promise(resolve => setTimeout(resolve, screen.delay));
  }

}

runScreenTests().catch(console.error);