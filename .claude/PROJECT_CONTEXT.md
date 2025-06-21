# Complete Project Context - Healthcare Alert System

## Project Overview

**Name**: Healthcare Alert System  
**Type**: Cross-platform mobile application  
**Stage**: MVP Complete, Production Preparation  
**Team Size**: 5-10 developers  
**Timeline**: 6 months development, ongoing maintenance

## Business Context

### Problem Statement
Healthcare facilities need efficient alert management to ensure timely response to patient needs. Current systems are fragmented, slow, and lack real-time coordination.

### Solution
A unified alert management platform that:
- Enables instant alert creation and routing
- Automatically escalates unaddressed alerts
- Provides real-time dashboards and analytics
- Supports multi-hospital organizations
- Works across all devices (iOS, Android, Web)

### Target Users
1. **Healthcare Operators**: Create and monitor alerts
2. **Nurses**: Respond to patient alerts
3. **Doctors**: Handle escalated medical issues
4. **Administrators**: Manage staff and analytics

## Technical Architecture

### Core Stack
- **Frontend**: Expo SDK 52 + React Native + TypeScript
- **Backend**: tRPC + Expo API Routes
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: Better Auth v1
- **Real-time**: WebSocket (Docker)
- **Styling**: NativeWind (Tailwind CSS)

### Key Modules
1. **Healthcare Module** (90% complete)
   - Alert management
   - Shift system
   - Patient tracking
   - Analytics

2. **Authentication Module** (100% complete)
   - Login/Register
   - Role management
   - Session handling
   - OAuth integration

3. **Organization Module** (80% complete)
   - Multi-tenancy
   - Hospital management
   - Member invitations
   - Permissions

4. **Design System** (40% migrated)
   - 60+ components
   - Responsive design
   - Dark mode support
   - Accessibility

## Development Workflow

### Code Organization
```
my-expo/
├── app/          # Expo Router pages
├── components/   # UI components
├── hooks/        # Business logic
├── lib/          # Utilities
├── src/          # Backend code
└── testing/      # Test infrastructure
```

### Branch Strategy
- `main`: Production code
- `develop`: Development branch
- `feature/*`: New features
- `fix/*`: Bug fixes
- `release/*`: Release preparation

### Development Process
1. Create feature branch
2. Implement with tests
3. Code review via PR
4. Merge to develop
5. Deploy to staging
6. Release to production

## Current State

### Completed Features ✅
- User authentication system
- Alert creation and management
- Real-time notifications
- Role-based permissions
- Shift management
- Basic analytics
- Multi-hospital support

### In Progress 🔄
- Design system migration (40%)
- Test coverage improvement
- Performance optimization
- Advanced analytics
- Push notifications

### Planned Features 📋
- Video consultations
- AI-powered predictions
- Mobile offline mode
- Advanced reporting
- Integration APIs

## Performance Metrics

### Current Performance
- **Load Time**: 2.3s average
- **Bundle Size**: 2.1MB
- **API Response**: <200ms
- **WebSocket Latency**: <100ms

### Targets
- Load Time: <2s
- Bundle Size: <2MB
- 99.9% uptime
- <100ms API response

## Quality Standards

### Code Quality
- TypeScript strict mode
- ESLint + Prettier
- 80%+ test coverage
- No console.logs in production
- Documented functions

### Testing Requirements
- Unit tests for logic
- Integration tests for APIs
- Component tests for UI
- E2E tests for critical flows

### Review Process
- Code review required
- Tests must pass
- No TypeScript errors
- Documentation updated
- Performance checked

## Common Tasks

### Adding a Feature
1. Check module docs: `.claude/modules/[module].md`
2. Use pattern guide: `.claude/patterns/[pattern].md`
3. Follow workflow: `.claude/workflows/new-feature.md`
4. Update tests and docs

### Fixing a Bug
1. Reproduce issue
2. Write failing test
3. Implement fix
4. Verify all tests pass
5. Update changelog

### Performance Optimization
1. Measure current state
2. Identify bottlenecks
3. Implement optimization
4. Verify improvement
5. Document changes

## Key Decisions

### Architecture Decisions
- **Expo Managed**: Easier updates and maintenance
- **tRPC**: Type-safe API without code generation
- **PostgreSQL**: Proven reliability for healthcare
- **Zustand**: Simple state management
- **NativeWind**: Consistent styling across platforms

### Design Decisions
- Mobile-first approach
- Accessibility priority
- Real-time updates
- Offline capability
- Progressive enhancement

## Resources

### Documentation
- [Full Docs](../docs/README.md)
- [API Reference](../docs/api/README.md)
- [Component Library](../docs/modules/design-system/README.md)

### External Resources
- [Expo Docs](https://docs.expo.dev)
- [tRPC Docs](https://trpc.io)
- [Better Auth Docs](https://better-auth.com)

### Team Resources
- Slack: #healthcare-app
- Jira: HEALTH-*
- Confluence: Healthcare App Wiki

## Important Notes

### Security Considerations
- All data encrypted in transit
- PII protection implemented
- Regular security audits
- HIPAA compliance in progress

### Deployment Notes
- Staging: auto-deploy from develop
- Production: manual release process
- Rollback plan always ready
- Database migrations versioned

### Known Issues
- WebSocket reconnection occasionally fails
- Large alert lists need pagination
- Some TypeScript errors remain
- Test coverage at 57%

---

Last Updated: June 18, 2025  
Version: 1.0.0