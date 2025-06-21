# Quick Start Guide

Get the Healthcare Alert System running on your machine in 5 minutes.

## Prerequisites

- Node.js 18+ or [Bun](https://bun.sh) (recommended)
- PostgreSQL 14+
- Docker Desktop (for WebSocket and Email services)
- iOS Simulator (Mac) or Android Emulator

## 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd my-expo

# Install dependencies
bun install
# or
npm install
```

## 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your values
# Key variables to set:
# - DATABASE_URL=postgresql://user:pass@localhost:5432/healthcare_db
# - BETTER_AUTH_SECRET=<generate-a-secret>
# - EXPO_PUBLIC_API_URL=http://localhost:8081
```

## 3. Database Setup

```bash
# Start PostgreSQL (if using Docker)
docker-compose up -d postgres

# Push database schema
bun run db:push

# (Optional) Seed with test data
bun run scripts/setup-healthcare-complete.ts
```

## 4. Start Services

```bash
# Start all services (recommended)
bun run local:healthcare

# Or start individually:
# - WebSocket service: docker-compose up websocket
# - Email service: docker-compose up email
# - Redis: docker-compose up redis
```

## 5. Run the App

```bash
# Start Expo
bun run start

# Press:
# - 'i' for iOS Simulator
# - 'a' for Android Emulator  
# - 'w' for Web Browser
```

## 6. Test Credentials

```
# Admin User
Email: admin@example.com
Password: admin123

# Healthcare Operator
Email: operator@hospital.com
Password: operator123

# Nurse
Email: nurse@hospital.com
Password: nurse123

# Doctor
Email: doctor@hospital.com
Password: doctor123
```

## 🎯 What's Next?

### Try These Features
1. **Create an Alert**: Login as operator → Click "Create Alert" → Fill form
2. **View Dashboard**: See real-time metrics and active alerts
3. **Test Escalation**: Create high-priority alert and watch it escalate
4. **Shift Management**: Start/end shifts as nurse or doctor

### Development Tasks
- [Set up your IDE](./guides/development.md#ide-setup)
- [Run tests](../testing/README.md)
- [Explore the API](./api/trpc-routes.md)
- [Customize components](./modules/design-system/README.md)

## 🚨 Common Issues

### Database Connection Failed
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Verify DATABASE_URL in .env
# Format: postgresql://username:password@localhost:5432/database_name
```

### WebSocket Not Connecting
```bash
# Ensure Docker is running
docker-compose up websocket

# Check WEBSOCKET_URL in .env
# Should be: ws://localhost:3002
```

### Metro Bundler Issues
```bash
# Clear cache
bun run fix:metro

# Reset everything
rm -rf node_modules .expo
bun install
```

## 📚 More Resources

- [Full Development Guide](./guides/development.md)
- [Architecture Overview](./ARCHITECTURE.md)
- [Troubleshooting Guide](./guides/troubleshooting.md)
- [Testing Guide](../testing/README.md)

---

Need help? Check our [Troubleshooting Guide](./guides/troubleshooting.md) or create an issue.