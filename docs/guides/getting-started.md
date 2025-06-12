# Quick Start Guide

Get your development environment up and running in 5 minutes!

## Prerequisites

- Node.js 18+ or [Bun](https://bun.sh) (recommended)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- iOS Simulator (Mac) or Android Studio (optional)
- [Expo Go](https://expo.dev/client) app on your phone

## 🚀 Quick Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd my-expo

# Install dependencies (using Bun)
bun install

# Or using npm
npm install
```

### 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env.local

# Essential variables (edit .env.local):
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/expo-db"
BETTER_AUTH_SECRET="your-secret-key-min-32-chars"
BETTER_AUTH_URL="http://localhost:8081"
```

### 3. Start Services

```bash
# Start PostgreSQL with Docker
docker-compose up -d postgres

# Run database migrations
bun db:migrate

# Start the development server
bun start
```

### 4. Access Your App

- **Expo Go**: Scan QR code with Expo Go app
- **Web**: Open http://localhost:8081
- **iOS Simulator**: Press `i` in terminal
- **Android**: Press `a` in terminal

## 🎯 First Steps

### 1. Create Your First User

1. Open the app
2. Click "Sign Up"
3. Enter email and password
4. Complete your profile
5. Create or join an organization

### 2. Explore the Dashboard

Based on your role, you'll see:
- **Admin**: Full system control
- **Manager**: Team management
- **User**: Basic features
- **Healthcare roles**: Patient management

### 3. Try Key Features

- **Theme Switcher**: Settings → Appearance
- **Create Organization**: From profile completion
- **Healthcare Demo**: Use healthcare roles

## 📱 Development Options

### Expo Go (Fastest)
```bash
bun start
# Scan QR code with Expo Go app
```

### Development Build
```bash
# iOS
bun ios

# Android
bun android
```

### Web Development
```bash
bun web
# Opens in browser at localhost:8081
```

## 🔧 Common Commands

```bash
# Development
bun start          # Start Expo
bun dev           # Start with dev client
bun test          # Run tests

# Database
bun db:migrate    # Run migrations
bun db:reset      # Reset database
bun db:seed       # Add demo data

# Building
bun build:preview # Create preview build
bun build:prod    # Production build
```

## 🩺 Healthcare Demo

Want to see the healthcare features?

```bash
# Start with healthcare demo data
bash scripts/dev-start-demo.sh

# Login with:
# Email: doctor@example.com
# Password: password123
```

## 🐛 Troubleshooting

### Can't Connect to API?
```bash
# Check Docker is running
docker ps

# Restart services
docker-compose restart

# Check logs
docker-compose logs -f
```

### Blank Screen on Mobile?
1. Shake device to open debug menu
2. Check console for errors
3. Try reloading the app

### OAuth Not Working?
- Ensure `BETTER_AUTH_URL` matches your device's access URL
- For physical devices, use ngrok:
```bash
bun tunnel
# Update .env.local with ngrok URL
```

## 📚 Next Steps

1. **Read the Docs**: Check out our [comprehensive documentation](../README.md)
2. **Explore Components**: Browse the [component library](../components/COMPONENT_INDEX.md)
3. **Understand Architecture**: Review [system architecture](../architecture/overview.md)
4. **Join Community**: Contribute and get help

## 🆘 Need Help?

- **Documentation**: `/docs` folder
- **Debug Panel**: Shake device in app
- **Console Logs**: Check terminal output
- **GitHub Issues**: Report bugs

## 🎉 Ready to Build!

You now have a fully functional development environment. Start building amazing features!

### Suggested First Tasks:
1. Create a new screen in `/app`
2. Add a universal component
3. Create a new tRPC endpoint
4. Customize the theme

Happy coding! 🚀