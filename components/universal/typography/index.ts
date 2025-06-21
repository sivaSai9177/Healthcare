/**
 * Typography Components
 * Unified text components with design system integration
 */

// Main text component and variants
export {
  Text,
  // Headings
  Heading,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  Display1,
  Display2,
  // Body text
  Body,
  BodyLarge,
  BodySmall,
  Paragraph,
  // UI text
  Label,
  Caption,
  Overline,
  ButtonText,
  ButtonLargeText,
  // Code
  Code,
  CodeBlock,
  // Interactive
  TextLink,
  // Animated
  AnimatedHeading,
  FadeInText,
  // Legacy aliases
  Title,
  Subtitle,
  TextLabel,
} from './Text';

// Text truncation utilities
export {
  TruncatedText,
  EllipsisText,
  ClampedText,
} from './TruncatedText';

// Legacy exports
export * from './ThemedText';
export * from './ThemedView';

// Re-export types
export type { TextProps } from './Text';