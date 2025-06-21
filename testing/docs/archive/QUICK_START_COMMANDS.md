# Quick Start Commands Reference

## 🚀 Most Common Commands

### Starting the App

```bash
# Quick start with everything (recommended)
bun run local:healthcare

# Basic start (network mode for mobile)
bun start

# Start specific platform
bun run web        # Web browser
bun run ios        # iOS simulator
bun run android    # Android emulator
```

### Database

```bash
# Start database
bun run docker:up

# View database GUI
bun run db:studio

# Push schema changes
bun run db:push
```

### Testing

```bash
# Check if everything is working
bun run api:health

# Test with demo credentials
# Operator: johncena@gmail.com (any password)
# Nurse: doremon@gmail.com (any password)
# Doctor: johndoe@gmail.com (any password)
```

### Troubleshooting

```bash
# Clean and restart
bun run clean
bun install
bun run docker:reset

# Check logs
bun run docker:logs
```

## 📝 Environment Quick Reference

| Command | APP_ENV | Database | Use Case |
|---------|---------|----------|----------|
| `bun run local` | local | localhost:5432 | Local development |
| `bun run dev` | development | localhost:5432 | Development (same as local) |
| `bun start` | local | localhost:5432 | Default start (network mode) |
| `bun run prod` | production | Production DB | Production testing |

## 🎯 Recommended Workflow

1. **First Time Setup**
   ```bash
   bun install
   bun run docker:up
   bun run db:push
   bun run local:healthcare
   ```

2. **Daily Development**
   ```bash
   bun run docker:up          # Start database
   bun run local:healthcare   # Start app with demo data
   ```

3. **Mobile Testing**
   ```bash
   bun start                  # Shows your local IP
   # Use the IP on your phone: http://192.168.x.x:8081
   ```

## 🔑 Key Points

- **Always use `local` for local development** (not `development`)
- **Docker must be running** for database
- **Port 8081** is the main app port
- **Healthcare mode** includes all demo data and services