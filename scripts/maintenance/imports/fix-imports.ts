#!/usr/bin/env bun

import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const importMappings = {
  '@/lib/theme/enhanced-theme-provider': '@/lib/theme/provider',
  '@/lib/trpc': '@/lib/api/trpc',
  '@/lib/core/logger': '@/lib/core/debug/logger',
  '@/lib/design-system': '@/lib/design',
  '@/lib/haptics': '@/lib/ui/haptics',
};

async function fixImports(filePath: string) {
  try {
    let content = await readFile(filePath, 'utf-8');
    let hasChanges = false;
    
    for (const [oldImport, newImport] of Object.entries(importMappings)) {
      if (content.includes(oldImport)) {
        content = content.replace(new RegExp(oldImport.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newImport);
        hasChanges = true;
      }
    }
    
    if (hasChanges) {
      await writeFile(filePath, content, 'utf-8');
// TODO: Replace with structured logging - /* console.log(`✅ Fixed imports in: ${filePath}`) */;
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error);
  }
}

async function processDirectory(dir: string) {
  const entries = await readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    
    if (entry.isDirectory()) {
      // Skip node_modules and other build directories
      if (!['node_modules', '.expo', 'dist', '.git'].includes(entry.name)) {
        await processDirectory(fullPath);
      }
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      await fixImports(fullPath);
    }
  }
}

async function main() {
// TODO: Replace with structured logging - /* console.log('🔧 Fixing import paths...\n') */;
  
  const directories = [
    'app',
    'components',
    'hooks',
    'lib',
    'src',
  ];
  
  for (const dir of directories) {
// TODO: Replace with structured logging - /* console.log(`📁 Processing ${dir}/...`) */;
    await processDirectory(dir);
  }
  
// TODO: Replace with structured logging - /* console.log('\n✨ Import fixes complete!') */;
}

main().catch(console.error);