#!/usr/bin/env bun

import { readFileSync, writeFileSync } from 'fs';
import glob from 'glob';
import path from 'path';

// Define color mappings
const COLOR_MAP: Record<string, string> = {
  // Whites
  '#fff': 'theme.background',
  '#ffffff': 'theme.background',
  '#FFFFFF': 'theme.background',
  'white': 'theme.background',
  
  // Blacks
  '#000': 'theme.foreground',
  '#000000': 'theme.foreground',
  'black': 'theme.foreground',
  
  // Grays
  '#f0f0f0': 'theme.muted',
  '#f5f5f5': 'theme.muted',
  '#f9fafb': 'theme.muted',
  '#e5e5e5': 'theme.border',
  '#e0e0e0': 'theme.border',
  '#ccc': 'theme.border',
  '#999': 'theme.mutedForeground',
  '#666': 'theme.mutedForeground',
  '#333': 'theme.foreground',
  
  // Common colors
  '#ff0000': 'theme.destructive',
  '#dc2626': 'theme.destructive',
  'red': 'theme.destructive',
  
  '#00ff00': 'theme.success',
  '#10b981': 'theme.success',
  'green': 'theme.success',
  
  '#0000ff': 'theme.primary',
  '#3b82f6': 'theme.primary',
  'blue': 'theme.primary',
  
  '#ffeb3b': 'theme.warning',
  '#f59e0b': 'theme.warning',
  'yellow': 'theme.warning',
  
  'transparent': 'transparent',
};

function fixColors() {
  const files = glob.sync('**/*.{ts,tsx}', {
    ignore: [
      'node_modules/**',
      '.next/**',
      'dist/**',
      '**/*.test.{ts,tsx}',
      '**/*.spec.{ts,tsx}',
      'scripts/**',
      '__tests__/**',
      // Skip debug components
      '**/DebugPanel.tsx',
      '**/EnhancedDebugPanel.tsx',
      '**/MobileDebugger.tsx',
      '**/SimpleMobileDebugger.tsx',
      '**/TanStackDebugInfo.tsx',
      // Skip theme files
      '**/theme/registry.tsx',
      '**/ColorPicker.tsx',
      // Skip email templates
      '**/email-templates/**',
    ],
    cwd: process.cwd(),
  });

  let totalFixed = 0;
  const fixedFiles: string[] = [];

  for (const file of files) {
    const filePath = path.join(process.cwd(), file);
    let content = readFileSync(filePath, 'utf8');
    const originalContent = content;
    let fixCount = 0;

    // Skip if it's a gradient file
    if (content.includes('LinearGradient') || content.includes('gradient')) {
      continue;
    }

    // Check if file imports theme
    const hasThemeImport = content.includes('useTheme()') || content.includes('const theme =');
    
    // Add theme import if needed
    if (!hasThemeImport && (
      content.includes('backgroundColor:') || 
      content.includes('color:') || 
      content.includes('borderColor:')
    )) {
      // Check if we have any color to replace
      let needsTheme = false;
      for (const [color] of Object.entries(COLOR_MAP)) {
        if (content.includes(color)) {
          needsTheme = true;
          break;
        }
      }
      
      if (needsTheme) {
        // Add theme import
        const hasReactImport = content.includes('import React');
        if (hasReactImport) {
          // Add useTheme import
          if (!content.includes('@/lib/theme/provider')) {
            const lastImport = content.lastIndexOf('import');
            const endOfLastImport = content.indexOf('\n', lastImport);
            content = content.slice(0, endOfLastImport + 1) + 
              "import { useTheme } from '@/lib/theme/provider';\n" + 
              content.slice(endOfLastImport + 1);
          }
          
          // Add theme hook in component
          const componentMatch = content.match(/export (?:default )?function \w+\([^)]*\) {/);
          if (componentMatch && !content.includes('const theme =')) {
            const functionStart = componentMatch.index! + componentMatch[0].length;
            const nextLine = content.indexOf('\n', functionStart);
            content = content.slice(0, nextLine + 1) + 
              "  const theme = useTheme();\n" + 
              content.slice(nextLine + 1);
          }
        }
      }
    }

    // Replace colors in style objects
    for (const [oldColor, newColor] of Object.entries(COLOR_MAP)) {
      // Pattern 1: backgroundColor: '#fff'
      const bgPattern = new RegExp(`backgroundColor:\\s*['"]${oldColor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`, 'g');
      if (content.match(bgPattern)) {
        content = content.replace(bgPattern, `backgroundColor: ${newColor}`);
        fixCount++;
      }
      
      // Pattern 2: color: '#fff'
      const colorPattern = new RegExp(`color:\\s*['"]${oldColor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`, 'g');
      if (content.match(colorPattern)) {
        content = content.replace(colorPattern, `color: ${newColor}`);
        fixCount++;
      }
      
      // Pattern 3: borderColor: '#fff'
      const borderPattern = new RegExp(`borderColor:\\s*['"]${oldColor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`, 'g');
      if (content.match(borderPattern)) {
        content = content.replace(borderPattern, `borderColor: ${newColor}`);
        fixCount++;
      }
      
      // Pattern 4: style={{ color: '#fff' }}
      const stylePattern = new RegExp(`style={{([^}]*)(backgroundColor|color|borderColor):\\s*['"]${oldColor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`, 'g');
      if (content.match(stylePattern)) {
        content = content.replace(stylePattern, (match, before, prop) => {
          return `style={{${before}${prop}: ${newColor}`;
        });
        fixCount++;
      }
    }

    // Fix rgba patterns
    content = content.replace(/rgba\(0,\s*0,\s*0,\s*0\.([0-9]+)\)/g, (match, opacity) => {
      const op = parseFloat(`0.${opacity}`);
      if (op < 0.2) return 'theme.mutedForeground + "10"';
      if (op < 0.5) return 'theme.mutedForeground + "40"';
      return 'theme.foreground + "80"';
    });
    
    content = content.replace(/rgba\(255,\s*255,\s*255,\s*0\.([0-9]+)\)/g, (match, opacity) => {
      const op = parseFloat(`0.${opacity}`);
      if (op < 0.2) return 'theme.background + "10"';
      if (op < 0.5) return 'theme.background + "40"';
      return 'theme.background + "80"';
    });

    if (content !== originalContent) {
      writeFileSync(filePath, content);
      totalFixed += fixCount;
      fixedFiles.push(file);
// TODO: Replace with structured logging - /* console.log(`✅ Fixed ${fixCount} colors in ${file}`) */;
    }
  }

// TODO: Replace with structured logging - /* console.log(`\n🎉 Color fixes complete!`) */;
// TODO: Replace with structured logging - /* console.log(`📊 Total fixes: ${totalFixed} in ${fixedFiles.length} files`) */;
  
  if (fixedFiles.length > 0) {
// TODO: Replace with structured logging - /* console.log(`\n📁 Files modified:`) */;
// TODO: Replace with structured logging - fixedFiles.forEach(file => /* console.log(`   - ${file}`) */);
  }
}

// Run the script
try {
  fixColors();
} catch (error) {
  console.error('Error:', error);
}