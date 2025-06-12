#!/usr/bin/env bun
import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const rootDir = process.cwd();

async function findAndReplaceInFile(filePath: string): Promise<boolean> {
  try {
    const content = await readFile(filePath, 'utf-8');
    let modified = false;
    let newContent = content;
    
    // Replace SpacingContext imports
    if (content.includes("from '@/contexts/SpacingContext'")) {
      newContent = newContent.replace(
        /import\s*{\s*useSpacing\s*}\s*from\s*['"]@\/contexts\/SpacingContext['"]/g,
        "import { useSpacing } from '@/lib/stores/spacing-store'"
      );
      modified = true;
    }
    
    // Also check for other variations
    if (content.includes('from "@/contexts/SpacingContext"')) {
      newContent = newContent.replace(
        /import\s*{\s*useSpacing\s*}\s*from\s*["']@\/contexts\/SpacingContext["']/g,
        "import { useSpacing } from '@/lib/stores/spacing-store'"
      );
      modified = true;
    }
    
    if (modified) {
      await writeFile(filePath, newContent);
// TODO: Replace with structured logging - console.log(`✅ Fixed: ${filePath.replace(rootDir, '.')}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error);
    return false;
  }
}

async function processDirectory(dir: string): Promise<{ total: number; fixed: number }> {
  let total = 0;
  let fixed = 0;
  
  const entries = await readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    
    // Skip node_modules, .git, etc.
    if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist') {
      continue;
    }
    
    if (entry.isDirectory()) {
      const subResult = await processDirectory(fullPath);
      total += subResult.total;
      fixed += subResult.fixed;
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      total++;
      if (await findAndReplaceInFile(fullPath)) {
        fixed++;
      }
    }
  }
  
  return { total, fixed };
}

async function main() {
// TODO: Replace with structured logging - console.log('🔍 Searching for SpacingContext imports to fix...\n');
  
  const componentsDir = join(rootDir, 'components');
  const appDir = join(rootDir, 'app');
  
  const componentsResult = await processDirectory(componentsDir);
  const appResult = await processDirectory(appDir);
  
  const totalFiles = componentsResult.total + appResult.total;
  const totalFixed = componentsResult.fixed + appResult.fixed;
  
// TODO: Replace with structured logging - console.log('\n📊 Summary:');
// TODO: Replace with structured logging - console.log(`Total TypeScript files scanned: ${totalFiles}`);
// TODO: Replace with structured logging - console.log(`Files fixed: ${totalFixed}`);
// TODO: Replace with structured logging - console.log(`\n✨ SpacingContext import fixes complete!`);
}

main().catch(console.error);