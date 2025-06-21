# New Feature Workflow

This guide walks through the complete process of adding a new feature to the Healthcare Alert System.

## 1. Planning Phase

### 1.1 Define Requirements
- [ ] Clear feature description
- [ ] User stories
- [ ] Acceptance criteria
- [ ] UI/UX mockups (if applicable)
- [ ] API requirements
- [ ] Database changes needed

### 1.2 Technical Design
- [ ] Architecture diagram
- [ ] Data flow
- [ ] Component hierarchy
- [ ] API endpoints
- [ ] State management approach

## 2. Setup Phase

### 2.1 Create Feature Branch
```bash
# From develop branch
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name
```

### 2.2 Create Feature Structure
```bash
# Example for a new module
mkdir -p components/blocks/your-feature
mkdir -p hooks/your-feature
mkdir -p src/server/routers/your-feature
mkdir -p __tests__/unit/your-feature
```

## 3. Implementation Phase

### 3.1 Backend Implementation

#### Database Schema (if needed)
```ts
// src/db/schema/your-feature.ts
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const yourTable = pgTable('your_table', {
  id: text('id').primaryKey(),
  // ... fields
});
```

#### tRPC Router
```ts
// src/server/routers/your-feature.ts
import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';

export const yourFeatureRouter = router({
  create: protectedProcedure
    .input(z.object({
      // Input validation
    }))
    .mutation(async ({ ctx, input }) => {
      // Implementation
    }),
    
  list: protectedProcedure
    .query(async ({ ctx }) => {
      // Implementation
    }),
});
```

#### Add to Main Router
```ts
// src/server/routers/index.ts
import { yourFeatureRouter } from './your-feature';

export const appRouter = router({
  // ... existing routers
  yourFeature: yourFeatureRouter,
});
```

### 3.2 Frontend Implementation

#### Types
```ts
// types/your-feature.ts
export interface YourFeatureType {
  id: string;
  // ... properties
}
```

#### Hook
```ts
// hooks/your-feature/useYourFeature.ts
import { api } from '@/lib/api/trpc';

export function useYourFeature() {
  const { data, isLoading } = api.yourFeature.list.useQuery();
  
  const createMutation = api.yourFeature.create.useMutation({
    onSuccess: () => {
      // Handle success
    },
  });
  
  return {
    data,
    isLoading,
    create: createMutation.mutate,
  };
}
```

#### Component
```tsx
// components/blocks/your-feature/YourFeatureList.tsx
import { View, Text, FlatList } from 'react-native';
import { useYourFeature } from '@/hooks/your-feature';

export function YourFeatureList() {
  const { data, isLoading } = useYourFeature();
  
  if (isLoading) {
    return <Text>Loading...</Text>;
  }
  
  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View className="p-4 border-b border-gray-200">
          <Text>{item.name}</Text>
        </View>
      )}
    />
  );
}
```

#### Page
```tsx
// app/(app)/your-feature.tsx
import { Stack } from 'expo-router';
import { YourFeatureList } from '@/components/blocks/your-feature';

export default function YourFeaturePage() {
  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Your Feature',
        }} 
      />
      <YourFeatureList />
    </>
  );
}
```

## 4. Testing Phase

### 4.1 Unit Tests
```ts
// __tests__/unit/your-feature/your-feature.test.ts
describe('Your Feature', () => {
  it('should create item', async () => {
    // Test implementation
  });
});
```

### 4.2 Integration Tests
```ts
// __tests__/integration/your-feature/api.test.ts
describe('Your Feature API', () => {
  it('should handle full workflow', async () => {
    // Test implementation
  });
});
```

### 4.3 Component Tests
```tsx
// components/blocks/your-feature/__tests__/YourFeatureList.test.tsx
import { render } from '@testing-library/react-native';
import { YourFeatureList } from '../YourFeatureList';

describe('YourFeatureList', () => {
  it('renders correctly', () => {
    const { getByText } = render(<YourFeatureList />);
    // Assertions
  });
});
```

## 5. Documentation Phase

### 5.1 Create Module Documentation
```markdown
// docs/modules/your-feature/README.md
# Your Feature Module

## Overview
Description of the feature...

## API Reference
- `yourFeature.create` - Creates a new item
- `yourFeature.list` - Lists all items

## Usage Examples
...
```

### 5.2 Update API Documentation
```markdown
// docs/api/trpc-routes.md
### Your Feature Routes
- `yourFeature.create` - POST - Creates new item
- `yourFeature.list` - GET - Lists items
```

## 6. Review Phase

### 6.1 Self Review Checklist
- [ ] Code follows project conventions
- [ ] All tests pass
- [ ] No TypeScript errors
- [ ] Documentation updated
- [ ] No console.logs
- [ ] Performance considered
- [ ] Accessibility handled
- [ ] Error states covered

### 6.2 Create Pull Request
```bash
# Push your branch
git push origin feature/your-feature-name

# Create PR with template
```

#### PR Template
```markdown
## Description
Brief description of the feature

## Changes
- Added X component
- Implemented Y API
- Created Z tests

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Screenshots
(Add if UI changes)

## Checklist
- [ ] Tests added
- [ ] Documentation updated
- [ ] No breaking changes
```

## 7. Post-Merge Phase

### 7.1 Deployment Verification
- [ ] Feature works in staging
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Analytics tracking (if needed)

### 7.2 Monitor
- [ ] Check error logs
- [ ] Monitor performance
- [ ] Gather user feedback

## Common Patterns

### Adding to Navigation
```tsx
// app/(app)/_layout.tsx
<Drawer.Screen
  name="your-feature"
  options={{
    title: 'Your Feature',
    drawerIcon: ({ color }) => (
      <Icon name="your-icon" color={color} />
    ),
  }}
/>
```

### Adding Permissions
```ts
// lib/auth/permissions.ts
export const permissions = {
  'your-feature:view': ['admin', 'manager'],
  'your-feature:create': ['admin'],
  'your-feature:edit': ['admin'],
  'your-feature:delete': ['admin'],
};
```

### Adding to Dashboard
```tsx
// components/blocks/dashboards/HealthcareDashboard.tsx
<DashboardCard
  title="Your Feature"
  value={metrics.yourFeature}
  icon="your-icon"
  onPress={() => router.push('/your-feature')}
/>
```

## Troubleshooting

### Common Issues
1. **Type errors**: Run `bun run typecheck`
2. **Test failures**: Check mock data
3. **Build errors**: Clear cache with `bun run fix:metro`
4. **API errors**: Check auth and permissions

### Getting Help
1. Check similar features in codebase
2. Review test files for examples
3. Check documentation
4. Ask in team Slack channel

---

Remember: Quality over speed. Take time to write tests and documentation.