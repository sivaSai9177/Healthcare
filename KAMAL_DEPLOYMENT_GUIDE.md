# Kamal Deployment Guide for Healthcare Alert System

## Overview

This guide covers deploying the Healthcare Alert System using Kamal (formerly MRSK), a deployment tool that makes it easy to deploy containerized applications.

## Prerequisites

### 1. Install Kamal
```bash
# Install Ruby if needed
brew install ruby # macOS
# or
sudo apt-get install ruby # Ubuntu

# Install Kamal
gem install kamal
```

### 2. Server Requirements
- Ubuntu 20.04+ or similar Linux distribution
- Docker will be installed automatically by Kamal
- SSH access with sudo privileges
- Ports 80, 443, 3000, 3002, 5432, 6379 available

### 3. Domain & DNS
- A domain name pointing to your server
- SSL certificate (handled automatically via Let's Encrypt)

## Initial Setup

### 1. Configure Secrets
```bash
# Copy the secrets template
cp .kamal/secrets .kamal/secrets.local

# Edit with your values
vim .kamal/secrets.local
```

### 2. Server Preparation
```bash
# Test connection to your server
ssh your-user@your-server-ip

# Ensure your SSH key is added
ssh-copy-id your-user@your-server-ip
```

## Deployment Commands

### First-Time Setup
```bash
# Initialize Kamal and install Docker on servers
kamal setup

# This will:
# - Connect to your servers
# - Install Docker
# - Set up the network
# - Create necessary directories
```

### Deploy Application
```bash
# Deploy to production
kamal deploy

# Deploy to staging
kamal deploy -d staging

# Deploy with verbose output
kamal deploy -v
```

### Common Operations

#### View Logs
```bash
# Application logs
kamal app logs

# Specific service logs
kamal accessory logs postgres
kamal accessory logs redis

# Follow logs
kamal app logs -f
```

#### Container Management
```bash
# List running containers
kamal app containers

# Restart application
kamal app restart

# Stop application
kamal app stop

# Start application
kamal app start
```

#### Execute Commands
```bash
# Run commands in container
kamal app exec 'bun run db:migrate'
kamal app exec 'bun scripts/create-admin-user.ts'

# Open shell in container
kamal app exec -i bash
```

#### Database Operations
```bash
# Backup database
kamal accessory exec postgres 'pg_dump -U $POSTGRES_USER healthcare_prod' > backup.sql

# Restore database
cat backup.sql | kamal accessory exec postgres -i 'psql -U $POSTGRES_USER healthcare_prod'
```

### Rollback
```bash
# Rollback to previous version
kamal rollback

# Rollback to specific version
kamal rollback --version=abc123
```

## Environment-Specific Deployments

### Staging Deployment
```bash
# Deploy to staging
kamal deploy -d staging

# Uses config/deploy.staging.yml overrides
```

### Production Deployment
```bash
# Deploy to production (default)
kamal deploy

# Or explicitly
kamal deploy -d production
```

## Monitoring & Maintenance

### Health Checks
```bash
# Check application health
curl https://your-domain.com/api/health

# Check all services
kamal app details
```

### View Running Services
```bash
# List all containers
kamal app containers

# Check accessory status
kamal accessory details all
```

### Update Configuration
```bash
# After changing deploy.yml
kamal config

# Redeploy with new config
kamal deploy
```

## Troubleshooting

### Common Issues

#### 1. SSH Connection Failed
```bash
# Test SSH connection
ssh -v your-user@your-server-ip

# Fix: Add SSH key
ssh-add ~/.ssh/id_rsa
```

#### 2. Docker Installation Failed
```bash
# Manually install Docker
kamal server bootstrap
```

#### 3. Port Already in Use
```bash
# Find what's using the port
sudo lsof -i :3000

# Stop the service or change port in deploy.yml
```

#### 4. Database Connection Issues
```bash
# Check PostgreSQL logs
kamal accessory logs postgres --tail 100

# Verify connection
kamal accessory exec postgres 'psql -U $POSTGRES_USER -c "SELECT 1"'
```

### Debug Mode
```bash
# Run with debug output
KAMAL_DEBUG=1 kamal deploy

# Verbose mode
kamal deploy -v
```

## Production Checklist

Before deploying to production:

- [ ] All secrets configured in `.kamal/secrets.local`
- [ ] Domain DNS configured and propagated
- [ ] Database backup strategy in place
- [ ] Monitoring alerts configured
- [ ] SSL certificate will be auto-generated
- [ ] PostHog analytics configured
- [ ] Email service configured
- [ ] Redis password set
- [ ] Server firewall configured

## Security Best Practices

1. **Use Strong Passwords**: All passwords in secrets should be 20+ characters
2. **Limit SSH Access**: Use SSH keys only, disable password auth
3. **Firewall Rules**: Only open necessary ports
4. **Regular Updates**: Keep servers updated
5. **Backup Strategy**: Automated daily backups
6. **Monitoring**: Set up alerts for errors and performance

## Backup & Recovery

### Automated Backups
Add to crontab on server:
```bash
# Daily database backup at 2 AM
0 2 * * * docker exec postgres pg_dump -U healthcare healthcare_prod | gzip > /backups/healthcare_$(date +\%Y\%m\%d).sql.gz

# Keep only last 30 days
0 3 * * * find /backups -name "healthcare_*.sql.gz" -mtime +30 -delete
```

### Manual Backup
```bash
# Backup database
kamal accessory exec postgres 'pg_dump -U $POSTGRES_USER healthcare_prod' | gzip > healthcare_backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Backup uploads
ssh your-server "tar czf uploads_$(date +%Y%m%d).tar.gz /app/uploads"
```

### Restore Process
```bash
# Stop application
kamal app stop

# Restore database
gunzip -c healthcare_backup.sql.gz | kamal accessory exec postgres -i 'psql -U $POSTGRES_USER healthcare_prod'

# Restore uploads
scp uploads_backup.tar.gz your-server:/tmp/
ssh your-server "cd / && tar xzf /tmp/uploads_backup.tar.gz"

# Start application
kamal app start
```

## Scaling

### Horizontal Scaling
```yaml
# In deploy.yml, add more servers:
servers:
  web:
    - server1.example.com
    - server2.example.com
    - server3.example.com
```

### Load Balancing
Kamal automatically configures Traefik as a load balancer when multiple servers are specified.

## Monitoring Integration

### PostHog Events
Deployment events are automatically sent to PostHog:
- `deployment_started`
- `deployment_completed`
- `deployment_failed`
- `rollback_performed`

### Custom Alerts
Add to post-deploy hook for custom notifications:
- Slack notifications
- Email alerts
- PagerDuty integration

## Cost Optimization

### Recommended Server Specs
- **Small (< 100 users)**: 2 vCPU, 4GB RAM
- **Medium (< 1000 users)**: 4 vCPU, 8GB RAM  
- **Large (< 10000 users)**: 8 vCPU, 16GB RAM

### Resource Monitoring
```bash
# Check resource usage
kamal app exec 'top -bn1'
kamal app exec 'df -h'
```

---

## Quick Reference

```bash
# First time
kamal setup

# Deploy
kamal deploy

# Logs
kamal app logs -f

# Rollback
kamal rollback

# Stop
kamal app stop

# Start
kamal app start

# Remove everything
kamal remove
```

**Remember**: Always test in staging before deploying to production! 🚀