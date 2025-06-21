# System Architecture

## Overview

The Healthcare Alert System is built as a modern, scalable React Native application using Expo's managed workflow with a TypeScript-based backend integrated directly into the app.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Clients                              │
├─────────────┬──────────────┬──────────────┬────────────────┤
│   iOS App   │  Android App │   Web App    │  Expo Go Dev   │
└──────┬──────┴──────┬───────┴──────┬───────┴────────┬───────┘
       │             │              │                │
       └─────────────┴──────────────┴────────────────┘
                            │
                    ┌───────▼────────┐
                    │  Expo Router   │
                    │  (Navigation)  │
                    └───────┬────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼────────┐ ┌────────▼────────┐ ┌───────▼────────┐
│     Hooks      │ │   Components    │ │     Stores     │
│  (Business     │ │  (UI Layer)     │ │   (Zustand)    │
│   Logic)       │ │                 │ │                │
└───────┬────────┘ └────────┬────────┘ └───────┬────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                    ┌───────▼────────┐
                    │   tRPC Client  │
                    │   (Type-safe   │
                    │     API)       │
                    └───────┬────────┘
                            │
                    ┌───────▼────────┐
                    │ Expo API Routes│
                    │  /app/api/*    │
                    └───────┬────────┘
                            │
                    ┌───────▼────────┐
                    │  tRPC Server   │
                    │   (Routers)    │
                    └───────┬────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼────────┐ ┌────────▼────────┐ ┌───────▼────────┐
│  Better Auth   │ │  Business Logic │ │   WebSocket    │
│  (Auth Layer)  │ │   (Services)    │ │   (Real-time)  │
└───────┬────────┘ └────────┬────────┘ └───────┬────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                    ┌───────▼────────┐
                    │  Drizzle ORM   │
                    │  (Data Layer)  │
                    └───────┬────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼────────┐ ┌────────▼────────┐ ┌───────▼────────┐
│  PostgreSQL    │ │     Redis       │ │  Email Service │
│  (Database)    │ │   (Sessions)    │ │   (Docker)     │
└────────────────┘ └─────────────────┘ └────────────────┘
```

## Core Technologies

### Frontend Stack
- **Expo SDK 52**: Managed workflow for cross-platform development
- **React Native**: Native mobile apps with React
- **TypeScript**: Type-safe development
- **Expo Router**: File-based navigation
- **NativeWind**: Tailwind CSS for React Native
- **Zustand**: Lightweight state management
- **TanStack Query**: Server state management via tRPC

### Backend Stack
- **tRPC**: End-to-end type-safe APIs
- **Expo API Routes**: Serverless functions in the app
- **Better Auth**: Modern authentication solution
- **Drizzle ORM**: Type-safe database queries
- **PostgreSQL**: Primary database
- **Redis**: Session storage and caching
- **WebSocket**: Real-time updates (Docker)

### DevOps & Tools
- **Docker**: Container services
- **Jest**: Testing framework
- **GitHub Actions**: CI/CD pipeline
- **Bun**: Fast JavaScript runtime

## Key Design Patterns

### 1. Modular Architecture
```
modules/
├── healthcare/     # Domain-specific logic
├── auth/          # Authentication
├── organization/  # Multi-tenancy
└── shared/        # Common utilities
```

### 2. Type-Safe API Layer
- tRPC provides end-to-end type safety
- No API documentation needed
- Automatic client generation
- Type inference from backend to frontend

### 3. Real-time Updates
- WebSocket for instant notifications
- Optimistic updates for better UX
- Automatic reconnection handling
- Event-driven architecture

### 4. Offline-First Design
- Local state management with Zustand
- Queue system for offline actions
- Sync when connection restored
- Conflict resolution strategies

## Data Flow

### 1. User Action Flow
```
User Input → Component → Hook → tRPC Client → API Route → 
tRPC Router → Service → Database → Response → UI Update
```

### 2. Real-time Event Flow
```
Database Change → Service → WebSocket Server → 
Connected Clients → Store Update → UI Re-render
```

### 3. Authentication Flow
```
Login Request → Better Auth → Validate → Create Session → 
Store in Redis → Return Token → Client Storage → 
Authenticated Requests
```

## Security Architecture

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (RBAC)
- Secure session management
- Multi-factor authentication ready

### API Security
- HTTPS everywhere
- API rate limiting
- Input validation
- SQL injection prevention

### Data Security
- Encrypted at rest
- Encrypted in transit
- PII data protection
- Audit logging

## Scalability Considerations

### Horizontal Scaling
- Stateless API design
- Redis for shared state
- Load balancer ready
- Database connection pooling

### Performance Optimization
- Code splitting
- Lazy loading
- Image optimization
- Bundle size monitoring

### Caching Strategy
- Redis for session data
- React Query for API caching
- CDN for static assets
- Database query optimization

## Module Architecture

### Healthcare Module
```
healthcare/
├── components/     # UI components
├── hooks/         # Business logic
├── services/      # Backend services
├── types/         # TypeScript types
└── utils/         # Helper functions
```

### Key Features
- Alert management system
- Automatic escalation
- Shift management
- Real-time dashboards
- Analytics and reporting

## Development Architecture

### Environment Management
- Development: Local with hot reload
- Staging: Production-like testing
- Production: Optimized builds

### Testing Strategy
- Unit tests for business logic
- Integration tests for API
- Component tests for UI
- E2E tests for critical flows

### CI/CD Pipeline
- Automated testing
- Build verification
- Deployment automation
- Release management

## Future Architecture Plans

### Microservices Migration
- Extract notification service
- Separate analytics engine
- Independent scaling

### Enhanced Real-time
- GraphQL subscriptions
- Server-sent events
- WebRTC for video calls

### AI Integration
- Predictive alerts
- Smart escalation
- Natural language processing

---

For implementation details, see:
- [Frontend Architecture](./guides/frontend-architecture.md)
- [Backend Architecture](./guides/backend-architecture.md)
- [Database Design](./api/database-schema.md)