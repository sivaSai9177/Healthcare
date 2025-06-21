# PostHog Integration Guide

## Quick Start

### 1. Start PostHog Container
```bash
# Make sure Docker is running
./scripts/start-posthog.sh
```

### 2. Initial Setup
1. Visit http://localhost:8000
2. Create your first account
3. Create a new project (e.g., "Healthcare MVP")
4. Copy your Project API Key

### 3. Configure Environment
Add to your `.env.local`:
```env
# PostHog Configuration
EXPO_PUBLIC_POSTHOG_ENABLED=true
EXPO_PUBLIC_POSTHOG_API_KEY=your-project-api-key-here
EXPO_PUBLIC_POSTHOG_API_HOST=http://localhost:8000

# Docker Console Logging (optional)
EXPO_PUBLIC_DOCKER_CONSOLE=true
```

### 4. Restart Your App
```bash
# Stop current session (Ctrl+C)
# Start with PostHog enabled
bun run local:healthcare
```

## What's Being Tracked

### Automatic Tracking
- **User Sessions**: Login/logout, session duration
- **Screen Views**: Navigation between screens
- **API Calls**: TRPC requests with timing
- **Errors**: All application errors with context
- **Healthcare Events**: Alert creation, acknowledgment, resolution
- **Performance**: API response times, WebSocket latency

### Custom Events
- `log_auth_*`: Authentication events
- `log_healthcare_*`: Healthcare module events
- `log_api_*`: API call logs
- `log_error_*`: Error logs
- `$exception`: Structured error tracking

## Viewing Analytics

### Real-time Dashboard
1. Go to http://localhost:8000
2. Navigate to "Events" to see real-time logs
3. Use "Insights" to create charts
4. Check "Recordings" for session replays (if enabled)

### Useful Queries
- **Error Rate**: Filter events by `log_*_error`
- **API Performance**: Look for `log_api_*` with duration
- **User Journey**: Filter by userId
- **Healthcare Metrics**: Search for `log_healthcare_*`

## Docker Console Logging

When `EXPO_PUBLIC_DOCKER_CONSOLE=true`, logs are also output as structured JSON:
```json
{
  "service": "expo-app",
  "timestamp": "2025-06-18T10:30:00Z",
  "level": "info",
  "category": "HEALTHCARE",
  "message": "[HEALTHCARE] Alert created",
  "metadata": {
    "userId": "user123",
    "data": {...}
  }
}
```

View Docker logs:
```bash
# All containers
docker-compose -f docker-compose.local.yml logs -f

# Just the app logs
docker logs -f myexpo-app
```

## Security Considerations

- PostHog is configured for local development only
- No PII should be logged in production
- Sensitive data is filtered before sending
- SSL is disabled for local development
- Use PostHog Cloud for production

## Troubleshooting

### PostHog Not Receiving Events?
1. Check if PostHog is running: `docker ps | grep posthog`
2. Verify API key is correct
3. Check browser console for errors
4. Ensure `EXPO_PUBLIC_POSTHOG_ENABLED=true`

### High Memory Usage?
PostHog can be resource-intensive. To reduce usage:
1. Stop other Docker containers
2. Use the simple configuration (already default)
3. Disable session recording in PostHog settings

### Can't Access Dashboard?
1. Check if port 8000 is free: `lsof -i :8000`
2. Try different port in docker-compose
3. Check Docker logs: `docker logs myexpo-posthog`

## Demo Tips

During your MVP demo:
1. Show real-time event tracking
2. Demonstrate error tracking with context
3. Show performance metrics
4. Highlight healthcare-specific analytics
5. Show how debugging is easier with centralized logs