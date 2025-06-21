# Documentation Reorganization Plan

## 🎯 Goal

Consolidate 40+ scattered documentation files from the root directory into a well-organized structure under `/docs`.

## 📁 New Structure

```
docs/
├── INDEX.md                      # Main documentation hub
├── README.md                     # Documentation overview
├── PROJECT_STATUS.md            # Current project status
├── PROJECT_STRUCTURE.md         # Codebase organization
├── ARCHITECTURE.md              # System architecture
│
├── guides/
│   ├── QUICK_START.md          # Getting started guide
│   ├── deployment/
│   │   ├── README.md           # Deployment overview
│   │   ├── staging.md          # Staging deployment
│   │   ├── production.md       # Production deployment
│   │   ├── kamal.md           # Kamal specific guide
│   │   └── docker.md          # Docker configuration
│   ├── development/
│   │   ├── setup.md           # Dev environment setup
│   │   ├── workflow.md        # Development workflow
│   │   └── scripts.md         # Scripts documentation
│   └── testing/
│       ├── README.md          # Testing overview
│       └── e2e.md            # E2E testing guide
│
├── api/
│   ├── README.md              # API overview
│   ├── trpc-routes.md        # tRPC endpoints
│   └── database-schema.md    # Database structure
│
├── modules/
│   ├── healthcare/           # Healthcare features
│   ├── auth/                # Authentication
│   └── design-system/       # UI components
│
└── archive/
    └── 2024-12-mvp/        # Archived MVP docs
```

## 🚚 Files to Move

### Move to `/docs/guides/deployment/`:
- `KAMAL_DEPLOYMENT_GUIDE.md` → `kamal.md`
- `STAGING_DEPLOYMENT_GUIDE.md` → `staging.md`
- `EAS_INTEGRATION_COMPLETE.md` → Archive
- `STAGING_DEPLOYMENT_READY.md` → Archive

### Move to `/docs/guides/development/`:
- `SCRIPTS_CONSOLIDATION_SUMMARY.md` → `scripts.md`
- `QUICK_START_MVP.md` → Merge with `QUICK_START.md`

### Move to `/docs/archive/2024-12-mvp/`:
All MVP-related files:
- `MVP_SHOWCASE.md`
- `MVP_DEMO_SCRIPT.md`
- `MVP_PRESENTATION_GUIDE.md`
- `MVP_TEST_GUIDE.md`
- `MVP_VERIFICATION_REPORT.md`
- `MVP_FINAL_STATUS.md`
- `MVP_READY_SUMMARY.md`
- `MVP_TEST_REPORT.md`

### Move to `/docs/archive/2024-12-reports/`:
All status reports and summaries:
- `PROJECT_COMPLETION_REPORT.md`
- `CURRENT_STATUS_REPORT.md`
- `BACKEND_CLEANUP_SUMMARY.md`
- `FRONTEND_FIXES_SUMMARY.md`
- `API_INTEGRATION_SUMMARY.md`
- All other `*_SUMMARY.md` files
- All other `*_REPORT.md` files

### Move to `/docs/guides/`:
- `POSTHOG_INTEGRATION.md` → `monitoring/posthog.md`
- `TESTING_INFRASTRUCTURE_SETUP.md` → `testing/setup.md`

### Delete (Redundant):
- Files with duplicate content
- Temporary status files
- Old tracking documents

## 📝 Implementation Steps

1. **Create Directory Structure**
   ```bash
   mkdir -p docs/guides/{deployment,development,testing,monitoring}
   mkdir -p docs/archive/{2024-12-mvp,2024-12-reports}
   mkdir -p docs/modules/{healthcare,auth,design-system}
   ```

2. **Move Files**
   ```bash
   # Move deployment guides
   mv KAMAL_DEPLOYMENT_GUIDE.md docs/guides/deployment/kamal.md
   mv STAGING_DEPLOYMENT_GUIDE.md docs/guides/deployment/staging.md
   
   # Archive MVP docs
   mv MVP_*.md docs/archive/2024-12-mvp/
   
   # Archive reports
   mv *_SUMMARY.md *_REPORT.md docs/archive/2024-12-reports/
   ```

3. **Update References**
   - Update all internal links
   - Update README.md references
   - Update INDEX.md links

4. **Create Redirects**
   Create a `MOVED.md` file in root with new locations for important files

## ✅ Benefits

1. **Cleaner Root** - Only essential files in root
2. **Better Organization** - Logical grouping by purpose
3. **Easier Navigation** - Clear hierarchy
4. **Version Control** - Archived docs preserve history
5. **Searchability** - Better file naming and structure

## 🎯 Success Criteria

- [ ] Root directory has <10 documentation files
- [ ] All guides organized by category
- [ ] No broken links
- [ ] Archive preserves historical docs
- [ ] README and INDEX updated

## 🚀 Next Steps

After reorganization:
1. Update CI/CD to check documentation links
2. Add documentation linting
3. Create documentation templates
4. Set up auto-generated API docs

---

**Note**: This reorganization should be done in a single PR to maintain link integrity.