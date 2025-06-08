# 🤖 Claude Code Agent User Guide

A comprehensive guide for developers using Claude Code to work with the Expo Modern Starter Kit.

## 📋 Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Understanding the Codebase](#understanding-the-codebase)
4. [Common Development Tasks](#common-development-tasks)
5. [Best Practices](#best-practices)
6. [Troubleshooting](#troubleshooting)
7. [Advanced Usage](#advanced-usage)

## 🎯 Introduction

The Expo Modern Starter Kit is a production-ready, full-stack application template that provides:
- **Universal Components**: 48+ cross-platform components
- **Authentication**: Complete auth system with OAuth
- **Modern Stack**: React 19, Expo SDK 53, TypeScript
- **Performance**: Optimized with React 19 features
- **Developer Experience**: Comprehensive tooling and documentation

This guide helps you leverage Claude Code effectively for development tasks.

## 🚀 Getting Started

### Initial Setup

1. **Clone the Repository**
   ```bash
   git clone [repository-url]
   cd expo-modern-starter
   ```

2. **Install Dependencies**
   ```bash
   bun install  # or npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Start Development**
   ```bash
   # Expo Go mode (default)
   bun start
   
   # Local database (Docker)
   bun local
   
   # Cloud database (Neon)
   bun dev
   ```

### Key Commands Reference

| Command | Description | Database |
|---------|-------------|----------|
| `bun start` | Start in Expo Go mode | Default |
| `bun local` | Local development | Docker PostgreSQL |
| `bun dev` | Development mode | Neon Cloud |
| `bun test` | Run tests | - |
| `bun lint` | Run linter | - |
| `bun db:studio` | Open Drizzle Studio | - |

## 📚 Understanding the Codebase

### Project Structure
```
expo-modern-starter/
├── app/                    # Expo Router screens
│   ├── (auth)/            # Public auth screens
│   ├── (home)/            # Protected app screens
│   └── api/               # API routes
├── components/            # Reusable components
│   ├── universal/         # Cross-platform components
│   └── shadcn/           # UI components
├── lib/                   # Core utilities
│   ├── auth/             # Authentication
│   ├── stores/           # State management
│   └── validations/      # Zod schemas
├── src/                   # Backend code
│   ├── db/               # Database schema
│   └── server/           # tRPC server
└── docs/                  # Documentation
```

### Key Technologies
- **Frontend**: Expo, React Native, React Native Web
- **Navigation**: Expo Router (file-based)
- **Styling**: NativeWind (TailwindCSS)
- **State**: Zustand
- **API**: tRPC
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: Better Auth

### Important Files
- `CLAUDE.md` - Development context and patterns
- `app/_layout.tsx` - Root layout with providers
- `lib/stores/auth-store.ts` - Authentication state
- `src/server/trpc.ts` - tRPC configuration
- `components/universal/` - Reusable components

## 💻 Common Development Tasks

### 1. Adding a New Screen

```typescript
// Ask Claude Code:
"Create a new screen for [feature] in the (home) group with:
- Protected route
- Universal components
- Proper TypeScript types
- Loading and error states"
```

Example structure:
```typescript
// app/(home)/new-feature.tsx
import { Container, VStack, Text, Button } from '@/components/universal';

export default function NewFeatureScreen() {
  return (
    <Container scroll>
      <VStack p={4} spacing={4}>
        <Text variant="heading1">New Feature</Text>
        {/* Your content */}
      </VStack>
    </Container>
  );
}
```

### 2. Creating a Universal Component

```typescript
// Ask Claude Code:
"Create a universal component for [component] that:
- Works on iOS, Android, and Web
- Follows the existing pattern in components/universal/
- Includes TypeScript types
- Has theme integration"
```

### 3. Adding API Endpoints

```typescript
// Ask Claude Code:
"Add a tRPC endpoint for [feature] that:
- Uses proper authorization (protectedProcedure)
- Has Zod validation
- Includes error handling
- Updates the database"
```

Example:
```typescript
// src/server/routers/feature.ts
export const featureRouter = router({
  create: protectedProcedure
    .input(createFeatureSchema)
    .mutation(async ({ input, ctx }) => {
      // Implementation
    }),
});
```

### 4. Implementing Authentication Features

```typescript
// Ask Claude Code:
"Implement [auth feature] such as:
- Two-factor authentication
- Password reset flow
- Session management
- OAuth provider integration"
```

### 5. Optimizing Performance

```typescript
// Ask Claude Code:
"Optimize [component/screen] using:
- React 19 hooks (useDeferredValue, useTransition)
- Memoization strategies
- Lazy loading
- Bundle size optimization"
```

## 🎨 Best Practices

### 1. Component Development
- Use universal components from `/components/universal`
- Follow existing patterns for consistency
- Test on all platforms (iOS, Android, Web)
- Include proper TypeScript types

### 2. State Management
- Use Zustand stores for global state
- Keep component state local when possible
- Use TanStack Query for server state
- Implement optimistic updates

### 3. Authentication
- Always use Better Auth patterns
- Check permissions with tRPC procedures
- Handle loading and error states
- Test auth flows thoroughly

### 4. Performance
- Apply React 19 optimizations
- Monitor bundle size
- Use proper memoization
- Test on low-end devices

### 5. Documentation
- Update docs with significant changes
- Include usage examples
- Document design decisions
- Keep CLAUDE.md current

## 🔧 Troubleshooting

### Common Issues

1. **Expo Go vs Development Build**
   - Default commands use Expo Go
   - Use `:dev` suffix for development builds
   - OAuth requires development builds

2. **Database Connection**
   - Local: Ensure Docker is running
   - Cloud: Check Neon credentials
   - Run migrations: `bun db:push`

3. **Type Errors**
   - Run `bun type-check`
   - Check for missing imports
   - Ensure proper generic types

4. **Platform-Specific Issues**
   - Test on target platform
   - Check Platform.OS conditions
   - Review universal component usage

## 🚀 Advanced Usage

### 1. Custom Themes
```typescript
// Ask Claude Code:
"Add a custom theme called [name] with:
- Color palette
- Dark mode variant
- Integration with theme system"
```

### 2. Complex State Management
```typescript
// Ask Claude Code:
"Implement complex state for [feature] with:
- Zustand store
- Persistence
- Middleware
- DevTools integration"
```

### 3. Advanced Authentication
```typescript
// Ask Claude Code:
"Implement [advanced auth] such as:
- Biometric authentication
- Magic links
- Passkeys
- Multi-tenant support"
```

### 4. Performance Monitoring
```typescript
// Ask Claude Code:
"Set up performance monitoring with:
- Custom metrics
- Error tracking
- User analytics
- Performance budgets"
```

## 📋 Task Templates

### Feature Development Template
```markdown
Create [feature name] with:
1. Database schema updates
2. tRPC endpoints with authorization
3. Zustand store if needed
4. Universal UI components
5. Screen implementation
6. Tests and documentation
```

### Bug Fix Template
```markdown
Fix [issue description]:
1. Reproduce the issue
2. Identify root cause
3. Implement fix
4. Add tests to prevent regression
5. Update documentation
```

### Performance Optimization Template
```markdown
Optimize [component/feature]:
1. Measure current performance
2. Identify bottlenecks
3. Apply optimizations
4. Verify improvements
5. Document changes
```

## 🤝 Working with Claude Code

### Effective Prompts

1. **Be Specific**
   ```
   "Create a user profile screen with avatar upload, 
   form validation, and optimistic updates"
   ```

2. **Reference Existing Patterns**
   ```
   "Following the pattern in login.tsx, create a 
   registration screen with similar validation"
   ```

3. **Include Requirements**
   ```
   "Add real-time notifications using WebSockets,
   with offline queue and retry logic"
   ```

4. **Ask for Best Practices**
   ```
   "What's the best way to implement infinite 
   scroll with TanStack Query in this codebase?"
   ```

### Getting Help

1. **Check Documentation**
   - Start with `/docs/INDEX.md`
   - Review `CLAUDE.md` for patterns
   - Check component examples

2. **Understand the Context**
   - Current tech stack
   - Existing patterns
   - Project conventions

3. **Provide Clear Context**
   - Share relevant code
   - Describe the goal
   - Mention constraints

## 📚 Resources

### Internal Documentation
- `/docs/INDEX.md` - Documentation index
- `/CLAUDE.md` - Development context
- `/docs/planning/CLAUDE_CODE_WORKFLOW.md` - Workflow guide
- `/docs/status/PROJECT_STATUS_2025.md` - Current status

### External Resources
- [Expo Documentation](https://docs.expo.dev)
- [React Native Docs](https://reactnative.dev)
- [tRPC Documentation](https://trpc.io)
- [Better Auth Docs](https://better-auth.com)

---

*Remember: Claude Code works best when you provide clear context and requirements. The more specific you are, the better the results!*