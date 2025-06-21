#!/usr/bin/env bun

import { readFileSync } from 'fs';
import glob from 'glob';
import path from 'path';

interface SpacingIssue {
  file: string;
  line: number;
  content: string;
  type: 'padding' | 'margin' | 'gap' | 'spacing';
}

function findHardcodedSpacing() {
  const files = glob.sync('**/*.{ts,tsx}', {
    ignore: [
      'node_modules/**',
      '.next/**',
      'dist/**',
      '**/*.test.{ts,tsx}',
      '**/*.spec.{ts,tsx}',
      'scripts/**',
      '__tests__/**',
      '**/theme/**',
    ],
    cwd: process.cwd(),
  });

  const issues: SpacingIssue[] = [];

  // Patterns to search for
  const paddingPattern = /padding(?:Top|Bottom|Left|Right|Horizontal|Vertical)?:\s*(\d+)/g;
  const marginPattern = /margin(?:Top|Bottom|Left|Right|Horizontal|Vertical)?:\s*(\d+)/g;
  const gapPattern = /gap:\s*(\d+)/g;
  const spacingPropsPattern = /(?:p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|gap|spacing)=\{(\d+)\}/g;

  for (const file of files) {
    const filePath = path.join(process.cwd(), file);
    const content = readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      // Skip comments
      if (line.trim().startsWith('//') || line.trim().startsWith('*')) {
        return;
      }

      // Find padding values
      let matches = line.match(paddingPattern);
      if (matches) {
        matches.forEach(match => {
          const value = parseInt(match.split(':')[1].trim());
          // Skip if it's a valid spacing scale value
          if (![0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64, 72, 80, 96].includes(value)) {
            issues.push({
              file,
              line: index + 1,
              content: line.trim(),
              type: 'padding',
            });
          }
        });
      }

      // Find margin values
      matches = line.match(marginPattern);
      if (matches) {
        matches.forEach(match => {
          const value = parseInt(match.split(':')[1].trim());
          if (![0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64, 72, 80, 96].includes(value)) {
            issues.push({
              file,
              line: index + 1,
              content: line.trim(),
              type: 'margin',
            });
          }
        });
      }

      // Find gap values
      matches = line.match(gapPattern);
      if (matches) {
        matches.forEach(match => {
          const value = parseInt(match.split(':')[1].trim());
          if (![0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 20, 24, 28, 32].includes(value)) {
            issues.push({
              file,
              line: index + 1,
              content: line.trim(),
              type: 'gap',
            });
          }
        });
      }

      // Find component spacing props
      matches = line.match(spacingPropsPattern);
      if (matches) {
        matches.forEach(match => {
          // Skip if it already has "as SpacingScale"
          if (!line.includes('as SpacingScale')) {
            issues.push({
              file,
              line: index + 1,
              content: line.trim(),
              type: 'spacing',
            });
          }
        });
      }
    });
  }

  // Group by file
  const groupedIssues: Record<string, SpacingIssue[]> = {};
  issues.forEach(issue => {
    if (!groupedIssues[issue.file]) {
      groupedIssues[issue.file] = [];
    }
    groupedIssues[issue.file].push(issue);
  });

  // Report findings
// TODO: Replace with structured logging - /* console.log('🔍 Hardcoded Spacing Audit Report\n') */;
// TODO: Replace with structured logging - /* console.log(`Found ${issues.length} hardcoded spacing values in ${Object.keys(groupedIssues) */.length} files\n`);

  // Show summary by type
  const paddingCount = issues.filter(i => i.type === 'padding').length;
  const marginCount = issues.filter(i => i.type === 'margin').length;
  const gapCount = issues.filter(i => i.type === 'gap').length;
  const spacingCount = issues.filter(i => i.type === 'spacing').length;

// TODO: Replace with structured logging - /* console.log('📊 Summary by type:') */;
// TODO: Replace with structured logging - /* console.log(`   Padding: ${paddingCount}`) */;
// TODO: Replace with structured logging - /* console.log(`   Margin: ${marginCount}`) */;
// TODO: Replace with structured logging - /* console.log(`   Gap: ${gapCount}`) */;
// TODO: Replace with structured logging - /* console.log(`   Component props: ${spacingCount}\n`) */;

  // Show top 10 files with most issues
  const sortedFiles = Object.entries(groupedIssues)
    .sort(([, a], [, b]) => b.length - a.length)
    .slice(0, 10);

// TODO: Replace with structured logging - /* console.log('📁 Top 10 files with most issues:') */;
  sortedFiles.forEach(([file, issues]) => {
// TODO: Replace with structured logging - /* console.log(`   ${file}: ${issues.length} issues`) */;
  });

  // Show some examples
// TODO: Replace with structured logging - /* console.log('\n💡 Example issues to fix:') */;
  const examples = issues.slice(0, 5);
  examples.forEach(issue => {
// TODO: Replace with structured logging - /* console.log(`\n   File: ${issue.file}:${issue.line}`) */;
// TODO: Replace with structured logging - /* console.log(`   Type: ${issue.type}`) */;
// TODO: Replace with structured logging - /* console.log(`   Line: ${issue.content}`) */;
  });

  return groupedIssues;
}

// Run the script
try {
  findHardcodedSpacing();
} catch (error) {
  console.error('Error:', error);
}