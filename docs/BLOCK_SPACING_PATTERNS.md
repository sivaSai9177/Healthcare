# Block Spacing Patterns Guide

## Overview

This guide explains how to implement consistent, density-aware spacing for blocks throughout the application. Instead of using golden ratio dimensions, we extend the existing spacing theme system to maintain consistency.

## Block Spacing System

### Core Principles

1. **Density-Aware**: Blocks adapt to compact/medium/large density modes
2. **Tailwind-First**: Use Tailwind classes with density conditions
3. **Consistent with Components**: Extend existing spacing theme
4. **Responsive**: Adapt to screen breakpoints

### Block Spacing Configuration

```typescript
// lib/design/block-spacing.ts
import { SpacingDensity } from './spacing';

export const BLOCK_SPACING = {
  compact: {
    // Padding & Margins
    blockPadding: 4,          // 12px (4 * 4 * 0.75)
    blockGap: 3,              // 9px
    blockMargin: 4,           // 12px
    sectionSpacing: 6,        // 18px between sections
    
    // Dimensions
    minHeight: 120,           // Minimum block height
    maxWidth: 600,            // Maximum block width
    
    // Grid Configuration
    gridColumns: { xs: 1, sm: 1, md: 2, lg: 3 },
    gridGap: 3,
  },
  medium: {
    // Padding & Margins
    blockPadding: 6,          // 24px (6 * 4 * 1.0)
    blockGap: 4,              // 16px
    blockMargin: 6,           // 24px
    sectionSpacing: 8,        // 32px between sections
    
    // Dimensions
    minHeight: 160,           // Minimum block height
    maxWidth: 800,            // Maximum block width
    
    // Grid Configuration
    gridColumns: { xs: 1, sm: 2, md: 3, lg: 4 },
    gridGap: 4,
  },
  large: {
    // Padding & Margins
    blockPadding: 8,          // 40px (8 * 4 * 1.25)
    blockGap: 6,              // 30px
    blockMargin: 8,           // 40px
    sectionSpacing: 12,       // 60px between sections
    
    // Dimensions
    minHeight: 200,           // Minimum block height
    maxWidth: 1200,           // Maximum block width
    
    // Grid Configuration
    gridColumns: { xs: 1, sm: 2, md: 4, lg: 6 },
    gridGap: 6,
  }
} as const;
```

## Implementation Patterns

### Basic Block with Density

```typescript
import { useSpacing } from '@/lib/stores/spacing-store';
import { BLOCK_SPACING } from '@/lib/design/block-spacing';
import { cn } from '@/lib/utils';

export function BasicBlock({ children }: { children: React.ReactNode }) {
  const { density } = useSpacing();
  const config = BLOCK_SPACING[density];
  
  return (
    <Card
      className={cn(
        'rounded-lg shadow-md transition-all duration-200',
        // Density-based padding using Tailwind
        density === 'compact' && 'p-4',
        density === 'medium' && 'p-6',
        density === 'large' && 'p-8',
        // Responsive width
        'w-full',
        `max-w-[${config.maxWidth}px]`,
        // Min height
        `min-h-[${config.minHeight}px]`
      )}
    >
      {children}
    </Card>
  );
}
```

### Grid Block Pattern

```typescript
export function MetricsGridBlock({ metrics }: { metrics: Metric[] }) {
  const { density } = useSpacing();
  const config = BLOCK_SPACING[density];
  
  return (
    <Card
      className={cn(
        'rounded-lg',
        density === 'compact' && 'p-4 shadow-sm',
        density === 'medium' && 'p-6 shadow-md',
        density === 'large' && 'p-8 shadow-lg'
      )}
    >
      <Grid 
        columns={config.gridColumns}
        gap={config.gridGap}
        className="w-full"
      >
        {metrics.map(metric => (
          <MetricCard key={metric.id} {...metric} />
        ))}
      </Grid>
    </Card>
  );
}
```

### List Block Pattern

```typescript
export function AlertListBlock({ alerts }: { alerts: Alert[] }) {
  const { density } = useSpacing();
  
  return (
    <VStack
      gap={density === 'compact' ? 2 : density === 'medium' ? 3 : 4}
      className={cn(
        'rounded-lg bg-card',
        density === 'compact' && 'p-3',
        density === 'medium' && 'p-4',
        density === 'large' && 'p-6'
      )}
    >
      {alerts.map(alert => (
        <AlertItem 
          key={alert.id} 
          alert={alert}
          compact={density === 'compact'}
        />
      ))}
    </VStack>
  );
}
```

### Dashboard Layout with Blocks

```typescript
export function DashboardLayout() {
  const { density } = useSpacing();
  const config = BLOCK_SPACING[density];
  const { isDesktop } = useResponsive();
  
  return (
    <VStack
      gap={config.sectionSpacing}
      className={cn(
        'w-full',
        density === 'compact' && 'px-3',
        density === 'medium' && 'px-4',
        density === 'large' && 'px-6'
      )}
    >
      {/* Header Section */}
      <HStack
        gap={config.blockGap}
        className="w-full"
      >
        <WelcomeBlock />
        {isDesktop && <QuickStatsBlock />}
      </HStack>
      
      {/* Main Content Grid */}
      <Grid
        columns={config.gridColumns}
        gap={config.gridGap}
      >
        <MetricsBlock />
        <AlertsBlock />
        <PatientsBlock />
        <ActivityBlock />
      </Grid>
      
      {/* Footer Section */}
      <RecentActivityBlock />
    </VStack>
  );
}
```

## Migration Examples

### Before: Fixed Dimensions

```typescript
// ❌ Old approach with golden ratio
const OrganizationBlock = () => {
  return (
    <Card
      style={{
        width: 377,  // Golden ratio width
        height: 233, // Golden ratio height
        padding: 16,
      }}
    >
      {/* content */}
    </Card>
  );
};
```

### After: Density-Aware Responsive

```typescript
// ✅ New approach with density
const OrganizationBlock = () => {
  const { density } = useSpacing();
  const config = BLOCK_SPACING[density];
  
  return (
    <Card
      className={cn(
        'w-full rounded-lg',
        // Density-based sizing
        density === 'compact' && 'p-4 min-h-[120px]',
        density === 'medium' && 'p-6 min-h-[160px]',
        density === 'large' && 'p-8 min-h-[200px]',
        // Responsive max-width
        'max-w-full sm:max-w-xl lg:max-w-2xl'
      )}
    >
      {/* content */}
    </Card>
  );
};
```

## Block Categories & Spacing

### 1. Metric/Stats Blocks
- **Purpose**: Display key metrics and KPIs
- **Spacing**: Compact internal padding, clear visual hierarchy
- **Pattern**:
```typescript
className={cn(
  'rounded-md',
  density === 'compact' && 'p-3 space-y-2',
  density === 'medium' && 'p-4 space-y-3',
  density === 'large' && 'p-5 space-y-4'
)}
```

### 2. List/Table Blocks
- **Purpose**: Display tabular or list data
- **Spacing**: Consistent row spacing, adequate padding
- **Pattern**:
```typescript
className={cn(
  'rounded-lg overflow-hidden',
  density === 'compact' && 'p-3 divide-y divide-border/50',
  density === 'medium' && 'p-4 divide-y divide-border',
  density === 'large' && 'p-6 divide-y divide-border'
)}
```

### 3. Action Blocks
- **Purpose**: Primary actions or CTAs
- **Spacing**: Generous padding, prominent appearance
- **Pattern**:
```typescript
className={cn(
  'rounded-lg shadow-md hover:shadow-lg transition-shadow',
  density === 'compact' && 'p-4',
  density === 'medium' && 'p-6',
  density === 'large' && 'p-8'
)}
```

### 4. Content Blocks
- **Purpose**: Rich content display (text, media)
- **Spacing**: Comfortable reading padding
- **Pattern**:
```typescript
className={cn(
  'rounded-lg',
  density === 'compact' && 'p-4 space-y-3',
  density === 'medium' && 'p-6 space-y-4',
  density === 'large' && 'p-8 space-y-6'
)}
```

## Tailwind Utilities for Blocks

### Custom Tailwind Classes

```css
/* Add to your global.css */
@layer utilities {
  .block-compact {
    @apply p-4 space-y-3 min-h-[120px];
  }
  
  .block-medium {
    @apply p-6 space-y-4 min-h-[160px];
  }
  
  .block-large {
    @apply p-8 space-y-6 min-h-[200px];
  }
  
  .block-shadow-compact {
    @apply shadow-sm hover:shadow-md;
  }
  
  .block-shadow-medium {
    @apply shadow-md hover:shadow-lg;
  }
  
  .block-shadow-large {
    @apply shadow-lg hover:shadow-xl;
  }
}
```

### Using Custom Classes

```typescript
<Card className={`block-${density} block-shadow-${density} rounded-lg`}>
  {/* Block content */}
</Card>
```

## Responsive Considerations

### Mobile-First Block Design

```typescript
export function ResponsiveBlock() {
  const { density } = useSpacing();
  const { isMobile, isTablet, isDesktop } = useResponsive();
  
  return (
    <Card
      className={cn(
        'rounded-lg',
        // Base mobile styles
        'p-4 min-h-[100px]',
        // Tablet adjustments
        isTablet && 'p-6 min-h-[140px]',
        // Desktop adjustments
        isDesktop && 'p-8 min-h-[180px]',
        // Density overrides
        density === 'large' && 'p-10 min-h-[220px]'
      )}
    >
      {/* Responsive content */}
    </Card>
  );
}
```

### Breakpoint-Specific Layouts

```typescript
<Grid
  columns={{
    xs: 1,                    // Mobile: Single column
    sm: density === 'large' ? 2 : 1,  // Large density gets 2 columns earlier
    md: 2,                    // Tablet: 2 columns
    lg: density === 'compact' ? 3 : 4, // Desktop: Density-aware columns
  }}
  gap={config.gridGap}
>
  {blocks}
</Grid>
```

## Best Practices

1. **Always use density-aware spacing** - Never hardcode pixel values
2. **Test all density modes** - Ensure blocks look good in compact/medium/large
3. **Mobile-first approach** - Start with mobile layout, enhance for larger screens
4. **Consistent shadows** - Use density-aware shadow classes
5. **Maintain aspect ratios** - Use min-height instead of fixed heights
6. **Group related blocks** - Use consistent spacing between related blocks

## Common Pitfalls to Avoid

1. **Don't use fixed dimensions** - Blocks should be flexible
2. **Don't ignore density** - Always consider the current density setting
3. **Don't mix spacing systems** - Use either Tailwind or theme, not both
4. **Don't forget hover states** - Add interactive feedback
5. **Don't overcrowd compact mode** - Simplify content for small screens

## Testing Checklist

- [ ] Test in all 3 density modes
- [ ] Test on all 6 breakpoints
- [ ] Verify spacing consistency across blocks
- [ ] Check shadow implementation
- [ ] Test interactive states (hover, active)
- [ ] Verify content doesn't overflow
- [ ] Test with dynamic content lengths
- [ ] Verify performance with many blocks

## Next Steps

1. Audit existing blocks for spacing consistency
2. Create block template components
3. Document block-specific patterns
4. Create Storybook stories for each block type
5. Add density switcher to development tools