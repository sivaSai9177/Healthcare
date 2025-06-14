# Tech Stack Documentation

## Overview

The Hospital Alert System leverages a modern, production-ready tech stack optimized for healthcare applications. This document provides a comprehensive overview of all technologies, libraries, and tools used in the project.

## Core Technologies

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React Native | 0.74.5 | Cross-platform mobile framework |
| Expo | SDK 51 | Development platform and tooling |
| TypeScript | 5.3.x | Type-safe JavaScript |
| React | 18.2.0 | UI component library |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 20.x LTS | JavaScript runtime |
| Bun | 1.0+ | Fast runtime for development |
| Express.js | 4.18.x | Web application framework |
| tRPC | 10.x | Type-safe APIs |

### Database
| Technology | Version | Purpose |
|------------|---------|---------|
| PostgreSQL | 15+ | Primary database |
| Drizzle ORM | 0.29.x | Type-safe ORM |
| Redis | 7.x | Caching and sessions |
| Neon | Latest | Serverless Postgres |

## Frontend Libraries

### UI & Styling
```json
{
  "nativewind": "^4.0.0",        // Tailwind CSS for React Native
  "tailwindcss": "^3.4.0",        // Utility-first CSS
  "react-native-reanimated": "~3.10.0", // Animations
  "react-native-gesture-handler": "~2.16.0", // Touch gestures
  "react-native-safe-area-context": "4.10.0", // Safe area handling
  "react-native-screens": "3.31.0", // Native navigation primitives
  "react-native-svg": "15.2.0",    // SVG support
  "expo-blur": "~13.0.0",          // Blur effects
  "expo-haptics": "~13.0.0",       // Haptic feedback
  "expo-linear-gradient": "~13.0.0" // Gradient support
}
```

### Navigation
```json
{
  "expo-router": "~3.5.0",         // File-based routing
  "@react-navigation/native": "^6.1.0", // Navigation core
  "@react-navigation/stack": "^6.3.0",  // Stack navigator
  "@react-navigation/bottom-tabs": "^6.5.0", // Tab navigator
  "expo-linking": "~6.3.0"         // Deep linking
}
```

### State Management
```json
{
  "zustand": "^4.5.0",             // Lightweight state management
  "@tanstack/react-query": "^5.20.0", // Server state management
  "react-hook-form": "^7.50.0",    // Form state management
  "immer": "^10.0.0"               // Immutable state updates
}
```

### Data Fetching
```json
{
  "@trpc/client": "^10.45.0",      // tRPC client
  "@trpc/react-query": "^10.45.0", // React Query integration
  "axios": "^1.6.0",               // HTTP client (fallback)
  "ky": "^1.2.0"                   // Modern fetch wrapper
}
```

### Development Tools
```json
{
  "@types/react": "~18.2.0",       // React types
  "@types/react-native": "~0.73.0", // React Native types
  "typescript": "~5.3.0",          // TypeScript compiler
  "eslint": "^8.57.0",             // Linting
  "prettier": "^3.2.0",            // Code formatting
  "jest": "^29.7.0",               // Testing framework
  "@testing-library/react-native": "^12.4.0" // Component testing
}
```

## Backend Libraries

### Core Framework
```json
{
  "@trpc/server": "^10.45.0",      // tRPC server
  "express": "^4.18.0",            // Web framework
  "cors": "^2.8.5",                // CORS handling
  "helmet": "^7.1.0",              // Security headers
  "compression": "^1.7.4",         // Response compression
  "body-parser": "^1.20.0"         // Request parsing
}
```

### Authentication
```json
{
  "better-auth": "^0.5.0",         // Modern auth solution
  "@better-auth/expo": "^0.1.0",   // Expo integration
  "bcryptjs": "^2.4.3",            // Password hashing
  "jsonwebtoken": "^9.0.0",        // JWT tokens
  "passport": "^0.7.0",            // Auth strategies
  "passport-google-oauth20": "^2.0.0" // Google OAuth
}
```

### Database
```json
{
  "drizzle-orm": "^0.29.0",        // ORM
  "drizzle-kit": "^0.20.0",        // Migration tools
  "postgres": "^3.4.0",            // PostgreSQL client
  "@neondatabase/serverless": "^0.7.0", // Neon client
  "ioredis": "^5.3.0"              // Redis client
}
```

### Real-time
```json
{
  "ws": "^8.16.0",                 // WebSocket server
  "@trpc/server/subscriptions": "^10.45.0", // tRPC subscriptions
  "socket.io": "^4.7.0",           // Socket.IO (alternative)
  "pusher": "^5.2.0"               // Pusher (alternative)
}
```

### Utilities
```json
{
  "zod": "^3.22.0",                // Schema validation
  "dotenv": "^16.4.0",             // Environment variables
  "winston": "^3.11.0",            // Logging
  "node-cron": "^3.0.0",           // Task scheduling
  "bull": "^4.12.0",               // Job queues
  "nodemailer": "^6.9.0"           // Email sending
}
```

## Infrastructure & DevOps

### Deployment
| Service | Purpose |
|---------|---------|
| Vercel | Frontend hosting & serverless functions |
| Expo EAS | Mobile app builds & OTA updates |
| Neon | Serverless PostgreSQL database |
| Redis Cloud | Managed Redis instance |
| Cloudflare | CDN & DDoS protection |

### CI/CD
```yaml
# GitHub Actions
- Build & Test Pipeline
- Type Checking
- Linting & Formatting
- Security Scanning
- Automated Deployments
```

### Monitoring
| Tool | Purpose |
|------|---------|
| Sentry | Error tracking & monitoring |
| LogRocket | Session replay & debugging |
| DataDog | APM & infrastructure monitoring |
| Expo Insights | Mobile app analytics |

## Development Environment

### Required Tools
```bash
# Node.js 20.x LTS
node --version  # v20.x.x

# Package Managers
npm --version   # 10.x.x
yarn --version  # 1.22.x
bun --version   # 1.0.x

# Mobile Development
expo --version  # 51.x.x
eas --version   # 5.x.x

# Database
psql --version  # 15.x
redis-cli --version  # 7.x
```

### VS Code Extensions
```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "prisma.prisma",
    "expo.vscode-expo-tools",
    "msjsdiag.vscode-react-native",
    "dsznajder.es7-react-js-snippets"
  ]
}
```

## Architecture Decisions

### Why React Native + Expo?
- **Cross-platform**: Single codebase for iOS, Android, and Web
- **Developer Experience**: Hot reload, OTA updates, managed workflow
- **Healthcare Ready**: Secure storage, biometrics, push notifications
- **Performance**: Near-native performance with Hermes engine

### Why tRPC?
- **Type Safety**: End-to-end type safety without code generation
- **Developer Experience**: Autocomplete across frontend/backend
- **Real-time**: Built-in subscription support
- **Performance**: Minimal overhead, efficient serialization

### Why PostgreSQL + Drizzle?
- **Reliability**: ACID compliance for healthcare data
- **Type Safety**: Fully typed queries and migrations
- **Performance**: Optimized for complex queries
- **Scalability**: Horizontal scaling with read replicas

### Why Tailwind CSS?
- **Consistency**: Design system enforcement
- **Performance**: Minimal CSS bundle size
- **Developer Experience**: Rapid UI development
- **Responsive**: Mobile-first design approach

## Performance Optimizations

### Frontend
- **Code Splitting**: Dynamic imports for large screens
- **Image Optimization**: WebP format, lazy loading
- **Bundle Size**: Tree shaking, dead code elimination
- **Caching**: React Query cache, persistent storage

### Backend
- **Query Optimization**: Indexed queries, query planning
- **Caching Strategy**: Redis for sessions, computed data
- **Connection Pooling**: Optimized database connections
- **Response Compression**: Gzip/Brotli compression

## Security Measures

### Authentication
- **OAuth 2.0**: Secure third-party authentication
- **JWT Tokens**: Short-lived access tokens
- **Refresh Tokens**: Secure token rotation
- **Session Management**: Redis-backed sessions

### Data Protection
- **Encryption**: TLS 1.3 for data in transit
- **Hashing**: Bcrypt for password storage
- **Input Validation**: Zod schemas for all inputs
- **SQL Injection**: Parameterized queries

### Mobile Security
- **Secure Storage**: Expo SecureStore for tokens
- **Certificate Pinning**: API certificate validation
- **Biometrics**: FaceID/TouchID support
- **Code Obfuscation**: Production build protection

## Upgrade Strategy

### Version Management
```json
{
  "engines": {
    "node": ">=20.0.0",
    "npm": ">=10.0.0"
  }
}
```

### Dependency Updates
- **Security Updates**: Immediate patches
- **Minor Updates**: Monthly review
- **Major Updates**: Quarterly planning
- **Breaking Changes**: Staged migrations

## Cost Optimization

### Service Costs (Monthly Estimates)
| Service | Free Tier | Growth | Scale |
|---------|-----------|--------|-------|
| Vercel | $0 | $20 | $150+ |
| Neon | $0 | $25 | $200+ |
| Redis | $0 | $15 | $100+ |
| Expo EAS | $0 | $99 | $299+ |

### Optimization Strategies
1. **Edge Caching**: Reduce API calls
2. **Database Pooling**: Optimize connections
3. **Image CDN**: Cloudinary/Imgix integration
4. **Serverless**: Pay-per-use architecture

## Future Considerations

### Potential Additions
1. **GraphQL**: For complex data requirements
2. **Kubernetes**: For containerized deployment
3. **Elasticsearch**: For advanced search
4. **Apache Kafka**: For event streaming
5. **TensorFlow.js**: For ML capabilities

### Migration Paths
- **Database**: PostgreSQL → CockroachDB (global scale)
- **Cache**: Redis → KeyDB (multithreaded)
- **API**: REST → GraphQL Federation
- **Hosting**: Vercel → AWS/GCP (enterprise)