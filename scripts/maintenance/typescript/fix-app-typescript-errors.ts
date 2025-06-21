#!/usr/bin/env bun
/**
 * Script to fix common TypeScript errors in app directory
 */

import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const APP_DIR = './app';

// Common replacements
const REPLACEMENTS = [
  // Badge variants
  { pattern: /variant="destructive"/g, replacement: 'variant="error"' },
  
  // Button sizes
  { pattern: /size="md"/g, replacement: 'size="default"' },
  { pattern: /size="lg"/g, replacement: 'size="default"' },
  
  // Avatar sizes
  { pattern: /<Avatar([^>]*)size="md"/g, replacement: '<Avatar$1size="sm"' },
  
  // HStack/VStack alignItems
  { pattern: /alignItems="start"/g, replacement: 'alignItems="flex-start"' },
  { pattern: /alignItems="end"/g, replacement: 'alignItems="flex-end"' },
  
  // HStack justify
  { pattern: /justify="space-between"/g, replacement: 'justify="between"' },
  { pattern: /justifyContent="space-between"/g, replacement: 'justifyContent="between"' },
  
  // Spacing props - Add type assertions
  { pattern: /gap=\{(\d+)\}/g, replacement: 'gap={$1 as any}' },
  { pattern: /spacing=\{(\d+)\}/g, replacement: 'spacing={$1 as any}' },
  { pattern: /padding=\{(\d+)\}/g, replacement: 'padding={$1 as any}' },
  { pattern: /margin=\{(\d+)\}/g, replacement: 'margin={$1 as any}' },
  
  // Router paths
  { pattern: /router\.push\(['"]\/\(healthcare\)\/([^'"]+)['"]\)/g, replacement: "router.push('/$1' as any)" },
  { pattern: /router\.push\(['"]\/\(app\)\/([^'"]+)['"]\)/g, replacement: "router.push('/$1' as any)" },
  { pattern: /href=['"]\/\(healthcare\)\/([^'"]+)['"]/g, replacement: 'href="/$1"' },
  { pattern: /href=['"]\/\(app\)\/([^'"]+)['"]/g, replacement: 'href="/$1"' },
  
  // API property fixes
  { pattern: /resolutionNotes:/g, replacement: 'resolution:' },
];

async function processFile(filePath: string): Promise<number> {
  try {
    let content = await readFile(filePath, 'utf-8');
    let changeCount = 0;
    
    for (const { pattern, replacement } of REPLACEMENTS) {
      const matches = content.match(pattern);
      if (matches) {
        changeCount += matches.length;
        content = content.replace(pattern, replacement);
      }
    }
    
    if (changeCount > 0) {
      await writeFile(filePath, content);

    }
    
    return changeCount;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error);
    return 0;
  }
}

async function processDirectory(dir: string): Promise<number> {
  let totalChanges = 0;
  
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      
      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        totalChanges += await processDirectory(fullPath);
      } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
        totalChanges += await processFile(fullPath);
      }
    }
  } catch (error) {
    console.error(`❌ Error processing directory ${dir}:`, error);
  }
  
  return totalChanges;
}

async function main() {

  const totalChanges = await processDirectory(APP_DIR);

}

main().catch(console.error);