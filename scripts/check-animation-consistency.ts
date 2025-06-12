#!/usr/bin/env bun

import { readFileSync } from 'fs';
import glob from 'glob';
import path from 'path';

interface AnimationIssue {
  file: string;
  line: number;
  content: string;
  type: 'duration' | 'easing' | 'variant' | 'hook' | 'config';
}

function checkAnimationConsistency() {
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

  const issues: AnimationIssue[] = [];
  const animationUsage = {
    hooks: new Set<string>(),
    variants: new Set<string>(),
    durations: new Set<number>(),
    easings: new Set<string>(),
  };

  // Patterns to check
  const durationPattern = /(?:duration|animationDuration):\s*(\d+)/g;
  const easingPattern = /(?:easing|animationEasing):\s*['"]?(\w+)['"]?/g;
  const animatedPattern = /Animated\.(View|Text|ScrollView|Image|createAnimatedComponent)/g;
  const reanimatedPattern = /use(?:SharedValue|AnimatedStyle|DerivedValue|AnimatedProps)/g;
  const animationHookPattern = /use(?:AnimationVariant|EntranceAnimation|NavigationTransition)/g;
  const hardcodedSpringPattern = /(?:damping|stiffness|mass|velocity):\s*(\d+)/g;
  const withTimingPattern = /withTiming\([^,]+,\s*(?:{[^}]+}|\d+)/g;
  const withSpringPattern = /withSpring\([^,]+,\s*{[^}]+}/g;

  for (const file of files) {
    const filePath = path.join(process.cwd(), file);
    const content = readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    // Track animation hook usage
    const hookMatches = content.match(animationHookPattern);
    if (hookMatches) {
      hookMatches.forEach(hook => animationUsage.hooks.add(hook));
    }

    // Track Reanimated usage
    const hasReanimated = content.match(reanimatedPattern);
    const hasAnimatedAPI = content.match(animatedPattern);

    lines.forEach((line, index) => {
      // Skip comments
      if (line.trim().startsWith('//') || line.trim().startsWith('*')) {
        return;
      }

      // Check for hardcoded durations
      const durationMatches = line.match(durationPattern);
      if (durationMatches) {
        durationMatches.forEach(match => {
          const duration = parseInt(match.split(':')[1].trim());
          animationUsage.durations.add(duration);
          
          // Flag non-standard durations
          if (![200, 300, 400, 500, 600, 800, 1000].includes(duration)) {
            issues.push({
              file,
              line: index + 1,
              content: line.trim(),
              type: 'duration',
            });
          }
        });
      }

      // Check for hardcoded easings
      const easingMatches = line.match(easingPattern);
      if (easingMatches) {
        easingMatches.forEach(match => {
          const easing = match.split(':')[1].trim().replace(/['"]/g, '');
          animationUsage.easings.add(easing);
          
          // Flag non-standard easings
          if (!['linear', 'ease', 'easeIn', 'easeOut', 'easeInOut', 'cubic-bezier'].includes(easing)) {
            issues.push({
              file,
              line: index + 1,
              content: line.trim(),
              type: 'easing',
            });
          }
        });
      }

      // Check for animation variants
      if (line.includes('animationVariant=') || line.includes('variant=')) {
        const variantMatch = line.match(/(?:animationVariant|variant)=["'](\w+)["']/);
        if (variantMatch) {
          animationUsage.variants.add(variantMatch[1]);
        }
      }

      // Check for hardcoded spring configs
      if (line.match(hardcodedSpringPattern)) {
        issues.push({
          file,
          line: index + 1,
          content: line.trim(),
          type: 'config',
        });
      }

      // Check for withTiming without config
      if (line.includes('withTiming') && !line.includes('getAnimationConfig')) {
        issues.push({
          file,
          line: index + 1,
          content: line.trim(),
          type: 'hook',
        });
      }
    });

    // Check for files using animations without proper hooks
    if ((hasReanimated || hasAnimatedAPI) && !content.includes('useAnimationVariant')) {
      issues.push({
        file,
        line: 0,
        content: 'File uses animations without useAnimationVariant hook',
        type: 'hook',
      });
    }
  }

  // Group by file
  const groupedIssues: Record<string, AnimationIssue[]> = {};
  issues.forEach(issue => {
    if (!groupedIssues[issue.file]) {
      groupedIssues[issue.file] = [];
    }
    groupedIssues[issue.file].push(issue);
  });

  // Report findings
// TODO: Replace with structured logging - console.log('🎬 Animation Consistency Audit Report\n');
// TODO: Replace with structured logging - console.log(`Found ${issues.length} animation issues in ${Object.keys(groupedIssues).length} files\n`);

  // Show usage statistics
// TODO: Replace with structured logging - console.log('📊 Animation Pattern Usage:');
// TODO: Replace with structured logging - console.log(`   Hooks: ${Array.from(animationUsage.hooks).join(', ') || 'None'}`);
// TODO: Replace with structured logging - console.log(`   Variants: ${Array.from(animationUsage.variants).join(', ')}`);
// TODO: Replace with structured logging - console.log(`   Durations: ${Array.from(animationUsage.durations).sort((a, b) => a - b).join(', ')}ms`);
// TODO: Replace with structured logging - console.log(`   Easings: ${Array.from(animationUsage.easings).join(', ')}\n`);

  // Show summary by type
  const durationCount = issues.filter(i => i.type === 'duration').length;
  const easingCount = issues.filter(i => i.type === 'easing').length;
  const variantCount = issues.filter(i => i.type === 'variant').length;
  const hookCount = issues.filter(i => i.type === 'hook').length;
  const configCount = issues.filter(i => i.type === 'config').length;

// TODO: Replace with structured logging - console.log('📈 Issue Summary:');
// TODO: Replace with structured logging - console.log(`   Non-standard durations: ${durationCount}`);
// TODO: Replace with structured logging - console.log(`   Non-standard easings: ${easingCount}`);
// TODO: Replace with structured logging - console.log(`   Missing animation hooks: ${hookCount}`);
// TODO: Replace with structured logging - console.log(`   Hardcoded configs: ${configCount}`);
// TODO: Replace with structured logging - console.log(`   Variant issues: ${variantCount}\n`);

  // Show top files with issues
  const sortedFiles = Object.entries(groupedIssues)
    .sort(([, a], [, b]) => b.length - a.length)
    .slice(0, 10);

// TODO: Replace with structured logging - console.log('📁 Top 10 files with animation issues:');
  sortedFiles.forEach(([file, issues]) => {
// TODO: Replace with structured logging - console.log(`   ${file}: ${issues.length} issues`);
  });

  // Recommendations
// TODO: Replace with structured logging - console.log('\n💡 Recommendations:');
// TODO: Replace with structured logging - console.log('1. Use animation variants (subtle, moderate, energetic, none)');
// TODO: Replace with structured logging - console.log('2. Import animation configs from @/lib/design/animation-variants');
// TODO: Replace with structured logging - console.log('3. Use useAnimationVariant() hook for consistent animations');
// TODO: Replace with structured logging - console.log('4. Avoid hardcoded durations - use getAnimationConfig()');
// TODO: Replace with structured logging - console.log('5. Use platform-specific animations via getLayoutAnimationConfig()');

  // Show examples
// TODO: Replace with structured logging - console.log('\n📝 Example fixes:');
// TODO: Replace with structured logging - console.log(`
// Before:
Animated.timing(opacity, {
  toValue: 1,
  duration: 300,
  useNativeDriver: true
}).start();

// After:
import { useAnimationVariant } from '@/hooks/useAnimationVariant';
const { getAnimationConfig } = useAnimationVariant();

Animated.timing(opacity, {
  toValue: 1,
  ...getAnimationConfig('timing'),
  useNativeDriver: true
}).start();
`);

  return groupedIssues;
}

// Run the script
try {
  checkAnimationConsistency();
} catch (error) {
  console.error('Error:', error);
}