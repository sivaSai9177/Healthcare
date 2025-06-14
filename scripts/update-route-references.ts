#!/usr/bin/env node
/**
 * Script to update all z-prefixed route references to their new names
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const routeMappings = {
  '/(admin)': '/(admin)',
  '/(healthcare)': '/(healthcare)',
  '/(manager)': '/(manager)',
  '/(organization)': '/(organization)',
  '/(modals)': '/(modals)',
};

const fileExtensions = ['.ts', '.tsx', '.js', '.jsx'];

function updateFile(filePath: string): boolean {
  let content = readFileSync(filePath, 'utf8');
  let hasChanges = false;

  // Replace all occurrences of old routes with new ones
  Object.entries(routeMappings).forEach(([oldRoute, newRoute]) => {
    const regex = new RegExp(oldRoute.replace(/[()]/g, '\\$&'), 'g');
    const newContent = content.replace(regex, newRoute);
    if (newContent !== content) {
      hasChanges = true;
      content = newContent;
    }
  });

  if (hasChanges) {
    writeFileSync(filePath, content, 'utf8');
// TODO: Replace with structured logging - console.log(`✅ Updated: ${filePath}`);
    return true;
  }
  return false;
}

function processDirectory(dir: string): number {
  let updatedCount = 0;
  
  const items = readdirSync(dir);
  
  for (const item of items) {
    const fullPath = join(dir, item);
    const stat = statSync(fullPath);
    
    // Skip node_modules, .git, and other build directories
    if (item === 'node_modules' || item === '.git' || item === 'dist' || item === 'build' || item === '.expo') {
      continue;
    }
    
    if (stat.isDirectory()) {
      updatedCount += processDirectory(fullPath);
    } else if (stat.isFile() && fileExtensions.includes(extname(item))) {
      if (updateFile(fullPath)) {
        updatedCount++;
      }
    }
  }
  
  return updatedCount;
}

// Run the script
// TODO: Replace with structured logging - console.log('🔄 Updating route references from z-prefixed to new names...\n');
const projectRoot = join(__dirname, '..');
const updatedCount = processDirectory(projectRoot);
// TODO: Replace with structured logging - console.log(`\n✨ Updated ${updatedCount} files!`);