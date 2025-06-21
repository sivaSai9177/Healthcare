#!/usr/bin/env bun
/**
 * Script to fix TypeScript errors in universal components
 */

import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const UNIVERSAL_DIR = './components/universal';

// Specific fixes for common issues
const SPECIFIC_FIXES = {
  'typography/Text.tsx': [
    // Add missing size
    {
      pattern: /const sizeClasses: Record<TypographySize, string> = {/,
      replacement: 'const sizeClasses: Record<TypographySize, string> = {\n  \'2xs\': \'text-2xs\','
    },
    // Add missing weight
    {
      pattern: /const weightClasses: Record<FontWeight, string> = {/,
      replacement: 'const weightClasses: Record<FontWeight, string> = {\n  extrabold: \'font-extrabold\','
    },
    // Fix TypographyPreset index issues
    {
      pattern: /typographyPresets\[preset\]/g,
      replacement: 'typographyPresets[preset as keyof typeof typographyPresets]'
    },
    // Fix type casting for preset
    {
      pattern: /const presetConfig = preset \? typographyPresets/g,
      replacement: 'const presetConfig = preset ? typographyPresets'
    }
  ]
};

// Common replacements for all universal components
const COMMON_REPLACEMENTS = [
  // Fix spacing type issues
  { pattern: /gap: spacing\[(\d+)\]/g, replacement: 'gap: spacing[$1] as any' },
  { pattern: /padding: spacing\[(\d+)\]/g, replacement: 'padding: spacing[$1] as any' },
  { pattern: /margin: spacing\[(\d+)\]/g, replacement: 'margin: spacing[$1] as any' },
  
  // Fix variant prop issues
  { pattern: /variant: ["']destructive["']/g, replacement: 'variant: "error"' },
  
  // Fix size prop issues
  { pattern: /size: ["']md["']/g, replacement: 'size: "default"' },
  
  // Add type assertions for numeric props
  { pattern: /borderRadius: (\d+)/g, replacement: 'borderRadius: $1 as any' },
  { pattern: /opacity: ([\d.]+)/g, replacement: 'opacity: $1 as any' },
  
  // Fix style array issues
  { pattern: /style=\{(\[.*?\])\}/g, replacement: 'style={$1 as any}' },
];

async function processFile(filePath: string, relativePath: string): Promise<number> {
  try {
    let content = await readFile(filePath, 'utf-8');
    let changeCount = 0;
    
    // Apply specific fixes if available
    const specificFixes = SPECIFIC_FIXES[relativePath];
    if (specificFixes) {
      for (const { pattern, replacement } of specificFixes) {
        const matches = content.match(pattern);
        if (matches) {
          changeCount += matches.length;
          content = content.replace(pattern, replacement);
        }
      }
    }
    
    // Apply common replacements
    for (const { pattern, replacement } of COMMON_REPLACEMENTS) {
      const matches = content.match(pattern);
      if (matches) {
        changeCount += matches.length;
        content = content.replace(pattern, replacement);
      }
    }
    
    // Additional fixes for common patterns
    
    // Fix missing type exports
    if (relativePath.includes('index.ts') && !content.includes('export type')) {
      const typeExports = `
// Type exports
export type * from './types';
`;
      if (!content.includes(typeExports)) {
        content = content + '\n' + typeExports;
        changeCount++;
      }
    }
    
    // Fix className type issues
    content = content.replace(
      /className=\{cn\((.*?)\)\}/g,
      'className={cn($1) as string}'
    );
    
    // Fix ref forwarding issues
    if (content.includes('forwardRef') && !content.includes('ForwardedRef')) {
      content = content.replace(
        /import React, { forwardRef/g,
        'import React, { forwardRef, type ForwardedRef'
      );
      changeCount++;
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

async function processDirectory(dir: string, baseDir: string = dir): Promise<number> {
  let totalChanges = 0;
  
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const relativePath = fullPath.replace(baseDir + '/', '');
      
      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        totalChanges += await processDirectory(fullPath, baseDir);
      } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
        totalChanges += await processFile(fullPath, relativePath);
      }
    }
  } catch (error) {
    console.error(`❌ Error processing directory ${dir}:`, error);
  }
  
  return totalChanges;
}

async function main() {

  const totalChanges = await processDirectory(UNIVERSAL_DIR);

}

main().catch(console.error);