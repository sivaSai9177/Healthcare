# 🚀 Full-Stack Expo Starter

A production-ready full-stack starter template built with React Native, Expo, and modern technologies. Perfect foundation for building cross-platform apps with authentication, database integration, and type-safe APIs.

> **Last Updated**: January 2025 - Complete project restructuring with improved organization and cleaner architecture.

## ✨ What's Included

### 🔐 **Complete Authentication System**
- **Email/Password Authentication** with secure validation
- **Google OAuth Integration** (iOS, Android, Web)
- **Role-Based Access Control** (Admin, Manager, User, Guest)
- **Session Management** with persistence across platforms
- **Secure Token Storage** (Expo SecureStore for mobile, localStorage for web)

### 🏗️ **Modern Full-Stack Architecture**
- **Frontend**: React Native 0.79.2 + Expo SDK 53 + TypeScript
- **Backend**: tRPC 11.1.4 with Better Auth 1.2.8
- **Database**: PostgreSQL + Drizzle ORM 0.44.1
- **State Management**: Zustand with persistence
- **Styling**: NativeWind 4.1.6 (TailwindCSS for React Native)
- **UI Components**: shadcn/ui adapted for React Native
- **Validation**: Zod v4 for runtime type checking

### 🌐 **Cross-Platform Ready**
- **iOS**: Native app with proper OAuth handling
- **Android**: Native app with optimized performance
- **Web**: Progressive web app with server-side rendering

### 🛡️ **Production Features**
- **100% TypeScript**: End-to-end type safety
- **Security**: TLS 1.3, secure session management, CORS protection
- **Performance**: Optimized queries, caching, lazy loading
- **Testing**: Jest + React Native Testing Library setup
- **Code Quality**: ESLint, Prettier, strict TypeScript

## 📁 Project Structure

```
my-expo/
├── app/                    # Expo Router - File-based routing
│   ├── (auth)/            # Authentication routes
│   │   ├── login.tsx      # Login screen
│   │   ├── signup.tsx     # Registration screen
│   │   ├── complete-profile.tsx # Profile completion
│   │   ├── forgot-password.tsx  # Password recovery
│   │   └── _layout.tsx    # Auth layout with guards
│   ├── (home)/            # Protected app routes
│   │   ├── index.tsx      # Dashboard
│   │   └── explore.tsx    # Feature showcase
│   ├── api/               # API routes
│   │   ├── auth/          # Better Auth endpoints
│   │   └── trpc/          # tRPC API endpoint
│   └── _layout.tsx        # Root layout with providers
├── components/            # Reusable UI components
│   ├── ui/               # Core UI components
│   │   ├── IconSymbol.tsx
│   │   └── TabBarBackground.tsx
│   ├── shadcn/ui/        # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── form.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   └── toast.tsx
│   ├── Avatar.tsx
│   ├── GoogleSignInButton.tsx
│   ├── HapticTab.tsx
│   ├── ProtectedRoute.tsx
│   ├── ThemedText.tsx
│   └── ThemedView.tsx
├── constants/             # App constants
│   └── theme/            # Theme constants
│       └── Colors.ts     # Color definitions
├── hooks/                # Custom React hooks
│   ├── useAuth.tsx       # Authentication hook
│   ├── useColorScheme.ts # Color scheme hook
│   └── useThemeColor.ts  # Theme color hook
├── lib/                  # Core utilities & configuration
│   ├── auth/            # Authentication modules
│   │   ├── auth.ts      # Better Auth server config
│   │   ├── auth-client.ts # Auth client setup
│   │   └── auth-session-manager.ts # Session management
│   ├── core/            # Core utilities
│   │   ├── alert.ts     # Alert utilities
│   │   ├── config.ts    # App configuration
│   │   ├── crypto.ts    # Cryptography helpers
│   │   ├── secure-storage.ts # Secure storage
│   │   └── utils.ts     # Utility functions
│   ├── stores/          # State management
│   │   └── auth-store.ts # Zustand auth store
│   ├── validations/     # Validation schemas
│   │   └── auth.ts      # Auth validation schemas
│   └── trpc.tsx         # tRPC client setup
├── src/                  # Backend source code
│   ├── db/              # Database layer
│   │   ├── index.ts     # Database connection
│   │   └── schema.ts    # Database schema
│   └── server/          # Server logic
│       ├── routers/     # tRPC routers
│       │   ├── auth.ts  # Auth router
│       │   └── index.ts # Root router
│       └── trpc.ts      # tRPC setup
├── types/               # TypeScript definitions
│   ├── auth.ts          # Auth type definitions
│   ├── api/             # API-related types
│   │   ├── auth.ts      # Auth API types
│   │   └── trpc.ts      # tRPC types
│   └── components/      # Component prop types
├── __tests__/           # Test suite
│   ├── unit/            # Unit tests
│   ├── integration/     # Integration tests
│   └── components/      # Component tests
├── assets/              # Static assets
│   ├── fonts/           # Custom fonts
│   └── images/          # Images & icons
└── docs/                # Documentation
    ├── guides/          # Setup & configuration guides
    ├── examples/        # Example implementations
    ├── planning/        # Development plans
    └── archive/         # Historical docs
```

## 🚀 Quick Start

### Prerequisites

- **Bun** (recommended) or Node.js 18+
- **PostgreSQL** database (local or cloud like Neon)
- **Expo CLI**: `bun install -g expo`
- **Google OAuth credentials** (optional, for social auth)

### 1. Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd expo-fullstack-starter

# Install dependencies
bun install
```

### 2. Environment Setup

Create `.env` file in the root directory:

```env
# Database
DATABASE_URL=your_postgresql_connection_string

# Better Auth (generate a random 32+ character string)
BETTER_AUTH_SECRET=your-super-secret-key-min-32-characters
BETTER_AUTH_BASE_URL=http://localhost:8081/api/auth
BETTER_AUTH_URL=http://localhost:8081

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Development
LOCAL_IP=192.168.1.XXX  # Your local IP for mobile testing
```

### 3. Database Setup

```bash
# Push database schema
bun run db:push

# (Optional) Open database studio
bun run db:studio
```

### 4. Start Development

```bash
# Start the development server
bun start

# Or run on specific platforms
bun run ios      # iOS Simulator
bun run android  # Android Emulator  
bun run web      # Web Browser
```

## 🔧 Configuration

### Google OAuth Setup (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials
3. Add authorized redirect URIs:
   - **Web**: `http://localhost:8081/api/auth/callback/google`
   - **Mobile**: `https://auth.expo.io/@anonymous/expo-fullstack-starter/auth/callback/google`
4. Add credentials to `.env` file

### App Configuration

Update `app.json` with your app details:

```json
{
  "expo": {
    "name": "Your App Name",
    "slug": "your-app-slug",
    "scheme": "your-app-scheme",
    "ios": {
      "bundleIdentifier": "com.yourcompany.yourapp"
    },
    "android": {
      "package": "com.yourcompany.yourapp"
    }
  }
}
```

## 🎨 Customization

### User Roles & Permissions

Customize user roles in `lib/validations/auth.ts`:

```typescript
export const UserRole = z.enum([
  "admin",    // Full access
  "manager",  // Management features
  "user",     // Standard user
  "guest"     // Limited access
]);
```

Update permissions in `lib/stores/auth-store.ts`:

```typescript
const rolePermissions: Record<string, string[]> = {
  admin: ['*'], // All permissions
  manager: ['manage_users', 'view_analytics', 'manage_content'],
  user: ['view_content', 'edit_profile'],
  guest: ['view_content'],
};
```

### Database Schema

Extend the schema in `src/db/schema.ts`:

```typescript
// Add your custom tables
export const yourTable = pgTable('your_table', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  // Add more fields as needed
});
```

Then run: `bun run db:push`

### Add New Features

1. **Backend**: Create tRPC routers in `src/server/routers/`
2. **Frontend**: Add components in `components/`
3. **Routes**: Create new screens in `app/`
4. **State**: Add Zustand stores in `lib/stores/`

## 🧪 Testing

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test --watch

# Run specific test file
bun test auth-core.test.ts
```

### Test Structure
```
__tests__/
├── auth-core.test.ts           # Authentication tests
├── auth-flow-integration.test.tsx # User flow tests
└── simple.test.ts              # Component tests
```

## 🚀 Deployment

### Web Deployment

Deploy to Vercel, Netlify, or any Node.js hosting:

```bash
# Build for production
bun run build

# Preview production build
bun run preview
```

### Mobile App Deployment

Use Expo Application Services (EAS):

```bash
# Install EAS CLI
bun install -g @expo/eas-cli

# Login to Expo
eas login

# Configure EAS
eas build:configure

# Build for production
eas build --platform ios
eas build --platform android

# Submit to app stores
eas submit --platform ios
eas submit --platform android
```

## 📚 Available Scripts

```bash
# Development
bun start              # Start Expo development server
bun run ios            # Run on iOS simulator
bun run android        # Run on Android emulator
bun run web            # Run in web browser

# Database
bun run db:push        # Push schema changes to database
bun run db:studio      # Open Drizzle Studio (database GUI)
bun run db:generate    # Generate migration files

# Code Quality
bun run lint           # Run ESLint
bun run lint:fix       # Fix ESLint errors
bun run type-check     # Run TypeScript checks
bun test              # Run test suite

# Build & Deploy
bun run build          # Build for production
bun run preview        # Preview production build
```

## 🛡️ Security Features

- **Authentication**: Better Auth with secure session management
- **Authorization**: Role-based access control at API and UI level
- **Validation**: Zod schemas for runtime type checking
- **Encryption**: TLS for data in transit, secure storage for tokens
- **CORS Protection**: Configured trusted origins
- **Rate Limiting**: Built-in protection against abuse

## 📖 Tech Stack Details

### Core Technologies
- **[React Native](https://reactnative.dev/)**: Cross-platform mobile development
- **[Expo](https://expo.dev/)**: Managed React Native workflow
- **[TypeScript](https://www.typescriptlang.org/)**: Type-safe JavaScript
- **[tRPC](https://trpc.io/)**: End-to-end typesafe APIs
- **[Better Auth](https://www.better-auth.com/)**: Authentication library

### Database & State
- **[PostgreSQL](https://www.postgresql.org/)**: Relational database
- **[Drizzle ORM](https://orm.drizzle.team/)**: Type-safe SQL toolkit
- **[Zustand](https://docs.pmnd.rs/zustand)**: Lightweight state management
- **[TanStack Query](https://tanstack.com/query)**: Server state management

### UI & Styling
- **[NativeWind](https://www.nativewind.dev/)**: TailwindCSS for React Native
- **[shadcn/ui](https://ui.shadcn.com/)**: High-quality UI components
- **[Expo Image](https://docs.expo.dev/versions/latest/sdk/image/)**: Optimized image component

### Development Tools
- **[Jest](https://jestjs.io/)**: Testing framework
- **[ESLint](https://eslint.org/)**: Code linting
- **[Prettier](https://prettier.io/)**: Code formatting

## 📖 Documentation

- **[Code Structure Guide](./docs/CODE_STRUCTURE.md)** - Detailed explanation of the project architecture
- **[Google OAuth Setup](./docs/guides/GOOGLE_OAUTH_SETUP.md)** - Step-by-step OAuth configuration
- **[Expo tRPC Best Practices](./docs/guides/EXPO_TRPC_BEST_PRACTICES.md)** - Best practices for using tRPC with Expo
- **[Healthcare Example](./docs/examples/HEALTHCARE_PROJECT.md)** - Complete healthcare app implementation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Ensure all tests pass: `bun test`
5. Lint your code: `bun run lint`
6. Commit your changes: `git commit -m 'Add amazing feature'`
7. Push to the branch: `git push origin feature/amazing-feature`
8. Open a Pull Request

## 💡 Example Projects

This starter template can be used to build various types of applications:

- **SaaS Applications**: Multi-tenant apps with role-based access
- **E-commerce Apps**: Product catalogs with user management
- **Social Platforms**: User-generated content with authentication
- **Business Tools**: Internal tools with employee access control
- **Healthcare Apps**: Check `HEALTHCARE_PROJECT.md` for a complete healthcare implementation example

## 🆘 Troubleshooting

### Common Issues

**Build Errors**:
```bash
# Clear cache and reinstall
expo start --clear
rm -rf node_modules && bun install
```

**Database Connection**:
```bash
# Check your DATABASE_URL
echo $DATABASE_URL

# Test database connection
bun run db:studio
```

**OAuth Issues**:
- Verify redirect URIs in Google Console
- Check bundle identifier matches your configuration
- Ensure environment variables are set correctly

**crypto.randomUUID is not a function**:
This error occurs when the Web Crypto API is not available. The project includes a polyfill in `lib/core/crypto.ts` that should handle this automatically. If you still encounter this error:
- Ensure `react-native-get-random-values` is installed
- The crypto polyfill is imported early in the auth client
- Clear your Metro cache: `expo start --clear`

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Expo team](https://expo.dev/) for the amazing React Native toolchain
- [Better Auth](https://www.better-auth.com/) for secure authentication
- [tRPC](https://trpc.io/) for type-safe APIs
- [shadcn](https://ui.shadcn.com/) for beautiful UI components

---

**Ready to build something amazing? 🚀**

This starter gives you everything you need to create a production-ready full-stack app. Start building your features and customize it to your needs!