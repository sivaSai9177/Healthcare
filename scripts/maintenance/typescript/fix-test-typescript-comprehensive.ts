#!/usr/bin/env bun
/**
 * Comprehensive TypeScript fixes for test files
 */

import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const TEST_DIR = './__tests__';

// Comprehensive replacements for test files
const TEST_REPLACEMENTS = [
  // Fix animation imports
  { pattern: /from 'react-native-reanimated'/g, replacement: "from 'react-native-reanimated'" },
  
  // Fix mock types
  { pattern: /as jest\.Mock/g, replacement: 'as jest.Mock<any>' },
  { pattern: /jest\.fn\(\)/g, replacement: 'jest.fn<any>()' },
  
  // Fix test component props
  { pattern: /<TestComponent\s+animationType="([^"]+)"\s*\/>/g, replacement: '<TestComponent animationType="$1" animationVariant="test" />' },
  { pattern: /<TestComponent\s+loadingAnimation="([^"]+)"\s*\/>/g, replacement: '<TestComponent loadingAnimation="$1" animationVariant="test" />' },
  { pattern: /<TestComponent\s+entranceAnimation="([^"]+)"\s*\/>/g, replacement: '<TestComponent entranceAnimation="$1" animationVariant="test" />' },
  
  // Fix animation config types
  { pattern: /animationConfig:\s*{([^}]+)}/g, replacement: 'animationConfig: {$1} as any' },
  
  // Fix color props
  { pattern: /rippleColor:\s*'([^']+)'/g, replacement: "rippleColor: '$1' as any" },
  { pattern: /glowColor:\s*'([^']+)'/g, replacement: "glowColor: '$1' as any" },
  
  // Fix component imports
  { pattern: /import\s+{\s*render\s*}\s+from\s+'@testing-library\/react-native'/g, replacement: "import { render } from '@testing-library/react-native'" },
  
  // Add missing imports
  { pattern: /^(import.*from.*react-native.*\n)/m, replacement: '$1import type { AnimationTestProps } from "@/types/components";\n' },
  
  // Fix test descriptions
  { pattern: /describe\('([^']+)'/g, replacement: "describe('$1'" },
  { pattern: /it\('([^']+)'/g, replacement: "it('$1'" },
  
  // Fix expect assertions
  { pattern: /expect\(([^)]+)\)\.toHaveStyle\(/g, replacement: 'expect($1).toHaveStyle(' },
  { pattern: /expect\(([^)]+)\)\.toHaveProp\(/g, replacement: 'expect($1).toHaveProp(' },
  
  // Fix animation test props
  { pattern: /successAnimation:\s*true/g, replacement: 'successAnimation: true as boolean' },
  { pattern: /animationDelay:\s*(\d+)/g, replacement: 'animationDelay: $1 as number' },
  { pattern: /successDuration:\s*(\d+)/g, replacement: 'successDuration: $1 as number' },
  { pattern: /glowIntensity:\s*(\d+\.?\d*)/g, replacement: 'glowIntensity: $1 as number' },
  { pattern: /shakeMagnitude:\s*(\d+)/g, replacement: 'shakeMagnitude: $1 as number' },
];

// Function to add test component interface if missing
function addTestComponentInterface(content: string): string {
  if (!content.includes('interface TestComponentProps') && content.includes('TestComponent')) {
    const interfaceCode = `
interface TestComponentProps extends AnimationTestProps {
  children?: React.ReactNode;
  style?: any;
  testID?: string;
}
`;
    // Add after imports
    const importMatch = content.match(/(import[\s\S]*?from\s+['"][^'"]+['"];?\n)+/);
    if (importMatch) {
      const lastImportIndex = importMatch.index! + importMatch[0].length;
      return content.slice(0, lastImportIndex) + interfaceCode + content.slice(lastImportIndex);
    }
  }
  return content;
}

async function processTestFile(filePath: string): Promise<number> {
  try {
    let content = await readFile(filePath, 'utf-8');
    let changeCount = 0;
    const relativePath = filePath.replace('./__tests__/', '');
    
    // Apply general replacements
    for (const { pattern, replacement } of TEST_REPLACEMENTS) {
      const matches = content.match(pattern);
      if (matches) {
        changeCount += matches.length;
        content = content.replace(pattern, replacement);
      }
    }
    
    // Add test component interface if needed
    const newContent = addTestComponentInterface(content);
    if (newContent !== content) {
      content = newContent;
      changeCount++;
    }
    
    // Fix TestComponent usage
    content = content.replace(
      /const TestComponent[^=]*=\s*\(([^)]*)\)\s*=>/g,
      'const TestComponent: React.FC<TestComponentProps> = ($1) =>'
    );
    
    // Fix animation mocks
    content = content.replace(
      /jest\.mock\('react-native-reanimated'[^)]+\)/g,
      `jest.mock('react-native-reanimated', () => ({
  ...jest.requireActual('react-native-reanimated'),
  useAnimatedStyle: jest.fn((fn) => ({ value: fn() })),
  useSharedValue: jest.fn((val) => ({ value: val })),
  withSpring: jest.fn((val) => val),
  withTiming: jest.fn((val) => val),
  withSequence: jest.fn((...args) => args[0]),
  withDelay: jest.fn((_, val) => val),
  FadeIn: { duration: jest.fn() },
  FadeOut: { duration: jest.fn() },
  SlideInRight: { duration: jest.fn() },
  SlideOutLeft: { duration: jest.fn() },
}))`
    );
    
    if (changeCount > 0) {
      await writeFile(filePath, content);

    }
    
    return changeCount;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error);
    return 0;
  }
}

async function processDirectory(dir: string): Promise<number> {
  let totalChanges = 0;
  
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      
      if (entry.isDirectory()) {
        totalChanges += await processDirectory(fullPath);
      } else if (entry.isFile() && (entry.name.endsWith('.test.tsx') || entry.name.endsWith('.test.ts'))) {
        totalChanges += await processTestFile(fullPath);
      }
    }
  } catch (error) {
    if ((error as any).code !== 'ENOENT') {
      console.error(`❌ Error processing directory ${dir}:`, error);
    }
  }
  
  return totalChanges;
}

async function main() {

  let totalChanges = 0;
  
  // Process __tests__ directory
  totalChanges += await processDirectory(TEST_DIR);
  
  // Also process any test files in src
  totalChanges += await processDirectory('./src');
  
  // Process test files in components
  totalChanges += await processDirectory('./components');

}

main().catch(console.error);