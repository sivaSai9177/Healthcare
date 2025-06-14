# Backend Architecture Documentation

## Overview

The Hospital Alert System backend is built with modern TypeScript technologies, focusing on type safety, real-time capabilities, and scalability. This document outlines the complete backend architecture, API design, and implementation details.

## Tech Stack

### Core Technologies
- **Runtime**: Node.js with Bun (for development)
- **Framework**: Express.js
- **API Layer**: tRPC v10 (type-safe APIs)
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Authentication**: Better Auth
- **Real-time**: WebSocket with tRPC subscriptions
- **Validation**: Zod schemas
- **Background Jobs**: Bull (Redis-based)

### Infrastructure
- **Hosting**: Vercel (serverless functions)
- **Database**: Neon (serverless Postgres)
- **Cache**: Redis (for sessions and queues)
- **File Storage**: Local (MVP), S3 (production ready)
- **Monitoring**: Console logging (MVP)

## Architecture Overview

```
server/
├── routers/              # tRPC routers (API endpoints)
│   ├── auth.ts          # Authentication endpoints
│   ├── user.ts          # User management
│   ├── organization.ts  # Organization CRUD
│   ├── healthcare.ts    # Healthcare-specific APIs
│   └── notifications.ts # Notification management
├── services/            # Business logic layer
│   ├── auth/           # Authentication services
│   ├── healthcare/     # Healthcare domain logic
│   ├── notifications/  # Push notification service
│   ├── websocket/      # Real-time communication
│   └── email/          # Email service
├── db/                  # Database layer
│   ├── schema.ts       # Drizzle schema definitions
│   ├── migrations/     # Database migrations
│   └── seed.ts         # Seed data
├── middleware/         # Express middleware
│   ├── auth.ts        # Authentication middleware
│   ├── cors.ts        # CORS configuration
│   └── rateLimit.ts   # Rate limiting
└── utils/             # Utility functions
    ├── validation.ts  # Input validation
    ├── errors.ts      # Error handling
    └── logger.ts      # Logging utilities
```

## Database Schema

### Core Tables

#### Users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  image TEXT,
  emailVerified TIMESTAMP,
  role VARCHAR(50) DEFAULT 'user',
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

#### Healthcare Users
```sql
CREATE TABLE healthcare_users (
  userId UUID PRIMARY KEY REFERENCES users(id),
  role VARCHAR(50) NOT NULL, -- operator, nurse, doctor, head_doctor
  hospitalId UUID REFERENCES hospitals(id),
  department VARCHAR(100),
  licenseNumber VARCHAR(50),
  isOnDuty BOOLEAN DEFAULT false,
  shiftStartTime TIME,
  shiftEndTime TIME
);
```

#### Alerts
```sql
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospitalId UUID REFERENCES hospitals(id),
  roomNumber VARCHAR(50) NOT NULL,
  alertType VARCHAR(50) NOT NULL,
  urgencyLevel INTEGER NOT NULL, -- 1-5
  description TEXT,
  status VARCHAR(50) DEFAULT 'active',
  createdBy UUID REFERENCES users(id),
  createdAt TIMESTAMP DEFAULT NOW(),
  escalationLevel INTEGER DEFAULT 0,
  escalatedAt TIMESTAMP
);
```

#### Alert Acknowledgments
```sql
CREATE TABLE alert_acknowledgments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alertId UUID REFERENCES alerts(id),
  userId UUID REFERENCES users(id),
  acknowledgedAt TIMESTAMP DEFAULT NOW(),
  responseTime INTEGER, -- seconds
  notes TEXT
);
```

### Relationships
- Users → Healthcare Users (1:1)
- Hospitals → Healthcare Users (1:N)
- Hospitals → Alerts (1:N)
- Alerts → Acknowledgments (1:N)
- Users → Acknowledgments (1:N)

## API Design

### tRPC Router Structure

#### Authentication Router
```typescript
export const authRouter = router({
  // Mutations
  register: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(8),
      name: z.string(),
    }))
    .mutation(async ({ input }) => {
      // Registration logic
    }),
    
  login: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string(),
    }))
    .mutation(async ({ input }) => {
      // Login logic
    }),
    
  // Queries
  me: protectedProcedure
    .query(async ({ ctx }) => {
      return ctx.user;
    }),
});
```

#### Healthcare Router
```typescript
export const healthcareRouter = router({
  // Alert Management
  createAlert: protectedProcedure
    .input(z.object({
      roomNumber: z.string(),
      alertType: z.enum(['cardiac_arrest', 'code_blue', 'fire', 'security', 'medical_emergency']),
      urgencyLevel: z.number().min(1).max(5),
      description: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Create alert
      // Send notifications
      // Start escalation timer
    }),
    
  acknowledgeAlert: protectedProcedure
    .input(z.object({
      alertId: z.string(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Record acknowledgment
      // Update alert status
      // Cancel escalation
    }),
    
  // Queries
  getActiveAlerts: protectedProcedure
    .input(z.object({
      hospitalId: z.string(),
      role: z.string().optional(),
    }))
    .query(async ({ input }) => {
      // Return filtered alerts
    }),
    
  // Subscriptions
  onAlertUpdate: protectedProcedure
    .input(z.object({
      hospitalId: z.string(),
    }))
    .subscription(async ({ input }) => {
      // Real-time alert updates
    }),
});
```

### API Endpoints

#### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh token

#### User Management
- `GET /api/users/:id` - Get user profile
- `PATCH /api/users/:id` - Update user profile
- `POST /api/users/complete-profile` - Complete onboarding

#### Healthcare Operations
- `POST /api/alerts` - Create new alert
- `GET /api/alerts` - List alerts (filtered)
- `GET /api/alerts/:id` - Get alert details
- `POST /api/alerts/:id/acknowledge` - Acknowledge alert
- `POST /api/alerts/:id/resolve` - Resolve alert
- `GET /api/alerts/:id/timeline` - Get alert timeline

#### Real-time Subscriptions
- `WS /api/alerts/subscribe` - Subscribe to alert updates
- `WS /api/alerts/:id/subscribe` - Subscribe to specific alert

## Authentication & Authorization

### Authentication Flow
1. **Registration**
   - Email/password validation
   - Create user account
   - Send verification email
   - Create session

2. **Login**
   - Validate credentials
   - Check email verification
   - Create session token
   - Return user data

3. **Session Management**
   - JWT tokens with refresh
   - 8-hour access token
   - 30-day refresh token
   - Secure httpOnly cookies

### Authorization Levels
```typescript
const permissions = {
  operator: ['create_alert', 'view_alerts'],
  nurse: ['view_alerts', 'acknowledge_alerts'],
  doctor: ['view_alerts', 'acknowledge_alerts', 'resolve_alerts'],
  head_doctor: ['all_permissions'],
  admin: ['system_admin'],
};
```

### Middleware Implementation
```typescript
export const requireRole = (roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};
```

## Real-time Communication

### WebSocket Server
```typescript
const wss = new WebSocketServer({
  server: httpServer,
  path: '/ws',
});

wss.on('connection', (ws, req) => {
  // Authenticate connection
  const token = extractToken(req);
  const user = await validateToken(token);
  
  // Subscribe to user's hospital alerts
  subscribeToAlerts(ws, user.hospitalId);
  
  // Handle incoming messages
  ws.on('message', (data) => {
    handleWebSocketMessage(ws, data, user);
  });
});
```

### Event Types
```typescript
enum WebSocketEvents {
  ALERT_CREATED = 'alert.created',
  ALERT_ACKNOWLEDGED = 'alert.acknowledged',
  ALERT_ESCALATED = 'alert.escalated',
  ALERT_RESOLVED = 'alert.resolved',
  USER_STATUS_CHANGED = 'user.status_changed',
}
```

## Business Logic Services

### Alert Service
```typescript
class AlertService {
  async createAlert(data: CreateAlertInput, userId: string) {
    // 1. Validate input
    // 2. Create alert record
    // 3. Find on-duty staff
    // 4. Send notifications
    // 5. Start escalation timer
    // 6. Log activity
    return alert;
  }
  
  async escalateAlert(alertId: string) {
    // 1. Get current escalation level
    // 2. Find next tier recipients
    // 3. Send notifications
    // 4. Update alert record
    // 5. Schedule next escalation
  }
}
```

### Notification Service
```typescript
class NotificationService {
  async sendAlertNotification(alert: Alert, recipients: User[]) {
    const notifications = await Promise.allSettled([
      this.sendPushNotifications(alert, recipients),
      this.sendWebSocketNotifications(alert, recipients),
      // Future: SMS, Email
    ]);
    
    // Log notification results
    await this.logNotificationResults(notifications);
  }
  
  private async sendPushNotifications(alert: Alert, users: User[]) {
    const tokens = await this.getUserPushTokens(users);
    return expo.sendPushNotificationsAsync(
      tokens.map(token => ({
        to: token,
        title: `${alert.alertType} - Room ${alert.roomNumber}`,
        body: alert.description,
        data: { alertId: alert.id },
        priority: 'high',
        sound: 'default',
      }))
    );
  }
}
```

### Escalation Service
```typescript
class EscalationService {
  private timers = new Map<string, NodeJS.Timeout>();
  
  startEscalation(alertId: string, level: number = 0) {
    const timer = setTimeout(async () => {
      await this.escalateAlert(alertId, level);
    }, this.getEscalationDelay(level));
    
    this.timers.set(alertId, timer);
  }
  
  cancelEscalation(alertId: string) {
    const timer = this.timers.get(alertId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(alertId);
    }
  }
  
  private getEscalationDelay(level: number): number {
    const delays = [3 * 60 * 1000, 5 * 60 * 1000, 10 * 60 * 1000];
    return delays[level] || delays[delays.length - 1];
  }
}
```

## Error Handling

### Error Types
```typescript
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string
  ) {
    super(message);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public errors: any[]) {
    super(400, message, 'VALIDATION_ERROR');
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(401, message, 'AUTH_ERROR');
  }
}
```

### Global Error Handler
```typescript
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        message: err.message,
        code: err.code,
      },
    });
  }
  
  // Log unexpected errors
  console.error('Unexpected error:', err);
  
  return res.status(500).json({
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
    },
  });
};
```

## Security Measures

### Input Validation
- All inputs validated with Zod schemas
- SQL injection prevention via parameterized queries
- XSS prevention through output encoding

### Authentication Security
- Passwords hashed with bcrypt (10 rounds)
- JWT secrets rotated regularly
- Refresh tokens stored securely
- Session invalidation on logout

### API Security
- Rate limiting per endpoint
- CORS configuration for known origins
- Request size limits
- API versioning

### Data Security
- Sensitive data encrypted at rest
- TLS/SSL for data in transit
- Audit logs for all actions
- PII data minimization

## Performance Optimization

### Database Optimization
```sql
-- Indexes for common queries
CREATE INDEX idx_alerts_hospital_status ON alerts(hospitalId, status);
CREATE INDEX idx_alerts_created_at ON alerts(createdAt DESC);
CREATE INDEX idx_acknowledgments_alert ON alert_acknowledgments(alertId);
CREATE INDEX idx_healthcare_users_hospital ON healthcare_users(hospitalId);
```

### Caching Strategy
```typescript
// Redis caching for frequently accessed data
const cache = {
  async getHospitalStaff(hospitalId: string) {
    const key = `staff:${hospitalId}`;
    const cached = await redis.get(key);
    if (cached) return JSON.parse(cached);
    
    const staff = await db.query.healthcareUsers.findMany({
      where: eq(healthcareUsers.hospitalId, hospitalId),
    });
    
    await redis.setex(key, 300, JSON.stringify(staff)); // 5 min cache
    return staff;
  },
};
```

### Query Optimization
- Use database views for complex queries
- Implement pagination for list endpoints
- Batch notifications for efficiency
- Connection pooling for database

## Monitoring & Logging

### Logging Strategy
```typescript
const logger = {
  info: (message: string, meta?: any) => {
    console.log(JSON.stringify({ level: 'info', message, ...meta }));
  },
  error: (message: string, error?: Error, meta?: any) => {
    console.error(JSON.stringify({ 
      level: 'error', 
      message, 
      error: error?.stack,
      ...meta 
    }));
  },
};
```

### Metrics to Track
- API response times
- Alert acknowledgment times
- Notification delivery rates
- WebSocket connection counts
- Error rates by endpoint

## Testing Strategy

### Unit Tests
```typescript
describe('AlertService', () => {
  it('should create alert and send notifications', async () => {
    const alert = await alertService.createAlert({
      roomNumber: '101',
      alertType: 'cardiac_arrest',
      urgencyLevel: 5,
    }, userId);
    
    expect(alert).toBeDefined();
    expect(notificationService.send).toHaveBeenCalled();
  });
});
```

### Integration Tests
- Test API endpoints with real database
- Test WebSocket connections
- Test notification delivery
- Test escalation timers

### Load Testing
- Simulate 1000 concurrent users
- Test alert creation under load
- Measure notification delivery times
- Monitor database performance

## Deployment

### Environment Variables
```env
# Database
DATABASE_URL=postgresql://user:pass@host/db
REDIS_URL=redis://localhost:6379

# Auth
JWT_SECRET=secret
REFRESH_SECRET=refresh-secret

# Services
PUSH_NOTIFICATION_KEY=expo-key
WEBSOCKET_PORT=3001

# Environment
NODE_ENV=production
```

### Deployment Process
1. Run database migrations
2. Build TypeScript code
3. Deploy to Vercel
4. Configure environment variables
5. Verify health endpoints
6. Monitor error rates

## Future Enhancements

### Planned Features
1. **SMS/Email Notifications**: Integrate Twilio/SendGrid
2. **Analytics Dashboard**: Real-time metrics
3. **Multi-tenancy**: Support multiple hospitals
4. **Offline Support**: Queue actions when offline
5. **Advanced Scheduling**: Shift management

### Scalability Considerations
1. **Horizontal Scaling**: Add more server instances
2. **Database Sharding**: Split by hospital
3. **Message Queue**: Add RabbitMQ/Kafka
4. **Microservices**: Split into smaller services
5. **CDN**: Cache static assets