# 📚 Documentation Index

*Last Updated: June 6, 2025*

## 🆕 NEW: Multi-Agent Development System

### 🤖 Automated Development from PRD
- [🎯 Multi-Agent Workflow System](./MULTI_AGENT_WORKFLOW_SYSTEM.md) - **START HERE** - Complete system documentation
- [📄 PRD Template](./projects/PRD_TEMPLATE.md) - Template for new projects
- [📋 Master Task Manager](./MASTER_TASK_MANAGER.md) - Task tracking and assignment
- [🤖 Agent Context Guide](./AGENT_CONTEXT.md) - Codebase knowledge for agents

### 🚀 Quick Start
1. Copy [PRD Template](./projects/PRD_TEMPLATE.md) to `docs/projects/your-app/PRD.md`
2. Run: `Manager, process PRD at docs/projects/your-app/PRD.md`
3. Monitor progress: `Manager, show project status`

## 🎯 Quick Navigation

### 🚀 Getting Started
- [README](../README.md) - Project overview and setup
- [Environment Setup Guide](./ENVIRONMENT_SETUP_GUIDE.md) - Development environment configuration
- [Running Your App Guide](./RUNNING_YOUR_APP_GUIDE.md) - How to run the application

### 📚 Documentation Structure
- [Starter Kit Docs](./starter-kit/README.md) - Generic documentation for all projects
- [Project-Specific Docs](./projects/README.md) - Documentation for individual projects
- [Codebase Status Report](./CODEBASE_STATUS_REPORT.md) - Current state of the starter kit

### 🏗️ Architecture & Design
- [Code Structure](./CODE_STRUCTURE.md) - Detailed project structure
- [Design System](./DESIGN_SYSTEM.md) - Universal component library
- [Navigation Architecture](./NAVIGATION_ARCHITECTURE.md) - Routing and navigation patterns
- [Frontend Architecture Plan](./guides/FRONTEND_ARCHITECTURE_PLAN.md) - Frontend best practices

### 🔐 Authentication & Security
- [Auth Flow Improvements](./AUTH_FLOW_IMPROVEMENTS_SUMMARY.md) - Authentication implementation
- [Google OAuth Setup](./guides/GOOGLE_OAUTH_SETUP.md) - OAuth configuration guide
- [Auth Session Management](./guides/AUTH_SESSION_MANAGEMENT.md) - Session handling patterns
- [OAuth Profile Completion](./OAUTH_PROFILE_COMPLETION_FLOW.md) - Profile setup flow

### 💻 Development Guides
- [CLAUDE.md](../CLAUDE.md) - AI agent memory and patterns
- [Expo tRPC Best Practices](./guides/EXPO_TRPC_BEST_PRACTICES.md) - API development guide
- [TanStack tRPC Integration](./guides/TANSTACK_TRPC_INTEGRATION.md) - Query management
- [Migrating to Design System](./guides/MIGRATING_TO_DESIGN_SYSTEM.md) - Component migration

### 📱 Mobile Development
- [Mobile OAuth Setup Guide](./MOBILE_OAUTH_SETUP_GUIDE.md) - Mobile authentication
- [Mobile Debugging Guide](./MOBILE_DEBUGGING_GUIDE.md) - Debugging techniques
- [Mobile Environment Solution](./MOBILE_ENVIRONMENT_SOLUTION.md) - Environment configuration

### 🧪 Testing & Quality
- [Test Summary](./final-test-summary.md) - Test results and coverage
- [Auth Flow Test Results](./AUTH_FLOW_TEST_RESULTS.md) - Authentication testing
- [Manual Test Procedures](./__tests__/manual/) - Manual testing guides

### 📊 Project Management
- [Master Task Plan](./planning/MASTER_TASK_PLAN.md) - Overall project roadmap
- [Authentication Tasks](./planning/AUTHENTICATION_TASKS.md) - Auth feature tasks
- [Database API Tasks](./planning/DATABASE_API_TASKS.md) - Backend tasks
- [Security Compliance Tasks](./planning/SECURITY_COMPLIANCE_TASKS.md) - Security requirements

### 🚢 Deployment & DevOps
- [Build Instructions](./guides/deployment/BUILD_INSTRUCTIONS.md) - Build process
- [Preview Build Guide](./PREVIEW_BUILD_GUIDE.md) - Preview builds with EAS
- [Credential Sync Setup](./guides/deployment/CREDENTIAL_SYNC_SETUP.md) - Credential management
- [EAS Configuration](../eas.json) - Expo Application Services config

### 📝 Implementation Status
- [Final Implementation Status](./FINAL_IMPLEMENTATION_STATUS.md) - Feature completion status
- [UI Implementation Status](./COMPLETE_UI_IMPLEMENTATION_STATUS.md) - UI component status
- [Navigation Flow Complete](./NAVIGATION_FLOW_COMPLETE.md) - Navigation implementation

## 📂 Documentation Structure

```
docs/
├── guides/                 # How-to guides and tutorials
│   ├── deployment/        # Deployment-specific guides
│   └── *.md              # Feature-specific guides
├── planning/              # Project planning documents
│   └── *_TASKS.md        # Task breakdowns by feature
├── status/                # Status reports and updates
├── archive/               # Historical documentation
└── examples/              # Code examples and patterns
```

## 🔍 Finding Information

### By Role
- **Backend Developer**: Start with [Agent Context](./AGENT_CONTEXT.md) → [tRPC Best Practices](./guides/EXPO_TRPC_BEST_PRACTICES.md)
- **Frontend Developer**: Start with [Design System](./DESIGN_SYSTEM.md) → [Frontend Architecture](./guides/FRONTEND_ARCHITECTURE_PLAN.md)
- **Tester**: Start with [Test Summary](./final-test-summary.md) → [Manual Test Procedures](./__tests__/manual/)
- **Manager**: Start with [Master Task Manager](./MASTER_TASK_MANAGER.md) → [Codebase Status](./CODEBASE_STATUS_REPORT.md)

### By Feature
- **Authentication**: See [Auth Flow Improvements](./AUTH_FLOW_IMPROVEMENTS_SUMMARY.md)
- **UI Components**: See [Design System](./DESIGN_SYSTEM.md)
- **API Development**: See [tRPC Best Practices](./guides/EXPO_TRPC_BEST_PRACTICES.md)
- **Testing**: See [Test Summary](./final-test-summary.md)

### By Task
- **Setting up dev environment**: [Environment Setup Guide](./ENVIRONMENT_SETUP_GUIDE.md)
- **Adding new features**: [Master Task Manager](./MASTER_TASK_MANAGER.md)
- **Debugging issues**: [Mobile Debugging Guide](./MOBILE_DEBUGGING_GUIDE.md)
- **Deploying app**: [Build Instructions](./guides/deployment/BUILD_INSTRUCTIONS.md)

## 📖 Key Documents

### Must Read for All Agents
1. [CLAUDE.md](../CLAUDE.md) - Core patterns and conventions
2. [Agent Context Guide](./AGENT_CONTEXT.md) - Codebase overview
3. [Master Task Manager](./MASTER_TASK_MANAGER.md) - Current tasks

### Architecture References
1. [Code Structure](./CODE_STRUCTURE.md) - File organization
2. [Design System](./DESIGN_SYSTEM.md) - UI components
3. [Frontend Architecture](./guides/FRONTEND_ARCHITECTURE_PLAN.md) - Frontend patterns

## 🔄 Documentation Updates

When updating documentation:
1. Update the relevant document
2. Update this INDEX.md if adding new files
3. Update CLAUDE.md with significant changes
4. Update Master Task Manager after task completion

---

*This index provides navigation to all project documentation. Keep it updated when adding new documents.*