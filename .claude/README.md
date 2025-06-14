# Claude Context System

This directory contains context files for AI-assisted development with Claude.

## Structure

```
.claude/
├── CLAUDE.md           # Main context file - start here
├── modules/            # Module-specific contexts
│   ├── design-system.md
│   ├── healthcare.md
│   ├── organization.md
│   ├── auth.md
│   └── performance.md
├── sprint-context/     # Sprint management
│   ├── current.md      # Active sprint tasks
│   ├── backlog.md      # Product backlog
│   └── completed.md    # Completed tasks
├── tasks/              # Task templates
│   ├── design-system-task.md
│   ├── healthcare-task.md
│   └── performance-task.md
└── templates/          # Code templates
```

## Usage

### For Managers/PMs

1. **View Current Sprint**:
   ```bash
   cat .claude/sprint-context/current.md
   ```

2. **Check Backlog**:
   ```bash
   cat .claude/sprint-context/backlog.md
   ```

3. **Start New Task**:
   - Pick task from current sprint
   - Load relevant module context
   - Use task template

### For Developers

1. **Starting Work**:
   ```bash
   # Load main context
   cat .claude/CLAUDE.md
   
   # Load module context
   cat .claude/modules/healthcare.md
   ```

2. **Task Template**:
   ```bash
   # Use appropriate template
   cat .claude/tasks/design-system-task.md
   ```

3. **Check Progress**:
   ```bash
   # View current sprint status
   cat .claude/sprint-context/current.md
   ```

## Context Loading Strategy

### Minimal Context (Quick Tasks)
- Just load CLAUDE.md

### Module Work
- CLAUDE.md + relevant module file

### Complex Features
- CLAUDE.md + module + related modules

### Sprint Planning
- sprint-context files + backlog

## Best Practices

1. **Keep Contexts Updated**
   - Update task status in current.md
   - Move completed tasks
   - Add new discoveries to module files

2. **Context Size Management**
   - Each file < 500 lines
   - Split large modules
   - Archive old sprints

3. **Task Management**
   - One task at a time
   - Update status immediately
   - Document blockers

## File Purposes

### CLAUDE.md
- Project overview
- Current sprint summary
- Key metrics
- Quick commands
- Recent changes

### Module Files
- Architecture details
- API endpoints
- Key components
- Current issues
- Testing approach

### Sprint Files
- Task prioritization
- Team assignments
- Success metrics
- Daily/weekly plans

### Task Templates
- Consistent approach
- Checklist format
- Code examples
- Testing requirements