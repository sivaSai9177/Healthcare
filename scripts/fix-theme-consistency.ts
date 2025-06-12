#!/usr/bin/env bun

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import path from 'path';
import glob from 'glob';

// Common color replacements
const COLOR_REPLACEMENTS: Record<string, string> = {
  // White/Black
  "theme.background": "theme.background",
  'theme.background': 'theme.background',
  "theme.foreground": "theme.foreground",
  'theme.foreground': 'theme.foreground',
  'theme.background': 'theme.background',
  'theme.background': 'theme.background',
  'theme.foreground': 'theme.foreground',
  'theme.foreground': 'theme.foreground',
  
  // Common grays
  'theme.mutedForeground': 'theme.mutedForeground',
  'theme.mutedForeground': 'theme.mutedForeground',
  'theme.mutedForeground': 'theme.mutedForeground',
  'theme.mutedForeground': 'theme.mutedForeground',
  'theme.foreground': 'theme.foreground',
  'theme.foreground': 'theme.foreground',
  
  // Borders
  'theme.border': 'theme.border',
  'theme.border': 'theme.border',
  'theme.border': 'theme.border',
  
  // Primary blues
  'theme.primary': 'theme.primary',
  'theme.primary': 'theme.primary',
  'theme.primary': 'theme.primary',
  
  // Errors/Destructive
  'theme.destructive': 'theme.destructive',
  'theme.destructive': 'theme.destructive',
  'theme.destructive': 'theme.destructive',
  'theme.destructive': 'theme.destructive',
  
  // Success
  'theme.success': 'theme.success',
  'theme.success': 'theme.success',
  'theme.success': 'theme.success',
  
  // Warning
  'theme.warning': 'theme.warning',
  'theme.warning': 'theme.warning',
  'theme.warning': 'theme.warning',
  'theme.warning': 'theme.warning',
  
  // Backgrounds
  'theme.muted': 'theme.muted',
  'theme.muted': 'theme.muted',
  'theme.background': 'theme.background',
  'theme.card': 'theme.card',
  'theme.destructiveForeground': 'theme.destructiveForeground',
};

// Common spacing replacements
const SPACING_REPLACEMENTS: Record<string, string> = {
  // Direct numeric values
  'padding: spacing[1]': 'padding: spacing[1]',
  'padding: spacing[2]': 'padding: spacing[2]',
  'padding: spacing[2.5]': 'padding: spacing[2.5]',
  'padding: spacing[3]': 'padding: spacing[3]',
  'padding: spacing[4]': 'padding: spacing[4]',
  'padding: spacing[5]': 'padding: spacing[5]',
  'padding: spacing[6]': 'padding: spacing[6]',
  
  'paddingTop: spacing[1]': 'paddingTop: spacing[1]',
  'paddingTop: spacing[2]': 'paddingTop: spacing[2]',
  'paddingTop: spacing[3]': 'paddingTop: spacing[3]',
  'paddingTop: spacing[4]': 'paddingTop: spacing[4]',
  'paddingTop: spacing[5]': 'paddingTop: spacing[5]',
  
  'paddingBottom: spacing[1]': 'paddingBottom: spacing[1]',
  'paddingBottom: spacing[2]': 'paddingBottom: spacing[2]',
  'paddingBottom: spacing[3]': 'paddingBottom: spacing[3]',
  'paddingBottom: spacing[4]': 'paddingBottom: spacing[4]',
  'paddingBottom: spacing[5]': 'paddingBottom: spacing[5]',
  
  'paddingLeft: spacing[1]': 'paddingLeft: spacing[1]',
  'paddingLeft: spacing[2]': 'paddingLeft: spacing[2]',
  'paddingLeft: spacing[3]': 'paddingLeft: spacing[3]',
  'paddingLeft: spacing[4]': 'paddingLeft: spacing[4]',
  'paddingLeft: spacing[5]': 'paddingLeft: spacing[5]',
  
  'paddingRight: spacing[1]': 'paddingRight: spacing[1]',
  'paddingRight: spacing[2]': 'paddingRight: spacing[2]',
  'paddingRight: spacing[3]': 'paddingRight: spacing[3]',
  'paddingRight: spacing[4]': 'paddingRight: spacing[4]',
  'paddingRight: spacing[5]': 'paddingRight: spacing[5]',
  
  'paddingVertical: spacing[5]': 'paddingVertical: spacing[5]',
  'paddingHorizontal: spacing[4]': 'paddingHorizontal: spacing[4]',
  
  'margin: spacing[1]': 'margin: spacing[1]',
  'margin: spacing[2]': 'margin: spacing[2]',
  'margin: spacing[2.5]': 'margin: spacing[2.5]',
  'margin: spacing[3]': 'margin: spacing[3]',
  'margin: spacing[4]': 'margin: spacing[4]',
  'margin: spacing[5]': 'margin: spacing[5]',
  
  'marginTop: spacing[0.5]': 'marginTop: spacing[0.5]',
  'marginTop: spacing[1]': 'marginTop: spacing[1]',
  'marginTop: spacing[2]': 'marginTop: spacing[2]',
  'marginTop: spacing[3]': 'marginTop: spacing[3]',
  'marginTop: spacing[4]': 'marginTop: spacing[4]',
  
  'marginBottom: spacing[0.5]': 'marginBottom: spacing[0.5]',
  'marginBottom: spacing[1]': 'marginBottom: spacing[1]',
  'marginBottom: spacing[2]': 'marginBottom: spacing[2]',
  'marginBottom: spacing[3]': 'marginBottom: spacing[3]',
  'marginBottom: spacing[4]': 'marginBottom: spacing[4]',
  
  'marginLeft: spacing[1]': 'marginLeft: spacing[1]',
  'marginLeft: spacing[2]': 'marginLeft: spacing[2]',
  'marginLeft: spacing[3]': 'marginLeft: spacing[3]',
  'marginLeft: spacing[4]': 'marginLeft: spacing[4]',
  
  'marginRight: spacing[1]': 'marginRight: spacing[1]',
  'marginRight: spacing[2]': 'marginRight: spacing[2]',
  'marginRight: spacing[3]': 'marginRight: spacing[3]',
  'marginRight: spacing[4]': 'marginRight: spacing[4]',
  
  'gap: spacing[1]': 'gap: spacing[1]',
  'gap: spacing[2]': 'gap: spacing[2]',
  'gap: spacing[3]': 'gap: spacing[3]',
  'gap: spacing[4]': 'gap: spacing[4]',
  'gap: spacing[5]': 'gap: spacing[5]',
  'gap: spacing[6]': 'gap: spacing[6]',
};

// Component prop replacements
const PROP_REPLACEMENTS: Record<string, string> = {
  'p={1 as SpacingScale}': 'p={1 as SpacingScale}',
  'p={2 as SpacingScale}': 'p={2 as SpacingScale}',
  'p={3 as SpacingScale}': 'p={3 as SpacingScale}',
  'p={4 as SpacingScale}': 'p={4 as SpacingScale}',
  'p={5 as SpacingScale}': 'p={5 as SpacingScale}',
  'p={6 as SpacingScale}': 'p={6 as SpacingScale}',
  'p={8 as SpacingScale}': 'p={8 as SpacingScale}',
  
  'px={1 as SpacingScale}': 'px={1 as SpacingScale}',
  'px={2 as SpacingScale}': 'px={2 as SpacingScale}',
  'px={3 as SpacingScale}': 'px={3 as SpacingScale}',
  'px={4 as SpacingScale}': 'px={4 as SpacingScale}',
  'px={5 as SpacingScale}': 'px={5 as SpacingScale}',
  'px={6 as SpacingScale}': 'px={6 as SpacingScale}',
  
  'py={1 as SpacingScale}': 'py={1 as SpacingScale}',
  'py={2 as SpacingScale}': 'py={2 as SpacingScale}',
  'py={3 as SpacingScale}': 'py={3 as SpacingScale}',
  'py={4 as SpacingScale}': 'py={4 as SpacingScale}',
  'py={5 as SpacingScale}': 'py={5 as SpacingScale}',
  'py={6 as SpacingScale}': 'py={6 as SpacingScale}',
  
  'gap={1 as SpacingScale}': 'gap={1 as SpacingScale}',
  'gap={2 as SpacingScale}': 'gap={2 as SpacingScale}',
  'gap={3 as SpacingScale}': 'gap={3 as SpacingScale}',
  'gap={4 as SpacingScale}': 'gap={4 as SpacingScale}',
  'gap={5 as SpacingScale}': 'gap={5 as SpacingScale}',
  'gap={6 as SpacingScale}': 'gap={6 as SpacingScale}',
};

function fixThemeConsistency() {
  // Find all TypeScript/TSX files
  const files = glob.sync('**/*.{ts,tsx}', {
    ignore: [
      'node_modules/**',
      '.next/**',
      'dist/**',
      '**/*.test.{ts,tsx}',
      '**/*.spec.{ts,tsx}',
      '**/debug-*.{ts,tsx}',
      '**/MobileDebugger.tsx',
      '**/SimpleMobileDebugger.tsx',
      '**/TanStackDebugInfo.tsx',
      '**/DebugPanel.tsx',
      '**/EnhancedDebugPanel.tsx',
    ],
    cwd: process.cwd(),
  });

  let totalFixed = 0;
  const fixedFiles: string[] = [];

  for (const file of files) {
    const filePath = path.join(process.cwd(), file);
    let content = readFileSync(filePath, 'utf8');
    let originalContent = content;
    let fixCount = 0;

    // Skip files that don't use theme
    const usesTheme = content.includes('useTheme()') || content.includes('theme.');
    const usesSpacing = content.includes('useSpacing()') || content.includes('spacing[') || content.includes('spacing.');

    // Fix color replacements only if file uses theme
    if (usesTheme) {
      for (const [search, replace] of Object.entries(COLOR_REPLACEMENTS)) {
        const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        const matches = content.match(regex);
        if (matches) {
          content = content.replace(regex, replace);
          fixCount += matches.length;
        }
      }
    }

    // Fix spacing replacements only if file uses spacing
    if (usesSpacing) {
      for (const [search, replace] of Object.entries(SPACING_REPLACEMENTS)) {
        const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        const matches = content.match(regex);
        if (matches) {
          content = content.replace(regex, replace);
          fixCount += matches.length;
        }
      }
    }

    // Fix component props
    for (const [search, replace] of Object.entries(PROP_REPLACEMENTS)) {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      const matches = content.match(regex);
      if (matches) {
        content = content.replace(regex, replace);
        fixCount += matches.length;
      }
    }

    // Add SpacingScale import if needed
    if (content.includes('as SpacingScale') && !content.includes("import { SpacingScale }") && !content.includes("import type { SpacingScale }")) {
      const libDesignImport = content.match(/import .* from ['"]@\/lib\/design['"]/);
      if (libDesignImport) {
        // Add to existing import
        content = content.replace(
          /import {([^}]+)} from ['"]@\/lib\/design['"]/,
          (match, imports) => {
            if (!imports.includes('SpacingScale')) {
              return `import {${imports}, SpacingScale } from '@/lib/design'`;
            }
            return match;
          }
        );
      } else {
        // Add new import after other imports
        const lastImport = content.lastIndexOf('import ');
        const endOfLastImport = content.indexOf('\n', lastImport);
        content = content.slice(0, endOfLastImport + 1) + 
          "import { SpacingScale } from '@/lib/design';\n" + 
          content.slice(endOfLastImport + 1);
      }
    }

    // Add spacing import if needed
    if (content.includes('spacing[') && !content.includes('useSpacing()') && !content.includes('const { spacing }')) {
      // Check if we need to add the hook
      const hasSpacingStore = content.includes('@/lib/stores/spacing-store');
      if (!hasSpacingStore) {
        // Add import
        const lastImport = content.lastIndexOf('import ');
        const endOfLastImport = content.indexOf('\n', lastImport);
        content = content.slice(0, endOfLastImport + 1) + 
          "import { useSpacing } from '@/lib/stores/spacing-store';\n" + 
          content.slice(endOfLastImport + 1);
        
        // Add hook usage in component
        const componentMatch = content.match(/export (?:default )?function \w+\([^)]*\) {/);
        if (componentMatch) {
          const functionStart = componentMatch.index! + componentMatch[0].length;
          const nextLine = content.indexOf('\n', functionStart);
          content = content.slice(0, nextLine + 1) + 
            "  const { spacing } = useSpacing();\n" + 
            content.slice(nextLine + 1);
        }
      }
    }

    if (content !== originalContent) {
      writeFileSync(filePath, content);
      totalFixed += fixCount;
      fixedFiles.push(file);
// TODO: Replace with structured logging - console.log(`✅ Fixed ${fixCount} issues in ${file}`);
    }
  }

// TODO: Replace with structured logging - console.log(`\n🎉 Theme consistency fixes complete!`);
// TODO: Replace with structured logging - console.log(`📊 Total fixes: ${totalFixed} in ${fixedFiles.length} files`);
  
  if (fixedFiles.length > 0) {
// TODO: Replace with structured logging - console.log(`\n📁 Files modified:`);
// TODO: Replace with structured logging - fixedFiles.forEach(file => console.log(`   - ${file}`));
  }
}

// Run the script
try {
  fixThemeConsistency();
} catch (error) {
  console.error(error);
}