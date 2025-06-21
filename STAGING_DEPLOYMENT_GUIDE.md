# Staging Deployment Guide

## 🚀 Quick Start

### 1. Initial Setup (One-time)
```bash
# Run the staging setup script
./scripts/deployment/setup-staging.sh

# This will:
# - Create .env.staging template
# - Validate environment configuration
# - Test SSH connectivity
# - Set up Kamal secrets
# - Create deployment helper scripts
```

### 2. Configure Environment
Edit `.env.staging` with your staging server details:
```env
STAGING_SERVER_IP=your.staging.server.ip
DEPLOY_DOMAIN=your-domain.com
DOCKER_REGISTRY_USERNAME=your-registry-username
DOCKER_REGISTRY_PASSWORD=your-registry-password
DATABASE_URL=postgresql://user:password@staging-server:5432/healthcare_staging
# ... other required variables
```

### 3. Test Deployment Readiness
```bash
# Run comprehensive deployment tests
bun scripts/deployment/test-staging-deployment.ts

# This will check:
# - Prerequisites (Kamal, Docker, configs)
# - Docker build
# - Server connectivity
# - Kamal configuration
# - Health endpoints
```

### 4. Deploy to Staging
```bash
# Option 1: Use the generated helper script
./deploy-staging.sh

# Option 2: Use manage-deploy script
bun scripts/deployment/manage-deploy.ts deploy --env=staging

# Option 3: Direct Kamal command
kamal deploy -d staging
```

## 📋 Pre-Deployment Checklist

- [ ] All tests passing locally
- [ ] Docker Desktop running
- [ ] `.env.staging` configured
- [ ] SSH access to staging server verified
- [ ] Database backup taken (if updating existing)
- [ ] Git repository up to date

## 🏗️ Architecture Overview

### Staging Infrastructure
```
┌─────────────────┐
│ Load Balancer   │
│   (Traefik)     │
└────────┬────────┘
         │
    ┌────┴────┐
    │   Web   │ ← Healthcare Alert App
    │Container│
    └────┬────┘
         │
┌────────┴────────┬─────────────┬──────────────┐
│   PostgreSQL    │    Redis    │  WebSocket   │
│   Database      │    Cache    │   Server     │
└─────────────────┴─────────────┴──────────────┘
```

### Container Services
1. **Web App**: Main Expo/React Native web application
2. **PostgreSQL**: Primary database (healthcare_staging)
3. **Redis**: Session storage and caching
4. **WebSocket**: Real-time alert notifications
5. **Traefik**: SSL termination and routing

## 🔧 Configuration Details

### Kamal Staging Config (`config/deploy.staging.yml`)
- Uses staging-specific environment variables
- Separate database (healthcare_staging)
- Reduced container retention (3 vs 5)
- Faster timeouts for quick iteration

### Environment Variables
| Variable | Purpose | Example |
|----------|---------|---------|
| `STAGING_SERVER_IP` | Target deployment server | `192.168.1.100` |
| `DEPLOY_DOMAIN` | Base domain for the app | `healthcare-app.com` |
| `DATABASE_URL` | PostgreSQL connection | `postgresql://...` |
| `REDIS_URL` | Redis connection | `redis://...` |
| `BETTER_AUTH_SECRET` | Auth encryption key | 32+ char secret |

## 📊 Monitoring & Debugging

### View Logs
```bash
# All container logs
kamal app logs -d staging

# Follow logs in real-time
kamal app logs -f -d staging

# Specific service logs
kamal accessory logs postgres -d staging
kamal accessory logs redis -d staging
kamal accessory logs websocket -d staging
```

### Check Status
```bash
# Container status
kamal app details -d staging

# Health check
curl https://staging.your-domain.com/api/health

# SSH to server
ssh root@${STAGING_SERVER_IP}

# Check containers on server
docker ps
```

### Database Access
```bash
# Connect to staging database
kamal accessory exec postgres -d staging --reuse \
  "psql -U healthcare_user -d healthcare_staging"

# Run migrations
kamal app exec --reuse \
  'bun drizzle-kit push'
```

## 🔄 Common Operations

### Update Application
```bash
# 1. Make your changes
# 2. Commit to git
git add .
git commit -m "feat: your changes"

# 3. Deploy update
./deploy-staging.sh
```

### Rollback
```bash
# Quick rollback to previous version
./rollback-staging.sh

# Or manually
kamal rollback -d staging
```

### Clean Deployment
```bash
# Remove all containers and redeploy
kamal app remove -d staging
kamal deploy -d staging
```

### Update Environment Variables
```bash
# 1. Update .env.staging
# 2. Update Kamal secrets
nano .kamal/secrets

# 3. Redeploy
kamal deploy -d staging
```

## 🚨 Troubleshooting

### Build Failures
```bash
# Check Docker build locally
docker build -t test -f Dockerfile.production .

# Clear Docker cache
docker system prune -a

# Check build logs
kamal build details -d staging
```

### Connection Issues
```bash
# Test SSH
ssh -v root@${STAGING_SERVER_IP}

# Check firewall
sudo ufw status

# Verify ports are open
nmap -p 22,80,443,5432,6379,3002 ${STAGING_SERVER_IP}
```

### Container Crashes
```bash
# Check container status
kamal app details -d staging

# View error logs
kamal app logs --grep ERROR -d staging

# Check resource usage
ssh root@${STAGING_SERVER_IP} 'docker stats --no-stream'
```

### Database Issues
```bash
# Check database connection
kamal app exec --reuse \
  'bun scripts/database/manage-database-simple.ts health'

# Reset database (CAUTION!)
kamal accessory exec postgres -d staging --reuse \
  "dropdb healthcare_staging && createdb healthcare_staging"
```

## 🔐 Security Considerations

1. **SSH Keys**: Use SSH keys, not passwords
2. **Firewall**: Only open required ports (22, 80, 443)
3. **Secrets**: Never commit `.env.staging` or `.kamal/secrets`
4. **SSL**: Traefik handles SSL with Let's Encrypt
5. **Database**: Use strong passwords, restrict connections

## 📈 Performance Tuning

### Server Requirements
- **Minimum**: 2GB RAM, 2 CPU cores, 20GB disk
- **Recommended**: 4GB RAM, 4 CPU cores, 40GB disk

### Optimization Tips
1. Enable Docker BuildKit: `export DOCKER_BUILDKIT=1`
2. Use multi-stage builds in Dockerfile
3. Configure PostgreSQL for containers
4. Set appropriate resource limits

## 🔄 CI/CD Integration

### GitHub Actions Example
```yaml
name: Deploy to Staging
on:
  push:
    branches: [staging]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install Kamal
        run: gem install kamal
        
      - name: Deploy
        env:
          STAGING_SERVER_IP: ${{ secrets.STAGING_SERVER_IP }}
          # ... other secrets
        run: |
          kamal deploy -d staging
```

## 📝 Post-Deployment Verification

After deployment, verify:

1. **Health Check**: `https://staging.your-domain.com/api/health`
2. **Authentication**: Test login/logout
3. **WebSocket**: Check real-time features
4. **Database**: Verify migrations applied
5. **Monitoring**: Check logs for errors

## 🆘 Emergency Procedures

### Complete Reset
```bash
# 1. Remove everything
kamal app remove -d staging
kamal accessory remove all -d staging

# 2. Clean server
ssh root@${STAGING_SERVER_IP} 'docker system prune -a'

# 3. Redeploy from scratch
kamal setup -d staging
```

### Backup Before Major Changes
```bash
# Backup database
kamal accessory exec postgres -d staging --reuse \
  "pg_dump healthcare_staging > backup.sql"

# Download backup
scp root@${STAGING_SERVER_IP}:backup.sql ./backups/
```

---

Last updated: December 2024