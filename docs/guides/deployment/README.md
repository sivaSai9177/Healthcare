# Deployment Overview

This guide provides a comprehensive overview of deploying the Healthcare Alert System across different platforms and environments.

## 🎯 Deployment Strategy

Our deployment strategy supports multiple platforms and environments:

- **Mobile Apps** (iOS & Android) via EAS Build
- **Web Application** via Docker & Kamal
- **Backend Services** via containerized microservices
- **Multiple Environments**: Development, Staging, Production

## 🚀 Quick Deployment Commands

### Mobile Deployment
```bash
# Development build
eas build --profile development --platform all

# Production build
eas build --profile production --platform all

# Submit to stores
eas submit --platform all
```

### Server Deployment
```bash
# Staging deployment
./deploy-staging.sh

# Production deployment
bun scripts/deployment/manage-deploy.ts deploy --env=production
```

## 📱 Mobile App Deployment

### EAS Build Setup
1. **Initial Configuration**
   ```bash
   ./scripts/deployment/eas-quick-setup.sh
   ```

2. **Build Profiles**
   - `development` - For local testing with dev client
   - `preview` - For internal testing via TestFlight/Play Console
   - `production` - For app store submission

3. **Build & Submit Process**
   ```bash
   # Build for production
   bun scripts/deployment/manage-eas.ts build --platform=all --profile=production
   
   # Submit to stores
   bun scripts/deployment/manage-eas.ts submit --platform=all
   ```

See [EAS Deployment Guide](../EAS_DEPLOYMENT_GUIDE.md) for detailed instructions.

## 🖥️ Server Deployment

### Infrastructure Overview
```
┌─────────────┐
│   Traefik   │ ← Load Balancer & SSL
└──────┬──────┘
       │
┌──────┴──────┐
│  Web App    │ ← Main Application
└──────┬──────┘
       │
┌──────┼──────┬─────────┬──────────┐
│ PostgreSQL  │  Redis  │ WebSocket │
└─────────────┴─────────┴───────────┘
```

### Deployment Methods

#### 1. Kamal Deployment (Recommended)
- **Pros**: Zero-downtime, easy rollbacks, built-in health checks
- **Setup**: [Kamal Setup Guide](kamal.md)
- **Deploy**: `kamal deploy`

#### 2. Docker Compose
- **Pros**: Simple, good for development/staging
- **Setup**: `docker-compose up -d`
- **Scale**: `docker-compose scale web=3`

#### 3. Kubernetes (Future)
- **Pros**: Maximum scalability, self-healing
- **Setup**: Coming soon

## 🌍 Environments

### Development
- **Purpose**: Local development and testing
- **URL**: http://localhost:8081
- **Database**: healthcare_dev
- **Deploy**: `npm run dev`

### Staging
- **Purpose**: Pre-production testing
- **URL**: https://staging.your-domain.com
- **Database**: healthcare_staging
- **Deploy**: `./deploy-staging.sh`
- **Setup**: [Staging Setup Guide](staging.md)

### Production
- **Purpose**: Live environment
- **URL**: https://your-domain.com
- **Database**: healthcare_prod
- **Deploy**: `kamal deploy`
- **Setup**: [Production Setup Guide](production.md)

## 🔧 Deployment Tools

### Management Scripts
```bash
# Main deployment script
bun scripts/deployment/manage-deploy.ts [action] [options]

# Actions:
# - build      Build application
# - deploy     Deploy to environment
# - rollback   Rollback deployment
# - status     Check deployment status
# - env        Manage environment variables
```

### Health Monitoring
```bash
# Check system health
bun scripts/monitoring/manage-health.ts check

# Monitor continuously
bun scripts/monitoring/manage-health.ts monitor
```

### EAS Management
```bash
# EAS build management
bun scripts/deployment/manage-eas.ts [action]

# Actions:
# - setup      Initial EAS setup
# - build      Start new build
# - submit     Submit to stores
# - status     Check build status
```

## 📋 Pre-Deployment Checklist

### Code Quality
- [ ] All tests passing
- [ ] Linting passes
- [ ] Type checking passes
- [ ] No console.log in production code
- [ ] Security audit passed

### Configuration
- [ ] Environment variables set
- [ ] Secrets configured
- [ ] SSL certificates ready
- [ ] Database migrations prepared

### Infrastructure
- [ ] Server resources adequate
- [ ] Backups configured
- [ ] Monitoring setup
- [ ] Rollback plan ready

## 🔄 Deployment Process

### 1. Preparation
```bash
# Run health checks
bun scripts/monitoring/manage-health.ts check

# Build and test
npm test
npm run build
```

### 2. Deployment
```bash
# Deploy to staging first
./deploy-staging.sh

# Verify staging
curl https://staging.your-domain.com/api/health

# Deploy to production
kamal deploy
```

### 3. Verification
```bash
# Check deployment status
bun scripts/deployment/manage-deploy.ts status

# Monitor logs
kamal app logs -f

# Run smoke tests
npm run test:e2e -- --env=production
```

### 4. Rollback (if needed)
```bash
# Quick rollback
kamal rollback

# Or use management script
bun scripts/deployment/manage-deploy.ts rollback --env=production
```

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Docker logs: `docker logs healthcare-app`
   - Verify environment variables
   - Ensure sufficient disk space

2. **Connection Issues**
   - Check firewall rules
   - Verify SSL certificates
   - Test with curl: `curl -v https://your-domain.com/api/health`

3. **Database Issues**
   - Check connection string
   - Verify migrations: `bun drizzle-kit push`
   - Check PostgreSQL logs

### Debug Commands
```bash
# Check container status
docker ps

# View logs
kamal app logs --grep ERROR

# SSH to server
ssh root@your-server-ip

# Check resources
docker stats
```

## 📊 Monitoring

### Health Endpoints
- `/api/health` - Basic health check
- `/api/health/detailed` - Detailed system status

### Metrics
- Response times
- Error rates
- Active connections
- Resource usage

### Alerts
Configure alerts for:
- Service downtime
- High error rates
- Resource exhaustion
- Security events

## 🔐 Security Considerations

1. **Environment Variables**
   - Never commit secrets
   - Use `.env.local` for local development
   - Use Kamal secrets for production

2. **Network Security**
   - Use HTTPS everywhere
   - Configure firewalls
   - Limit SSH access

3. **Container Security**
   - Regular image updates
   - Non-root users
   - Security scanning

4. **Data Protection**
   - Encrypted connections
   - Regular backups
   - GDPR compliance

## 📚 Additional Resources

- [EAS Documentation](https://docs.expo.dev/eas/)
- [Kamal Documentation](https://kamal-deploy.org)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [PostgreSQL Tuning](https://wiki.postgresql.org/wiki/Tuning_Your_PostgreSQL_Server)

## 🆘 Getting Help

- **Deployment Issues**: Check [Troubleshooting Guide](../troubleshooting/deployment.md)
- **Build Errors**: See [Build Troubleshooting](../troubleshooting/build-errors.md)
- **Support**: Create an issue with the `deployment` label

---

**Next Steps:**
- [Set up Staging Environment](staging.md)
- [Configure EAS Builds](../EAS_DEPLOYMENT_GUIDE.md)
- [Production Deployment](production.md)