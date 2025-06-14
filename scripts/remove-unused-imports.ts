#!/usr/bin/env bun

import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { execSync } from 'child_process';

interface UnusedImport {
  file: string;
  line: number;
  column: number;
  name: string;
}

// Common animation imports that might be used in platform-specific files
const ANIMATION_IMPORTS = [
  'FadeIn', 'FadeOut', 'ZoomIn', 'ZoomOut', 'SlideInDown', 'SlideInRight', 'SlideInLeft', 'SlideInUp',
  'withTiming', 'withDelay', 'withSpring', 'withSequence', 'interpolate', 'runOnJS',
  'useAnimatedStyle', 'useSharedValue', 'getAnimationConfig'
];

// Platform-specific imports that might be conditionally used
const PLATFORM_SPECIFIC = ['Platform', 'Pressable', 'ScrollView', 'View', 'Text'];

// Commonly imported but conditionally used
const CONDITIONAL_IMPORTS = ['useEffect', 'useRef', 'useState', 'useCallback', 'useMemo'];

async function parseUnusedImports(): Promise<UnusedImport[]> {
// TODO: Replace with structured logging - console.log('🔍 Running ESLint to find unused imports...');
  
  const lintOutput = execSync('bun lint --format json 2>&1 || true', {
    encoding: 'utf-8',
    maxBuffer: 1024 * 1024 * 10 // 10MB buffer
  });

  try {
    const results = JSON.parse(lintOutput);
    const unusedImports: UnusedImport[] = [];

    for (const result of results) {
      if (result.messages) {
        for (const message of result.messages) {
          if (message.ruleId === '@typescript-eslint/no-unused-vars' && 
              message.message.includes('is defined but never used')) {
            const match = message.message.match(/'([^']+)'/);
            if (match) {
              unusedImports.push({
                file: result.filePath,
                line: message.line,
                column: message.column,
                name: match[1]
              });
            }
          }
        }
      }
    }

    return unusedImports;
  } catch (e) {
    // Fallback to parsing text output
// TODO: Replace with structured logging - console.log('⚠️  JSON parsing failed, falling back to text parsing...');
    return parseTextOutput();
  }
}

async function parseTextOutput(): Promise<UnusedImport[]> {
  const output = execSync('bun lint 2>&1 || true', { encoding: 'utf-8' });
  const lines = output.split('\n');
  const unusedImports: UnusedImport[] = [];
  let currentFile = '';

  for (const line of lines) {
    if (line.startsWith('/')) {
      currentFile = line.trim();
    } else if (line.includes('is defined but never used')) {
      const match = line.match(/\s*(\d+):(\d+)\s+warning\s+'([^']+)'/);
      if (match && currentFile) {
        unusedImports.push({
          file: currentFile,
          line: parseInt(match[1]),
          column: parseInt(match[2]),
          name: match[3]
        });
      }
    }
  }

  return unusedImports;
}

async function removeUnusedImport(filePath: string, importName: string): Promise<boolean> {
  if (!existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    return false;
  }

  const content = await readFile(filePath, 'utf-8');
  const lines = content.split('\n');
  let modified = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip if line is in a comment
    if (line.trim().startsWith('//') || line.trim().startsWith('*')) {
      continue;
    }

    // Handle different import patterns
    const patterns = [
      // Named imports: import { X } from 'module'
      new RegExp(`import\\s*{([^}]*\\b${importName}\\b[^}]*)}\\s*from`, 'g'),
      // Default imports: import X from 'module'
      new RegExp(`import\\s+${importName}\\s+from`, 'g'),
      // Namespace imports: import * as X from 'module'
      new RegExp(`import\\s*\\*\\s*as\\s+${importName}\\s+from`, 'g'),
      // Type imports: import type { X } from 'module'
      new RegExp(`import\\s+type\\s*{([^}]*\\b${importName}\\b[^}]*)}\\s*from`, 'g'),
    ];

    for (const pattern of patterns) {
      if (pattern.test(line)) {
        // For named imports, check if it's the only import
        if (line.includes('{') && line.includes('}')) {
          const importMatch = line.match(/import\s*(?:type\s*)?{([^}]+)}/);
          if (importMatch) {
            const imports = importMatch[1].split(',').map(s => s.trim());
            const filteredImports = imports.filter(imp => !imp.includes(importName));
            
            if (filteredImports.length === 0) {
              // Remove entire import line
              lines[i] = '';
              modified = true;
            } else if (filteredImports.length < imports.length) {
              // Remove just this import
              const newImportList = filteredImports.join(', ');
              lines[i] = line.replace(/import\s*(?:type\s*)?{[^}]+}/, `import ${line.includes('type') ? 'type ' : ''}{ ${newImportList} }`);
              modified = true;
            }
          }
        } else {
          // Remove entire import line for default/namespace imports
          lines[i] = '';
          modified = true;
        }
        break;
      }
    }
  }

  if (modified) {
    // Clean up empty lines
    const cleanedContent = lines
      .filter((line, idx) => {
        // Keep line if it's not empty or if previous/next line isn't empty
        return line.trim() !== '' || 
               (idx > 0 && lines[idx - 1].trim() !== '') ||
               (idx < lines.length - 1 && lines[idx + 1].trim() !== '');
      })
      .join('\n');

    await writeFile(filePath, cleanedContent);
    return true;
  }

  return false;
}

async function main() {
// TODO: Replace with structured logging - console.log('🧹 Analyzing unused imports...\n');

  const unusedImports = await parseUnusedImports();
  
  if (unusedImports.length === 0) {
// TODO: Replace with structured logging - console.log('✅ No unused imports found!');
    return;
  }

// TODO: Replace with structured logging - console.log(`📊 Found ${unusedImports.length} unused imports\n`);

  // Group by import name
  const importCounts = new Map<string, number>();
  const importsByName = new Map<string, UnusedImport[]>();

  for (const imp of unusedImports) {
    importCounts.set(imp.name, (importCounts.get(imp.name) || 0) + 1);
    if (!importsByName.has(imp.name)) {
      importsByName.set(imp.name, []);
    }
    importsByName.get(imp.name)!.push(imp);
  }

  // Sort by frequency
  const sortedImports = Array.from(importCounts.entries())
    .sort((a, b) => b[1] - a[1]);

// TODO: Replace with structured logging - console.log('📈 Most common unused imports:');
  sortedImports.slice(0, 10).forEach(([name, count]) => {
// TODO: Replace with structured logging - console.log(`   ${name}: ${count} occurrences`);
  });
// TODO: Replace with structured logging - console.log('');

  // Categorize imports
  const animationImports = sortedImports.filter(([name]) => ANIMATION_IMPORTS.includes(name));
  const platformImports = sortedImports.filter(([name]) => PLATFORM_SPECIFIC.includes(name));
  const conditionalImports = sortedImports.filter(([name]) => CONDITIONAL_IMPORTS.includes(name));
  const otherImports = sortedImports.filter(([name]) => 
    !ANIMATION_IMPORTS.includes(name) && 
    !PLATFORM_SPECIFIC.includes(name) && 
    !CONDITIONAL_IMPORTS.includes(name)
  );

// TODO: Replace with structured logging - console.log('📦 Import categories:');
// TODO: Replace with structured logging - console.log(`   Animation-related: ${animationImports.reduce((sum, [, count]) => sum + count, 0)}`);
// TODO: Replace with structured logging - console.log(`   Platform-specific: ${platformImports.reduce((sum, [, count]) => sum + count, 0)}`);
// TODO: Replace with structured logging - console.log(`   Conditional (hooks): ${conditionalImports.reduce((sum, [, count]) => sum + count, 0)}`);
// TODO: Replace with structured logging - console.log(`   Other: ${otherImports.reduce((sum, [, count]) => sum + count, 0)}`);
// TODO: Replace with structured logging - console.log('');

  // Interactive mode
  const args = process.argv.slice(2);
  const autoMode = args.includes('--auto');
  const dryRun = args.includes('--dry-run');
  const category = args.find(arg => arg.startsWith('--category='))?.split('=')[1];

  if (dryRun) {
// TODO: Replace with structured logging - console.log('🔍 Dry run mode - no changes will be made\n');
  }

  let importsToRemove: [string, number][] = [];

  if (category) {
    switch (category) {
      case 'animation':
        importsToRemove = animationImports;
        break;
      case 'platform':
        importsToRemove = platformImports;
        break;
      case 'conditional':
        importsToRemove = conditionalImports;
        break;
      case 'other':
        importsToRemove = otherImports;
        break;
      default:
        console.error(`❌ Unknown category: ${category}`);
        process.exit(1);
    }
  } else if (autoMode) {
    // In auto mode, remove "safe" imports (non-conditional, non-platform specific)
    importsToRemove = otherImports;
  } else {
// TODO: Replace with structured logging - console.log('\n🤔 What would you like to do?');
// TODO: Replace with structured logging - console.log('   1. Remove all unused imports (risky)');
// TODO: Replace with structured logging - console.log('   2. Remove animation-related imports');
// TODO: Replace with structured logging - console.log('   3. Remove other safe imports (recommended)');
// TODO: Replace with structured logging - console.log('   4. Show detailed report and exit');
// TODO: Replace with structured logging - console.log('');
    
    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const answer = await new Promise<string>(resolve => {
      rl.question('Enter your choice (1-4): ', resolve);
    });
    rl.close();

    switch (answer.trim()) {
      case '1':
        importsToRemove = sortedImports;
        break;
      case '2':
        importsToRemove = animationImports;
        break;
      case '3':
        importsToRemove = otherImports;
        break;
      case '4':
        // Generate detailed report
// TODO: Replace with structured logging - console.log('\n📋 Detailed Report:\n');
        for (const [name, count] of sortedImports) {
// TODO: Replace with structured logging - console.log(`\n${name} (${count} occurrences):`);
          const imports = importsByName.get(name)!;
          imports.slice(0, 5).forEach(imp => {
// TODO: Replace with structured logging - console.log(`  ${imp.file}:${imp.line}:${imp.column}`);
          });
          if (imports.length > 5) {
// TODO: Replace with structured logging - console.log(`  ... and ${imports.length - 5} more`);
          }
        }
        return;
      default:
// TODO: Replace with structured logging - console.log('❌ Invalid choice');
        return;
    }
  }

  if (importsToRemove.length === 0) {
// TODO: Replace with structured logging - console.log('✅ No imports to remove in this category');
    return;
  }

// TODO: Replace with structured logging - console.log(`\n🗑️  Removing ${importsToRemove.reduce((sum, [, count]) => sum + count, 0)} unused imports...`);

  let successCount = 0;
  let errorCount = 0;

  for (const [importName] of importsToRemove) {
    const imports = importsByName.get(importName)!;
    for (const imp of imports) {
      if (!dryRun) {
        try {
          const removed = await removeUnusedImport(imp.file, imp.name);
          if (removed) {
            successCount++;
          }
        } catch (error) {
          console.error(`❌ Error removing ${imp.name} from ${imp.file}: ${error}`);
          errorCount++;
        }
      } else {
// TODO: Replace with structured logging - console.log(`Would remove: ${imp.name} from ${imp.file}:${imp.line}`);
        successCount++;
      }
    }
  }

// TODO: Replace with structured logging - console.log(`\n✅ Complete! ${successCount} imports ${dryRun ? 'would be' : 'were'} removed, ${errorCount} errors`);

  if (!dryRun) {
// TODO: Replace with structured logging - console.log('\n🔍 Running ESLint again to verify...');
    execSync('bun lint', { stdio: 'inherit' });
  }
}

main().catch(console.error);