# 🔧 Key Patterns and Conventions - Claude Context Module

*Last Updated: January 10, 2025*

## State Management Patterns

### Zustand Store Pattern
```typescript
// ✅ CORRECT - Always use Zustand store, never Context API
import { useAuthStore } from '@/lib/stores/auth-store';

const MyComponent = () => {
  const { user, isAuthenticated, hasHydrated } = useAuthStore();
  
  // Always check hasHydrated before using auth state
  if (!hasHydrated) return <LoadingView />;
  
  return <View>{/* Component content */}</View>;
};

// ❌ WRONG - Never use Context API
const AuthContext = createContext(); // Don't do this
```

### Store Structure
```typescript
interface StoreState {
  // State
  user: User | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  logout: () => void;
  
  // Computed
  get isAdmin(): boolean;
}
```

## API Patterns

### tRPC Usage
```typescript
// ✅ CORRECT - Always use tRPC for API calls
import { api } from '@/lib/trpc';

// Query
const { data, isLoading, error } = api.auth.getSession.useQuery();

// Mutation
const mutation = api.auth.signIn.useMutation({
  onSuccess: (data) => {
    // Handle success
  },
  onError: (error) => {
    showErrorAlert('Login Failed', error.message);
  },
});

// ❌ WRONG - Never use fetch directly
const data = await fetch('/api/...'); // Don't do this
```

### tRPC Router Pattern
```typescript
export const featureRouter = router({
  // Public procedure
  getPublicData: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return await getDataById(input.id);
    }),
    
  // Protected procedure
  updateData: protectedProcedure
    .input(updateSchema)
    .mutation(async ({ input, ctx }) => {
      // ctx.user is guaranteed
      return await updateUserData(ctx.user.id, input);
    }),
    
  // Role-based procedure
  adminAction: adminProcedure
    .input(adminSchema)
    .mutation(async ({ input, ctx }) => {
      // Only admins can access
      // ctx.hasRole() and ctx.hasPermission() available
    }),
    
  // Permission-based procedure
  manageContent: createPermissionProcedure('manage_content')
    .mutation(async ({ ctx }) => {
      // Only users with 'manage_content' permission
    }),
});
```

## Component Patterns

### Universal Components Only
```typescript
// ✅ CORRECT - Use universal components
import { Box, Text, Button, VStack } from '@/components/universal';

export function MyComponent() {
  return (
    <Box p={4}>
      <VStack spacing={4}>
        <Text>Content</Text>
        <Button onPress={handlePress}>Action</Button>
      </VStack>
    </Box>
  );
}

// ❌ WRONG - Don't use React Native directly
import { View, Text } from 'react-native'; // Don't do this
```

### Component Structure Template
```typescript
interface ComponentProps {
  // Props
  prop1: string;
  prop2?: number;
  children?: React.ReactNode;
}

export const ComponentName = React.forwardRef<View, ComponentProps>(
  ({ prop1, prop2, children, ...props }, ref) => {
    // Theme and spacing
    const theme = useTheme();
    const { spacing } = useSpacing();
    
    // State
    const [state, setState] = useState<string>('');
    
    // API calls
    const { data, isLoading } = api.feature.getData.useQuery();
    
    // Memoized values
    const computedValue = useMemo(() => {
      return expensiveComputation(prop1);
    }, [prop1]);
    
    // Callbacks
    const handleAction = useCallback(() => {
      // Handle action
    }, [dependency]);
    
    // Effects
    useEffect(() => {
      // Side effects
    }, [dependency]);
    
    // Early returns
    if (isLoading) return <LoadingView />;
    if (!data) return <EmptyState />;
    
    // Render
    return (
      <Box ref={ref} {...props}>
        {children}
      </Box>
    );
  }
);

ComponentName.displayName = 'ComponentName';
```

## Navigation Patterns

### Route Protection
```typescript
// ✅ CORRECT - Use guards at layout level
// app/(home)/_layout.tsx
export default function HomeLayout() {
  const { isAuthenticated, hasHydrated } = useAuthStore();
  
  if (!hasHydrated) return <LoadingView />;
  if (!isAuthenticated) return <Redirect href="/login" />;
  
  return <Tabs>{/* Protected content */}</Tabs>;
}

// ❌ WRONG - Manual redirects in components
if (!isAuthenticated) {
  router.push('/login'); // Don't do this in components
}
```

### Navigation Methods
```typescript
import { useRouter } from 'expo-router';

const router = useRouter();

// For authentication redirects
router.replace('/(home)'); // Replace history

// For regular navigation
router.push('/screen'); // Add to history

// For going back
router.back();

// With params
router.push({
  pathname: '/details/[id]',
  params: { id: '123' },
});
```

## Error Handling Patterns

### UI Error Handling
```typescript
// ✅ CORRECT - Use error alert utility
import { showErrorAlert } from '@/lib/core/alert';

try {
  await riskyOperation();
} catch (error) {
  showErrorAlert('Operation Failed', error.message);
  log.error('Operation failed', 'ComponentName', error);
}

// ❌ WRONG - Don't use console or Alert directly
console.error(error); // Don't do this
Alert.alert('Error', message); // Use showErrorAlert instead
```

### API Error Handling
```typescript
// In tRPC procedures
.mutation(async ({ input }) => {
  if (!isValid(input)) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Invalid input',
    });
  }
  
  try {
    return await performOperation(input);
  } catch (error) {
    log.error('Operation failed', 'API', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Operation failed',
    });
  }
});
```

## Database Patterns

### Drizzle ORM Usage
```typescript
// ✅ CORRECT - Use Drizzle ORM
import { db } from '@/src/db';
import { users, organizations } from '@/src/db/schema';
import { eq, and, desc } from 'drizzle-orm';

// Select
const userList = await db
  .select()
  .from(users)
  .where(eq(users.role, 'admin'))
  .orderBy(desc(users.createdAt));

// Insert
const [newUser] = await db
  .insert(users)
  .values({ email, name, role })
  .returning();

// Update
await db
  .update(users)
  .set({ updatedAt: new Date() })
  .where(eq(users.id, userId));

// Transaction
await db.transaction(async (tx) => {
  await tx.insert(users).values(userData);
  await tx.insert(organizations).values(orgData);
});

// ❌ WRONG - Avoid raw SQL
await db.execute('SELECT * FROM users'); // Don't do this
```

## Form Validation Patterns

### Zod Schema Pattern
```typescript
// Define schema
export const userSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Minimum 8 characters'),
  name: z.string().min(2, 'Name required'),
  role: z.enum(['user', 'manager', 'admin']),
});

// Use in component
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const form = useForm<z.infer<typeof userSchema>>({
  resolver: zodResolver(userSchema),
  defaultValues: {
    email: '',
    password: '',
    name: '',
    role: 'user',
  },
});

// Use in tRPC
.input(userSchema)
.mutation(async ({ input }) => {
  // input is validated
});
```

## Logging Patterns

### Structured Logging
```typescript
// ✅ CORRECT - Use structured logger
import { log } from '@/lib/core/logger';

// Basic logging
log.info('User action', 'ComponentName', { userId, action });
log.error('Operation failed', 'ServiceName', error);
log.debug('Debug info', 'FunctionName', { data });

// Domain-specific logging
log.auth.login('User signed in', { userId, provider });
log.api.request('API call', { endpoint, method });
log.store.update('State changed', { action, payload });

// ❌ WRONG - Never use console.log
console.log('Debug:', data); // Don't do this in production
```

## Performance Patterns

### Memoization
```typescript
// Memoize expensive computations
const expensiveResult = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

// Memoize callbacks
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);

// Memoize components
const MemoizedComponent = React.memo(({ prop }) => {
  return <ExpensiveComponent prop={prop} />;
});
```

### React 19 Optimizations
```typescript
// Use deferred values for search
const deferredQuery = useDeferredValue(searchQuery);

// Use transitions for non-urgent updates
const [isPending, startTransition] = useTransition();
const handleUpdate = () => {
  startTransition(() => {
    setComplexState(newValue);
  });
};

// Use optimistic updates
const [optimisticValue, setOptimisticValue] = useOptimistic(
  actualValue,
  (current, optimistic) => optimistic
);
```

## Security Patterns

1. **Never expose secrets** in code or logs
2. **Always validate input** with Zod schemas
3. **Use prepared statements** (Drizzle handles this)
4. **Implement rate limiting** on sensitive endpoints
5. **Audit log** all important operations
6. **Sanitize user content** before display
7. **Use HTTPS** in production
8. **Implement CSRF protection** for mutations

## Helper Utilities

### Common Helpers
```typescript
// Convert Better Auth user to app user
import { toAppUser } from '@/lib/auth/utils';
const appUser = toAppUser(betterAuthUser);

// Check permissions
if (ctx.hasRole('admin')) { /* ... */ }
if (ctx.hasPermission('manage_users')) { /* ... */ }

// Environment detection
const isDev = process.env.NODE_ENV === 'development';
const isNative = Platform.OS !== 'web';
```

---

*This module contains coding patterns and conventions. For specific implementations, see other context modules.*