#!/usr/bin/env bun

import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const ROUTE_MAPPINGS = {
  '(healthcare)': '(zhealthcare)',
  '(organization)': '(zorganization)',
  '(admin)': '(zadmin)',
  '(manager)': '(zmanager)',
  '(modals)': '(zmodals)',
};

async function fixRouteReferences(dir: string) {
  const entries = await readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
      await fixRouteReferences(fullPath);
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      let content = await readFile(fullPath, 'utf-8');
      let modified = false;
      
      for (const [oldRoute, newRoute] of Object.entries(ROUTE_MAPPINGS)) {
        if (content.includes(oldRoute)) {
          content = content.replace(new RegExp(escapeRegExp(oldRoute), 'g'), newRoute);
          modified = true;
        }
      }
      
      if (modified) {
        await writeFile(fullPath, content);
// TODO: Replace with structured logging - /* console.log(`✅ Updated routes in: ${fullPath}`) */;
      }
    }
  }
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Run the fix
// TODO: Replace with structured logging - /* console.log('🔧 Fixing route references...') */;
fixRouteReferences('./app')
  .then(() => fixRouteReferences('./components'))
  .then(() => fixRouteReferences('./lib'))
// TODO: Replace with structured logging - .then(() => /* console.log('✅ All route references updated!') */)
  .catch(console.error);