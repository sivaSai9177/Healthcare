# PostHog Analytics Module

## Overview

PostHog is our self-hosted product analytics platform that provides event tracking, user identification, session recording, feature flags, and more. This module covers the complete implementation for both server-side (Bun) and client-side (React Native/Expo) tracking.

## Architecture

```
┌──────────────┐     ┌─────────────┐     ┌──────────────┐
│ React Native │────▶│   PostHog   │────▶│  PostgreSQL  │
│     App      │     │   Server    │     │   Database   │
└──────────────┘     └─────────────┘     └──────────────┘
       │                    ▲                     │
       │                    │                     │
       ▼                    │                     ▼
┌──────────────┐     ┌─────────────┐     ┌──────────────┐
│ TRPC Server  │────▶│   Logging   │     │    Redis     │
│    (Bun)     │     │   Service   │     │    Cache     │
└──────────────┘     └─────────────┘     └──────────────┘
```

## Self-Hosting Setup

### 1. Docker Configuration

PostHog requires PostgreSQL, Redis, and optionally ClickHouse for analytics data.

```yaml
# docker-compose.posthog.yml
version: '3.8'

services:
  posthog-db:
    image: postgres:15-alpine
    container_name: posthog-postgres
    environment:
      POSTGRES_USER: posthog
      POSTGRES_PASSWORD: ${POSTHOG_DB_PASSWORD:-posthog}
      POSTGRES_DB: posthog
    volumes:
      - posthog_postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U posthog"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - myexpo-local

  posthog-redis:
    image: redis:7-alpine
    container_name: posthog-redis
    command: redis-server --maxmemory-policy allkeys-lru --maxmemory 200mb
    volumes:
      - posthog_redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - myexpo-local

  posthog:
    image: posthog/posthog:latest
    container_name: posthog
    depends_on:
      posthog-db:
        condition: service_healthy
      posthog-redis:
        condition: service_healthy
    environment:
      # Database
      DATABASE_URL: postgres://posthog:${POSTHOG_DB_PASSWORD:-posthog}@posthog-db:5432/posthog
      REDIS_URL: redis://posthog-redis:6379/
      
      # PostHog Configuration
      SECRET_KEY: ${POSTHOG_SECRET_KEY:-insecure-local-dev-key-change-in-production}
      SITE_URL: ${POSTHOG_SITE_URL:-http://localhost:8000}
      IS_BEHIND_PROXY: ${IS_BEHIND_PROXY:-false}
      DISABLE_SECURE_SSL_REDIRECT: ${DISABLE_SECURE_SSL_REDIRECT:-true}
      SECURE_COOKIES: ${SECURE_COOKIES:-false}
      
      # Features
      CAPTURE_CONSOLE_LOG_ENABLED: true
      SESSION_RECORDING_ENABLED: true
      
      # Email (optional)
      EMAIL_ENABLED: ${EMAIL_ENABLED:-false}
      EMAIL_HOST: ${EMAIL_HOST:-}
      EMAIL_PORT: ${EMAIL_PORT:-587}
      EMAIL_USE_TLS: ${EMAIL_USE_TLS:-true}
      EMAIL_HOST_USER: ${EMAIL_HOST_USER:-}
      EMAIL_HOST_PASSWORD: ${EMAIL_HOST_PASSWORD:-}
      DEFAULT_FROM_EMAIL: ${DEFAULT_FROM_EMAIL:-noreply@posthog.local}
    ports:
      - "${POSTHOG_PORT:-8000}:8000"
    volumes:
      - posthog_data:/var/lib/posthog
    networks:
      - myexpo-local
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/_health/"]
      interval: 10s
      timeout: 10s
      retries: 5

networks:
  myexpo-local:
    external: true

volumes:
  posthog_postgres_data:
  posthog_redis_data:
  posthog_data:
```

### 2. Environment Variables

Add to `.env`:

```bash
# PostHog Configuration
POSTHOG_API_KEY=phc_your_project_api_key_here
POSTHOG_PERSONAL_API_KEY=phx_your_personal_api_key_here
POSTHOG_API_HOST=http://localhost:8000
POSTHOG_ENABLED=true

# PostHog Database
POSTHOG_DB_PASSWORD=secure-password-here
POSTHOG_SECRET_KEY=generate-with-openssl-rand-base64-32

# PostHog Features
POSTHOG_DISABLE_SECURE_SSL_REDIRECT=true
POSTHOG_SECURE_COOKIES=false
POSTHOG_SESSION_RECORDING_ENABLED=true
POSTHOG_CAPTURE_CONSOLE_LOG_ENABLED=true
```

### 3. Initial Setup

```bash
# Start PostHog
bun run docker:posthog

# Wait for services to be ready
sleep 30

# Access PostHog at http://localhost:8000
# 1. Create your account
# 2. Create a project
# 3. Get your API key (starts with phc_)
# 4. Update .env with your API key
```

## Server-Side Integration (Bun)

### 1. PostHog Service

```typescript
// src/server/analytics/posthog-service.ts
import { PostHog } from 'posthog-node';
import { logger } from '@/lib/core/debug/unified-logger';

export class PostHogService {
  private client: PostHog | null = null;
  private enabled: boolean;

  constructor() {
    this.enabled = process.env.POSTHOG_ENABLED === 'true' && !!process.env.POSTHOG_API_KEY;
    
    if (this.enabled) {
      this.client = new PostHog(process.env.POSTHOG_API_KEY!, {
        host: process.env.POSTHOG_API_HOST || 'https://app.posthog.com',
        flushAt: 20,
        flushInterval: 10000, // 10 seconds
      });
      
      logger.info('PostHog analytics initialized', 'POSTHOG', {
        host: process.env.POSTHOG_API_HOST,
      });
    }
  }

  async capture(event: string, distinctId: string, properties?: Record<string, any>) {
    if (!this.client) return;

    try {
      this.client.capture({
        distinctId,
        event,
        properties: {
          ...properties,
          $lib: 'hospital-alert-system',
          $lib_version: '1.0.0',
          runtime: 'bun',
        },
      });
    } catch (error) {
      logger.error('PostHog capture failed', 'POSTHOG', error);
    }
  }

  async identify(distinctId: string, properties?: Record<string, any>) {
    if (!this.client) return;

    try {
      this.client.identify({
        distinctId,
        properties,
      });
    } catch (error) {
      logger.error('PostHog identify failed', 'POSTHOG', error);
    }
  }

  async alias(distinctId: string, alias: string) {
    if (!this.client) return;

    try {
      this.client.alias({
        distinctId,
        alias,
      });
    } catch (error) {
      logger.error('PostHog alias failed', 'POSTHOG', error);
    }
  }

  async shutdown() {
    if (this.client) {
      await this.client.shutdown();
    }
  }
}

// Singleton instance
export const posthogService = new PostHogService();

// Ensure proper shutdown
process.on('SIGTERM', async () => {
  await posthogService.shutdown();
});

process.on('SIGINT', async () => {
  await posthogService.shutdown();
});
```

### 2. TRPC Integration

Update the enhanced TRPC logger to send events to PostHog:

```typescript
// In lib/core/debug/trpc-logger-enhanced.ts
import { posthogService } from '@/src/server/analytics/posthog-service';

// In the sendToPostHog method:
private async sendToPostHog(event: LogEvent | TRPCLogEvent): Promise<void> {
  if (!this.postHogClient) return;

  try {
    const postHogEvent = this.transformToPostHogEvent(event);
    
    // Send to PostHog service
    await posthogService.capture(
      postHogEvent.event,
      event.userId || 'anonymous',
      postHogEvent.properties
    );

    // Track performance separately
    if ('procedure' in event && event.duration) {
      await posthogService.capture(
        'api_performance',
        event.userId || 'anonymous',
        {
          procedure: event.procedure,
          duration: event.duration,
          success: event.success,
          performance_rating: event.duration < 100 ? 'fast' : 
                            event.duration < 500 ? 'normal' : 'slow',
        }
      );
    }
  } catch (error) {
    log.error('Failed to send to PostHog', 'LOGGING', error);
  }
}
```

## Client-Side Integration (React Native/Expo)

### 1. Install SDK

```bash
bun add posthog-react-native @react-native-async-storage/async-storage
```

### 2. PostHog Provider

```typescript
// components/providers/PostHogProvider.tsx
import React, { createContext, useContext, useEffect } from 'react';
import PostHog from 'posthog-react-native';
import { useAuthStore } from '@/lib/stores/auth-store';
import { getPostHogConfig } from '@/lib/core/config/unified-env';

interface PostHogContextType {
  posthog: PostHog | null;
}

const PostHogContext = createContext<PostHogContextType>({ posthog: null });

export function usePostHog() {
  const context = useContext(PostHogContext);
  if (!context) {
    throw new Error('usePostHog must be used within PostHogProvider');
  }
  return context.posthog;
}

interface PostHogProviderProps {
  children: React.ReactNode;
}

export function PostHogProvider({ children }: PostHogProviderProps) {
  const [posthog, setPostHog] = React.useState<PostHog | null>(null);
  const { user } = useAuthStore();
  const config = getPostHogConfig();

  useEffect(() => {
    if (config.enabled && config.apiKey) {
      const client = new PostHog(config.apiKey, {
        host: config.apiHost,
        // React Native specific options
        captureApplicationLifecycleEvents: true,
        captureDeepLinks: true,
        captureNativeAppLifecycleEvents: true,
      });

      setPostHog(client);

      // Identify user if logged in
      if (user) {
        client.identify(user.id, {
          email: user.email,
          name: user.name,
          role: user.role,
          organizationId: user.organizationId,
        });
      }
    }
  }, [config.enabled, config.apiKey, user]);

  return (
    <PostHogContext.Provider value={{ posthog }}>
      {children}
    </PostHogContext.Provider>
  );
}
```

### 3. Track Events Hook

```typescript
// hooks/useAnalytics.ts
import { useCallback } from 'react';
import { usePostHog } from '@/components/providers/PostHogProvider';
import { logger } from '@/lib/core/debug/unified-logger';

export function useAnalytics() {
  const posthog = usePostHog();

  const track = useCallback((event: string, properties?: Record<string, any>) => {
    try {
      if (posthog) {
        posthog.capture(event, properties);
      }
      
      // Also log locally for debugging
      logger.debug('Analytics event', 'ANALYTICS', { event, properties });
    } catch (error) {
      logger.error('Analytics tracking failed', 'ANALYTICS', error);
    }
  }, [posthog]);

  const identify = useCallback((userId: string, traits?: Record<string, any>) => {
    try {
      if (posthog) {
        posthog.identify(userId, traits);
      }
    } catch (error) {
      logger.error('Analytics identify failed', 'ANALYTICS', error);
    }
  }, [posthog]);

  const screen = useCallback((name: string, properties?: Record<string, any>) => {
    try {
      if (posthog) {
        posthog.screen(name, properties);
      }
    } catch (error) {
      logger.error('Analytics screen tracking failed', 'ANALYTICS', error);
    }
  }, [posthog]);

  return { track, identify, screen };
}
```

### 4. App Integration

Update your app layout to include the PostHog provider:

```typescript
// app/_layout.tsx
import { PostHogProvider } from '@/components/providers/PostHogProvider';

export default function RootLayout() {
  return (
    <Providers>
      <PostHogProvider>
        {/* Your app */}
      </PostHogProvider>
    </Providers>
  );
}
```

## Usage Examples

### 1. Track User Actions

```typescript
// In a component
const { track } = useAnalytics();

// Track button click
const handleCreateAlert = () => {
  track('alert_created', {
    severity: 'high',
    department: 'emergency',
  });
  
  // Create alert logic...
};

// Track screen view
useEffect(() => {
  track('screen_viewed', {
    screen_name: 'AlertDetails',
    alert_id: alertId,
  });
}, []);
```

### 2. Track API Performance

```typescript
// Automatically tracked via TRPC middleware
// Events like:
// - trpc_healthcare.createAlert
// - trpc_auth.login
// - api_performance
```

### 3. User Identification

```typescript
// On successful login
const handleLogin = async (credentials) => {
  const result = await login(credentials);
  if (result.success) {
    identify(result.user.id, {
      email: result.user.email,
      role: result.user.role,
    });
  }
};
```

## Privacy & Security

### 1. Data Masking

PostHog automatically masks sensitive data:
- Password fields
- Credit card numbers
- SSNs

Configure additional masking:

```typescript
// In PostHog initialization
{
  maskAllInputs: false,
  maskInputOptions: {
    password: true,
    creditCard: true,
    ssn: true,
  },
}
```

### 2. User Consent

Implement opt-in/opt-out:

```typescript
// Opt out
posthog.optOut();

// Opt in
posthog.optIn();

// Check status
const hasOptedOut = posthog.hasOptedOut();
```

### 3. Data Retention

Configure in PostHog dashboard:
- Event retention: 90 days (default)
- Person profiles: 365 days
- Session recordings: 21 days

## Performance Optimization

### 1. Batch Events

PostHog automatically batches events:
- Server: Every 20 events or 10 seconds
- Client: Every 30 events or 30 seconds

### 2. Selective Recording

Disable session recording for sensitive screens:

```typescript
// Temporarily disable
posthog.sessionRecording.stop();

// Re-enable
posthog.sessionRecording.start();
```

### 3. Reduce Payload Size

Only send necessary properties:

```typescript
// Good
track('button_clicked', {
  button_name: 'create_alert',
  screen: 'dashboard',
});

// Avoid
track('button_clicked', {
  entire_state_object: {...},
  large_array: [...],
});
```

## Monitoring & Debugging

### 1. Debug Mode

Enable debug logging:

```typescript
// Server
const posthog = new PostHog(apiKey, {
  debug: process.env.NODE_ENV === 'development',
});

// Client
posthog.debug();
```

### 2. View Events

Check PostHog dashboard:
1. Events & Actions → Live Events
2. Filter by user or event type
3. Inspect event properties

### 3. Health Check

```bash
# Check PostHog health
curl http://localhost:8000/_health/

# Check if events are being received
curl http://localhost:8000/api/projects/1/events/
```

## Troubleshooting

### Common Issues

1. **Events not appearing**
   - Check API key is correct
   - Verify PostHog service is running
   - Check network connectivity
   - Look for errors in logs

2. **High memory usage**
   - Reduce batch size
   - Increase flush interval
   - Disable session recording

3. **Connection errors**
   - Verify POSTHOG_API_HOST
   - Check firewall rules
   - Ensure PostHog is accessible

### Debug Commands

```bash
# View PostHog logs
docker logs posthog

# Check PostHog database
docker exec -it posthog-postgres psql -U posthog -d posthog

# Test API endpoint
curl -X POST http://localhost:8000/capture/ \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "your-api-key",
    "event": "test_event",
    "distinct_id": "test-user"
  }'
```

## Best Practices

1. **Event Naming**
   - Use snake_case: `alert_created`, `user_logged_in`
   - Be descriptive but concise
   - Group related events: `alert_`, `user_`, `api_`

2. **Property Names**
   - Use consistent naming across events
   - Include relevant context
   - Avoid PII in properties

3. **User Identification**
   - Always identify logged-in users
   - Use consistent user IDs
   - Update traits when they change

4. **Performance**
   - Track only necessary events
   - Use sampling for high-volume events
   - Monitor dashboard performance

## Integration Checklist

- [ ] PostHog Docker containers running
- [ ] Environment variables configured
- [ ] API key obtained from PostHog dashboard
- [ ] Server-side service initialized
- [ ] Client-side provider added
- [ ] User identification implemented
- [ ] Key events tracked
- [ ] Privacy settings configured
- [ ] Monitoring dashboard set up
- [ ] Team members have access

## Next Steps

1. Set up feature flags
2. Configure A/B testing
3. Create custom dashboards
4. Set up alerts for key metrics
5. Integrate with other tools (Slack, etc.)