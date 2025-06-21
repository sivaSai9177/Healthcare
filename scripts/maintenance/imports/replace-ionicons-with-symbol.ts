import { promises as fs } from 'fs';
import path from 'path';

// Extended mapping from Ionicons names to Symbol names
const ioniconsToSymbolMap: Record<string, string> = {
  // Navigation
  'arrow-back': 'chevron.left',
  'arrow-forward': 'chevron.right',
  'arrow-up': 'arrow.up',
  'arrow-down': 'arrow.down',
  'chevron-back': 'chevron.left',
  'chevron-forward': 'chevron.right',
  'chevron-up': 'chevron.up',
  'chevron-down': 'chevron.down',
  'chevron-left': 'chevron.left',
  'chevron-right': 'chevron.right',
  
  // Actions
  'add': 'plus',
  'add-outline': 'plus',
  'remove': 'minus',
  'remove-outline': 'minus',
  'close': 'xmark',
  'close-outline': 'xmark',
  'checkmark': 'checkmark',
  'checkmark-outline': 'checkmark',
  'checkmark-circle': 'checkmark.circle.fill',
  'checkmark-circle-outline': 'checkmark.circle',
  'search': 'magnifyingglass',
  'search-outline': 'magnifyingglass',
  'filter': 'line.3.horizontal.decrease',
  'filter-outline': 'line.3.horizontal.decrease',
  'settings': 'gearshape.fill',
  'settings-outline': 'gearshape',
  'create': 'pencil',
  'create-outline': 'pencil',
  'pencil': 'pencil',
  'pencil-outline': 'pencil',
  'trash': 'trash',
  'trash-outline': 'trash',
  'download': 'arrow.down.circle',
  'download-outline': 'arrow.down.circle',
  'cloud-download': 'arrow.down.circle',
  'cloud-download-outline': 'arrow.down.circle',
  'share': 'square.and.arrow.up',
  'share-outline': 'square.and.arrow.up',
  'copy': 'doc.on.doc',
  'copy-outline': 'doc.on.doc',
  
  // UI Elements
  'menu': 'line.3.horizontal',
  'menu-outline': 'line.3.horizontal',
  'ellipsis-horizontal': 'ellipsis',
  'ellipsis-horizontal-outline': 'ellipsis',
  'ellipsis-vertical': 'ellipsis.vertical',
  'ellipsis-vertical-outline': 'ellipsis.vertical',
  'grid': 'square.grid.2x2',
  'grid-outline': 'square.grid.2x2',
  'list': 'list.bullet',
  'list-outline': 'list.bullet',
  'home': 'house.fill',
  'home-outline': 'house',
  'person': 'person.fill',
  'person-outline': 'person',
  'people': 'person.2.fill',
  'people-outline': 'person.2',
  'person-add': 'person.badge.plus',
  'person-add-outline': 'person.badge.plus',
  'notifications': 'bell.fill',
  'notifications-outline': 'bell',
  'calendar': 'calendar',
  'calendar-outline': 'calendar',
  'time': 'clock',
  'time-outline': 'clock',
  
  // Status
  'information-circle': 'info.circle.fill',
  'information-circle-outline': 'info.circle',
  'warning': 'exclamationmark.triangle.fill',
  'warning-outline': 'exclamationmark.triangle',
  'alert-circle': 'exclamationmark.circle.fill',
  'alert-circle-outline': 'exclamationmark.circle',
  'close-circle': 'xmark.circle.fill',
  'close-circle-outline': 'xmark.circle',
  'help-circle': 'questionmark.circle.fill',
  'help-circle-outline': 'questionmark.circle',
  
  // Media
  'image': 'photo',
  'image-outline': 'photo',
  'images': 'photo.stack',
  'images-outline': 'photo.stack',
  'camera': 'camera.fill',
  'camera-outline': 'camera',
  'videocam': 'video.fill',
  'videocam-outline': 'video',
  'mic': 'mic.fill',
  'mic-outline': 'mic',
  
  // Files
  'document': 'doc.fill',
  'document-outline': 'doc',
  'documents': 'doc.on.doc',
  'documents-outline': 'doc.on.doc',
  'folder': 'folder.fill',
  'folder-outline': 'folder',
  'folder-open': 'folder.open.fill',
  'folder-open-outline': 'folder.open',
  
  // Business/Healthcare
  'briefcase': 'briefcase.fill',
  'briefcase-outline': 'briefcase',
  'heart': 'heart.fill',
  'heart-outline': 'heart',
  'pulse': 'waveform.path.ecg',
  'medical': 'cross.case.fill',
  'medical-outline': 'cross.case',
  
  // Social
  'thumbs-up': 'hand.thumbsup.fill',
  'thumbs-up-outline': 'hand.thumbsup',
  'thumbs-down': 'hand.thumbsdown.fill',
  'thumbs-down-outline': 'hand.thumbsdown',
  'bookmark': 'bookmark.fill',
  'bookmark-outline': 'bookmark',
  'star': 'star.fill',
  'star-outline': 'star',
  'star-half': 'star.leadinghalf.filled',
  
  // Communication
  'mail': 'envelope.fill',
  'mail-outline': 'envelope',
  'call': 'phone.fill',
  'call-outline': 'phone',
  'chatbubble': 'message.fill',
  'chatbubble-outline': 'message',
  'send': 'paperplane.fill',
  'send-outline': 'paperplane',
  
  // Security
  'lock-closed': 'lock.fill',
  'lock-closed-outline': 'lock',
  'lock-open': 'lock.open.fill',
  'lock-open-outline': 'lock.open',
  'key': 'key.fill',
  'key-outline': 'key',
  'shield': 'shield.fill',
  'shield-outline': 'shield',
  'shield-checkmark': 'shield.checkmark.fill',
  'shield-checkmark-outline': 'shield.checkmark',
  
  // Others
  'eye': 'eye.fill',
  'eye-outline': 'eye',
  'eye-off': 'eye.slash.fill',
  'eye-off-outline': 'eye.slash',
  'refresh': 'arrow.clockwise',
  'refresh-outline': 'arrow.clockwise',
  'log-out': 'rectangle.portrait.and.arrow.right',
  'log-out-outline': 'rectangle.portrait.and.arrow.right',
  'log-in': 'rectangle.portrait.and.arrow.forward',
  'log-in-outline': 'rectangle.portrait.and.arrow.forward',
  'radio-button-on': 'circle.fill',
  'radio-button-off': 'circle',
  'checkbox': 'checkmark.square.fill',
  'checkbox-outline': 'checkmark.square',
  'square': 'square.fill',
  'square-outline': 'square',
  'circle': 'circle.fill',
  'circle-outline': 'circle',
  'arrow-up-circle': 'arrow.up.circle.fill',
  'arrow-up-circle-outline': 'arrow.up.circle',
  'compass': 'safari.fill',
  'compass-outline': 'safari',
  'cube': 'cube.fill',
  'cube-outline': 'cube',
  'color-palette': 'paintpalette.fill',
  'color-palette-outline': 'paintpalette',
  'rocket': 'airplane',
  'rocket-outline': 'airplane',
};

async function replaceIoniconsInFile(filePath: string): Promise<boolean> {
  try {
    let content = await fs.readFile(filePath, 'utf-8');
    let hasChanges = false;

    // Remove Ionicons import
    if (content.includes("from '@expo/vector-icons'") || content.includes('from "@expo/vector-icons"')) {
      content = content.replace(/import\s*{\s*Ionicons\s*}\s*from\s*['"]@expo\/vector-icons['"];?\s*\n?/g, '');
      hasChanges = true;
    }

    // Add Symbol import if not present and Ionicons was used
    if (content.includes('<Ionicons') && !content.includes("from './Symbols'") && !content.includes('from "./Symbols"')) {
      // Find the last import statement
      const importMatches = content.match(/^import.*$/gm);
      if (importMatches) {
        const lastImport = importMatches[importMatches.length - 1];
        const lastImportIndex = content.lastIndexOf(lastImport);
        content = content.slice(0, lastImportIndex + lastImport.length) + 
                  "\nimport { Symbol } from './Symbols';" + 
                  content.slice(lastImportIndex + lastImport.length);
        hasChanges = true;
      }
    }

    // Replace Ionicons components with Symbol
    const ioniconsRegex = /<Ionicons\s+([^>]+)>/g;
    let match;
    
    while ((match = ioniconsRegex.exec(content)) !== null) {
      const fullMatch = match[0];
      const attributes = match[1];
      
      // Extract name attribute
      const nameMatch = attributes.match(/name=["'{]([^"'}]+)["'}]/);
      if (nameMatch) {
        const iconName = nameMatch[1];
        const symbolName = ioniconsToSymbolMap[iconName] || iconName;
        
        // Replace the component
        let newComponent = fullMatch
          .replace('Ionicons', 'Symbol')
          .replace(/name=["'{][^"'}]+["'}]/, `name="${symbolName}"`);
        
        // Handle color prop (Symbol uses color prop the same way)
        // Size prop works the same
        
        content = content.replace(fullMatch, newComponent);
        hasChanges = true;
      }
    }

    // Handle Ionicons.glyphMap references
    content = content.replace(/Ionicons\.glyphMap/g, 'any');
    
    if (hasChanges) {
      await fs.writeFile(filePath, content);
// TODO: Replace with structured logging - /* console.log(`Updated: ${filePath}`) */;
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    return false;
  }
}

async function findAndReplaceIonicons(dir: string): Promise<void> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      // Skip node_modules and other irrelevant directories
      if (!['node_modules', '.git', 'dist', 'build', '.next', '.expo'].includes(entry.name)) {
        await findAndReplaceIonicons(fullPath);
      }
    } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
      await replaceIoniconsInFile(fullPath);
    }
  }
}

async function main() {
  const componentsDir = path.join(process.cwd(), 'components');
  const appDir = path.join(process.cwd(), 'app');
  
// TODO: Replace with structured logging - /* console.log('Starting Ionicons to Symbol migration...') */;
  
  await findAndReplaceIonicons(componentsDir);
  await findAndReplaceIonicons(appDir);
  
// TODO: Replace with structured logging - /* console.log('Migration complete!') */;
}

main().catch(console.error);