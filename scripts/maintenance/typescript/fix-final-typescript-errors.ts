#!/usr/bin/env bun
/**
 * Fix final TypeScript errors
 */

import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const FINAL_REPLACEMENTS = [
  // Fix duplicate <any> in mock types
  { pattern: /as jest\.Mock<any><any>/g, replacement: 'as jest.Mock<any>' },
  { pattern: /jest\.Mock<any><any>/g, replacement: 'jest.Mock<any>' },
  
  // Fix test syntax errors
  { pattern: /\)\)\.mock/g, replacement: ').mock' },
  
  // Fix trailing commas in test files
  { pattern: /,\s*\)/g, replacement: ')' },
  
  // Fix duplicate semicolons
  { pattern: /;;/g, replacement: ';' },
  
  // Fix expect syntax
  { pattern: /expect\(([^)]+)\)\.toHaveBeenCalledWith<any>\(/g, replacement: 'expect($1).toHaveBeenCalledWith(' },
  
  // Fix type assertions in tests
  { pattern: /as\s+any\s+as\s+any/g, replacement: 'as any' },
  
  // Fix mock return value syntax
  { pattern: /mockReturnValue\(([^)]+)\)<any>/g, replacement: 'mockReturnValue($1)' },
  { pattern: /mockResolvedValue\(([^)]+)\)<any>/g, replacement: 'mockResolvedValue($1)' },
];

async function processFile(filePath: string): Promise<number> {
  try {
    let content = await readFile(filePath, 'utf-8');
    let changeCount = 0;
    
    // Apply replacements
    for (const { pattern, replacement } of FINAL_REPLACEMENTS) {
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

  let totalChanges = 0;
  
  // Process test directories
  totalChanges += await processDirectory('./__tests__');
  
  // Process app directory
  totalChanges += await processDirectory('./app');
  
  // Process src directory
  totalChanges += await processDirectory('./src');

}

main().catch(console.error);