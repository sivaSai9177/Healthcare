# Healthcare Alert System

> A real-time healthcare alert management system built with Expo, React Native, and TypeScript.

[![Expo](https://img.shields.io/badge/Expo-SDK%2052-000.svg?style=flat&logo=expo)](https://expo.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-007ACC.svg?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![React Native](https://img.shields.io/badge/React%20Native-0.76-61DAFB.svg?style=flat&logo=react)](https://reactnative.dev)

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/your-org/healthcare-alert-system.git
cd healthcare-alert-system

# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your configuration

# Start development
npm run dev
```

## 📱 Features

### Core Functionality
- **Real-time Alerts**: Instant push notifications for critical patient alerts
- **Role-based Access**: Separate interfaces for nurses, doctors, and administrators
- **WebSocket Integration**: Live updates without page refresh
- **Offline Support**: Works seamlessly even with intermittent connectivity

### Technical Highlights
- **Cross-platform**: iOS, Android, and Web from single codebase
- **Type-safe**: Full TypeScript with strict mode
- **Modern Stack**: Expo SDK 52, React Native 0.76
- **Scalable Architecture**: Microservices-ready with Docker support

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Mobile Apps   │     │   Web Client    │     │  Admin Portal   │
│  (iOS/Android)  │     │  (React Native) │     │   (React Web)   │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                         │
         └───────────────────────┴─────────────────────────┘
                                 │
                         ┌───────┴────────┐
                         │   API Gateway  │
                         │    (tRPC)      │
                         └───────┬────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
┌───────┴────────┐     ┌────────┴────────┐     ┌────────┴────────┐
│  Auth Service  │     │  Alert Service  │     │   WebSocket     │
│  (Better Auth) │     │   (Business)    │     │    Server       │
└────────────────┘     └─────────────────┘     └─────────────────┘
        │                        │                        │
        └────────────────────────┼────────────────────────┘
                                 │
                         ┌───────┴────────┐
                         │   PostgreSQL   │
                         │   + Redis      │
                         └────────────────┘
```

## 📖 Documentation

### Getting Started
- [Quick Start Guide](docs/guides/QUICK_START.md)
- [Development Setup](docs/guides/development/setup.md)
- [Environment Configuration](docs/guides/development/environment.md)

### Development
- [Project Structure](docs/PROJECT_STRUCTURE.md)
- [Development Workflow](docs/guides/development/workflow.md)
- [Testing Guide](docs/guides/testing-setup.md)
- [Scripts Guide](docs/guides/development/SCRIPTS_GUIDE_COMPLETE.md)

### Deployment
- [Deployment Overview](docs/guides/deployment/README.md)
- [EAS Build Guide](docs/guides/EAS_DEPLOYMENT_GUIDE.md)
- [Kamal Deployment](docs/guides/deployment/kamal.md)
- [Staging Deployment](docs/guides/deployment/staging.md)

### API & Architecture
- [API Documentation](docs/api/README.md)
- [Architecture Overview](docs/ARCHITECTURE.md)
- [Database Schema](docs/api/database-schema.md)

### More Resources
- [Full Documentation Index](docs/INDEX.md)
- [Contributing Guide](CONTRIBUTING.md)
- [Security Policy](SECURITY.md)

## 🛠️ Technology Stack

### Frontend
- **Framework**: Expo SDK 52 + React Native 0.76
- **Language**: TypeScript 5.3
- **Navigation**: Expo Router (file-based)
- **State**: Zustand + TanStack Query
- **Styling**: NativeWind (Tailwind for RN)

### Backend
- **Runtime**: Bun + Node.js
- **API**: tRPC with Better Auth
- **Database**: PostgreSQL + Drizzle ORM
- **Cache**: Redis
- **WebSocket**: Native WebSocket server

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Deployment**: Kamal (formerly MRSK)
- **Mobile Builds**: EAS Build
- **Analytics**: PostHog
- **Monitoring**: Custom health checks

## 🚀 Commands

### Development
```bash
npm run dev              # Start development server
npm run ios             # Run on iOS simulator
npm run android         # Run on Android emulator
npm run web             # Run web version
```

### Testing
```bash
npm test                # Run all tests
npm run test:unit       # Unit tests only
npm run test:e2e        # E2E tests
npm run lint            # Lint code
npm run typecheck       # TypeScript checks
```

### Building
```bash
npm run build:web       # Build for web
npm run build:ios       # Build iOS (via EAS)
npm run build:android   # Build Android (via EAS)
```

### Deployment
```bash
# EAS Builds
./scripts/deployment/eas-quick-setup.sh

# Staging Deployment
./scripts/deployment/setup-staging.sh
./deploy-staging.sh

# Production Deployment
bun scripts/deployment/manage-deploy.ts deploy --env=production
```

## 📱 Mobile Development

### Prerequisites
- Xcode 15+ (for iOS development)
- Android Studio (for Android development)
- EAS CLI: `npm install -g eas-cli`

### Development Builds
```bash
# Create development build
eas build --profile development --platform all

# Run on device
eas build --profile preview --platform ios
```

### App Distribution
- **iOS**: TestFlight for beta testing
- **Android**: Internal testing track
- **Web**: Deployed via Docker/Kamal

## 🔧 Configuration

### Environment Variables
```env
# Core Configuration
DATABASE_URL=postgresql://user:pass@localhost:5432/healthcare
BETTER_AUTH_SECRET=your-secret-key-min-32-chars

# API Configuration  
EXPO_PUBLIC_API_URL=http://localhost:8081
EXPO_PUBLIC_WS_URL=ws://localhost:3002

# Optional Services
POSTHOG_API_KEY=your-posthog-key
GOOGLE_CLIENT_ID=your-google-oauth-id
```

See [Environment Configuration Guide](docs/guides/development/environment.md) for full details.

## 🧪 Testing

The project uses a comprehensive testing strategy:

- **Unit Tests**: Jest + React Native Testing Library
- **Integration Tests**: API and service layer testing
- **E2E Tests**: Detox for mobile, Playwright for web
- **Performance Tests**: Custom performance monitoring

See [Testing Guide](docs/guides/testing-setup.md) for details.

## 🚢 Deployment

### Staging
1. Configure staging environment: `./scripts/deployment/setup-staging.sh`
2. Run deployment tests: `bun scripts/deployment/test-staging-deployment.ts`
3. Deploy: `./deploy-staging.sh`

### Production
1. Build mobile apps: `eas build --profile production`
2. Deploy backend: `kamal deploy`
3. Submit to stores: `eas submit`

See [Deployment Guide](docs/guides/deployment/README.md) for detailed instructions.

## 📊 Project Status

- **Current Version**: 0.1.0 (MVP)
- **Production Ready**: 85%
- **Test Coverage**: 73%
- **Documentation**: Complete

See [Project Status](docs/PROJECT_STATUS.md) for detailed metrics.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Process
1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'feat: add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Expo](https://expo.dev)
- Authentication by [Better Auth](https://better-auth.com)
- Deployment with [Kamal](https://kamal-deploy.org)
- Analytics by [PostHog](https://posthog.com)

---

For more information, visit our [full documentation](docs/INDEX.md).