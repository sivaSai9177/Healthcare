# Kamal Deployment - Ready to Deploy

## ✅ Configuration Complete

All Kamal deployment files have been consolidated and tested. The system is ready for deployment.

## 📁 Deployment Files

1. **`config/deploy.yml`** - Main Kamal configuration (supports both local and remote deployment)
2. **`.env.production`** - Environment variables (currently set for localhost)
3. **`deploy-with-kamal.sh`** - Simple deployment script

## 🚀 Quick Deployment

### Local Deployment (to your laptop)
```bash
./deploy-with-kamal.sh local
```

### Remote Deployment
1. Update `.env.production` with your server details:
   ```
   DEPLOY_SERVER_IP=your.server.ip
   DEPLOY_DOMAIN=your-domain.com
   DOCKER_REGISTRY_USERNAME=your-dockerhub-username
   ```

2. Run deployment:
   ```bash
   ./deploy-with-kamal.sh
   ```

## 📋 Pre-deployment Checklist

- [x] Kamal installed (`gem install kamal`)
- [x] Docker running
- [x] Environment variables configured
- [x] Kamal config validated
- [ ] Docker Hub credentials ready
- [ ] Server SSH access (for remote deployment)

## 🔧 Post-deployment Steps

1. **Run database migrations:**
   ```bash
   kamal app exec 'bun run db:push'
   ```

2. **Create admin user:**
   ```bash
   kamal app exec 'bun scripts/users/manage-users.ts create admin@localhost Admin User changeme'
   ```

3. **View logs:**
   ```bash
   kamal app logs -f
   ```

## 🌐 Access Points

- **Local:** http://localhost:3000
- **Remote:** https://your-domain.com

## ⚡ Useful Commands

- `kamal app details` - View app status
- `kamal app restart` - Restart application
- `kamal accessory logs postgres` - View database logs
- `kamal stop` - Stop all services
- `kamal remove` - Remove all containers

## 🎯 Ready to Deploy!

The deployment system is fully configured and tested. Simply run the deployment script to start.