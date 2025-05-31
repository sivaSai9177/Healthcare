# Technology Stack

This document provides a comprehensive overview of the technologies, frameworks, and tools used in this Expo application.

## 🎯 Core Technologies

### Frontend Framework
- **React Native 0.79.2**: Cross-platform mobile development framework
- **React 19.0.0**: Latest React version with improved performance
- **Expo SDK 53**: Managed workflow for React Native development
- **TypeScript 5.8.3**: Static type checking and enhanced developer experience

### Routing & Navigation
- **Expo Router 5.0.6**: File-based routing system
- **React Navigation 7.x**: Navigation library with bottom tabs support
- **Typed Routes**: Experimental feature for type-safe navigation

### State Management & Data Fetching
- **TanStack Query (React Query) 5.79.0**: Powerful asynchronous state management
  - Server state caching
  - Background refetching
  - Optimistic updates
  - Infinite queries support
- **tRPC 11.1.4**: End-to-end typesafe APIs
  - @trpc/client: Type-safe API client
  - @trpc/server: Type-safe API server
  - @trpc/react-query: React Query integration
  - Full TypeScript inference
- **React Hook Form 7.56.4**: Performant forms with easy validation
  - @hookform/resolvers 5.0.1: Validation schema resolvers
  - Zod integration for schema validation
- **Better Auth**: Full-featured authentication library
  - Email/password authentication
  - Session management
  - Secure token storage
  - CORS and rate limiting support
- **React Hooks**: Built-in state management with useState, useEffect, etc.
- **Zustand** (planned): Lightweight state management solution

## 🎨 UI & Styling

### Styling Framework
- **NativeWind 4.1.6**: TailwindCSS for React Native
- **TailwindCSS 3.4.1**: Utility-first CSS framework
- **tailwindcss-animate 1.0.7**: Animation utilities for Tailwind

### Component Libraries
- **shadcn/ui**: Accessible and customizable component library
  - Radix UI primitives (@radix-ui/react-slot 1.2.3)
  - Built with TypeScript
  - Dark mode support
  - Components: Button, Card, Form, Input, Select, Toast
- **Lucide React 0.511.0**: Modern icon library
- **Lucide React Native 0.511.0**: Native icon support
- **Expo Vector Icons 14.1.0**: Icon sets for Expo apps
- **Sonner 2.0.4**: Toast notifications library

### UI Utilities
- **clsx 2.1.1**: Utility for constructing className strings
- **class-variance-authority 0.7.1**: CSS-in-TS library for component variants
- **tailwind-merge 3.3.0**: Merge Tailwind CSS classes without conflicts
- **tw-animate-css 1.3.2**: Animation utilities for Tailwind

## 🗄️ Backend & Database

### Database
- **PostgreSQL**: Primary database system
- **Neon Serverless**: Serverless PostgreSQL hosting
- **Drizzle ORM 0.44.1**: Type-safe ORM for TypeScript
- **Drizzle Kit 0.31.1**: CLI tool for database migrations

### Authentication & Security
- **Better Auth 1.2.8**: Authentication framework
- **@better-auth/expo 1.2.8**: Expo-specific auth integration
- **Expo Secure Store 14.2.3**: Secure storage for sensitive data

### API & Server
- **Expo API Routes**: Server-side API endpoints
  - Better Auth endpoints at `/api/auth/[...auth]+api.ts`
  - tRPC endpoints at `/api/trpc/[trpc]+api.ts`
- **tRPC Server**: Type-safe API layer
  - Procedure-based API design
  - Context-based authentication
  - Input validation with Zod
- **dotenv 16.5.0**: Environment variable management

## 📱 Mobile-Specific

### Expo SDK Modules
- **expo-constants 17.1.6**: System information
- **expo-font 13.3.1**: Custom font loading
- **expo-haptics 14.1.4**: Haptic feedback
- **expo-image 2.1.7**: Optimized image component
- **expo-linking 7.1.5**: Deep linking support
- **expo-splash-screen 0.30.8**: Splash screen configuration
- **expo-status-bar 2.2.3**: Status bar management
- **expo-symbols 0.4.4**: SF Symbols support
- **expo-system-ui 5.0.7**: System UI components
- **expo-web-browser 14.1.6**: In-app browser
- **expo-blur 14.1.4**: Blur effects

### Platform-Specific
- **react-native-gesture-handler 2.24.0**: Touch gestures
- **react-native-reanimated 3.17.4**: Smooth animations
- **react-native-safe-area-context 5.4.0**: Safe area handling
- **react-native-screens 4.10.0**: Native navigation primitives
- **react-native-svg 15.12.0**: SVG support for React Native
- **react-native-webview 13.13.5**: WebView component
- **react-native-web 0.20.0**: Web compatibility layer

## 🛠️ Development Tools

### Build Tools
- **Metro**: JavaScript bundler for React Native
- **Babel 7.25.2**: JavaScript compiler
  - babel-plugin-inline-import 3.0.0
- **Expo CLI**: Command-line tools for Expo

### Code Quality
- **ESLint 9.25.0**: Linting utility
- **eslint-config-expo 9.2.0**: Expo-specific ESLint config
- **TypeScript**: Static type checking

### Development Utilities
- **tsx 4.19.4**: TypeScript execution for Node.js
- **Bun**: Fast JavaScript runtime (optional, used for package management)

## 🏗️ Architecture Patterns

### Project Structure
- **Feature-based organization**: Components grouped by feature
- **File-based routing**: Routes defined by file structure
- **Separation of concerns**: Clear distinction between UI, logic, and data
- **Type-safe API layer**: tRPC for end-to-end type safety
- **Form validation**: Zod schemas for runtime validation

### Design Patterns
- **Component composition**: Reusable UI components
- **Custom hooks**: Logic encapsulation (useAuth, useColorScheme, useThemeColor)
- **Type safety**: Full TypeScript coverage with strict mode
- **Environment-based configuration**: Different configs for dev/prod
- **Schema validation**: Zod for runtime type checking
- **Server-side procedures**: tRPC for API endpoints
- **Optimistic UI updates**: React Query mutations

### Security Considerations
- **Secure token storage**: Using Expo Secure Store
- **CORS protection**: Configured trusted origins
- **Rate limiting**: API endpoint protection
- **Environment variables**: Sensitive data protection

## 📦 Package Management

### Dependencies
- **Production dependencies**: 52 packages
- **Development dependencies**: 8 packages
- **Trusted dependencies**: tailwindcss, nativewind
- **Validation library**: Zod 3.25.42 for schema validation

### Version Management
- **Semantic versioning**: Following semver conventions
- **Lock files**: package-lock.json / bun.lock for reproducible builds

## 🚀 Deployment Targets

### Platforms
- **iOS**: Native iOS app via Expo
- **Android**: Native Android app via Expo
- **Web**: Progressive Web App support
- **Server**: API routes with serverless functions

### Build Configuration
- **EAS Build**: Expo Application Services for building
- **Metro bundler**: For development and production builds
- **Environment-specific builds**: Different configs for dev/staging/prod