# System Architecture Overview

## Architecture Principles

1. **Type Safety First**: End-to-end type safety with TypeScript and tRPC
2. **Universal Components**: Write once, run on iOS, Android, and Web
3. **State Management**: Zustand for all state (no Context API)
4. **Performance**: Optimized bundle size and lazy loading
5. **Security**: Role-based access control, secure token storage

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Expo)                       │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   Screens   │  │  Components  │  │      Stores      │  │
│  │ (App Router)│  │  (Universal) │  │    (Zustand)     │  │
│  └─────────────┘  └──────────────┘  └──────────────────┘  │
│                           │                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    tRPC Client                       │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓ HTTP/WebSocket
┌─────────────────────────────────────────────────────────────┐
│                        Backend (Node.js)                     │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ tRPC Server │  │ Better Auth  │  │   WebSocket      │  │
│  │  (Routers)  │  │   (OAuth)    │  │   (Real-time)    │  │
│  └─────────────┘  └──────────────┘  └──────────────────┘  │
│                           │                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   Drizzle ORM                        │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                     PostgreSQL Database                      │
└─────────────────────────────────────────────────────────────┘
```

## Key Technologies

### Frontend
- **Expo SDK 52**: React Native framework
- **Expo Router**: File-based navigation
- **NativeWind**: TailwindCSS for React Native
- **Zustand**: State management
- **React Query**: Server state management
- **TypeScript**: Type safety

### Backend
- **tRPC**: Type-safe API layer
- **Better Auth**: Authentication with OAuth
- **Drizzle ORM**: Type-safe database queries
- **PostgreSQL**: Relational database
- **WebSocket**: Real-time communication
- **Docker**: Containerization

## Data Flow

1. **User Interaction** → Screen Component
2. **Component** → Zustand Store (client state) or tRPC Query (server state)
3. **tRPC Client** → HTTP/WebSocket Request
4. **tRPC Server** → Route Handler
5. **Route Handler** → Database via Drizzle
6. **Response** → Back through the chain

## Authentication Flow

```
User → Login Screen → Better Auth → OAuth Provider
                         ↓
                    Session Token
                         ↓
                   Secure Storage
                         ↓
                    tRPC Context
                         ↓
                  Protected Routes
```

## State Management Strategy

### Client State (Zustand)
- UI state (modals, sidebars)
- User preferences (theme, spacing)
- Cached data
- Form state

### Server State (React Query)
- User data
- Organization data
- Real-time updates
- API responses

## Security Layers

1. **Authentication**: Better Auth with JWT
2. **Authorization**: Role-based access control
3. **API Security**: tRPC middleware
4. **Data Validation**: Zod schemas
5. **Storage**: Encrypted AsyncStorage/SecureStore

## Performance Optimizations

1. **Code Splitting**: Lazy-loaded routes
2. **Bundle Optimization**: Tree shaking
3. **Image Optimization**: Responsive images
4. **Caching**: React Query cache
5. **Memoization**: React.memo and useMemo

## Deployment Architecture

### Development
- Local PostgreSQL via Docker
- Metro bundler for hot reload
- Expo Go for quick testing

### Production
- Cloud PostgreSQL (e.g., Supabase, Neon)
- CDN for static assets
- EAS Build for app binaries
- App Store/Google Play distribution