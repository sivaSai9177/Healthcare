# Skeleton Component Spacing Fix

**Date**: January 23, 2025  
**Issue**: TypeError: spacing.scale is not a function  
**Component**: `/components/universal/feedback/Skeleton.tsx`

## Problem

The Skeleton component was trying to call `spacing.scale()` method which doesn't exist. The `useSpacing()` hook returns an object with numeric spacing values, not methods.

## Root Cause

The component was incorrectly using:
```typescript
spacing.scale(4)  // ❌ Wrong
spacing.borderRadius.lg  // ❌ Wrong
```

## Solution

Fixed by using the correct syntax:
```typescript
spacing[4] as number  // ✅ Correct
12  // ✅ Hard-coded border radius value
```

## Changes Made

1. Replaced all `spacing.scale(n)` with `spacing[n] as number`
2. Replaced `spacing.borderRadius.lg` with hard-coded value `12`
3. Fixed closing parentheses that were incorrectly left after the replacement

## Prevention

- Always check the return type of hooks before using them
- Use TypeScript's type checking to catch these errors during development
- Consider adding unit tests for spacing usage

## Related Files

- `/lib/stores/spacing-store.ts` - Spacing store definition
- `/lib/design/spacing.ts` - Spacing theme configuration