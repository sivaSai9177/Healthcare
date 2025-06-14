/**
 * Simple utility to combine class names
 * Can be extended with clsx and tailwind-merge if needed
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}