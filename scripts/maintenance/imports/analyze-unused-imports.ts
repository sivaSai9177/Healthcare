#!/usr/bin/env bun

import { execSync } from 'child_process';

// Quick analysis script for unused imports

// TODO: Replace with structured logging - /* console.log('🔍 Analyzing unused imports in the codebase...\n') */;

// Get all unused imports
const output = execSync('bun lint 2>&1 || true', { encoding: 'utf-8' });
const lines = output.split('\n');
const unusedImports: { [key: string]: number } = {};
const fileImports: { [key: string]: Set<string> } = {};
let currentFile = '';

// Parse the lint output
for (const line of lines) {
  if (line.startsWith('/')) {
    currentFile = line.trim();
  } else if (line.includes('is defined but never used')) {
    const match = line.match(/'([^']+)'/);
    if (match) {
      const importName = match[1];
      unusedImports[importName] = (unusedImports[importName] || 0) + 1;
      
      if (!fileImports[currentFile]) {
        fileImports[currentFile] = new Set();
      }
      fileImports[currentFile].add(importName);
    }
  }
}

// Sort by frequency
const sortedImports = Object.entries(unusedImports)
  .sort((a, b) => b[1] - a[1]);

// Categorize imports
const categories = {
  animation: ['FadeIn', 'FadeOut', 'ZoomIn', 'ZoomOut', 'SlideInDown', 'SlideInRight', 'SlideInLeft', 'SlideInUp', 'withTiming', 'withDelay', 'withSpring', 'interpolate', 'runOnJS', 'getAnimationConfig'],
  platform: ['Platform', 'Pressable', 'ScrollView', 'View', 'Text'],
  hooks: ['useEffect', 'useRef', 'useState', 'useCallback', 'useMemo'],
  components: ['Box', 'Container', 'Badge', 'Button', 'Card', 'Input', 'Label', 'Separator', 'Progress'],
  icons: ['IconSymbol', 'Filter', 'Settings', 'Users', 'ChevronRight', 'ChevronDown'],
  routing: ['router', 'Link', 'useRouter'],
  utils: ['cn', 'api', 'showErrorAlert', 'showSuccessAlert']
};

const categorizedImports: { [key: string]: [string, number][] } = {};
const uncategorized: [string, number][] = [];

// Categorize each import
for (const [name, count] of sortedImports) {
  let categorized = false;
  for (const [category, items] of Object.entries(categories)) {
    if (items.includes(name)) {
      if (!categorizedImports[category]) {
        categorizedImports[category] = [];
      }
      categorizedImports[category].push([name, count]);
      categorized = true;
      break;
    }
  }
  if (!categorized) {
    uncategorized.push([name, count]);
  }
}

// Print summary
// TODO: Replace with structured logging - /* console.log(`📊 Total unused imports: ${sortedImports.reduce((sum, [, count]) */ => sum + count, 0)}\n`);

// TODO: Replace with structured logging - /* console.log('📈 Top 20 most common unused imports:') */;
sortedImports.slice(0, 20).forEach(([name, count]) => {
// TODO: Replace with structured logging - /* console.log(`   ${name.padEnd(25) */} ${count} occurrences`);
});

// TODO: Replace with structured logging - /* console.log('\n📦 Categorized unused imports:\n') */;
for (const [category, imports] of Object.entries(categorizedImports)) {
  const total = imports.reduce((sum, [, count]) => sum + count, 0);
// TODO: Replace with structured logging - /* console.log(`${category.toUpperCase() */} (${total} total):`);
  imports.forEach(([name, count]) => {
// TODO: Replace with structured logging - /* console.log(`   ${name.padEnd(25) */} ${count}`);
  });
// TODO: Replace with structured logging - /* console.log('') */;
}

if (uncategorized.length > 0) {
// TODO: Replace with structured logging - /* console.log(`UNCATEGORIZED (${uncategorized.reduce((sum, [, count]) */ => sum + count, 0)} total):`);
  uncategorized.slice(0, 10).forEach(([name, count]) => {
// TODO: Replace with structured logging - /* console.log(`   ${name.padEnd(25) */} ${count}`);
  });
  if (uncategorized.length > 10) {
// TODO: Replace with structured logging - /* console.log(`   ... and ${uncategorized.length - 10} more`) */;
  }
// TODO: Replace with structured logging - /* console.log('') */;
}

// Find files with most unused imports
const filesByCount = Object.entries(fileImports)
  .map(([file, imports]) => ({ file, count: imports.size }))
  .sort((a, b) => b.count - a.count);

// TODO: Replace with structured logging - /* console.log('📁 Files with most unused imports:') */;
filesByCount.slice(0, 10).forEach(({ file, count }) => {
  const fileName = file.split('/').pop();
// TODO: Replace with structured logging - /* console.log(`   ${fileName?.padEnd(40) */} ${count} unused imports`);
});

// Recommendations
// TODO: Replace with structured logging - /* console.log('\n💡 Recommendations:\n') */;
// TODO: Replace with structured logging - /* console.log('1. Start by removing unused imports from the "uncategorized" and "utils" categories') */;
// TODO: Replace with structured logging - /* console.log('2. Animation imports might be used conditionally - review carefully') */;
// TODO: Replace with structured logging - /* console.log('3. Platform-specific imports might be needed for cross-platform compatibility') */;
// TODO: Replace with structured logging - /* console.log('4. Consider using the remove-unused-imports.ts script with --category=other for safe removal') */;
// TODO: Replace with structured logging - /* console.log('\n📝 Quick commands:') */;
// TODO: Replace with structured logging - /* console.log('   bun run scripts/remove-unused-imports.ts --dry-run --category=other') */;
// TODO: Replace with structured logging - /* console.log('   bun run scripts/remove-unused-imports.ts --auto') */;
// TODO: Replace with structured logging - /* console.log('   bun run scripts/remove-unused-imports.ts  # Interactive mode') */;

// Export summary to JSON
const summary = {
  totalUnusedImports: sortedImports.reduce((sum, [, count]) => sum + count, 0),
  topImports: Object.fromEntries(sortedImports.slice(0, 20)),
  categories: Object.fromEntries(
    Object.entries(categorizedImports).map(([cat, imports]) => [
      cat, 
      {
        total: imports.reduce((sum, [, count]) => sum + count, 0),
        imports: Object.fromEntries(imports)
      }
    ])
  ),
  filesWithMostUnusedImports: filesByCount.slice(0, 20).map(f => ({
    file: f.file,
    count: f.count,
    imports: Array.from(fileImports[f.file])
  }))
};

// Write summary to file
await Bun.write(
  'unused-imports-summary.json', 
  JSON.stringify(summary, null, 2)
);

// TODO: Replace with structured logging - /* console.log('\n✅ Analysis complete! Summary saved to unused-imports-summary.json') */;