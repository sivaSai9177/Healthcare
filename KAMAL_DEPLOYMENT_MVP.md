# Kamal Deployment Guide - Healthcare Alert System MVP

## Prerequisites

1. **Server Requirements**
   - Ubuntu 22.04 LTS or newer
   - Docker installed
   - SSH access with root privileges
   - Domain name pointing to server IP
   - At least 4GB RAM, 2 CPU cores, 20GB storage

2. **Local Requirements**
   - Kamal installed: `gem install kamal`
   - Docker Hub account (or other registry)
   - Bun installed: `curl -fsSL https://bun.sh/install | bash`

## Environment Setup

### 1. Create Production Environment File

```bash
cp .env.example .env.production
```

Edit `.env.production` with production values:

```env
# Server Configuration
DEPLOY_SERVER_IP=your.server.ip.address
DEPLOY_DOMAIN=healthcare.yourdomain.com
DEPLOY_EMAIL=admin@yourdomain.com

# Docker Registry
DOCKER_REGISTRY_USERNAME=your-dockerhub-username
DOCKER_REGISTRY_PASSWORD=your-dockerhub-password

# Database
DATABASE_URL=postgres://postgres:strong_password@postgres:5432/healthcare_prod
POSTGRES_USER=postgres
POSTGRES_PASSWORD=strong_password
POSTGRES_DB=healthcare_prod

# Redis
REDIS_URL=redis://:redis_password@redis:6379
REDIS_PASSWORD=redis_password

# Auth
BETTER_AUTH_SECRET=generate-64-char-secret-here
BETTER_AUTH_URL=https://healthcare.yourdomain.com

# API URLs
EXPO_PUBLIC_API_URL=https://healthcare.yourdomain.com
EXPO_PUBLIC_WS_URL=wss://healthcare.yourdomain.com/ws

# Email (optional but recommended)
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM=noreply@yourdomain.com

# OAuth (optional)
AUTH_GOOGLE_ID=your-google-oauth-id
AUTH_GOOGLE_SECRET=your-google-oauth-secret

# Analytics (optional)
EXPO_PUBLIC_POSTHOG_API_KEY=your-posthog-key
POSTHOG_API_KEY=your-posthog-key
```

### 2. Generate Secrets

```bash
# Generate Better Auth secret
openssl rand -base64 64

# Generate strong passwords
openssl rand -base64 32
```

## Deployment Steps

### 1. Initial Server Setup

```bash
# SSH into your server
ssh root@your.server.ip.address

# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh

# Create directories
mkdir -p /var/healthcare/{uploads,logs,backups}
mkdir -p /letsencrypt

# Exit server
exit
```

### 2. Configure Kamal

```bash
# Load production environment
export $(cat .env.production | xargs)

# Initialize Kamal (first time only)
kamal init

# Setup Docker registry login
kamal registry login
```

### 3. Deploy Application

```bash
# First deployment (includes setup)
kamal setup

# Subsequent deployments
kamal deploy
```

### 4. Deploy WebSocket Server

```bash
# Build WebSocket Docker image
docker build -f docker/Dockerfile.websocket -t healthcare-alerts/websocket .

# Push to registry
docker push healthcare-alerts/websocket

# Deploy WebSocket accessory
kamal accessory boot websocket
```

## Post-Deployment

### 1. Run Database Migrations

```bash
kamal app exec 'bun run db:push'
```

### 2. Create Initial Admin User

```bash
kamal app exec 'bun run scripts/users/manage-users.ts create admin@yourdomain.com'
```

### 3. Seed Demo Data (Optional)

```bash
kamal app exec 'bun run scripts/users/manage-users.ts setup-healthcare'
```

### 4. Verify Deployment

```bash
# Check application health
curl https://healthcare.yourdomain.com/api/health

# Check WebSocket connection
wscat -c wss://healthcare.yourdomain.com/ws

# View logs
kamal app logs

# Check all services
kamal accessory logs postgres
kamal accessory logs redis
kamal accessory logs websocket
```

## Mobile App Deployment

### 1. Configure EAS Build

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo account
eas login

# Configure project
eas build:configure
```

### 2. Update app.json for Production

```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "your-project-id"
      }
    },
    "updates": {
      "url": "https://u.expo.dev/your-project-id"
    }
  }
}
```

### 3. Build for App Stores

```bash
# iOS build
eas build --platform ios --profile production

# Android build
eas build --platform android --profile production

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

## Monitoring & Maintenance

### 1. View Application Logs

```bash
# Real-time logs
kamal app logs -f

# Specific container logs
kamal app logs --grep error

# Access logs by date
kamal app exec 'tail -f logs/app-$(date +%Y-%m-%d).log'
```

### 2. Database Backup

```bash
# Manual backup
kamal accessory exec postgres 'pg_dump -U postgres healthcare_prod' > backup-$(date +%Y%m%d).sql

# Restore backup
kamal accessory exec postgres 'psql -U postgres healthcare_prod' < backup.sql
```

### 3. Update Application

```bash
# Pull latest changes
git pull origin main

# Deploy update
kamal deploy

# Or rollback if needed
kamal rollback
```

## Troubleshooting

### Common Issues

1. **SSL Certificate Issues**
   ```bash
   # Check Traefik logs
   kamal traefik logs
   
   # Manually trigger certificate generation
   kamal traefik reboot
   ```

2. **Database Connection Issues**
   ```bash
   # Check postgres status
   kamal accessory logs postgres
   
   # Restart postgres
   kamal accessory reboot postgres
   ```

3. **WebSocket Connection Issues**
   ```bash
   # Check WebSocket logs
   kamal accessory logs websocket
   
   # Restart WebSocket server
   kamal accessory reboot websocket
   ```

### Debug Commands

```bash
# SSH into running container
kamal app exec -i bash

# Check environment variables
kamal app exec 'env | grep EXPO'

# Test database connection
kamal app exec 'bun run scripts/test/db-connection.ts'

# Check disk usage
kamal server exec 'df -h'
```

## Security Checklist

- [ ] Change all default passwords
- [ ] Enable firewall (allow only 80, 443, 22)
- [ ] Set up regular backups
- [ ] Configure log rotation
- [ ] Enable rate limiting
- [ ] Set up monitoring alerts
- [ ] Review and update dependencies regularly

## Production URLs

After successful deployment, your application will be available at:

- **Web App**: https://healthcare.yourdomain.com
- **API**: https://healthcare.yourdomain.com/api
- **WebSocket**: wss://healthcare.yourdomain.com/ws
- **Health Check**: https://healthcare.yourdomain.com/api/health

## Support

For issues or questions:
1. Check logs: `kamal app logs`
2. Review this guide
3. Check Kamal documentation: https://kamal-deploy.org
4. Contact support team