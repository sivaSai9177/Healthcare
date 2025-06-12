#!/usr/bin/env bun

import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const replacements = [
  // Smart quotes to HTML entities
  { pattern: /(\w)'(\w)/g, replacement: '$1&apos;$2' }, // Contractions
  { pattern: /'/g, replacement: '&apos;' }, // Single quotes
  { pattern: /"/g, replacement: '&quot;' }, // Double quotes
  { pattern: /"/g, replacement: '&ldquo;' }, // Left double quote
  { pattern: /"/g, replacement: '&rdquo;' }, // Right double quote
];

async function fixUnescapedEntities(filePath: string) {
  try {
    let content = await readFile(filePath, 'utf-8');
    let hasChanges = false;
    
    // Only process JSX/TSX content
    if (!content.includes('return') && !content.includes('React')) {
      return;
    }
    
    // Find JSX text content (between > and <)
    const jsxTextRegex = />([^<]+)</g;
    
    content = content.replace(jsxTextRegex, (match, text) => {
      let newText = text;
      let changed = false;
      
      for (const { pattern, replacement } of replacements) {
        if (pattern.test(newText)) {
          newText = newText.replace(pattern, replacement);
          changed = true;
        }
      }
      
      if (changed) {
        hasChanges = true;
      }
      
      return `>${newText}<`;
    });
    
    if (hasChanges) {
      await writeFile(filePath, content, 'utf-8');
// TODO: Replace with structured logging - console.log(`✅ Fixed unescaped entities in: ${filePath}`);
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
      if (!['node_modules', '.expo', 'dist', '.git'].includes(entry.name)) {
        await processDirectory(fullPath);
      }
    } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.jsx'))) {
      await fixUnescapedEntities(fullPath);
    }
  }
}

async function main() {
// TODO: Replace with structured logging - console.log('🔧 Fixing React unescaped entities...\n');
  
  const directories = ['app', 'components'];
  
  for (const dir of directories) {
// TODO: Replace with structured logging - console.log(`📁 Processing ${dir}/...`);
    await processDirectory(dir);
  }
  
// TODO: Replace with structured logging - console.log('\n✨ Unescaped entities fixes complete!');
}

main().catch(console.error);