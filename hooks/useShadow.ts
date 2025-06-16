import { Platform, ViewStyle } from 'react-native';
import { useSpacing } from '@/lib/stores/spacing-store';
import { useThemeStore } from '@/lib/stores/theme-store';
import { useMemo, useState } from 'react';

export type ShadowSize = 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type ShadowColor = 'default' | 'primary' | 'secondary' | 'destructive' | 'success' | 'warning';

interface ShadowOptions {
  size?: ShadowSize;
  color?: ShadowColor;
  density?: 'compact' | 'medium' | 'large';
  inset?: boolean;
  animated?: boolean;
}

interface ShadowStyle extends ViewStyle {
  // Web-specific shadow properties
  boxShadow?: string;
  // iOS shadow properties
  shadowColor?: string;
  shadowOffset?: { width: number; height: number };
  shadowOpacity?: number;
  shadowRadius?: number;
  // Android elevation
  elevation?: number;
}

// Shadow configurations for different densities
const shadowConfigs = {
  compact: {
    none: { elevation: 0, shadowRadius: 0, shadowOpacity: 0 },
    sm: { elevation: 1, shadowRadius: 1, shadowOpacity: 0.05 },
    md: { elevation: 2, shadowRadius: 2, shadowOpacity: 0.08 },
    lg: { elevation: 4, shadowRadius: 4, shadowOpacity: 0.12 },
    xl: { elevation: 6, shadowRadius: 8, shadowOpacity: 0.15 },
    '2xl': { elevation: 8, shadowRadius: 12, shadowOpacity: 0.20 },
  },
  medium: {
    none: { elevation: 0, shadowRadius: 0, shadowOpacity: 0 },
    sm: { elevation: 2, shadowRadius: 2, shadowOpacity: 0.05 },
    md: { elevation: 4, shadowRadius: 4, shadowOpacity: 0.10 },
    lg: { elevation: 8, shadowRadius: 8, shadowOpacity: 0.15 },
    xl: { elevation: 12, shadowRadius: 16, shadowOpacity: 0.20 },
    '2xl': { elevation: 24, shadowRadius: 24, shadowOpacity: 0.25 },
  },
  large: {
    none: { elevation: 0, shadowRadius: 0, shadowOpacity: 0 },
    sm: { elevation: 2, shadowRadius: 3, shadowOpacity: 0.06 },
    md: { elevation: 6, shadowRadius: 6, shadowOpacity: 0.12 },
    lg: { elevation: 12, shadowRadius: 12, shadowOpacity: 0.18 },
    xl: { elevation: 18, shadowRadius: 20, shadowOpacity: 0.24 },
    '2xl': { elevation: 32, shadowRadius: 32, shadowOpacity: 0.30 },
  },
};

// Shadow offset configurations
const shadowOffsets = {
  none: { width: 0, height: 0 },
  sm: { width: 0, height: 1 },
  md: { width: 0, height: 2 },
  lg: { width: 0, height: 4 },
  xl: { width: 0, height: 8 },
  '2xl': { width: 0, height: 12 },
};

// Web box-shadow templates
const webShadowTemplates = {
  compact: {
    none: 'none',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.03)',
    lg: '0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 8px 10px -2px rgba(0, 0, 0, 0.08), 0 4px 6px -3px rgba(0, 0, 0, 0.05)',
    '2xl': '0 12px 16px -4px rgba(0, 0, 0, 0.10), 0 8px 10px -5px rgba(0, 0, 0, 0.05)',
  },
  medium: {
    none: 'none',
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  },
  large: {
    none: 'none',
    sm: '0 2px 4px 0 rgba(0, 0, 0, 0.12), 0 1px 3px -1px rgba(0, 0, 0, 0.08)',
    md: '0 6px 8px -1px rgba(0, 0, 0, 0.12), 0 3px 5px -2px rgba(0, 0, 0, 0.08)',
    lg: '0 12px 18px -3px rgba(0, 0, 0, 0.15), 0 6px 8px -4px rgba(0, 0, 0, 0.10)',
    xl: '0 24px 32px -5px rgba(0, 0, 0, 0.15), 0 12px 16px -6px rgba(0, 0, 0, 0.10)',
    '2xl': '0 32px 64px -12px rgba(0, 0, 0, 0.30)',
  },
};

// Color modifiers for shadows
const shadowColors = {
  default: '#000000',
  primary: '#3b82f6', // blue-500
  secondary: '#8b5cf6', // purple-500
  destructive: '#ef4444', // red-500
  success: '#10b981', // green-500
  warning: '#f59e0b', // amber-500
};

/**
 * Hook to generate platform-specific shadow styles with density support
 * 
 * @example
 * const shadowStyle = useShadow({ size: 'md' });
 * const coloredShadow = useShadow({ size: 'lg', color: 'primary' });
 * const insetShadow = useShadow({ size: 'sm', inset: true });
 */
export function useShadow(options: ShadowOptions | ShadowSize | undefined = {}): ShadowStyle {
  const { density } = useSpacing();
  const { colorScheme } = useThemeStore();
  const isDark = colorScheme === 'dark';
  
  // Handle string input (legacy support)
  const normalizedOptions: ShadowOptions = typeof options === 'string' 
    ? { size: options } 
    : (options || {});
  
  const {
    size = 'md',
    color = 'default',
    density: customDensity,
    inset = false,
    animated = false,
  } = normalizedOptions;
  
  const effectiveDensity = customDensity || density;
  
  const shadowStyle = useMemo(() => {
    // Return empty style for undefined or 'none'
    if (!size || size === 'none') {
      return {};
    }
    
    // Base configuration with fallbacks
    const config = shadowConfigs[effectiveDensity]?.[size] || shadowConfigs.medium.md;
    const offset = shadowOffsets[size] || shadowOffsets.md;
    const shadowColor = shadowColors[color] || shadowColors.default;
    
    // Adjust opacity for dark mode
    const opacityMultiplier = isDark ? 1.5 : 1;
    const finalOpacity = config.shadowOpacity * opacityMultiplier;
    
    // Platform-specific implementation
    if (Platform.OS === 'web') {
      const webShadow = webShadowTemplates[effectiveDensity][size];
      
      // Replace color if not default
      let boxShadow = webShadow;
      if (color !== 'default' && webShadow !== 'none') {
        // Extract RGB values from hex color
        const r = parseInt(shadowColor.slice(1, 3), 16);
        const g = parseInt(shadowColor.slice(3, 5), 16);
        const b = parseInt(shadowColor.slice(5, 7), 16);
        
        // Replace rgba values in shadow
        boxShadow = webShadow.replace(/rgba\(0, 0, 0,/g, `rgba(${r}, ${g}, ${b},`);
      }
      
      // Add inset modifier
      if (inset && boxShadow !== 'none') {
        boxShadow = `inset ${boxShadow}`;
      }
      
      return {
        boxShadow,
        ...(animated && {
          transition: 'box-shadow 0.3s ease-in-out',
        }),
      } as ShadowStyle;
    }
    
    // iOS implementation
    if (Platform.OS === 'ios') {
      return {
        shadowColor,
        shadowOffset: inset ? { width: -offset.width, height: -offset.height } : offset,
        shadowOpacity: finalOpacity,
        shadowRadius: config.shadowRadius,
      } as ShadowStyle;
    }
    
    // Android implementation
    if (Platform.OS === 'android') {
      // Android doesn't support colored shadows or inset shadows natively
      // Use elevation for standard shadows
      return {
        elevation: inset ? 0 : config.elevation,
        // Fallback shadow properties for Android (may work on newer versions)
        shadowColor: color !== 'default' ? shadowColor : '#000000',
      } as ShadowStyle;
    }
    
    return {};
  }, [size, color, effectiveDensity, inset, animated, isDark]);
  
  return shadowStyle;
}

/**
 * Hook to generate Tailwind shadow classes for web
 * Useful when you need className instead of style object
 */
export function useShadowClass(options: ShadowOptions = {}): string {
  const { density } = useSpacing();
  const { colorScheme } = useThemeStore();
  const isDark = colorScheme === 'dark';
  
  const {
    size = 'md',
    color = 'default',
    density: customDensity,
    inset = false,
  } = options;
  
  const effectiveDensity = customDensity || density;
  
  // Map size and density to Tailwind classes
  const sizeClasses = {
    compact: {
      none: 'shadow-none',
      sm: 'shadow-sm',
      md: 'shadow',
      lg: 'shadow-md',
      xl: 'shadow-lg',
      '2xl': 'shadow-xl',
    },
    medium: {
      none: 'shadow-none',
      sm: 'shadow',
      md: 'shadow-md',
      lg: 'shadow-lg',
      xl: 'shadow-xl',
      '2xl': 'shadow-2xl',
    },
    large: {
      none: 'shadow-none',
      sm: 'shadow-md',
      md: 'shadow-lg',
      lg: 'shadow-xl',
      xl: 'shadow-2xl',
      '2xl': 'shadow-2xl ring-1 ring-black/5',
    },
  };
  
  const baseClass = sizeClasses[effectiveDensity][size];
  
  // Color modifiers
  const colorClasses = {
    default: '',
    primary: 'shadow-blue-500/25',
    secondary: 'shadow-purple-500/25',
    destructive: 'shadow-red-500/25',
    success: 'shadow-green-500/25',
    warning: 'shadow-amber-500/25',
  };
  
  const colorClass = color !== 'default' ? colorClasses[color] : '';
  
  // Inset modifier
  const insetClass = inset ? 'shadow-inner' : '';
  
  // Dark mode adjustments
  const darkClass = isDark ? 'dark:shadow-white/10' : '';
  
  return [baseClass, colorClass, insetClass, darkClass].filter(Boolean).join(' ');
}

/**
 * Preset shadow styles for common use cases
 */
export const shadowPresets = {
  card: { size: 'md' as ShadowSize },
  button: { size: 'sm' as ShadowSize },
  modal: { size: 'xl' as ShadowSize },
  dropdown: { size: 'lg' as ShadowSize },
  tooltip: { size: 'md' as ShadowSize },
  input: { size: 'sm' as ShadowSize, inset: true },
  elevated: { size: '2xl' as ShadowSize },
} as const;

/**
 * Hook to create animated shadow that responds to interaction
 */
export function useInteractiveShadow(
  baseSize: ShadowSize = 'md',
  hoverSize: ShadowSize = 'lg',
  options: Omit<ShadowOptions, 'size'> = {}
) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  
  const currentSize = isPressed ? 'sm' : isHovered ? hoverSize : baseSize;
  const shadowStyle = useShadow({ ...options, size: currentSize, animated: true });
  
  const handlers = Platform.OS === 'web' ? {
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
    onMouseDown: () => setIsPressed(true),
    onMouseUp: () => setIsPressed(false),
  } : {
    onPressIn: () => setIsPressed(true),
    onPressOut: () => setIsPressed(false),
  };
  
  return {
    shadowStyle,
    handlers,
    isHovered,
    isPressed,
  };
}