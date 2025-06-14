# Frontend Architecture Documentation

Last Updated: January 15, 2025

## Overview

The Hospital Alert System frontend is built with React Native/Expo, leveraging modern cross-platform development patterns. This document outlines the complete frontend architecture, component structure, and implementation patterns.

## Tech Stack

### Core Technologies
- **Framework**: React Native with Expo SDK 52
- **Language**: TypeScript 5.x
- **Navigation**: Expo Router (file-based routing)
- **State Management**: Zustand
- **API Client**: tRPC with React Query
- **Styling**: Tailwind CSS via NativeWind
- **Animations**: React Native Reanimated 2
- **Forms**: React Hook Form with Zod validation

### Development Tools
- **Bundler**: Metro (with custom webpack for web)
- **Testing**: Jest + React Native Testing Library
- **Linting**: ESLint with custom rules
- **Type Checking**: TypeScript strict mode
- **Code Formatting**: Prettier

## Architecture Overview

```
app/                      # Expo Router screens
├── (auth)/              # Authentication flow
│   ├── _layout.tsx      # Auth layout wrapper
│   ├── login.tsx        # Login screen
│   ├── register.tsx     # Registration screen
│   └── oauth-callback.tsx # OAuth callback handler
├── (tabs)/              # Main app tabs
│   ├── _layout.tsx      # Tab navigator
│   ├── index.tsx        # Dashboard
│   ├── alerts.tsx       # Active alerts
│   ├── patients.tsx     # Patient management
│   └── settings.tsx     # User settings
├── (healthcare)/        # Healthcare-specific screens
│   ├── alert-details.tsx # Alert detail view
│   ├── create-alert.tsx  # Alert creation
│   └── escalation-queue.tsx # Escalation management
└── _layout.tsx          # Root layout

components/              # Reusable components
├── universal/          # Core UI components (60+)
│   ├── Button.tsx      # Button with variants
│   ├── Input.tsx       # Form input
│   ├── Text.tsx        # Typography
│   └── ...            # Forms, Layout, Display, Charts
├── blocks/            # Feature-specific blocks
│   ├── auth/          # Auth blocks (GoogleSignIn, ProfileCompletion)
│   ├── dashboard/     # Dashboard blocks (100% migrated)
│   ├── debug/         # Debug panel (consolidated)
│   ├── forms/         # Form blocks (100% migrated)
│   ├── healthcare/    # Healthcare blocks (77.8% migrated)
│   ├── navigation/    # Nav components (71.4% migrated)
│   ├── organization/  # Org blocks (100% migrated)
│   └── theme/         # Theme blocks (100% migrated)
└── providers/        # Context providers

lib/                  # Core libraries
├── api/             # API client setup
├── stores/          # Zustand stores
├── hooks/           # Custom hooks
├── utils/           # Utility functions
└── design/          # Design system
```

## Component Architecture

### Component Hierarchy

```
<RootLayout>
  <Providers>
    <AuthProvider>
      <ThemeProvider>
        <QueryProvider>
          <NavigationContainer>
            <Stack.Navigator>
              {/* Screens */}
            </Stack.Navigator>
          </NavigationContainer>
        </QueryProvider>
      </ThemeProvider>
    </AuthProvider>
  </Providers>
</RootLayout>
```

### Component Patterns

#### 1. **Universal Components**
Base UI components with consistent APIs:

```tsx
interface UniversalComponentProps {
  // Responsive props
  size?: ResponsiveValue<'sm' | 'md' | 'lg'>;
  // Animation props
  animated?: boolean;
  // Accessibility
  accessibilityLabel?: string;
  // Platform-specific
  style?: ViewStyle;
}
```

#### 2. **Block Components**
Feature-specific composed components:

```tsx
// Healthcare Alert Block
<AlertSummary
  alert={alertData}
  onAcknowledge={handleAck}
  showActions
/>
```

#### 3. **Screen Components**
Full screens with data fetching:

```tsx
export default function AlertDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { data, isLoading } = api.healthcare.getAlert.useQuery({ 
    alertId: id 
  });
  
  return <AlertDetailView alert={data} />;
}
```

## State Management

### Zustand Stores

#### Auth Store
```typescript
interface AuthState {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  logout: () => void;
}
```

#### Theme Store
```typescript
interface ThemeState {
  mode: 'light' | 'dark' | 'system';
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => void;
}
```

#### Spacing Store
```typescript
interface SpacingState {
  density: 'compact' | 'medium' | 'large';
  setDensity: (density: Density) => void;
  getSpacing: (value: number) => number;
}
```

### Data Fetching with tRPC

#### Query Example
```tsx
const { data, isLoading, error } = api.healthcare.getActiveAlerts.useQuery({
  hospitalId: user.hospitalId,
  limit: 50,
});
```

#### Mutation Example
```tsx
const createAlert = api.healthcare.createAlert.useMutation({
  onSuccess: (data) => {
    toast.success('Alert created');
    router.push(`/alert-details?id=${data.alert.id}`);
  },
});
```

#### Subscription Example
```tsx
api.healthcare.subscribeToAlerts.useSubscription({
  hospitalId: user.hospitalId,
}, {
  onData: (event) => {
    handleAlertUpdate(event);
  },
});
```

## Navigation System

### File-Based Routing
```
app/
├── index.tsx           → /
├── login.tsx          → /login
├── (tabs)/
│   ├── _layout.tsx    → Tab layout
│   └── alerts.tsx     → /alerts
└── alert/[id].tsx     → /alert/123
```

### Navigation Patterns

#### Stack Navigation
```tsx
router.push('/alert-details', { id: alertId });
router.replace('/dashboard');
router.back();
```

#### Tab Navigation
```tsx
<Tabs
  screenOptions={{
    tabBarActiveTintColor: colors.primary,
    tabBarStyle: { height: 60 },
  }}
>
  <Tabs.Screen name="index" options={{ title: 'Dashboard' }} />
  <Tabs.Screen name="alerts" options={{ title: 'Alerts' }} />
</Tabs>
```

#### Deep Linking
```tsx
// app.json
{
  "expo": {
    "scheme": "hospital-alert",
    "web": { "bundler": "metro" }
  }
}
```

## Form Management

### React Hook Form Integration
```tsx
const form = useForm<CreateAlertInput>({
  resolver: zodResolver(CreateAlertSchema),
  defaultValues: {
    urgencyLevel: 3,
    alertType: 'medical_emergency',
  },
});

<Controller
  control={form.control}
  name="roomNumber"
  render={({ field }) => (
    <Input
      label="Room Number"
      {...field}
      error={form.formState.errors.roomNumber?.message}
    />
  )}
/>
```

### Validation with Zod
```typescript
const CreateAlertSchema = z.object({
  roomNumber: z.string().min(1, 'Room number required'),
  alertType: z.enum(['cardiac_arrest', 'code_blue', 'fall']),
  urgencyLevel: z.number().min(1).max(5),
  description: z.string().optional(),
});
```

## Animation System

### Reanimated 2 Patterns

#### Gesture Animations
```tsx
const gesture = Gesture.Pan()
  .onUpdate((e) => {
    translateX.value = e.translationX;
  })
  .onEnd(() => {
    translateX.value = withSpring(0);
  });
```

#### Layout Animations
```tsx
<Animated.View
  entering={FadeIn.duration(300)}
  exiting={FadeOut.duration(200)}
  layout={Layout.springify()}
>
  {children}
</Animated.View>
```

#### Shared Element Transitions
```tsx
<Animated.View
  sharedTransitionTag={`alert-${alert.id}`}
  sharedTransitionStyle={transition}
>
  <AlertCard alert={alert} />
</Animated.View>
```

## Performance Optimization

### Code Splitting
```tsx
// Lazy load heavy screens
const AnalyticsScreen = lazy(() => import('./analytics'));

<Suspense fallback={<LoadingView />}>
  <AnalyticsScreen />
</Suspense>
```

### Memoization
```tsx
const MemoizedAlertList = memo(AlertList, (prev, next) => {
  return prev.alerts.length === next.alerts.length;
});
```

### List Optimization
```tsx
<FlashList
  data={alerts}
  renderItem={renderAlert}
  estimatedItemSize={100}
  keyExtractor={(item) => item.id}
  // Performance optimizations
  removeClippedSubviews
  maxToRenderPerBatch={10}
  windowSize={10}
/>
```

### Image Optimization
```tsx
import { Image } from 'expo-image';

<Image
  source={{ uri: patient.photo }}
  style={styles.avatar}
  contentFit="cover"
  transition={200}
  placeholder={blurhash}
/>
```

## Platform-Specific Code

### Platform Detection
```tsx
import { Platform } from 'react-native';

const styles = StyleSheet.create({
  container: {
    padding: Platform.select({
      ios: 20,
      android: 16,
      web: 24,
    }),
  },
});
```

### Conditional Features
```tsx
{Platform.OS === 'ios' && (
  <BlurView intensity={80} style={styles.blur} />
)}

{Platform.OS === 'web' && (
  <div className="backdrop-blur-md" />
)}
```

### Platform Extensions
```
Button.ios.tsx      # iOS-specific implementation
Button.android.tsx  # Android-specific implementation
Button.web.tsx      # Web-specific implementation
Button.tsx          # Shared/default implementation
```

## Accessibility

### Screen Reader Support
```tsx
<Pressable
  accessibilityRole="button"
  accessibilityLabel="Create new alert"
  accessibilityHint="Double tap to open alert creation form"
  accessibilityState={{ disabled: isLoading }}
>
  <Text>Create Alert</Text>
</Pressable>
```

### Focus Management
```tsx
const inputRef = useRef<TextInput>(null);

useEffect(() => {
  // Auto-focus first input
  inputRef.current?.focus();
}, []);
```

### Reduced Motion
```tsx
const prefersReducedMotion = useReducedMotion();

const animationConfig = prefersReducedMotion
  ? { duration: 0 }
  : { duration: 300, type: 'spring' };
```

## Error Handling

### Error Boundaries
```tsx
export class ErrorBoundary extends Component {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    log.error('React Error Boundary', error, errorInfo);
    // Send to error reporting service
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback onReset={this.reset} />;
    }
    return this.props.children;
  }
}
```

### API Error Handling
```tsx
const mutation = useMutation({
  onError: (error) => {
    if (error.code === 'UNAUTHORIZED') {
      router.replace('/login');
    } else {
      toast.error(error.message);
    }
  },
});
```

### Network Status
```tsx
const netInfo = useNetInfo();

if (!netInfo.isConnected) {
  return <OfflineScreen />;
}
```

## Testing Strategy

### Component Testing
```tsx
describe('Button', () => {
  it('renders with correct text', () => {
    const { getByText } = render(
      <Button onPress={jest.fn()}>Click me</Button>
    );
    expect(getByText('Click me')).toBeTruthy();
  });
  
  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByRole } = render(
      <Button onPress={onPress}>Click</Button>
    );
    fireEvent.press(getByRole('button'));
    expect(onPress).toHaveBeenCalled();
  });
});
```

### Hook Testing
```tsx
describe('useAuth', () => {
  it('returns authenticated state', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.isAuthenticated).toBe(false);
    
    act(() => {
      result.current.login({ email: 'test@example.com' });
    });
    
    expect(result.current.isAuthenticated).toBe(true);
  });
});
```

### Integration Testing
```tsx
describe('Alert Creation Flow', () => {
  it('creates alert successfully', async () => {
    const { getByLabelText, getByText } = render(<CreateAlertScreen />);
    
    fireEvent.changeText(getByLabelText('Room Number'), '302');
    fireEvent.press(getByText('Create Alert'));
    
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/alerts');
    });
  });
});
```

## Build & Deployment

### Development Build
```bash
# iOS
npx expo run:ios

# Android
npx expo run:android

# Web
npx expo start --web
```

### Production Build
```bash
# iOS
eas build --platform ios --profile production

# Android
eas build --platform android --profile production

# Web
npx expo export --platform web
```

### Environment Configuration
```typescript
// config/env.ts
const ENV = {
  dev: {
    apiUrl: 'http://localhost:3000',
    enableDebug: true,
  },
  staging: {
    apiUrl: 'https://staging-api.hospital.com',
    enableDebug: false,
  },
  prod: {
    apiUrl: 'https://api.hospital.com',
    enableDebug: false,
  },
};
```

## Performance Monitoring

### Metrics to Track
- App launch time
- Screen load times
- API response times
- Frame rate (should be 60 FPS)
- Memory usage
- Bundle size

### Performance Tools
```tsx
// React DevTools Profiler
<Profiler id="AlertList" onRender={onRenderCallback}>
  <AlertList alerts={alerts} />
</Profiler>

// Custom performance monitoring
performance.mark('alert-list-start');
// ... render
performance.mark('alert-list-end');
performance.measure('alert-list', 'alert-list-start', 'alert-list-end');
```

## Security Best Practices

1. **Token Storage**: Use expo-secure-store for sensitive data
2. **API Security**: Always use HTTPS in production
3. **Input Validation**: Validate all user inputs with Zod
4. **Code Obfuscation**: Enable in production builds
5. **Certificate Pinning**: For enhanced API security

## Future Enhancements

1. **Offline Support**: Implement with WatermelonDB
2. **Push Notifications**: Real-time alert notifications
3. **Biometric Auth**: FaceID/TouchID integration
4. **Voice Commands**: Hands-free alert creation
5. **AR Features**: Room navigation assistance