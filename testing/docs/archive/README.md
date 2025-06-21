# Hospital Alert System

<div align="center">
  <img src="./assets/images/icon.png" alt="Hospital Alert System" width="120" height="120" />
  <h3>Modern Healthcare Alert Management Platform</h3>
  <p>Built with React Native, Expo, and TypeScript</p>
  
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
  [![React Native](https://img.shields.io/badge/React%20Native-0.74-61DAFB)](https://reactnative.dev/)
  [![Expo](https://img.shields.io/badge/Expo-SDK%2051-000020)](https://expo.dev/)
  [![License](https://img.shields.io/badge/License-MIT-green)](./LICENSE)
</div>

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/your-org/hospital-alert-system.git
cd hospital-alert-system

# Install dependencies
npm install

# Start healthcare MVP environment
npm run local:healthcare
```

This will automatically:
- ✅ Set up the PostgreSQL database
- ✅ Run migrations and seed data
- ✅ Start the API server
- ✅ Launch the Expo development server
- ✅ Open the app in your simulator/device

## 📋 Prerequisites

- **Node.js** 20.x LTS (required)
- **PostgreSQL** 15+ (for local development)
- **iOS Simulator** (Mac only) or **Android Studio**
- **Expo Go** app on your physical device (optional)

## 🏗️ Project Structure

```
my-expo/
├── 📱 app/              # Expo Router screens
├── 🧩 components/       # Reusable React components
├── 🎨 assets/          # Images, fonts, and static files
├── 🔧 lib/             # Core libraries and utilities
├── 🖥️ src/             # Backend server code
├── 📝 types/           # TypeScript type definitions
├── 📚 docs/            # Comprehensive documentation
└── 🧪 __tests__/       # Test suites
```

## 🌟 Key Features

### Healthcare Operations
- 🚨 **Real-time Alert System** - Create and manage critical alerts
- 👥 **Role-based Access** - Operator, Nurse, Doctor, Head Doctor roles
- ⏱️ **Smart Escalation** - Automatic alert escalation with timers
- 📊 **Analytics Dashboard** - Track response times and metrics
- 🔔 **Push Notifications** - Instant alert delivery

### Technical Features
- 📱 **Cross-platform** - iOS, Android, and Web from single codebase
- 🔐 **Secure Authentication** - Better Auth v1.2.8 with OAuth 2.0 (Google/Microsoft/Apple)
- 🛡️ **Enterprise Security** - Rate limiting, audit logging, session management
- 🌐 **Real-time Updates** - WebSocket subscriptions
- 🎨 **Modern UI/UX** - Tailwind CSS with animations
- ♿ **Accessibility** - WCAG 2.1 AA compliant
- 🌍 **Offline Support** - Work without internet connection

## 🛠️ Tech Stack

### Frontend
- **React Native** + **Expo SDK 51**
- **TypeScript** for type safety
- **Tailwind CSS** via NativeWind
- **React Native Reanimated** for animations
- **Zustand** for state management
- **React Query** for server state

### Backend
- **Node.js** with Express
- **tRPC** for type-safe APIs
- **PostgreSQL** with Drizzle ORM
- **Better Auth** for authentication
- **WebSockets** for real-time features
- **Redis** for caching and sessions

## 📖 Documentation

Comprehensive documentation is available in the `/docs` directory:

### Architecture Guides
- 📐 [Frontend Architecture](./docs/modules/FRONTEND_ARCHITECTURE.md)
- 🏗️ [Backend Architecture](./docs/modules/BACKEND_ARCHITECTURE.md)
- 🔐 [Authentication Module](./docs/modules/AUTH_MODULE.md) **✅ Production Ready**
- 🎨 [Design System](./docs/modules/DESIGN_SYSTEM.md)
- 🔧 [Tech Stack Details](./docs/modules/TECH_STACK.md)
- 📁 [Project Structure](./docs/PROJECT_STRUCTURE.md)

### Development Guides
- 🚀 [Getting Started](./docs/guides/development/GETTING_STARTED.md)
- 🧪 [Testing Guide](./docs/guides/development/TESTING.md)
- 🎯 [Best Practices](./docs/guides/development/BEST_PRACTICES.md)

### Deployment Guides
- 📦 [Production Deployment](./docs/guides/deployment/PRODUCTION.md)
- ☁️ [Cloud Setup](./docs/guides/deployment/CLOUD_SETUP.md)
- 📊 [Monitoring Setup](./docs/guides/deployment/MONITORING.md)

## 🚀 Development Commands

### Essential Commands
```bash
# Start development environment
npm run local:healthcare    # All-in-one healthcare dev environment
npm run dev                # Start Expo only
npm run server:dev         # Start API server only

# Platform-specific
npm run ios               # Run on iOS simulator
npm run android          # Run on Android emulator
npm run web             # Run in web browser

# Database
npm run db:setup        # Initialize database
npm run db:migrate      # Run migrations
npm run db:seed         # Seed test data
npm run db:reset        # Reset database

# Code Quality
npm run lint            # Run ESLint
npm run type-check      # Check TypeScript
npm run test            # Run test suite
npm run test:watch      # Run tests in watch mode

# Build & Deploy
npm run build:web       # Build for web
npm run build:ios       # Build iOS app
npm run build:android   # Build Android app
```

## 🔧 Configuration

### Environment Variables

1. Copy the example file:
```bash
cp .env.example .env.local
```

2. Configure your environment:
```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/hospital_alerts

# API Configuration
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_WS_URL=ws://localhost:3001

# Authentication (Better Auth v1.2.8)
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_BASE_URL=http://localhost:8081
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email Service
EMAIL_FROM=noreply@hospital-alerts.com
RESEND_API_KEY=your-resend-api-key

# Push Notifications
EXPO_PUBLIC_PUSH_KEY=your-expo-push-key
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test suites
npm test -- --testNamePattern="Button"
npm test -- --testPathPattern="healthcare"

# Coverage report
npm run test:coverage
```

## 📱 Mobile Development

### iOS Development
```bash
# Install iOS dependencies
cd ios && pod install && cd ..

# Run on specific simulator
npm run ios -- --simulator="iPhone 15 Pro"
```

### Android Development
```bash
# Start Android emulator first
# Then run:
npm run android

# Or specify device
npm run android -- --deviceId="emulator-5554"
```

## 🚢 Deployment

### Production Build
```bash
# Web deployment
npm run build:web
vercel deploy ./dist

# Mobile deployment
eas build --platform ios --profile production
eas build --platform android --profile production
```

### EAS Configuration
The project is configured for Expo Application Services (EAS) for building and deploying mobile apps. See `eas.json` for configuration details.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Expo](https://expo.dev/)
- UI components inspired by [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)
- Authentication by [Better Auth](https://better-auth.com/)

## 📞 Support

For support, email support@hospital-alerts.com or join our Slack channel.

---

<div align="center">
  Made with ❤️ by the Hospital Alert System Team
</div>