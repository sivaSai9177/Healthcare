#!/usr/bin/env bun

import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const componentsDir = '/Users/sirigiri/Documents/coding-projects/my-expo/components';

// Lucide-react to SF Symbols mappings
const lucideToSymbolMappings: Record<string, string> = {
  // Navigation
  'ChevronRight': 'chevron.right',
  'ChevronLeft': 'chevron.left',
  'ChevronDown': 'chevron.down',
  'ChevronUp': 'chevron.up',
  'ArrowLeft': 'arrow.left',
  'ArrowRight': 'arrow.right',
  'ArrowUp': 'arrow.up',
  'ArrowDown': 'arrow.down',
  
  // Actions
  'Plus': 'plus',
  'Minus': 'minus',
  'X': 'xmark',
  'Check': 'checkmark',
  'Search': 'magnifyingglass',
  'Filter': 'line.3.horizontal.decrease',
  'Settings': 'gearshape',
  'Settings2': 'gearshape.2',
  'Edit': 'pencil',
  'Trash': 'trash',
  'Download': 'arrow.down.circle',
  'Upload': 'arrow.up.circle',
  'Share': 'square.and.arrow.up',
  'Copy': 'doc.on.doc',
  
  // UI Elements
  'Menu': 'line.3.horizontal',
  'MoreHorizontal': 'ellipsis',
  'MoreVertical': 'ellipsis.vertical',
  'Grid': 'square.grid.2x2',
  'List': 'list.bullet',
  'Home': 'house',
  'User': 'person',
  'Users': 'person.2',
  'Bell': 'bell',
  'Calendar': 'calendar',
  'Clock': 'clock',
  
  // Status
  'Info': 'info.circle',
  'AlertCircle': 'exclamationmark.circle',
  'AlertTriangle': 'exclamationmark.triangle',
  'CheckCircle': 'checkmark.circle',
  'XCircle': 'xmark.circle',
  'HelpCircle': 'questionmark.circle',
  
  // Media
  'Image': 'photo',
  'Video': 'video',
  'Camera': 'camera',
  'Mic': 'mic',
  
  // Files
  'File': 'doc',
  'Folder': 'folder',
  'FileText': 'doc.text',
  
  // Business
  'Briefcase': 'briefcase',
  'Heart': 'heart',
  'Star': 'star',
  'Shield': 'shield',
  'Lock': 'lock',
  'Unlock': 'lock.open',
  'Key': 'key',
  
  // Communication
  'Mail': 'envelope',
  'Phone': 'phone',
  'MessageSquare': 'message',
  
  // Development
  'Code': 'chevron.left.slash.chevron.right',
  'Terminal': 'terminal',
  'SquareTerminal': 'terminal',
  'Bug': 'ant',
  
  // Charts
  'BarChart': 'chart.bar',
  'LineChart': 'chart.line.uptrend.xyaxis',
  'PieChart': 'chart.pie',
  
  // Specific app icons
  'AudioWaveform': 'waveform',
  'BookOpen': 'book.open',
  'Bot': 'cpu',
  'Command': 'command',
  'Frame': 'square.dashed',
  'GalleryVerticalEnd': 'square.grid.3x3',
  'Map': 'map',
  
  // More icons
  'LogOut': 'arrow.right.square',
  'BadgeCheck': 'checkmark.seal',
  'ChevronsUpDown': 'chevron.up.chevron.down',
  'Sparkles': 'sparkles',
  'CreditCard': 'creditcard',
  'LifeBuoy': 'lifepreserver',
  'Send': 'paperplane',
};

// Convert PascalCase to kebab-case for icon names
function toKebabCase(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

async function replaceLucideInFile(filePath: string) {
  try {
    let content = await readFile(filePath, 'utf8');
    let modified = false;

    // Skip if it's the Symbols component itself
    if (filePath.includes('Symbols.tsx')) {
      return false;
    }

    // Check if file imports from lucide-react
    if (content.includes('from "lucide-react"') || content.includes("from 'lucide-react'")) {
// TODO: Replace with structured logging - console.log(`\n📄 Processing: ${filePath}`);
      
      // Extract lucide imports
      const importMatch = content.match(/import\s*{([^}]+)}\s*from\s*["']lucide-react["']/);
      if (importMatch) {
        const imports = importMatch[1].split(',').map(i => i.trim());
        const iconImports = imports.filter(i => i !== 'type LucideIcon' && i !== 'LucideIcon');
        
// TODO: Replace with structured logging - console.log(`  Found icons: ${iconImports.join(', ')}`);
        
        // Replace import statement
        if (iconImports.length > 0) {
          // Add Symbol import
          const hasSymbolImport = content.includes('import { Symbol') || content.includes('import { Symbol,');
          if (!hasSymbolImport) {
            // Add Symbol import after lucide import
            content = content.replace(
              /import\s*{[^}]+}\s*from\s*["']lucide-react["'];?\s*\n/,
              `import { Symbol } from '@/components/universal/Symbols';\n`
            );
          } else {
            // Just remove lucide import
            content = content.replace(
              /import\s*{[^}]+}\s*from\s*["']lucide-react["'];?\s*\n/,
              ''
            );
          }
          
          // Replace icon usage
          for (const iconName of iconImports) {
            const symbolName = lucideToSymbolMappings[iconName] || toKebabCase(iconName);
            
            // Replace JSX usage <IconName ... />
            const jsxPattern = new RegExp(`<${iconName}\\s*([^>]*)\\s*/?>`, 'g');
            content = content.replace(jsxPattern, (match, attrs) => {
              // Extract className and size if present
              const classMatch = attrs.match(/className=["']([^"']+)["']/);
              const sizeMatch = attrs.match(/size={([^}]+)}/);
              
              let newAttrs = `name="${symbolName}"`;
              if (sizeMatch) {
                newAttrs += ` size={${sizeMatch[1]}}`;
              }
              if (classMatch) {
                newAttrs += ` className="${classMatch[1]}"`;
              }
              
              // Copy other attributes
              const otherAttrs = attrs
                .replace(/className=["'][^"']+["']/, '')
                .replace(/size={[^}]+}/, '')
                .trim();
              if (otherAttrs) {
                newAttrs += ' ' + otherAttrs;
              }
              
              return `<Symbol ${newAttrs} />`;
            });
            
            // Replace icon as component prop (e.g., icon: Settings)
            const propPattern = new RegExp(`icon:\\s*${iconName}([,\\s}])`, 'g');
            content = content.replace(propPattern, `icon: "${symbolName}"$1`);
            
            // Replace in arrays/objects (e.g., logo: AudioWaveform)
            const objPattern = new RegExp(`(logo|icon):\\s*${iconName}([,\\s}])`, 'g');
            content = content.replace(objPattern, `$1: "${symbolName}"$2`);
          }
          
          modified = true;
        }
      }
      
      // Handle type LucideIcon
      if (content.includes('LucideIcon')) {
        content = content.replace(/:\s*LucideIcon/g, ': string');
        content = content.replace(/icon\?\s*:\s*LucideIcon/g, 'icon?: string');
        modified = true;
      }
    }

    if (modified) {
      await writeFile(filePath, content);
// TODO: Replace with structured logging - console.log(`  ✅ Updated successfully`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error);
    return false;
  }
}

async function processDirectory(dir: string): Promise<number> {
  const entries = await readdir(dir, { withFileTypes: true });
  let count = 0;

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
      count += await processDirectory(fullPath);
    } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
      const updated = await replaceLucideInFile(fullPath);
      if (updated) count++;
    }
  }

  return count;
}

async function main() {
// TODO: Replace with structured logging - console.log('🔄 Starting lucide-react icon replacement...\n');
  
  const updatedCount = await processDirectory(componentsDir);
  
// TODO: Replace with structured logging - console.log(`\n✨ Icon replacement complete! Updated ${updatedCount} files.`);
// TODO: Replace with structured logging - console.log('\n📝 Next steps:');
// TODO: Replace with structured logging - console.log('1. Review the changes');
// TODO: Replace with structured logging - console.log('2. Update any icon prop types from LucideIcon to string');
// TODO: Replace with structured logging - console.log('3. Test the components');
// TODO: Replace with structured logging - console.log('4. Remove lucide-react from package.json');
}

// Run the script
main().catch(console.error);