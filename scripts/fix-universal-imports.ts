#!/usr/bin/env bun
import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

// Map of component names to their correct import paths
const componentMap = {
  // Typography
  'Text': '@/components/universal/typography',
  'Heading': '@/components/universal/typography',
  'Label': '@/components/universal/typography',
  'ThemedText': '@/components/universal/typography',
  'ThemedView': '@/components/universal/typography',
  
  // Display
  'Avatar': '@/components/universal/display',
  'Badge': '@/components/universal/display',
  'Card': '@/components/universal/display',
  'CardHeader': '@/components/universal/display',
  'CardTitle': '@/components/universal/display',
  'CardDescription': '@/components/universal/display',
  'CardContent': '@/components/universal/display',
  'CardFooter': '@/components/universal/display',
  'Chip': '@/components/universal/display',
  'EmptyState': '@/components/universal/display',
  'List': '@/components/universal/display',
  'Rating': '@/components/universal/display',
  'Stats': '@/components/universal/display',
  'Symbol': '@/components/universal/display/Symbols',
  'Symbols': '@/components/universal/display/Symbols',
  'Table': '@/components/universal/display',
  'TableHeader': '@/components/universal/display',
  'TableBody': '@/components/universal/display',
  'TableRow': '@/components/universal/display',
  'TableCell': '@/components/universal/display',
  'Tag': '@/components/universal/display',
  'Timeline': '@/components/universal/display',
  
  // Layout
  'Box': '@/components/universal/layout',
  'Container': '@/components/universal/layout',
  'Divider': '@/components/universal/layout',
  'Grid': '@/components/universal/layout',
  'ScrollArea': '@/components/universal/layout',
  'ScrollContainer': '@/components/universal/layout',
  'ScrollHeader': '@/components/universal/layout',
  'Separator': '@/components/universal/layout',
  'Spacer': '@/components/universal/layout',
  'Stack': '@/components/universal/layout',
  'VStack': '@/components/universal/layout',
  'HStack': '@/components/universal/layout',
  'ZStack': '@/components/universal/layout',
  
  // Feedback
  'Alert': '@/components/universal/feedback',
  'AlertTitle': '@/components/universal/feedback',
  'AlertDescription': '@/components/universal/feedback',
  'ErrorDisplay': '@/components/universal/feedback',
  'LoadingView': '@/components/universal/feedback',
  'Progress': '@/components/universal/feedback',
  'Skeleton': '@/components/universal/feedback',
  'Spinner': '@/components/universal/feedback',
  'Toast': '@/components/universal/feedback',
  'ValidationIcon': '@/components/universal/feedback',
  
  // Form
  'Checkbox': '@/components/universal/form',
  'ColorPicker': '@/components/universal/form',
  'DatePicker': '@/components/universal/form',
  'FilePicker': '@/components/universal/form',
  'Form': '@/components/universal/form',
  'FormItem': '@/components/universal/form',
  'Input': '@/components/universal/form',
  'RadioGroup': '@/components/universal/form',
  'Select': '@/components/universal/form',
  'SelectTrigger': '@/components/universal/form',
  'SelectValue': '@/components/universal/form',
  'SelectContent': '@/components/universal/form',
  'SelectItem': '@/components/universal/form',
  'Slider': '@/components/universal/form',
  'Switch': '@/components/universal/form',
  'TextArea': '@/components/universal/form',
  'TimePicker': '@/components/universal/form',
  'Toggle': '@/components/universal/form',
  
  // Interaction
  'Accordion': '@/components/universal/interaction',
  'Button': '@/components/universal/interaction',
  'Collapsible': '@/components/universal/interaction',
  'Command': '@/components/universal/interaction',
  'Search': '@/components/universal/interaction',
  
  // Navigation
  'Breadcrumb': '@/components/universal/navigation',
  'Link': '@/components/universal/navigation',
  'Navbar': '@/components/universal/navigation',
  'NavigationMenu': '@/components/universal/navigation',
  'Pagination': '@/components/universal/navigation',
  'Sidebar': '@/components/universal/navigation',
  'Stepper': '@/components/universal/navigation',
  'Tabs': '@/components/universal/navigation',
  'TabsList': '@/components/universal/navigation',
  'TabsTrigger': '@/components/universal/navigation',
  'TabsContent': '@/components/universal/navigation',
  
  // Overlay
  'ContextMenu': '@/components/universal/overlay',
  'Dialog': '@/components/universal/overlay',
  'DialogContent': '@/components/universal/overlay',
  'DialogHeader': '@/components/universal/overlay',
  'DialogTitle': '@/components/universal/overlay',
  'DialogDescription': '@/components/universal/overlay',
  'DialogFooter': '@/components/universal/overlay',
  'Drawer': '@/components/universal/overlay',
  'DropdownMenu': '@/components/universal/overlay',
  'Popover': '@/components/universal/overlay',
  'Sheet': '@/components/universal/overlay',
  'Tooltip': '@/components/universal/overlay',
};

async function processFile(filePath: string) {
  try {
    const content = await readFile(filePath, 'utf-8');
    
    // Check if file imports from @/components/universal
    if (!content.includes("from '@/components/universal'")) {
      return;
    }
    
    console.log(`Processing: ${filePath}`);
    
    // Find all imports from @/components/universal
    const importRegex = /import\s*{\s*([^}]+)\s*}\s*from\s*['"]@\/components\/universal['"];?/g;
    let newContent = content;
    let hasChanges = false;
    
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      const importedItems = match[1]
        .split(',')
        .map(item => item.trim())
        .filter(Boolean);
      
      // Group imports by their correct path
      const importGroups: Record<string, string[]> = {};
      
      for (const item of importedItems) {
        const componentName = item.split(' as ')[0].trim();
        const importPath = componentMap[componentName];
        
        if (importPath) {
          if (!importGroups[importPath]) {
            importGroups[importPath] = [];
          }
          importGroups[importPath].push(item);
        } else {
          console.warn(`  ⚠️  Unknown component: ${componentName}`);
        }
      }
      
      // Build new import statements
      const newImports = Object.entries(importGroups)
        .map(([path, items]) => `import { ${items.join(', ')} } from '${path}';`)
        .join('\n');
      
      // Replace the old import
      newContent = newContent.replace(match[0], newImports);
      hasChanges = true;
    }
    
    if (hasChanges) {
      await writeFile(filePath, newContent);
      console.log(`  ✅ Fixed imports in ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
}

async function processDirectory(dir: string) {
  const entries = await readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    
    if (entry.isDirectory()) {
      // Skip node_modules and other irrelevant directories
      if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
        await processDirectory(fullPath);
      }
    } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
      await processFile(fullPath);
    }
  }
}

// Main execution
async function main() {
  console.log('🔧 Fixing universal component imports...\n');
  
  const componentsDir = join(process.cwd(), 'components', 'blocks');
  await processDirectory(componentsDir);
  
  console.log('\n✨ Import fixes complete!');
}

main().catch(console.error);