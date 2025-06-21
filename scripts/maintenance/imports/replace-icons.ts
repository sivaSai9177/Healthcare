#!/usr/bin/env bun

import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const universalComponentsDir = '/Users/sirigiri/Documents/coding-projects/my-expo/components/universal';

// Icon name mappings from Ionicons to SF Symbols
const iconMappings: Record<string, string> = {
  // Navigation
  'arrow-back': 'arrow.left',
  'arrow-forward': 'arrow.right',
  'arrow-up': 'arrow.up',
  'arrow-down': 'arrow.down',
  'chevron-back': 'chevron.left',
  'chevron-forward': 'chevron.right',
  'chevron-up': 'chevron.up',
  'chevron-down': 'chevron.down',
  
  // Actions
  'add': 'plus',
  'remove': 'minus',
  'close': 'xmark',
  'checkmark': 'checkmark',
  'search': 'magnifyingglass',
  'filter': 'line.3.horizontal.decrease',
  'settings': 'gearshape',
  'create': 'pencil',
  'trash': 'trash',
  'download': 'arrow.down.circle',
  'cloud-upload': 'arrow.up.circle',
  'share': 'square.and.arrow.up',
  'copy': 'doc.on.doc',
  
  // UI Elements
  'menu': 'line.3.horizontal',
  'ellipsis-horizontal': 'ellipsis',
  'ellipsis-vertical': 'ellipsis.vertical',
  'grid': 'square.grid.2x2',
  'list': 'list.bullet',
  'home': 'house',
  'person': 'person',
  'people': 'person.2',
  'notifications': 'bell',
  'calendar': 'calendar',
  'time': 'clock',
  
  // Status
  'information-circle': 'info.circle',
  'warning': 'exclamationmark.triangle',
  'close-circle': 'xmark.circle',
  'checkmark-circle': 'checkmark.circle',
  'help-circle': 'questionmark.circle',
  
  // Media
  'image': 'photo',
  'videocam': 'video',
  'camera': 'camera',
  'mic': 'mic',
  
  // Files
  'document': 'doc',
  'folder': 'folder',
  
  // Business/Healthcare
  'briefcase': 'briefcase',
  'heart': 'heart',
  'pulse': 'heart.text.square',
  'medkit': 'pills',
  
  // Social
  'thumbs-up': 'hand.thumbsup',
  'thumbs-down': 'hand.thumbsdown',
  'bookmark': 'bookmark',
  
  // Common UI
  'eye': 'eye',
  'eye-off': 'eye.slash',
  'lock-closed': 'lock',
  'lock-open': 'lock.open',
  'key': 'key',
  'shield': 'shield',
  
  // Communication
  'mail': 'envelope',
  'call': 'phone',
  'chatbox': 'message',
  
  // E-commerce
  'cart': 'cart',
  'card': 'creditcard',
  
  // Development
  'code': 'chevron.left.slash.chevron.right',
  'terminal': 'terminal',
  'bug': 'ant',
  
  // Math/Finance
  'calculator': 'plusminus.circle',
  'bar-chart': 'chart.bar',
  'trending-up': 'chart.line.uptrend.xyaxis',
  'pie-chart': 'chart.pie',
};

async function replaceIconsInFile(filePath: string) {
  try {
    let content = await readFile(filePath, 'utf8');
    let modified = false;

    // Replace Ionicons import
    if (content.includes("from '@expo/vector-icons'") && content.includes('Ionicons')) {
      // Add Symbols import
      if (!content.includes("from './Symbols'") && !content.includes('from "@/components/universal/Symbols"')) {
        content = content.replace(
          /import\s*{\s*Ionicons\s*}\s*from\s*['"]@expo\/vector-icons['"];?/g,
          "import { Symbol } from './Symbols';"
        );
        modified = true;
      }

      // Remove standalone Ionicons import
      content = content.replace(/import\s*{\s*Ionicons\s*}\s*from\s*['"]@expo\/vector-icons['"];?\s*\n/g, '');
      
      // Replace Ionicons usage with Symbol
      content = content.replace(/<Ionicons\s+name=["']([^"']+)["']/g, (match, iconName) => {
        const mappedName = iconMappings[iconName] || iconName;
        return `<Symbol name="${mappedName}"`;
      });

      // Replace icon prop references
      content = content.replace(/icon:\s*keyof\s+typeof\s+Ionicons\.glyphMap/g, 'icon: string');

      // Handle AnimatedIcon
      if (content.includes('AnimatedIcon')) {
        content = content.replace(
          /const\s+AnimatedIcon\s*=\s*Animated\.createAnimatedComponent\(Ionicons\);?/g,
          ''
        );
      }

      // Replace IconComponent logic
      content = content.replace(
        /const\s+IconComponent\s*=\s*animated\s*&&\s*isAnimated\s*&&\s*shouldAnimate\(\)\s*\?\s*AnimatedIcon\s*:\s*Ionicons;?/g,
        ''
      );

      // Update icon rendering
      content = content.replace(
        /<IconComponent\s+name={icon}/g,
        '<Symbol name={icon}'
      );
    }

    if (modified) {
      await writeFile(filePath, content);
// TODO: Replace with structured logging - /* console.log(`✅ Updated: ${filePath}`) */;
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error);
    return false;
  }
}

async function replaceAllIcons() {
// TODO: Replace with structured logging - /* console.log('🔄 Starting icon replacement...\n') */;
  
  const files = await readdir(universalComponentsDir);
  const tsxFiles = files.filter(f => f.endsWith('.tsx'));
  
  let updatedCount = 0;
  
  for (const file of tsxFiles) {
    const filePath = join(universalComponentsDir, file);
    const updated = await replaceIconsInFile(filePath);
    if (updated) updatedCount++;
  }
  
// TODO: Replace with structured logging - /* console.log(`\n✨ Icon replacement complete! Updated ${updatedCount} files.`) */;
}

// Run the replacement
replaceAllIcons().catch(console.error);