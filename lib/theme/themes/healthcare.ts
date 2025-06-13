import { ThemeDefinition } from '../registry';

// Helper function to convert HSL to Hex
function hslToHex(hsl: string): string {
  const [h, s, l] = hsl.split(' ').map((v, i) => {
    const num = parseFloat(v);
    return i === 0 ? num : num / 100;
  });

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0, g = 0, b = 0;

  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }

  const toHex = (n: number) => {
    const hex = Math.round((n + m) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Healthcare theme - Professional medical theme with semantic colors
export const healthcareTheme: ThemeDefinition = {
  id: 'healthcare',
  name: 'Healthcare',
  description: 'Professional medical theme with clear status indicators',
  colors: {
    light: {
      // Clean white/light gray backgrounds
      background: '#ffffff',
      foreground: '#1f2937',
      card: '#f9fafb',
      cardForeground: '#1f2937',
      popover: '#ffffff',
      popoverForeground: '#1f2937',
      
      // Primary: Professional blue (trust, stability)
      primary: '#2563eb',
      primaryForeground: '#ffffff',
      
      // Secondary: Calming teal
      secondary: '#14b8a6',
      secondaryForeground: '#ffffff',
      
      // Muted: Light grays
      muted: '#f3f4f6',
      mutedForeground: '#6b7280',
      
      // Accent: Soft purple (compassion)
      accent: '#8b5cf6',
      accentForeground: '#ffffff',
      
      // Status colors
      destructive: '#dc2626', // Critical/Emergency red
      destructiveForeground: '#ffffff',
      success: '#16a34a', // Normal/Good green
      successForeground: '#ffffff',
      
      // UI elements
      border: '#e5e7eb',
      input: '#e5e7eb',
      ring: '#3b82f6',
      
      // Additional semantic colors for healthcare
      warning: '#f59e0b', // Warning/Caution amber
      warningForeground: '#ffffff',
      info: '#0ea5e9', // Information blue
      infoForeground: '#ffffff',
    },
    dark: {
      // Dark mode for night shifts
      background: '#0f172a',
      foreground: '#f1f5f9',
      card: '#1e293b',
      cardForeground: '#f1f5f9',
      popover: '#1e293b',
      popoverForeground: '#f1f5f9',
      
      // Primary: Softer blue for dark mode
      primary: '#60a5fa',
      primaryForeground: '#0f172a',
      
      // Secondary: Teal
      secondary: '#5eead4',
      secondaryForeground: '#0f172a',
      
      // Muted: Dark grays
      muted: '#334155',
      mutedForeground: '#94a3b8',
      
      // Accent: Light purple
      accent: '#a78bfa',
      accentForeground: '#0f172a',
      
      // Status colors
      destructive: '#ef4444', // Brighter red for dark mode
      destructiveForeground: '#0f172a',
      success: '#22c55e', // Brighter green for dark mode
      successForeground: '#0f172a',
      
      // UI elements
      border: '#334155',
      input: '#334155',
      ring: '#60a5fa',
      
      // Additional semantic colors
      warning: '#fbbf24', // Brighter amber for dark mode
      warningForeground: '#0f172a',
      info: '#38bdf8', // Brighter blue for dark mode
      infoForeground: '#0f172a',
    },
  },
};

// Healthcare-specific color utilities
export const healthcareColors = {
  // Vital sign status colors
  vitalStatus: {
    critical: 'destructive', // Use theme's destructive color
    warning: 'warning',      // Use theme's warning color
    normal: 'success',       // Use theme's success color
    unknown: 'muted',        // Use theme's muted color
  },
  
  // Alert levels
  alertLevels: {
    emergency: 'destructive',
    urgent: 'warning',
    standard: 'primary',
    low: 'muted',
  },
  
  // Department colors (can be customized per hospital)
  departments: {
    emergency: 'destructive',
    icu: 'accent',
    surgery: 'primary',
    pediatrics: 'secondary',
    general: 'muted',
  },
};