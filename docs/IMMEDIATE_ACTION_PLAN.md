# Immediate Action Plan - Next Sprint

## 🎯 Quick Wins (Do Today)

### 1. Fix Duplicate Hook (5 minutes)
```bash
# Remove duplicate file
rm hooks/useResponsive.ts

# Update all imports (automated)
find . -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|@/hooks/useResponsive|@/hooks/responsive/useResponsive|g'
```

### 2. Run Cleanup Scripts (30 minutes)
```bash
# Remove console.logs
bun run scripts/remove-console-logs.ts

# Fix unused imports
bun run scripts/remove-unused-imports.ts

# Run linting
bun run lint:fix
```

### 3. Create Migration Scripts (1 hour)
Create these essential scripts for the team:

```typescript
// scripts/migrate-to-tailwind.ts
// - Find all theme.* references
// - Replace with Tailwind classes
// - Update imports

// scripts/fix-shadow-usage.ts
// - Find hardcoded shadows
// - Replace with CSS variables
// - Add platform handling

// scripts/fix-typescript-any.ts
// - Find all 'any' usage
// - Suggest proper types
// - Auto-fix where possible
```

## 📋 Week 1 Priorities

### Day 1-2: Design System Migration
1. **Morning**: Run migration scripts on universal components
2. **Afternoon**: Test each migrated component
3. **End of Day**: Commit working components

### Day 3-4: Shadow System
1. Implement `useShadow` hook
2. Update Card, Button, Modal components
3. Document shadow patterns

### Day 5: Code Quality
1. Address critical TODOs
2. Fix TypeScript strict errors
3. Remove commented code

## 🚀 Team Assignments

### Frontend Team (2 devs)
```
Dev 1: Universal components migration
- Text, Select, List, Form components
- Test on all platforms
- Update documentation

Dev 2: Blocks migration
- Healthcare blocks (6)
- Organization blocks (5)
- Dashboard blocks (3)
```

### Quality Team (1 dev)
```
- Run all cleanup scripts
- Fix TypeScript 'any' usage
- Address TODO comments
- Set up pre-commit hooks
```

### Performance Team (1 dev)
```
- Analyze bundle with metro
- Remove duplicate dependencies
- Implement code splitting
- Consolidate npm scripts
```

## 📊 Success Metrics

### End of Week 1
- [ ] 0 console.logs in production
- [ ] < 50 TypeScript 'any' usage
- [ ] 20+ components migrated to Tailwind
- [ ] Shadow system implemented
- [ ] Bundle size < 2MB

### End of Week 2
- [ ] 100% Tailwind migration
- [ ] All critical TODOs addressed
- [ ] Documentation updated
- [ ] Performance score > 95

## 🛠️ Git Workflow

```bash
# Create feature branch
git checkout -b feature/design-system-migration

# Daily commits
git add -A
git commit -m "feat: Migrate [component] to Tailwind"

# Push for review
git push origin feature/design-system-migration
```

## 🔍 Daily Standup Questions

1. How many components did you migrate?
2. Any blockers with Tailwind classes?
3. Are tests passing?
4. Bundle size impact?

## 📞 Support Channels

- **Slack**: #design-system-migration
- **Docs**: /docs/MIGRATION_GUIDE_TAILWIND.md
- **Examples**: /components/universal/Button.tsx (reference)

## ⚡ Start Now

1. Open terminal
2. Run: `rm hooks/useResponsive.ts`
3. Run: `bun run scripts/remove-console-logs.ts`
4. Create migration branch
5. Start with Text component

Let's make this sprint a success! 🚀