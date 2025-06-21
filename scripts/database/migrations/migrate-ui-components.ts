import { promises as fs } from 'fs';
import path from 'path';

async function migrateUIComponents() {
// TODO: Replace with structured logging - /* console.log('Starting UI components migration...') */;
  
  // 1. Create ValidationIcon in universal directory
  const validationIconContent = `import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/lib/theme/enhanced-theme-provider';
import { Symbol } from './Symbols';

interface ValidationIconProps {
  status: 'success' | 'error' | 'none';
  size?: number;
}

export function ValidationIcon({ status, size = 20 }: ValidationIconProps) {
  const theme = useTheme();
  
  if (status === 'none') return null;
  
  const iconName = status === 'success' ? 'checkmark.circle.fill' : 'xmark.circle.fill';
  const color = status === 'success' ? (theme.success || theme.accent) : theme.destructive;
  
  return (
    <View style={{ width: size, height: size }}>
      <Symbol 
        name={iconName} 
        size={size} 
        color={color}
      />
    </View>
  );
}
`;
  
  await fs.writeFile(
    path.join(process.cwd(), 'components/universal/ValidationIcon.tsx'),
    validationIconContent
  );
// TODO: Replace with structured logging - /* console.log('Created ValidationIcon in universal') */;
  
  // 2. Update imports from ui to universal
  const filesToUpdate = [
    'components/EnhancedDebugPanel.tsx',
    'components/ProfileCompletionFlowEnhanced.tsx',
    'components/healthcare/EscalationTimerResponsive.tsx',
    'components/healthcare/EscalationTimer.tsx',
    'app/(auth)/forgot-password.tsx',
    'app/(auth)/complete-profile-universal.tsx',
    'app/(home)/_layout.tsx',
    'components/navigation/AnimatedTabBar.tsx',
    'components/MobileDebugger.tsx',
    'components/universal/ErrorDisplay.tsx',
    'app/(auth)/register.tsx',
    'app/(auth)/login.tsx',
    'app/(auth)/complete-profile.tsx',
    'components/SimpleMobileDebugger.tsx',
    'components/WebTabBar.tsx',
    'components/OrganizationField.tsx',
    'components/shadcn/ui/input.tsx',
  ];
  
  for (const filePath of filesToUpdate) {
    try {
      const fullPath = path.join(process.cwd(), filePath);
      let content = await fs.readFile(fullPath, 'utf-8');
      let hasChanges = false;
      
      // Replace PrimaryButton imports
      if (content.includes("from '@/components/ui/PrimaryButton'") || 
          content.includes('from "@/components/ui/PrimaryButton"')) {
        content = content.replace(
          /import\s*{\s*PrimaryButton\s*}\s*from\s*['"]@\/components\/ui\/PrimaryButton['"]/g,
          "import { Button as PrimaryButton } from '@/components/universal'"
        );
        hasChanges = true;
      }
      
      // Replace IconSymbol imports
      if (content.includes("from '@/components/ui/IconSymbol'") || 
          content.includes('from "@/components/ui/IconSymbol"')) {
        content = content.replace(
          /import\s*{\s*IconSymbol\s*}\s*from\s*['"]@\/components\/ui\/IconSymbol['"]/g,
          "import { Symbol as IconSymbol } from '@/components/universal'"
        );
        hasChanges = true;
      }
      
      // Replace ValidationIcon imports
      if (content.includes("from '@/components/ui/ValidationIcon'") || 
          content.includes('from "@/components/ui/ValidationIcon"')) {
        content = content.replace(
          /import\s*{\s*ValidationIcon\s*}\s*from\s*['"]@\/components\/ui\/ValidationIcon['"]/g,
          "import { ValidationIcon } from '@/components/universal'"
        );
        hasChanges = true;
      }
      
      // Replace TabBarBackground imports (keep as is, it's platform specific)
      
      if (hasChanges) {
        await fs.writeFile(fullPath, content);
// TODO: Replace with structured logging - /* console.log(`Updated imports in: ${filePath}`) */;
      }
    } catch (error) {
      console.error(`Error updating ${filePath}:`, error);
    }
  }
  
// TODO: Replace with structured logging - /* console.log('Migration complete!') */;
}

migrateUIComponents().catch(console.error);