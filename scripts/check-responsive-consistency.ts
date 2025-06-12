#!/usr/bin/env bun

import { readFileSync } from 'fs';
import glob from 'glob';
import path from 'path';

interface ResponsiveIssue {
  file: string;
  line: number;
  content: string;
  type: 'breakpoint' | 'hook' | 'value' | 'platform';
}

function checkResponsiveConsistency() {
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

  const issues: ResponsiveIssue[] = [];
  const responsiveUsage = {
    hooks: new Set<string>(),
    breakpoints: new Set<string>(),
    platformChecks: new Set<string>(),
  };

  // Patterns to check
  const breakpointPattern = /screenWidth\s*[<>=]+\s*(\d+)/g;
  const windowDimensionsPattern = /Dimensions\.get\(['"]window['"]\)/g;
  const platformPattern = /Platform\.OS\s*===?\s*['"](\w+)['"]/g;
  const responsiveHookPattern = /use(Breakpoint|Responsive|MediaQuery|IsMobile|IsTablet|IsDesktop)/g;
  const inlineStylePattern = /style=\{[^}]*(?:width|height|padding|margin):\s*['"]?\d+%?['"]?/g;
  const hardcodedBreakpointPattern = /(?:width|minWidth|maxWidth)\s*[<>=]+\s*(?:768|1024|1280|640|480)/g;

  for (const file of files) {
    const filePath = path.join(process.cwd(), file);
    const content = readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    // Track responsive hook usage
    const hookMatches = content.match(responsiveHookPattern);
    if (hookMatches) {
      hookMatches.forEach(hook => responsiveUsage.hooks.add(hook));
    }

    lines.forEach((line, index) => {
      // Skip comments
      if (line.trim().startsWith('//') || line.trim().startsWith('*')) {
        return;
      }

      // Check for hardcoded breakpoints
      const breakpointMatches = line.match(breakpointPattern);
      if (breakpointMatches) {
        breakpointMatches.forEach(match => {
          const value = match.match(/\d+/)?.[0];
          if (value) {
            responsiveUsage.breakpoints.add(value);
            issues.push({
              file,
              line: index + 1,
              content: line.trim(),
              type: 'breakpoint',
            });
          }
        });
      }

      // Check for hardcoded breakpoint values
      if (line.match(hardcodedBreakpointPattern)) {
        issues.push({
          file,
          line: index + 1,
          content: line.trim(),
          type: 'breakpoint',
        });
      }

      // Check for window dimensions usage
      if (line.match(windowDimensionsPattern)) {
        // Check if using responsive hook in the same file
        if (!content.includes('useBreakpoint') && !content.includes('useResponsive')) {
          issues.push({
            file,
            line: index + 1,
            content: line.trim(),
            type: 'hook',
          });
        }
      }

      // Check for platform checks
      const platformMatches = line.match(platformPattern);
      if (platformMatches) {
        platformMatches.forEach(match => {
          const platform = match.match(/['"](\w+)['"]/)?.[1];
          if (platform) {
            responsiveUsage.platformChecks.add(platform);
          }
        });
      }

      // Check for inline responsive styles
      if (line.match(inlineStylePattern) && line.includes('%')) {
        issues.push({
          file,
          line: index + 1,
          content: line.trim(),
          type: 'value',
        });
      }
    });
  }

  // Group by file
  const groupedIssues: Record<string, ResponsiveIssue[]> = {};
  issues.forEach(issue => {
    if (!groupedIssues[issue.file]) {
      groupedIssues[issue.file] = [];
    }
    groupedIssues[issue.file].push(issue);
  });

  // Report findings
// TODO: Replace with structured logging - console.log('🔍 Responsive Consistency Audit Report\n');
// TODO: Replace with structured logging - console.log(`Found ${issues.length} responsive issues in ${Object.keys(groupedIssues).length} files\n`);

  // Show usage statistics
// TODO: Replace with structured logging - console.log('📊 Responsive Pattern Usage:');
// TODO: Replace with structured logging - console.log(`   Hooks used: ${Array.from(responsiveUsage.hooks).join(', ') || 'None'}`);
// TODO: Replace with structured logging - console.log(`   Breakpoints: ${Array.from(responsiveUsage.breakpoints).sort((a, b) => parseInt(a) - parseInt(b)).join(', ')}`);
// TODO: Replace with structured logging - console.log(`   Platform checks: ${Array.from(responsiveUsage.platformChecks).join(', ')}\n`);

  // Show summary by type
  const breakpointCount = issues.filter(i => i.type === 'breakpoint').length;
  const hookCount = issues.filter(i => i.type === 'hook').length;
  const valueCount = issues.filter(i => i.type === 'value').length;
  const platformCount = issues.filter(i => i.type === 'platform').length;

// TODO: Replace with structured logging - console.log('📈 Issue Summary:');
// TODO: Replace with structured logging - console.log(`   Hardcoded breakpoints: ${breakpointCount}`);
// TODO: Replace with structured logging - console.log(`   Missing responsive hooks: ${hookCount}`);
// TODO: Replace with structured logging - console.log(`   Inline responsive values: ${valueCount}`);
// TODO: Replace with structured logging - console.log(`   Platform-specific code: ${platformCount}\n`);

  // Show top files with issues
  const sortedFiles = Object.entries(groupedIssues)
    .sort(([, a], [, b]) => b.length - a.length)
    .slice(0, 10);

// TODO: Replace with structured logging - console.log('📁 Top 10 files with responsive issues:');
  sortedFiles.forEach(([file, issues]) => {
// TODO: Replace with structured logging - console.log(`   ${file}: ${issues.length} issues`);
  });

  // Recommendations
// TODO: Replace with structured logging - console.log('\n💡 Recommendations:');
// TODO: Replace with structured logging - console.log('1. Use responsive hooks (useBreakpoint, useResponsive) instead of manual breakpoints');
// TODO: Replace with structured logging - console.log('2. Define breakpoints in a central location (designSystem.breakpoints)');
// TODO: Replace with structured logging - console.log('3. Use ResponsiveValue<T> type for responsive props');
// TODO: Replace with structured logging - console.log('4. Avoid inline percentage values - use responsive utilities');
// TODO: Replace with structured logging - console.log('5. Consider using useIsMobile() instead of Platform.OS checks where appropriate');

  // Show examples
// TODO: Replace with structured logging - console.log('\n📝 Example fixes:');
// TODO: Replace with structured logging - console.log(`
// Before:
const { width } = Dimensions.get('window');
const isTablet = width >= 768;

// After:
const { breakpoint } = useBreakpoint();
const isTablet = breakpoint === 'md' || breakpoint === 'lg' || breakpoint === 'xl';

// Or even better:
const { isTablet } = useResponsive();
`);

  return groupedIssues;
}

// Run the script
try {
  checkResponsiveConsistency();
} catch (error) {
  console.error('Error:', error);
}