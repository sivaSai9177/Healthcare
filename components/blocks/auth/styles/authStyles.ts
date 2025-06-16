/**
 * Centralized auth component styles for consistency
 * Based on hospital-app design patterns with 4px base unit
 */

// Base spacing unit (4px) - matching hospital-app
const BASE_UNIT = 4;

// Spacing scale based on 4px grid
export const spacing = {
  0: 0,
  0.5: BASE_UNIT * 0.5,    // 2px
  1: BASE_UNIT * 1,        // 4px
  1.5: BASE_UNIT * 1.5,    // 6px
  2: BASE_UNIT * 2,        // 8px
  2.5: BASE_UNIT * 2.5,    // 10px
  3: BASE_UNIT * 3,        // 12px
  4: BASE_UNIT * 4,        // 16px
  5: BASE_UNIT * 5,        // 20px
  6: BASE_UNIT * 6,        // 24px
  7: BASE_UNIT * 7,        // 28px
  8: BASE_UNIT * 8,        // 32px
  9: BASE_UNIT * 9,        // 36px
  10: BASE_UNIT * 10,      // 40px
  11: BASE_UNIT * 11,      // 44px
  12: BASE_UNIT * 12,      // 48px
  14: BASE_UNIT * 14,      // 56px
  16: BASE_UNIT * 16,      // 64px
  20: BASE_UNIT * 20,      // 80px
  24: BASE_UNIT * 24,      // 96px
  32: BASE_UNIT * 32,      // 128px
} as const;

// Colors matching hospital-app exactly
export const colors = {
  primary: '#3b82f6',           // Blue-500
  primaryDark: '#2563eb',       // Blue-600 for hover
  primaryLight: '#60a5fa',      // Blue-400
  secondary: '#8b5cf6',         // Purple-500
  destructive: '#ef4444',       // Red-500
  success: '#10b981',           // Emerald-500
  warning: '#f59e0b',           // Amber-500
  info: '#3b82f6',              // Blue-500
  border: '#e5e7eb',            // Gray-200
  borderFocus: '#3b82f6',       // Primary
  text: '#111827',              // Gray-900
  textMuted: '#6b7280',         // Gray-500
  background: '#ffffff',        // White
  backgroundMuted: '#f9fafb',   // Gray-50
  backgroundHover: '#f3f4f6',   // Gray-100
} as const;

export const authStyles = {
  // Container styles
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollView: {
    contentContainerStyle: { 
      flexGrow: 1,
    },
    showsVerticalScrollIndicator: false,
    keyboardShouldPersistTaps: 'handled' as const,
  },
  formWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[4], // 16px
  },
  formContainer: {
    width: '100%',
    maxWidth: 440, // Desktop max width
  },
  card: {
    backgroundColor: colors.background,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    padding: spacing[8], // 32px
  },
  mobileContainer: {
    paddingHorizontal: spacing[4], // 16px
    paddingVertical: spacing[6],   // 24px
  },
  
  // Spacing object for components
  spacing: {
    ...spacing,
    // Semantic spacing for auth screens - more compact for single screen
    formGap: spacing[2.5],    // 10px between form fields (reduced from 16px)
    sectionGap: spacing[4],   // 16px between sections (reduced from 24px)
    buttonGap: spacing[4],    // 16px before button (reduced from 24px)
    labelGap: spacing[1.5],   // 6px between label and input (matching hospital-app)
    // Register specific - slightly more space for scrollable content
    registerFormGap: spacing[3],      // 12px between form fields
    registerSectionGap: spacing[5],   // 20px between sections
  },
  
  // Input styles matching hospital-app
  input: {
    container: {
      width: '100%',
      marginBottom: spacing[4], // 16px
    },
    field: {
      height: 44, // Medium size default (matching hospital-app)
      paddingHorizontal: spacing[4], // 16px
      fontSize: 16,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 6,
      backgroundColor: colors.background,
    },
    fieldLarge: {
      height: 52,
      fontSize: 18,
    },
    fieldSmall: {
      height: 36,
      fontSize: 14,
    },
    focused: {
      borderColor: colors.borderFocus,
      borderWidth: 1,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
    },
    error: {
      borderColor: colors.destructive,
    },
    success: {
      borderColor: colors.success,
    },
    label: {
      fontSize: 14,
      fontWeight: '500' as any,
      marginBottom: spacing[1.5], // 6px (matching hospital-app)
      color: colors.text,
    },
  },
  
  // Button styles - matching hospital-app sizes
  button: {
    base: {
      width: '100%',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 6,
      flexDirection: 'row' as const,
    },
    // Size variants
    small: {
      height: 36,
      paddingHorizontal: spacing[3], // 12px
      paddingVertical: spacing[2],   // 8px
    },
    medium: {
      height: 44, // Matching hospital-app button height
      paddingHorizontal: spacing[4], // 16px
      paddingVertical: 10,
    },
    large: {
      height: 52,
      paddingHorizontal: spacing[5], // 20px
      paddingVertical: 14,
    },
    // Style variants
    primary: {
      backgroundColor: colors.primary,
    },
    primaryHover: {
      backgroundColor: colors.primaryDark,
    },
    primaryPressed: {
      backgroundColor: '#1d4ed8', // blue-700
    },
    primaryDisabled: {
      backgroundColor: colors.border,
    },
    secondary: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: '#d1d5db', // gray-300
    },
    secondaryHover: {
      backgroundColor: colors.backgroundMuted,
    },
    text: {
      fontSize: 16,
      fontWeight: '600' as any,
      color: colors.background,
    },
    textSecondary: {
      color: colors.text,
    },
    textDisabled: {
      color: colors.textMuted,
    },
  },
  
  // Text styles - consistent colors and sizes
  text: {
    // Error states
    error: {
      color: colors.destructive,
      fontSize: 14,
      textAlign: 'center' as const,
    },
    errorInline: {
      color: colors.destructive,
      fontSize: 12,
    },
    
    // Info and hints
    hint: {
      color: colors.textMuted,
      fontSize: 12,
    },
    info: {
      color: colors.textMuted,
      fontSize: 14,
    },
    
    // Labels
    label: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '500' as any,
      marginBottom: spacing[1.5], // 6px
    },
    
    // Links
    link: {
      color: colors.primary,
      fontSize: 14,
    },
    linkHover: {
      color: colors.primary,
      textDecorationLine: 'underline' as const,
    },
    
    // Footer text
    footer: {
      color: colors.textMuted,
      fontSize: 14,
    },
    
    // Sizes
    sizes: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
    },
  },
  
  // Color constants
  colors,
  
  // Layout helpers
  layout: {
    row: {
      flexDirection: 'row' as const,
      gap: spacing[3], // 12px
    },
    column: {
      flexDirection: 'column' as const,
      gap: spacing[3], // 12px
    },
    inputGroup: {
      width: '100%',
    },
    centerContent: {
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
  },
  
  // Common patterns
  patterns: {
    errorBox: {
      padding: spacing[3], // 12px
      backgroundColor: 'rgba(239, 68, 68, 0.1)', // red-500 with opacity
      borderRadius: 8,
      marginBottom: spacing[4], // 16px
      borderWidth: 1,
      borderColor: 'rgba(239, 68, 68, 0.2)',
    },
    successBox: {
      padding: spacing[3], // 12px
      backgroundColor: 'rgba(16, 185, 129, 0.1)', // emerald-500 with opacity
      borderRadius: 8,
      marginBottom: spacing[4], // 16px
      borderWidth: 1,
      borderColor: 'rgba(16, 185, 129, 0.2)',
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 0, // Margin handled inline
    },
    socialButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      height: 44, // Matching regular button height
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 6,
      backgroundColor: colors.background,
      paddingHorizontal: spacing[4], // 16px
    },
    socialButtonHover: {
      backgroundColor: colors.backgroundMuted,
      borderColor: '#d1d5db', // gray-300
    },
  },
};

export const authAnimations = {
  fadeIn: {
    entering: 'fade-in',
    delay: (index: number) => `delay-${index * 100}`,
  },
  slideUp: {
    entering: 'slide-in-up',
    delay: (index: number) => `delay-${index * 100}`,
  },
  shake: {
    entering: 'shake',
    duration: 300,
  },
};