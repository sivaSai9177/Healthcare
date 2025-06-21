# Backend Architecture Documentation

## Overview

The Hospital Alert System backend is built using Expo's built-in API routes with tRPC v11, providing type-safe APIs without a separate Node.js server. The architecture focuses on type safety, real-time capabilities, and seamless integration with React Native.

## Tech Stack

### Core Technologies
- **Runtime**: Expo API Routes (no separate Node.js server)
- **API Layer**: tRPC v11 (type-safe APIs)
- **Database**: PostgreSQL (local Docker / Neon for production)
- **ORM**: Drizzle ORM
- **Authentication**: Better Auth v1.2.8
- **Real-time**: WebSocket server (Docker container)
- **Validation**: Zod schemas
- **Caching**: Redis (Docker container)

### Infrastructure
- **Development**: Expo Dev Server (port 8081)
- **Database**: PostgreSQL in Docker
- **WebSocket**: Standalone server in Docker (port 3002)
- **Redis**: Docker container for sessions/caching
- **Email Service**: Docker container (development)

## Architecture Overview

```
app/
├── api/                     # Expo API Routes
│   ├── trpc/
│   │   └── [trpc]+api.ts   # tRPC handler endpoint
│   └── auth/
│       └── [...auth]+api.ts # Better Auth handler
│
src/server/
├── routers/                 # tRPC routers (API endpoints)
│   ├── index.ts            # Root router combining all routers
│   ├── auth.ts             # Authentication endpoints
│   ├── healthcare.ts       # Healthcare-specific APIs
│   ├── organization.ts     # Organization management
│   ├── user.ts             # User profile management
│   ├── patient.ts          # Patient management
│   ├── admin.ts            # Admin operations
│   ├── notification.ts     # Push notifications
│   └── system.ts           # System health/config
│
├── services/               # Business logic layer
│   ├── alert-subscriptions.ts  # Real-time alert handling
│   ├── escalation-timer.ts     # Alert escalation logic
│   ├── notifications.ts        # Multi-channel notifications
│   └── server-startup.ts       # Service initialization
│
├── middleware/             # tRPC middleware
│   └── rate-limiter.ts    # Rate limiting per operation
│
├── websocket/             # WebSocket server (separate)
│   └── server.ts          # Socket.io implementation
│
└── trpc.ts               # tRPC context and setup
```

## Database Schema

### Core Tables

#### Users (Better Auth)
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  image TEXT,
  emailVerified BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  userId TEXT REFERENCES users(id),
  expiresAt TIMESTAMP NOT NULL,
  token TEXT UNIQUE NOT NULL,
  ipAddress TEXT,
  userAgent TEXT
);

CREATE TABLE accounts (
  id TEXT PRIMARY KEY,
  userId TEXT REFERENCES users(id),
  accountId TEXT NOT NULL,
  providerId TEXT NOT NULL,
  accessToken TEXT,
  refreshToken TEXT,
  expiresAt TIMESTAMP,
  scope TEXT
);
```

#### Healthcare Domain
```sql
CREATE TABLE healthcare_users (
  userId TEXT PRIMARY KEY REFERENCES users(id),
  role VARCHAR(50) NOT NULL, -- operator, nurse, doctor, manager, admin
  hospitalId UUID REFERENCES hospitals(id),
  organizationId UUID REFERENCES organizations(id),
  department VARCHAR(100),
  licenseNumber VARCHAR(50),
  specialization VARCHAR(100),
  phoneNumber VARCHAR(20),
  isOnDuty BOOLEAN DEFAULT FALSE,
  shiftStartedAt TIMESTAMP
);

CREATE TABLE hospitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizationId UUID REFERENCES organizations(id),
  name VARCHAR(255) NOT NULL,
  address TEXT,
  phone VARCHAR(20),
  isDefault BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT NOW()
);

CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospitalId UUID REFERENCES hospitals(id),
  roomNumber VARCHAR(50) NOT NULL,
  alertType VARCHAR(50) NOT NULL,
  urgencyLevel INTEGER NOT NULL CHECK (urgencyLevel BETWEEN 1 AND 5),
  description TEXT,
  status VARCHAR(50) DEFAULT 'active',
  patientId UUID REFERENCES patients(id),
  createdBy TEXT REFERENCES users(id),
  createdAt TIMESTAMP DEFAULT NOW(),
  resolvedAt TIMESTAMP,
  resolution TEXT,
  escalationTier INTEGER DEFAULT 1,
  nextEscalationAt TIMESTAMP
);

CREATE TABLE alert_acknowledgments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alertId UUID REFERENCES alerts(id),
  userId TEXT REFERENCES users(id),
  notes TEXT,
  acknowledgedAt TIMESTAMP DEFAULT NOW()
);
```

## API Layer (tRPC)

### Router Structure
```ts
// src/server/routers/index.ts
export const appRouter = router({
  auth: authRouter,
  healthcare: healthcareRouter,
  organization: organizationRouter,
  user: userRouter,
  patient: patientRouter,
  admin: adminRouter,
  notification: notificationRouter,
  system: systemRouter,
});

export type AppRouter = typeof appRouter;
```

### Context & Authentication
```ts
// src/server/trpc.ts
export async function createContext(req: Request) {
  const authRequest = auth.api.getSession({
    headers: req.headers,
  });

  const session = await authRequest;
  
  // Get hospital context if user is authenticated
  let hospitalContext = null;
  if (session?.user) {
    hospitalContext = await getHospitalContext(session.user.id);
  }

  return {
    req,
    user: session?.user || null,
    session,
    hospitalContext,
  };
}
```

### Protected Procedures
```ts
// Role-based access control
export const protectedProcedure = t.procedure.use(isAuthed);

export const operatorProcedure = protectedProcedure.use(
  hasPermission('create_alerts')
);

export const healthcareProcedure = protectedProcedure.use(
  hasRole(['doctor', 'nurse', 'admin'])
);

export const adminProcedure = protectedProcedure.use(
  hasRole(['admin'])
);
```

## Real-time Architecture

### WebSocket Server (Docker)
```ts
// Runs separately in Docker container
// Port: 3002
// src/server/websocket/server.ts

io.on('connection', (socket) => {
  socket.on('auth', async ({ token }) => {
    const user = await validateToken(token);
    if (user) {
      socket.join(`user:${user.id}`);
      socket.join(`hospital:${user.hospitalId}`);
    }
  });

  socket.on('subscribe:alerts', ({ hospitalId }) => {
    socket.join(`hospital:${hospitalId}:alerts`);
  });
});
```

### Alert Broadcasting
```ts
// When alert is created
io.to(`hospital:${hospitalId}:alerts`).emit('alert:new', alert);

// When alert is acknowledged
io.to(`hospital:${hospitalId}:alerts`).emit('alert:updated', alert);

// When alert escalates
io.to(`hospital:${hospitalId}:alerts`).emit('alert:escalated', {
  alertId,
  tier,
  nextEscalationAt
});
```

## Service Layer

### Alert Escalation Service
```ts
// Automatic escalation based on urgency
const ESCALATION_TIMERS = {
  5: [5, 10, 15],    // Critical: 5min intervals
  4: [10, 20, 30],   // High: 10min intervals
  3: [15, 30, 45],   // Medium: 15min intervals
  2: [30, 60, 90],   // Low: 30min intervals
  1: [60],           // Info: 60min only
};

// Background job checks every minute
setInterval(async () => {
  const alertsToEscalate = await getAlertsForEscalation();
  for (const alert of alertsToEscalate) {
    await escalateAlert(alert);
    await notifyEscalation(alert);
  }
}, 60000);
```

### Notification Service
```ts
// Multi-channel notifications
export async function sendAlertNotification(alert: Alert) {
  const recipients = await getAlertRecipients(alert);
  
  await Promise.all([
    // Push notifications
    sendPushNotifications(recipients, alert),
    
    // Email notifications (if enabled)
    sendEmailNotifications(recipients, alert),
    
    // In-app notifications
    createInAppNotifications(recipients, alert),
    
    // WebSocket broadcast
    broadcastToWebSocket(alert)
  ]);
}
```

## Authentication Flow

### Email/Password
```
1. Client → POST /api/auth/sign-up
2. Better Auth creates user
3. Email verification sent
4. User completes healthcare profile
5. Session cookie set
```

### OAuth (Google/GitHub)
```
1. Client → GET /api/auth/sign-in/google
2. Redirect to provider
3. Callback → /api/auth/callback/google
4. Better Auth creates/updates user
5. Redirect to profile completion (if new)
6. Session cookie set
```

### Session Management
- Sessions stored in PostgreSQL
- 7-day expiry with auto-refresh
- Secure HTTP-only cookies
- Hospital context loaded with session

## Error Handling

### tRPC Error Codes
```ts
throw new TRPCError({
  code: 'FORBIDDEN',
  message: 'You do not have permission to perform this action',
  cause: {
    requiredPermission: 'create_alerts',
    userPermissions: ctx.hospitalContext.permissions
  }
});
```

### Global Error Handler
```ts
// In tRPC router setup
onError: ({ error, type, path, input, ctx, req }) => {
  logger.error('tRPC Error', {
    code: error.code,
    message: error.message,
    type,
    path,
    userId: ctx?.user?.id
  });
}
```

## Performance Optimizations

### Database
- Connection pooling with pg
- Indexed queries on common filters
- Prepared statements via Drizzle
- Row-level security for multi-tenancy

### Caching
- Redis for session storage
- Query result caching (5min TTL)
- WebSocket connection state
- Rate limit counters

### API Optimizations
- Batch queries with dataloader pattern
- Pagination on all list endpoints
- Selective field returns
- Gzip compression

## Security

### Authentication
- Better Auth v1.2.8 with latest security patches
- Bcrypt password hashing (10 rounds)
- JWT tokens for API access
- Secure session cookies

### Authorization
- Role-based access control (RBAC)
- Permission-based procedures
- Hospital context validation
- Organization isolation

### Rate Limiting
```ts
// Per-operation limits
const limits = {
  'auth.signIn': { window: 60, max: 5 },
  'auth.signUp': { window: 60, max: 3 },
  'healthcare.createAlert': { window: 60, max: 30 },
  'default': { window: 60, max: 100 }
};
```

### Input Validation
- Zod schemas for all inputs
- SQL injection prevention via Drizzle
- XSS protection on outputs
- CORS configuration

## Deployment

### Development
```bash
# Start all services
bun run local:healthcare

# This starts:
# - Expo dev server (8081)
# - PostgreSQL (5432)
# - Redis (6379)
# - WebSocket server (3002)
```

### Production Considerations
- Expo API routes deploy with app
- PostgreSQL on Neon (serverless)
- Redis on Upstash
- WebSocket on dedicated server
- Environment-based configuration

## Monitoring

### Logging
```ts
// Unified logger throughout
logger.info('Alert created', {
  alertId: alert.id,
  hospitalId: alert.hospitalId,
  urgency: alert.urgencyLevel,
  userId: ctx.user.id
});
```

### Metrics
- API response times
- Alert response times
- Escalation rates
- Error rates by endpoint

### Health Checks
```ts
// GET /api/trpc/system.health
{
  status: 'healthy',
  services: {
    database: true,
    redis: true,
    websocket: true
  },
  timestamp: new Date()
}
```

## Best Practices

### Code Organization
1. Routers contain only routing logic
2. Business logic in service layer
3. Database queries in dedicated functions
4. Shared types in `/types` directory

### Error Handling
1. Use appropriate tRPC error codes
2. Include helpful error messages
3. Log errors with context
4. Don't expose internal details

### Performance
1. Use pagination for lists
2. Implement caching where appropriate
3. Optimize database queries
4. Monitor response times

### Security
1. Always validate inputs
2. Use parameterized queries
3. Implement rate limiting
4. Follow principle of least privilege

---

For more details, see:
- [API Documentation](../api/trpc-routes.md)
- [Database Schema](../database/schema.md)
- [Deployment Guide](../guides/deployment.md)