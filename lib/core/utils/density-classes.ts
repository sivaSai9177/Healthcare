/**
 * Utility functions for density-aware Tailwind classes
 * Maps spacing density settings to appropriate Tailwind classes
 */

import { SpacingDensity } from '@/lib/design/spacing';
import { useSpacing } from '@/lib/stores/spacing-store';

// Map density to Tailwind spacing multipliers
const DENSITY_CLASS_MAP = {
  compact: {
    // Padding
    p: { sm: 'p-2', md: 'p-3', lg: 'p-4', xl: 'p-5' },
    px: { sm: 'px-2', md: 'px-3', lg: 'px-4', xl: 'px-5' },
    py: { sm: 'py-1.5', md: 'py-2', lg: 'py-2.5', xl: 'py-3' },
    
    // Gap
    gap: { sm: 'gap-1.5', md: 'gap-2', lg: 'gap-3', xl: 'gap-4' },
    
    // Text size
    text: { sm: 'text-xs', md: 'text-sm', lg: 'text-base', xl: 'text-lg' },
    
    // Component sizes
    button: { sm: 'h-8', md: 'h-9', lg: 'h-10', xl: 'h-11' },
    input: { sm: 'h-8', md: 'h-9', lg: 'h-10', xl: 'h-11' },
  },
  medium: {
    // Padding
    p: { sm: 'p-3', md: 'p-4', lg: 'p-6', xl: 'p-8' },
    px: { sm: 'px-3', md: 'px-4', lg: 'px-6', xl: 'px-8' },
    py: { sm: 'py-2', md: 'py-2.5', lg: 'py-3', xl: 'py-4' },
    
    // Gap
    gap: { sm: 'gap-2', md: 'gap-3', lg: 'gap-4', xl: 'gap-6' },
    
    // Text size
    text: { sm: 'text-sm', md: 'text-base', lg: 'text-lg', xl: 'text-xl' },
    
    // Component sizes
    button: { sm: 'h-9', md: 'h-11', lg: 'h-13', xl: 'h-15' },
    input: { sm: 'h-9', md: 'h-11', lg: 'h-13', xl: 'h-15' },
  },
  large: {
    // Padding
    p: { sm: 'p-4', md: 'p-6', lg: 'p-8', xl: 'p-10' },
    px: { sm: 'px-4', md: 'px-6', lg: 'px-8', xl: 'px-10' },
    py: { sm: 'py-3', md: 'py-3', lg: 'py-4', xl: 'py-5' },
    
    // Gap
    gap: { sm: 'gap-3', md: 'gap-4', lg: 'gap-6', xl: 'gap-8' },
    
    // Text size
    text: { sm: 'text-base', md: 'text-lg', lg: 'text-xl', xl: 'text-2xl' },
    
    // Component sizes
    button: { sm: 'h-11', md: 'h-13', lg: 'h-15', xl: 'h-17' },
    input: { sm: 'h-11', md: 'h-13', lg: 'h-15', xl: 'h-17' },
  },
} as const;

type SpacingSize = 'sm' | 'md' | 'lg' | 'xl';

/**
 * Get density-aware class for a specific property
 * @param property - The CSS property type (p, px, py, gap, text, button, input)
 * @param size - The size variant (sm, md, lg, xl)
 * @param density - The current density setting
 */
export function getDensityClass(
  property: keyof typeof DENSITY_CLASS_MAP.medium,
  size: SpacingSize,
  density: SpacingDensity
): string {
  return DENSITY_CLASS_MAP[density][property][size];
}

/**
 * Hook to get density-aware classes
 */
export function useDensityClasses() {
  const { density } = useSpacing();
  
  return {
    // Padding helpers
    p: (size: SpacingSize = 'md') => getDensityClass('p', size, density),
    px: (size: SpacingSize = 'md') => getDensityClass('px', size, density),
    py: (size: SpacingSize = 'md') => getDensityClass('py', size, density),
    
    // Gap helper
    gap: (size: SpacingSize = 'md') => getDensityClass('gap', size, density),
    
    // Text size helper
    text: (size: SpacingSize = 'md') => getDensityClass('text', size, density),
    
    // Component size helpers
    buttonHeight: (size: SpacingSize = 'md') => getDensityClass('button', size, density),
    inputHeight: (size: SpacingSize = 'md') => getDensityClass('input', size, density),
    
    // Get multiple classes at once
    getClasses: (config: Partial<Record<keyof typeof DENSITY_CLASS_MAP.medium, SpacingSize>>) => {
      return Object.entries(config)
        .map(([prop, size]) => getDensityClass(prop as any, size, density))
        .join(' ');
    },
  };
}

/**
 * Map numeric gap values to density-aware Tailwind classes
 */
export function getGapClass(gap: number, density: SpacingDensity): string {
  // Map the numeric gap to size categories based on density
  const gapMappings = {
    compact: {
      0: 'gap-0',
      1: 'gap-0.5',
      2: 'gap-1',
      3: 'gap-1.5',
      4: 'gap-2',
      5: 'gap-2.5',
      6: 'gap-3',
      8: 'gap-4',
      10: 'gap-5',
      12: 'gap-6',
    },
    medium: {
      0: 'gap-0',
      1: 'gap-1',
      2: 'gap-1.5',
      3: 'gap-2',
      4: 'gap-3',
      5: 'gap-4',
      6: 'gap-5',
      8: 'gap-6',
      10: 'gap-8',
      12: 'gap-10',
    },
    large: {
      0: 'gap-0',
      1: 'gap-1.5',
      2: 'gap-2',
      3: 'gap-3',
      4: 'gap-4',
      5: 'gap-5',
      6: 'gap-6',
      8: 'gap-8',
      10: 'gap-10',
      12: 'gap-12',
    },
  };
  
  const mapping = gapMappings[density];
  // Find the closest gap value
  const availableGaps = Object.keys(mapping).map(Number).sort((a, b) => a - b);
  const closest = availableGaps.reduce((prev, curr) => 
    Math.abs(curr - gap) < Math.abs(prev - gap) ? curr : prev
  );
  
  return mapping[closest] || 'gap-4';
}

/**
 * Map numeric padding values to density-aware Tailwind classes
 */
export function getPaddingClass(padding: number, density: SpacingDensity, direction?: 'x' | 'y' | ''): string {
  const prefix = direction ? `p${direction}` : 'p';
  
  // Similar mapping logic as gap
  const paddingMappings = {
    compact: {
      0: `${prefix}-0`,
      2: `${prefix}-0.5`,
      4: `${prefix}-1`,
      6: `${prefix}-1.5`,
      8: `${prefix}-2`,
      12: `${prefix}-3`,
      16: `${prefix}-4`,
      20: `${prefix}-5`,
      24: `${prefix}-6`,
    },
    medium: {
      0: `${prefix}-0`,
      2: `${prefix}-0.5`,
      4: `${prefix}-1`,
      6: `${prefix}-1.5`,
      8: `${prefix}-2`,
      12: `${prefix}-3`,
      16: `${prefix}-4`,
      20: `${prefix}-5`,
      24: `${prefix}-6`,
      32: `${prefix}-8`,
    },
    large: {
      0: `${prefix}-0`,
      4: `${prefix}-1`,
      8: `${prefix}-2`,
      12: `${prefix}-3`,
      16: `${prefix}-4`,
      20: `${prefix}-5`,
      24: `${prefix}-6`,
      32: `${prefix}-8`,
      40: `${prefix}-10`,
      48: `${prefix}-12`,
    },
  };
  
  const mapping = paddingMappings[density];
  const availablePaddings = Object.keys(mapping).map(Number).sort((a, b) => a - b);
  const closest = availablePaddings.reduce((prev, curr) => 
    Math.abs(curr - padding) < Math.abs(prev - padding) ? curr : prev
  );
  
  return mapping[closest] || `${prefix}-4`;
}