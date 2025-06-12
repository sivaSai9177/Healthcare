#!/usr/bin/env bun

import { readFileSync, writeFileSync } from 'fs';
import glob from 'glob';
import path from 'path';

function fixResponsiveConsistency() {
  const files = glob.sync('**/*.{ts,tsx}', {
    ignore: [
      'node_modules/**',
      '.next/**',
      'dist/**',
      '**/*.test.{ts,tsx}',
      '**/*.spec.{ts,tsx}',
      'scripts/**',
      '__tests__/**',
      '**/responsive.ts', // Don't modify the responsive system itself
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

    // Skip if file already uses responsive hooks properly
    const hasResponsiveHook = content.includes('useBreakpoint()') || 
                             content.includes('useResponsive()') ||
                             content.includes('useIsMobile()');

    // Pattern 1: Replace Dimensions.get('window') with responsive hooks
    if (content.includes("Dimensions.get('window')") && !hasResponsiveHook) {
      // Check if we need width-based breakpoints
      if (content.match(/(?:width|screenWidth)\s*[<>=]+\s*\d+/)) {
        // Add useBreakpoint import
        if (!content.includes('@/hooks/responsive')) {
          const lastImport = content.lastIndexOf('import');
          const endOfLastImport = content.indexOf('\n', lastImport);
          content = content.slice(0, endOfLastImport + 1) + 
            "import { useBreakpoint } from '@/hooks/responsive';\n" + 
            content.slice(endOfLastImport + 1);
        }
        
        // Replace in component
        content = content.replace(
          /const\s*{\s*width(?:\s*:\s*\w+)?\s*}\s*=\s*Dimensions\.get\(['"]window['"]\);?/g,
          'const { breakpoint } = useBreakpoint();'
        );
        
        content = content.replace(
          /const\s+(\w+)\s*=\s*Dimensions\.get\(['"]window['"]\)\.width;?/g,
          'const { breakpoint } = useBreakpoint();\n  const $1 = breakpoint;'
        );
        
        fixCount++;
      }
    }

    // Pattern 2: Replace hardcoded breakpoint checks
    const breakpointReplacements: Record<string, string> = {
      'width >= 1024': "['lg', 'xl', '2xl'].includes(breakpoint)",
      'width >= 768': "['md', 'lg', 'xl', '2xl'].includes(breakpoint)",
      'width >= 640': "['sm', 'md', 'lg', 'xl', '2xl'].includes(breakpoint)",
      'screenWidth >= 1024': "['lg', 'xl', '2xl'].includes(breakpoint)",
      'screenWidth >= 768': "['md', 'lg', 'xl', '2xl'].includes(breakpoint)",
      'screenWidth >= 640': "['sm', 'md', 'lg', 'xl', '2xl'].includes(breakpoint)",
    };

    for (const [pattern, replacement] of Object.entries(breakpointReplacements)) {
      if (content.includes(pattern)) {
        content = content.replace(new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacement);
        fixCount++;
      }
    }

    // Pattern 3: Replace isTablet/isDesktop patterns
    content = content.replace(
      /const\s+isTablet\s*=\s*(?:width|screenWidth)\s*>=\s*768;?/g,
      'const { isTablet } = useResponsive();'
    );
    
    content = content.replace(
      /const\s+isDesktop\s*=\s*(?:width|screenWidth)\s*>=\s*1024;?/g,
      'const { isDesktop } = useResponsive();'
    );
    
    content = content.replace(
      /const\s+isMobile\s*=\s*(?:width|screenWidth)\s*<\s*768;?/g,
      'const { isMobile } = useResponsive();'
    );

    // Pattern 4: Add useResponsive hook if we made replacements
    if (content.includes('{ isTablet }') || content.includes('{ isDesktop }') || content.includes('{ isMobile }')) {
      if (!content.includes('useResponsive')) {
        // Add import
        if (!content.includes('@/hooks/responsive')) {
          const lastImport = content.lastIndexOf('import');
          const endOfLastImport = content.indexOf('\n', lastImport);
          content = content.slice(0, endOfLastImport + 1) + 
            "import { useResponsive } from '@/hooks/responsive';\n" + 
            content.slice(endOfLastImport + 1);
        } else {
          // Add to existing import
          content = content.replace(
            /import\s*{\s*([^}]+)\s*}\s*from\s*['"]@\/hooks\/responsive['"]/,
            (match, imports) => {
              if (!imports.includes('useResponsive')) {
                return `import { ${imports.trim()}, useResponsive } from '@/hooks/responsive'`;
              }
              return match;
            }
          );
        }
      }
    }

    // Pattern 5: Fix inline percentage widths
    content = content.replace(
      /style={{([^}]*width:\s*['"])(\d+)%(['"][^}]*)}}/g,
      (match, before, percent, after) => {
        // Convert percentage to responsive value
        if (percent === '100') return match; // Keep 100%
        if (percent === '50') return `style={{${before}1/2${after}}}`;
        if (percent === '33') return `style={{${before}1/3${after}}}`;
        if (percent === '25') return `style={{${before}1/4${after}}}`;
        return match;
      }
    );

    // Pattern 6: Import BREAKPOINTS where needed
    if (content.includes('768') || content.includes('1024') || content.includes('640')) {
      // Check if we should replace with BREAKPOINTS constant
      const needsBreakpoints = content.match(/(?:minWidth|maxWidth|width):\s*(?:768|1024|640)/);
      if (needsBreakpoints && !content.includes('BREAKPOINTS')) {
        // Add import
        if (!content.includes('@/lib/design/responsive')) {
          const lastImport = content.lastIndexOf('import');
          const endOfLastImport = content.indexOf('\n', lastImport);
          content = content.slice(0, endOfLastImport + 1) + 
            "import { BREAKPOINTS } from '@/lib/design/responsive';\n" + 
            content.slice(endOfLastImport + 1);
        }
        
        // Replace values
        content = content.replace(/:\s*768([,\s}])/g, ': BREAKPOINTS.md$1');
        content = content.replace(/:\s*1024([,\s}])/g, ': BREAKPOINTS.lg$1');
        content = content.replace(/:\s*640([,\s}])/g, ': BREAKPOINTS.sm$1');
        content = content.replace(/:\s*1280([,\s}])/g, ': BREAKPOINTS.xl$1');
        
        fixCount++;
      }
    }

    if (content !== originalContent) {
      writeFileSync(filePath, content);
      totalFixed += fixCount;
      fixedFiles.push(file);
// TODO: Replace with structured logging - console.log(`✅ Fixed ${fixCount} responsive issues in ${file}`);
    }
  }

// TODO: Replace with structured logging - console.log(`\n🎉 Responsive fixes complete!`);
// TODO: Replace with structured logging - console.log(`📊 Total fixes: ${totalFixed} in ${fixedFiles.length} files`);
  
  if (fixedFiles.length > 0) {
// TODO: Replace with structured logging - console.log(`\n📁 Files modified:`);
// TODO: Replace with structured logging - fixedFiles.forEach(file => console.log(`   - ${file}`));
  }

  // Show recommendations
// TODO: Replace with structured logging - console.log('\n📚 Next Steps:');
// TODO: Replace with structured logging - console.log('1. Review the changes to ensure they work correctly');
// TODO: Replace with structured logging - console.log('2. Test on different screen sizes');
// TODO: Replace with structured logging - console.log('3. Consider using ResponsiveValue<T> for component props');
// TODO: Replace with structured logging - console.log('4. Use RESPONSIVE_SPACING and RESPONSIVE_TYPOGRAPHY from @/lib/design/responsive');
}

// Run the script
try {
  fixResponsiveConsistency();
} catch (error) {
  console.error('Error:', error);
}