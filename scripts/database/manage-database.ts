#!/usr/bin/env bun
/**
 * Database Management Script
 * 
 * This is a convenience wrapper that calls the unified database management script.
 * All database operations are consolidated in manage-database-unified.ts
 * 
 * Usage:
 *   bun run scripts/database/manage-database.ts [action] [options]
 * 
 * For help:
 *   bun run scripts/database/manage-database.ts --help
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Forward all arguments to the unified script
const unifiedScript = join(__dirname, 'manage-database-unified.ts');
const args = process.argv.slice(2);

const child = spawn('bun', ['run', unifiedScript, ...args], {
  stdio: 'inherit',
  env: process.env
});

child.on('exit', (code) => {
  process.exit(code || 0);
});