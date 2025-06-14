# Design System Task Template

## Task Overview
**Module**: Design System  
**Component**: [Component Name]  
**Priority**: High/Medium/Low  
**Estimated Time**: X hours  

## Current State
- Using old theme system / Partially migrated / Not started
- TypeScript errors: Yes/No
- Dependencies on other components: List them

## Migration Requirements

### 1. Remove Old Theme System
- [ ] Remove `useTheme()` hook
- [ ] Remove direct theme imports
- [ ] Remove theme color references
- [ ] Remove spacing object usage

### 2. Implement Tailwind Classes
- [ ] Convert background colors
- [ ] Convert text colors
- [ ] Convert spacing (padding/margin)
- [ ] Convert borders and shadows
- [ ] Add hover/active states

### 3. Add Density Support
- [ ] Use `useSpacing()` for density
- [ ] Implement density-based classes
- [ ] Test all three modes (compact/medium/large)

### 4. Platform Handling
- [ ] Handle platform-specific styles
- [ ] Test on iOS/Android/Web
- [ ] Verify shadows work correctly

### 5. Update TypeScript
- [ ] Remove old prop types
- [ ] Update component interface
- [ ] Fix any type errors

## Code Patterns

### Basic Migration
```typescript
// Remove this
const theme = useTheme();
style={{ backgroundColor: theme.card }}

// Add this
className="bg-card"
```

### Density Pattern
```typescript
const { density } = useSpacing();

className={cn(
  'rounded-lg',
  density === 'compact' && 'p-3',
  density === 'medium' && 'p-4', 
  density === 'large' && 'p-5'
)}
```

### Responsive Pattern
```typescript
className="p-4 md:p-6 lg:p-8"
```

## Testing Checklist
- [ ] Component renders without errors
- [ ] All variants work correctly
- [ ] Responsive behavior correct
- [ ] Density modes working
- [ ] Platform differences handled
- [ ] No TypeScript errors
- [ ] Storybook story updated

## Files to Update
- `components/universal/[Component].tsx`
- `components/universal/[Component].stories.tsx` (if exists)
- `components/universal/[Component].test.tsx` (if exists)

## Dependencies
List any components this depends on or components that depend on this.

## Notes
Any special considerations or gotchas for this component.