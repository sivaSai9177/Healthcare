#!/usr/bin/env bun

import { readFileSync } from 'fs';
import glob from 'glob';
import path from 'path';

interface ColorIssue {
  file: string;
  line: number;
  content: string;
  type: 'hex' | 'rgb' | 'named';
}

function findHardcodedColors() {
  const files = glob.sync('**/*.{ts,tsx}', {
    ignore: [
      'node_modules/**',
      '.next/**',
      'dist/**',
      '**/*.test.{ts,tsx}',
      '**/*.spec.{ts,tsx}',
      'scripts/**',
      '__tests__/**',
    ],
    cwd: process.cwd(),
  });

  const issues: ColorIssue[] = [];

  // Patterns to search for
  const hexPattern = /#[0-9a-fA-F]{3,8}/g;
  const rgbPattern = /rgba?\([^)]+\)/g;
  const namedColorPattern = /(?:backgroundColor|color|borderColor|shadowColor)\s*:\s*["'](?:white|black|red|blue|green|yellow|orange|purple|gray|grey)["']/g;
  const styleColorPattern = /style\s*=\s*\{[^}]*(?:backgroundColor|color|borderColor)\s*:\s*["'](?:#[0-9a-fA-F]{3,8}|white|black|red|blue|green)["'][^}]*\}/g;

  for (const file of files) {
    const filePath = path.join(process.cwd(), file);
    const content = readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    // Skip files that are email templates or brand-specific
    if (file.includes('email-templates') || file.includes('GoogleSignInButton')) {
      continue;
    }

    lines.forEach((line, index) => {
      // Skip comments and console logs
      if (line.trim().startsWith('//') || line.trim().startsWith('*') || line.includes('console.')) {
        return;
      }

      // Find hex colors
      const hexMatches = line.match(hexPattern);
      if (hexMatches) {
        hexMatches.forEach(match => {
          // Skip if it's in a comment or a gradient
          if (!line.includes('//') && !line.includes('gradient') && !line.includes('LinearGradient')) {
            issues.push({
              file,
              line: index + 1,
              content: line.trim(),
              type: 'hex',
            });
          }
        });
      }

      // Find rgb/rgba colors
      const rgbMatches = line.match(rgbPattern);
      if (rgbMatches) {
        rgbMatches.forEach(match => {
          if (!line.includes('//')) {
            issues.push({
              file,
              line: index + 1,
              content: line.trim(),
              type: 'rgb',
            });
          }
        });
      }

      // Find named colors in style props
      if (line.match(namedColorPattern) || line.match(styleColorPattern)) {
        issues.push({
          file,
          line: index + 1,
          content: line.trim(),
          type: 'named',
        });
      }
    });
  }

  // Group by file
  const groupedIssues: Record<string, ColorIssue[]> = {};
  issues.forEach(issue => {
    if (!groupedIssues[issue.file]) {
      groupedIssues[issue.file] = [];
    }
    groupedIssues[issue.file].push(issue);
  });

  // Report findings
// TODO: Replace with structured logging - console.log('🔍 Hardcoded Color Audit Report\n');
// TODO: Replace with structured logging - console.log(`Found ${issues.length} hardcoded colors in ${Object.keys(groupedIssues).length} files\n`);

  // Show summary by type
  const hexCount = issues.filter(i => i.type === 'hex').length;
  const rgbCount = issues.filter(i => i.type === 'rgb').length;
  const namedCount = issues.filter(i => i.type === 'named').length;

// TODO: Replace with structured logging - console.log('📊 Summary by type:');
// TODO: Replace with structured logging - console.log(`   Hex colors: ${hexCount}`);
// TODO: Replace with structured logging - console.log(`   RGB/RGBA: ${rgbCount}`);
// TODO: Replace with structured logging - console.log(`   Named colors: ${namedCount}\n`);

  // Show top 10 files with most issues
  const sortedFiles = Object.entries(groupedIssues)
    .sort(([, a], [, b]) => b.length - a.length)
    .slice(0, 10);

// TODO: Replace with structured logging - console.log('📁 Top 10 files with most issues:');
  sortedFiles.forEach(([file, issues]) => {
// TODO: Replace with structured logging - console.log(`   ${file}: ${issues.length} issues`);
  });

  // Show some examples
// TODO: Replace with structured logging - console.log('\n💡 Example issues to fix:');
  const examples = issues.slice(0, 5);
  examples.forEach(issue => {
// TODO: Replace with structured logging - console.log(`\n   File: ${issue.file}:${issue.line}`);
// TODO: Replace with structured logging - console.log(`   Type: ${issue.type}`);
// TODO: Replace with structured logging - console.log(`   Line: ${issue.content}`);
  });

  return groupedIssues;
}

// Run the script
try {
  const issues = findHardcodedColors();
  
  // Save detailed report
  const report = {
    summary: {
      totalIssues: Object.values(issues).flat().length,
      filesAffected: Object.keys(issues).length,
      timestamp: new Date().toISOString(),
    },
    issues,
  };
  
// TODO: Replace with structured logging - console.log('\n✅ Full report saved to hardcoded-colors-report.json');
} catch (error) {
  console.error('Error:', error);
}