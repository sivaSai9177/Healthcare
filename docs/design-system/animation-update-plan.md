# Universal Components Animation Update Plan

## Status: 3/55 Components Updated ✅

### ✅ Completed Components
1. **Box** - Full animation variant support
2. **Button** - Full animation variant support with button-specific types
3. **Card** - Full animation variant support with card-specific types

### 🚧 Partially Updated (Need Variant System)
1. **Stack** - Has animation props but not using variant system
2. **Input** - Has basic animated prop
3. **Skeleton** - Has shimmer animation
4. **Progress** - Has animated prop
5. **Slider** - Has animated prop

### ❌ Components to Update

#### Phase 1: Core Layout Components (Priority: High)
- [ ] Container - Add parallax, fade animations
- [ ] Grid - Add stagger animations for children
- [ ] ScrollContainer - Add scroll-based animations
- [ ] ScrollHeader - Add header animations
- [ ] Separator - Add shimmer, pulse effects

#### Phase 2: Form Components (Priority: High)
- [ ] Input - Add focus animations, error shake
- [ ] Checkbox - Add check animations
- [ ] Switch - Add toggle animations
- [ ] Toggle - Add press animations
- [ ] Select - Add dropdown animations
- [ ] RadioGroup - Add selection animations
- [ ] Slider - Add drag animations
- [ ] Search - Add search icon animations
- [ ] Form - Add validation animations

#### Phase 3: Feedback Components (Priority: Medium)
- [ ] Alert - Add entrance/exit animations
- [ ] Badge - Add pulse, bounce animations
- [ ] Progress - Add progress animations
- [ ] Skeleton - Enhance shimmer with variants
- [ ] Toast - Add slide, fade animations
- [ ] EmptyState - Add illustration animations

#### Phase 4: Navigation Components (Priority: Medium)
- [ ] Tabs - Add tab switch animations
- [ ] Breadcrumb - Add path animations
- [ ] NavigationMenu - Add menu animations
- [ ] Pagination - Add page transition animations
- [ ] Stepper - Add step animations
- [ ] Link - Add hover animations
- [ ] Navbar - Add scroll animations

#### Phase 5: Data Display Components (Priority: Low)
- [ ] Avatar - Add load animations
- [ ] Table - Add row animations
- [ ] Timeline - Add timeline animations
- [ ] Rating - Add star animations
- [ ] List - Add list item animations
- [ ] Stats - Add number animations

#### Phase 6: Overlay Components (Priority: High)
- [ ] Dialog - Add modal animations
- [ ] DropdownMenu - Add menu animations
- [ ] Tooltip - Add tooltip animations
- [ ] Popover - Add popover animations
- [ ] Drawer - Add slide animations
- [ ] ContextMenu - Add context menu animations

#### Phase 7: Advanced Components (Priority: Low)
- [ ] Accordion - Add expand/collapse animations
- [ ] Collapsible - Add collapse animations
- [ ] DatePicker - Add calendar animations
- [ ] FilePicker - Add file upload animations
- [ ] ColorPicker - Add color transition animations
- [ ] Command - Add command palette animations

#### Phase 8: Layout Components (Priority: Low)
- [ ] Sidebar - Add slide animations
- [ ] Sidebar07 - Add enhanced sidebar animations

#### Phase 9: Typography (Priority: Low)
- [ ] Text - Add text animations (typewriter, fade)
- [ ] Label - Add label animations

## Animation Types by Component Category

### Form Components
```typescript
type FormAnimationType = 'shake' | 'pulse' | 'bounce' | 'focus' | 'none';
```

### Overlay Components
```typescript
type OverlayAnimationType = 'fade' | 'scale' | 'slide' | 'zoom' | 'none';
```

### Navigation Components
```typescript
type NavigationAnimationType = 'slide' | 'fade' | 'scale' | 'none';
```

### Feedback Components
```typescript
type FeedbackAnimationType = 'pulse' | 'shake' | 'bounce' | 'flash' | 'none';
```

## Implementation Strategy

Each component update should:
1. Add `AnimationVariant` import
2. Add animation props to interface
3. Use `useAnimationVariant` hook
4. Implement variant-based animations
5. Support component-specific animation types
6. Maintain backward compatibility
7. Test on all platforms

## Estimated Time
- Phase 1-2: 2-3 hours (High priority)
- Phase 3-6: 3-4 hours (Medium priority)
- Phase 7-9: 2-3 hours (Low priority)

Total: ~10 hours to update all components