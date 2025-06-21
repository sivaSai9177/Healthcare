# TRPC Logging Integration with PostHog

## Overview
We've successfully moved the TRPC logger to a separate service with PostHog integration capabilities.

## Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│ TRPC Server │────▶│ Enhanced Logger  │────▶│  Logging    │
│             │     │ (trpc-logger-    │     │  Service    │
│             │     │  enhanced.ts)    │     │ (Port 3003) │
└─────────────┘     └──────────────────┘     └─────────────┘
                                                     │
                                                     ▼
                                              ┌─────────────┐
                                              │  PostHog    │
                                              │ (Port 8000) │
                                              └─────────────┘
```

## Components

### 1. Enhanced TRPC Logger
- **File**: `/lib/core/debug/trpc-logger-enhanced.ts`
- **Features**:
  - Sends logs to both local logger and external service
  - Batch processing for efficiency
  - Includes user context, hospital context, and trace IDs
  - Retry logic for failed transmissions

### 2. Logging Service
- **Files**: 
  - `/src/server/logging/service.ts` - Core service implementation
  - `/src/server/logging/start.ts` - Bun server entry point
- **Endpoints**:
  - `GET /health` - Health check
  - `POST /trpc` - Log TRPC calls
  - `POST /event` - Log general events
  - `POST /performance` - Log performance metrics
  - `POST /batch` - Batch log submission
- **Docker**: `/docker/Dockerfile.logging`

### 3. PostHog Integration
- **SDK**: `posthog-node` npm package
- **Configuration**:
  ```env
  POSTHOG_API_KEY=your-api-key
  POSTHOG_API_HOST=http://localhost:8000
  POSTHOG_ENABLED=true
  ```

## Setup Instructions

### 1. Start the Logging Service
```bash
docker-compose -f docker-compose.local.yml up -d logging-local
```

### 2. Start PostHog (Self-Hosted)
```bash
./scripts/start-posthog.sh
```

### 3. Configure PostHog
1. Visit http://localhost:8000
2. Create an account and project
3. Get your API key
4. Add to `.env` file:
   ```env
   POSTHOG_API_KEY=phc_your_api_key_here
   POSTHOG_API_HOST=http://localhost:8000
   ```

### 4. Restart Logging Service
```bash
docker-compose -f docker-compose.local.yml restart logging-local
```

## Testing

### Test Logging Service
```bash
bun run scripts/test-logging-service.ts
```

### View Integration Demo
```bash
bun run scripts/demo-trpc-logging.ts
```

## Features

### Automatic TRPC Logging
- All TRPC calls are automatically logged
- Includes request/response data
- Performance metrics (duration)
- Error tracking with stack traces
- User and organization context

### PostHog Analytics
When configured, sends:
- Custom events for each TRPC procedure
- Performance metrics
- User identification
- Error tracking
- Console log recording (when enabled)

### Batch Processing
- Logs are batched for efficiency
- Default batch size: 50 events
- Default flush interval: 5 seconds
- Retry on failure

## Environment Variables

```env
# Logging Service
LOGGING_SERVICE_ENABLED=true
LOGGING_SERVICE_URL=http://localhost:3003
LOGGING_BATCH_SIZE=50
LOGGING_FLUSH_INTERVAL=5000

# PostHog
POSTHOG_API_KEY=your-api-key
POSTHOG_API_HOST=http://localhost:8000
POSTHOG_ENABLED=true
```

## PostHog Resources
- Console Log Recording: https://posthog.com/docs/session-replay/console-log-recording
- Self-Hosting Guide: https://posthog.com/docs/self-host
- JavaScript SDK: https://github.com/PostHog/posthog-js

## Status
✅ Logging service created and running
✅ TRPC middleware updated to use enhanced logger
✅ PostHog SDK integrated
✅ Docker configuration complete
⏳ PostHog container downloading (may take time on first run)

Once PostHog is running and configured with an API key, all TRPC logs will be automatically sent to PostHog for analytics.