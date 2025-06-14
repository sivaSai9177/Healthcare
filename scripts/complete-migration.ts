#!/usr/bin/env ts-node

/**
 * Complete migration script for all universal components
 * This script will:
 * 1. Add responsive system to all components
 * 2. Implement useShadow hook where appropriate
 * 3. Complete Tailwind migration
 * 4. Add missing hover states
 * 5. Ensure density support
 */

import * as fs from 'fs';
import * as path from 'path';

const componentsDir = path.join(__dirname, '../components/universal');

// Components that need responsive support
const componentsNeedingResponsive = [
  'Text.tsx', 'Button.tsx', 'Card.tsx', 'Input.tsx', 'Select.tsx',
  'Badge.tsx', 'Alert.tsx', 'Dialog.tsx', 'Container.tsx', 'Tabs.tsx',
  'Breadcrumb.tsx', 'Pagination.tsx', 'Avatar.tsx', 'Skeleton.tsx',
  'Progress.tsx', 'Table.tsx', 'List.tsx', 'Timeline.tsx'
];

// Components that need shadow support
const componentsNeedingShadow = [
  'Button.tsx', 'Card.tsx', 'Input.tsx', 'Select.tsx', 'Badge.tsx',
  'Alert.tsx', 'Dialog.tsx', 'Drawer.tsx', 'Popover.tsx', 'Tooltip.tsx',
  'Sheet.tsx', 'Toast.tsx', 'DropdownMenu.tsx', 'ContextMenu.tsx',
  'CommandPalette.tsx', 'Avatar.tsx', 'DatePicker.tsx', 'ColorPicker.tsx'
];

// Components still using theme imports
const componentsNeedingTailwind = [
  'Container.tsx', 'Tabs.tsx', 'Dialog.tsx', 'Drawer.tsx', 'Popover.tsx',
  'Tooltip.tsx', 'Toast.tsx', 'DropdownMenu.tsx', 'ContextMenu.tsx',
  'NavigationMenu.tsx', 'Breadcrumb.tsx', 'Pagination.tsx', 'Link.tsx',
  'Table.tsx', 'List.tsx', 'Timeline.tsx', 'Stepper.tsx', 'Rating.tsx'
];

// Import additions for responsive support
const responsiveImports = `import { useResponsive, useResponsiveValue } from '@/hooks/useResponsive';
import { ResponsiveValue } from '@/lib/design/responsive';`;

// Import for shadow support
const shadowImport = `import { useShadow } from '@/hooks/useShadow';`;

// Helper to add imports if not present
function addImportsIfNeeded(content: string, imports: string): string {
  if (!content.includes(imports)) {
    // Add after last import
    const lastImportIndex = content.lastIndexOf('import ');
    const lineEnd = content.indexOf('\n', lastImportIndex);
    return content.slice(0, lineEnd) + '\n' + imports + content.slice(lineEnd);
  }
  return content;
}

// Helper to add responsive hook usage
function addResponsiveHook(content: string): string {
  if (!content.includes('useResponsive()')) {
    // Find where other hooks are used
    const hookPattern = /const \{.*?\} = use\w+\(\);/;
    const match = content.match(hookPattern);
    if (match) {
      const insertPoint = content.indexOf(match[0]) + match[0].length;
      return content.slice(0, insertPoint) + 
        '\n  const { isMobile, isTablet, isDesktop } = useResponsive();' +
        content.slice(insertPoint);
    }
  }
  return content;
}

// Helper to replace theme usage with Tailwind
function replaceThemeWithTailwind(content: string): string {
  // Replace common theme patterns
  content = content.replace(/theme\.colors\./g, '');
  content = content.replace(/theme\.primary/g, 'text-primary');
  content = content.replace(/theme\.secondary/g, 'text-secondary');
  content = content.replace(/theme\.destructive/g, 'text-destructive');
  content = content.replace(/theme\.muted/g, 'text-muted');
  content = content.replace(/theme\.foreground/g, 'text-foreground');
  content = content.replace(/theme\.background/g, 'bg-background');
  content = content.replace(/theme\.border/g, 'border-border');
  
  // Remove useTheme imports
  content = content.replace(/import \{ useTheme \} from ['"].*?['"];?\n/g, '');
  content = content.replace(/const.*?theme.*?=.*?useTheme\(\);?\n/g, '');
  
  return content;
}

// Process each component
async function processComponent(componentPath: string) {
  try {
    let content = fs.readFileSync(componentPath, 'utf8');
    const componentName = path.basename(componentPath);
    
// TODO: Replace with structured logging - console.log(`Processing ${componentName}...`);
    
    // Add responsive support
    if (componentsNeedingResponsive.includes(componentName)) {
      content = addImportsIfNeeded(content, responsiveImports);
      content = addResponsiveHook(content);
      
      // Make size props responsive
      content = content.replace(/size\?: ['"]sm['"] \| ['"]md['"] \| ['"]lg['"]/g, 
        "size?: ResponsiveValue<'sm' | 'md' | 'lg'>");
    }
    
    // Add shadow support
    if (componentsNeedingShadow.includes(componentName)) {
      content = addImportsIfNeeded(content, shadowImport);
      
      // Add shadow prop to interface
      if (!content.includes('shadow?:')) {
        const interfaceMatch = content.match(/interface \w+Props[^{]*{/);
        if (interfaceMatch) {
          const insertPoint = content.indexOf(interfaceMatch[0]) + interfaceMatch[0].length;
          content = content.slice(0, insertPoint) + 
            "\n  // Shadow\n  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';" +
            content.slice(insertPoint);
        }
      }
    }
    
    // Complete Tailwind migration
    if (componentsNeedingTailwind.includes(componentName)) {
      content = replaceThemeWithTailwind(content);
    }
    
    // Add hover states to Input if needed
    if (componentName === 'Input.tsx' && !content.includes('isHovered')) {
      // Add hover state
      const statePattern = /const \[isFocused, setIsFocused\] = useState/;
      const match = content.match(statePattern);
      if (match) {
        const lineEnd = content.indexOf('\n', content.indexOf(match[0]));
        content = content.slice(0, lineEnd + 1) + 
          '  const [isHovered, setIsHovered] = useState(false);\n' +
          content.slice(lineEnd + 1);
      }
    }
    
    // Write back
    fs.writeFileSync(componentPath, content);
// TODO: Replace with structured logging - console.log(`✅ Completed ${componentName}`);
    
  } catch (error) {
    console.error(`❌ Error processing ${componentPath}:`, error);
  }
}

// Main execution
async function main() {
// TODO: Replace with structured logging - console.log('Starting comprehensive component migration...\n');
  
  const components = fs.readdirSync(componentsDir)
    .filter(f => f.endsWith('.tsx') && !f.includes('.test.'));
  
  for (const component of components) {
    await processComponent(path.join(componentsDir, component));
  }
  
// TODO: Replace with structured logging - console.log('\n✅ Migration complete!');
// TODO: Replace with structured logging - console.log('\nNext steps:');
// TODO: Replace with structured logging - console.log('1. Run type checking: npm run typecheck');
// TODO: Replace with structured logging - console.log('2. Run linting: npm run lint');
// TODO: Replace with structured logging - console.log('3. Test components: npm run test');
// TODO: Replace with structured logging - console.log('4. Update blocks to use responsive components');
}

// Run the migration
main().catch(console.error);