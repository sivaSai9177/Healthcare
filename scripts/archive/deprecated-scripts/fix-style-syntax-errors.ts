#!/usr/bin/env bun
/**
 * Fix style syntax errors with {1} appended
 */

import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

async function processFile(filePath: string): Promise<number> {
  try {
    let content = await readFile(filePath, 'utf-8');
    let changeCount = 0;
    
    // Fix style={{ ... }}{1} pattern
    const stylePattern = /style=\{\{([^}]+)\}\}\{1\}/g;
    const matches = content.match(stylePattern);
    if (matches) {
      changeCount += matches.length;
      content = content.replace(stylePattern, 'style={{$1}}');
    }
    
    // Fix any remaining {1} after closing braces
    const bracePattern = /\}\{1\}/g;
    const braceMatches = content.match(bracePattern);
    if (braceMatches) {
      changeCount += braceMatches.length;
      content = content.replace(bracePattern, '}');
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
      
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
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

  const totalChanges = await processDirectory('./app');

}

main().catch(console.error);