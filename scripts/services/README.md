# Service Scripts

Scripts for starting and managing various services in the application.

## Subdirectories

### startup/
Main service orchestration scripts
- `start-unified.sh` - Unified startup script with multiple modes
- `start-with-healthcare.sh` - Start with healthcare module enabled
- `start-smart.sh` - Smart startup with auto-detection
- `dev-start.sh` - Development mode starter
- `docker-reset.sh` - Docker environment reset

### individual/
Individual service starters
- `start-api-server.ts` - API server
- `start-auth-server.ts` - Authentication server
- `start-websocket-server.ts` - WebSocket server
- `start-email-server.ts` - Email service
- `start-logging-service.sh` - Logging service
- `start-posthog.sh` - PostHog analytics
- `start-ngrok.sh` - Ngrok tunnel

## Service Modes

### Development
```bash
# Start all services for development
./scripts/services/startup/dev-start.sh

# Start with healthcare enabled
./scripts/services/startup/start-with-healthcare.sh
```

### Individual Services
```bash
# Start specific services
tsx scripts/services/individual/start-api-server.ts
tsx scripts/services/individual/start-websocket-server.ts
```

### Docker Services
```bash
# Reset Docker environment
./scripts/services/startup/docker-reset.sh

# Setup Docker services
./scripts/services/startup/docker-setup.sh
```

## Service Dependencies

- **API Server**: Core application server
- **Auth Server**: Handles authentication flows
- **WebSocket**: Real-time communications
- **Email**: Email notifications
- **Logging**: Centralized logging
- **PostHog**: Analytics tracking