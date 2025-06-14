/**
 * Style fixes for React Native Web compatibility
 * Handles edge cases where React Native styles don't translate well to web
 */

import { Platform, ViewStyle, TextStyle } from 'react-native';

/**
 * Sanitize styles for web platform to avoid CSS errors
 * @param style - The style object or array to sanitize
 * @returns Sanitized style object
 */
export function sanitizeStyleForWeb<T extends ViewStyle | TextStyle | (ViewStyle | TextStyle)[]>(
  style: T
): T {
  if (Platform.OS !== 'web' || !style) {
    return style;
  }

  // Handle style arrays
  if (Array.isArray(style)) {
    return style.filter(Boolean).map(s => sanitizeStyleForWeb(s)) as T;
  }

  const sanitized = { ...style };

  // Remove properties that cause issues on web
  const problematicProps = [
    'elevation', // Android shadow property
    'shadowOpacity', // iOS shadow property
    'shadowRadius', // iOS shadow property
    'shadowOffset', // iOS shadow property
    'shadowColor', // iOS shadow property
  ];

  // Also check for deprecated shadow* props
  const deprecatedShadowProps = [
    'shadowBottom',
    'shadowEnd',
    'shadowHorizontal',
    'shadowLeft',
    'shadowRight',
    'shadowStart',
    'shadowTop',
    'shadowVertical',
  ];

  [...problematicProps, ...deprecatedShadowProps].forEach(prop => {
    if (prop in sanitized) {
      delete (sanitized as any)[prop];
    }
  });

  // Convert percentage strings to numbers where needed
  if ('width' in sanitized && typeof sanitized.width === 'string' && sanitized.width.endsWith('%')) {
    // Keep percentage strings, they're valid
  }

  // Fix transform array issues
  if ('transform' in sanitized && sanitized.transform) {
    // Ensure transform is an array
    if (!Array.isArray(sanitized.transform)) {
      delete (sanitized as any).transform;
    } else {
      // For web, ensure transform arrays are properly formatted
      sanitized.transform = sanitized.transform
        .filter(t => {
          // Check if t is a valid object
          return t && typeof t === 'object' && !Array.isArray(t);
        })
        .map(t => {
          const transform: any = {};
          // Safely get keys only if t is a valid object
          if (t && typeof t === 'object') {
            try {
              Object.keys(t).forEach(key => {
                const value = (t as any)[key];
                // Skip invalid values
                if (value !== undefined && value !== null && !String(value).includes('undefined')) {
                  transform[key] = value;
                }
              });
            } catch (e) {
              console.warn('Error processing transform:', e);
              return null;
            }
          }
          return transform;
        })
        .filter(t => t && Object.keys(t).length > 0);
      
      // If transform array is empty after filtering, remove it
      if (sanitized.transform.length === 0) {
        delete (sanitized as any).transform;
      }
    }
  }

  return sanitized;
}

/**
 * Create a style function that sanitizes for web
 * @param styleFn - The style function to wrap
 * @returns Wrapped style function
 */
export function createWebSafeStyleFn<T extends ViewStyle | TextStyle>(
  styleFn: (state: any) => T | T[]
): (state: any) => T | T[] {
  if (Platform.OS !== 'web') {
    return styleFn;
  }

  return (state: any) => {
    const result = styleFn(state);
    if (Array.isArray(result)) {
      return result.filter(Boolean).map(sanitizeStyleForWeb);
    }
    return sanitizeStyleForWeb(result);
  };
}

/**
 * Check if a transform value is valid for web
 */
export function isValidWebTransform(transform: any): boolean {
  if (!transform || typeof transform !== 'object') {
    return false;
  }
  
  const validKeys = ['translateX', 'translateY', 'translateZ', 'scale', 'scaleX', 'scaleY', 'rotate', 'rotateX', 'rotateY', 'rotateZ', 'skewX', 'skewY'];
  return Object.keys(transform).every(key => validKeys.includes(key));
}