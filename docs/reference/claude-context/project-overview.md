# 🏗️ Project Overview - Claude Context Module

*Last Updated: January 10, 2025*

## Project Information

**Project**: Modern Expo Starter Kit  
**Development**: Single-agent approach with Claude Code  
**Stack**: Expo (React Native), TypeScript, tRPC, Better Auth, Drizzle ORM, TanStack Query  
**Purpose**: The most comprehensive, production-ready starter kit for modern app development  
**Status**: 98% Complete - Production Ready

## Technology Stack

### Frontend
- **Framework**: React Native 0.79.2 + Expo SDK 53
- **Web Support**: React Native Web
- **Language**: TypeScript (strict mode)
- **Routing**: Expo Router v5 (file-based)
- **State Management**: 
  - Zustand (client state)
  - TanStack Query (server state)
  - No Context API usage
- **Styling**: 
  - NativeWind 4.1.6 (TailwindCSS)
  - Universal Design System
  - 5 built-in themes

### Backend
- **API**: tRPC 11.1.4 (type-safe)
- **Authentication**: Better Auth 1.2.8
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod schemas
- **Session**: 7-day expiry with auto-refresh

### Infrastructure
- **Build**: EAS Build
- **Testing**: Jest + React Native Testing Library
- **CI/CD**: GitHub Actions ready
- **Docker**: Full development environment

## Key Features

1. **Universal Design System**
   - 48+ cross-platform components
   - 6 chart types with full theming
   - 5 built-in themes
   - Dark mode support
   - Responsive spacing system

2. **Authentication & Authorization**
   - Email/password + OAuth
   - Role-based access control
   - Permission-based procedures
   - Multi-session support
   - Audit logging

3. **Performance Optimizations**
   - React 19 features implemented
   - Bundle size optimized (saved 73MB)
   - 60fps animations
   - Lazy loading

4. **Developer Experience**
   - Type-safe end-to-end
   - Hot reload everywhere
   - Comprehensive documentation
   - Docker development environment

## Project Goals

1. **Production-Ready**: Enterprise-grade starter kit
2. **Cross-Platform**: iOS, Android, and Web from single codebase
3. **Type-Safe**: End-to-end type safety with TypeScript
4. **Performance**: Optimized for real-world usage
5. **Developer-Friendly**: Excellent DX with modern tooling

## Current Focus Areas

- Animation system implementation (75% complete)
- Advanced features (real-time, offline support)
- Interactive documentation
- Video tutorials

## Architecture Principles

1. **Feature-Based Structure**: Organized by features, not file types
2. **Universal Components**: Single component works everywhere
3. **Type Safety**: TypeScript everywhere with strict mode
4. **Performance First**: Every decision considers performance
5. **Security by Default**: Built-in security best practices

## Development Methodology

- **Single Agent**: Claude Code handles all development
- **Documentation First**: Document before implementing
- **Test Driven**: Tests alongside features
- **Iterative**: Small, focused improvements
- **Quality Focus**: Code quality over speed

---

*This module contains the high-level project overview. For detailed implementation, see other context modules.*