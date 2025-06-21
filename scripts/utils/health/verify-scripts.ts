#!/usr/bin/env bun

import { readFileSync } from 'fs';
import { join } from 'path';

// Read package.json
const packageJsonPath = join(process.cwd(), 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
const scripts = packageJson.scripts || {};

// Key scripts from SCRIPTS_GUIDE.md
const requiredScripts = [
  // Main unified commands
  'start',
  'start:local', 
  'start:tunnel',
  'start:oauth',
  
  // Healthcare commands
  'healthcare',
  'healthcare:network',
  'healthcare:oauth',
  'local:healthcare',
  'dev:healthcare',
  'start:healthcare',
  
  // Platform commands
  'ios',
  'android', 
  'web',
  'web:local',
  'web:preview',
  'web:dev',
  'web:ngrok',
  
  // Environment commands
  'local',
  'dev',
  'dev:local',
  'dev:preview',
  'dev:development',
  'dev:staging',
  'dev:production',
  
  // Database commands
  'db:local:up',
  'db:local:down',
  'db:local:reset',
  'db:migrate',
  'db:migrate:local',
  'db:migrate:dev',
  'db:push',
  'db:push:local',
  'db:push:dev',
  'db:studio',
  'db:studio:local',
  'db:studio:dev',
  'db:studio:prod',
  
  // Healthcare setup
  'healthcare:setup',
  'healthcare:setup:local',
  'healthcare:setup:dev',
  'healthcare:demo',
  
  // Build commands
  'preview',
  'preview:ios',
  'preview:android',
  'preview:run:ios',
  'preview:run:android',
  'eas:setup',
  'eas:build:ios',
  'eas:build:android',
  
  // Testing
  'test',
  'test:watch',
  'test:coverage',
  'api:test',
  'api:health',
  
  // Environment setup
  'setup:env',
  'env:generate',
  'env:update-ip',
  
  // Utilities
  'reset-project',
  'reset-profile',
  'delete-user',
  'expo:go',
  'expo:go:local',
  
  // Ngrok
  'ngrok:setup',
  'ngrok:start',
  'ngrok:update-eas',
];

// TODO: Replace with structured logging - /* console.log('🔍 Verifying scripts from SCRIPTS_GUIDE.md...\n') */;

let missingCount = 0;
let foundCount = 0;

requiredScripts.forEach(script => {
  if (scripts[script] !== undefined) {
// TODO: Replace with structured logging - /* console.log(`✅ ${script}`) */;
    foundCount++;
  } else {
// TODO: Replace with structured logging - /* console.log(`❌ ${script} - MISSING`) */;
    missingCount++;
  }
});

// TODO: Replace with structured logging - /* console.log(`\n📊 Summary:`) */;
// TODO: Replace with structured logging - /* console.log(`   Found: ${foundCount}/${requiredScripts.length}`) */;
// TODO: Replace with structured logging - /* console.log(`   Missing: ${missingCount}/${requiredScripts.length}`) */;

if (missingCount === 0) {
// TODO: Replace with structured logging - /* console.log('\n✅ All required scripts are present!') */;
} else {
// TODO: Replace with structured logging - /* console.log('\n⚠️  Some scripts are missing. Please update package.json.') */;
  process.exit(1);
}