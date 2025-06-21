# EAS Build & Deployment Guide

## 🚀 Quick Start

### 1. Initial Setup
```bash
# Install EAS CLI globally
npm install -g eas-cli

# Login to your Expo account
eas login

# Run initial setup
bun scripts/deployment/manage-eas.ts setup
```

### 2. Build for Testing
```bash
# Build for iOS simulator (development)
bun scripts/deployment/manage-eas.ts build --platform=ios --profile=development

# Build APK for Android testing
bun scripts/deployment/manage-eas.ts build --platform=android --profile=preview
```

### 3. Production Build & Submit
```bash
# Build for production
bun scripts/deployment/manage-eas.ts build --platform=all --profile=production

# Submit to app stores
bun scripts/deployment/manage-eas.ts submit --platform=all
```

## 📱 Build Profiles

### Development
- **Purpose**: Local development and testing
- **iOS**: Simulator build with dev client
- **Android**: Debug APK
- **Distribution**: Internal

### Preview
- **Purpose**: Internal testing and QA
- **iOS**: Ad hoc distribution
- **Android**: APK for direct installation
- **Distribution**: Internal

### Production
- **Purpose**: App store submission
- **iOS**: App Store distribution
- **Android**: AAB for Google Play
- **Distribution**: Store

## 🔧 Configuration

### Environment Variables
Each build profile has its own environment configuration:

```json
// eas.json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://healthcare-app.com",
        "EXPO_PUBLIC_WS_URL": "wss://healthcare-app.com",
        "NODE_ENV": "production"
      }
    }
  }
}
```

### iOS Configuration

1. **Bundle Identifier**: `com.hospital.alerts`
2. **Provisioning**: Managed by EAS (recommended)
3. **Capabilities**: Push Notifications enabled

### Android Configuration

1. **Package Name**: `com.hospital.alerts`
2. **Keystore**: Managed by EAS (recommended)
3. **Permissions**: Notifications enabled

## 📝 Step-by-Step Deployment Process

### 1. Pre-deployment Checklist
- [ ] All tests passing
- [ ] No console.log statements in production
- [ ] Environment variables configured
- [ ] Version number updated in app.json
- [ ] Changelog updated

### 2. Build Process
```bash
# 1. Ensure clean working directory
git status

# 2. Run health check
bun scripts/monitoring/manage-health.ts check

# 3. Create production build
bun scripts/deployment/manage-eas.ts build --profile=production

# 4. Monitor build progress
bun scripts/deployment/manage-eas.ts status
```

### 3. Testing Production Build
```bash
# Download and test the build
# iOS: Use TestFlight
# Android: Download APK directly

# Test critical features:
- [ ] Authentication flow
- [ ] Real-time alerts
- [ ] Push notifications
- [ ] Offline functionality
```

### 4. App Store Submission
```bash
# Submit to both stores
bun scripts/deployment/manage-eas.ts submit --platform=all

# iOS App Store Connect
# - Add screenshots
# - Update description
# - Submit for review

# Google Play Console
# - Add screenshots
# - Update listing
# - Submit for review
```

## 🔄 OTA Updates

### Publishing Updates
```bash
# Publish update to production branch
bun scripts/deployment/manage-eas.ts update --message="Fix critical alert issue"
```

### Update Channels
- **default**: Development updates
- **preview**: Staging updates
- **production**: Production updates

## 🔑 Credentials Management

### Automatic (Recommended)
Let EAS manage your credentials:
```bash
eas credentials
```

### Manual
Store credentials in `credentials.json`:
```json
{
  "ios": {
    "provisioningProfilePath": "profiles/production.mobileprovision",
    "distributionCertificate": {
      "path": "certs/distribution.p12",
      "password": "CERT_PASSWORD"
    }
  },
  "android": {
    "keystore": {
      "path": "keystores/release.keystore",
      "keystorePassword": "KEYSTORE_PASSWORD",
      "keyAlias": "release",
      "keyPassword": "KEY_PASSWORD"
    }
  }
}
```

## 📊 Monitoring Builds

### Check Build Status
```bash
# View recent builds
bun scripts/deployment/manage-eas.ts list

# Check detailed status
bun scripts/deployment/manage-eas.ts status
```

### Build Artifacts
- **iOS**: .ipa file
- **Android**: .apk (preview) or .aab (production)
- **Download**: Available in Expo dashboard

## 🚨 Troubleshooting

### Common Issues

1. **Build Fails: "Git working tree is dirty"**
   ```bash
   git add .
   git commit -m "chore: prepare for build"
   ```

2. **iOS Build Fails: "No provisioning profile"**
   ```bash
   eas credentials
   # Select "Manage iOS credentials"
   ```

3. **Android Build Fails: "Keystore not found"**
   ```bash
   eas credentials
   # Select "Manage Android credentials"
   ```

### Debug Commands
```bash
# Clear build cache
bun scripts/deployment/manage-eas.ts build --clear-cache

# Local build for debugging
bun scripts/deployment/manage-eas.ts build --local

# Check EAS service status
eas diagnostics
```

## 📱 Platform-Specific Notes

### iOS
- Requires Apple Developer account ($99/year)
- TestFlight for beta testing
- App Store review: 1-7 days

### Android
- Requires Google Play Developer account ($25 one-time)
- Internal testing track available immediately
- Google Play review: 2-24 hours

## 🔄 CI/CD Integration

### GitHub Actions Example
```yaml
name: EAS Build
on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          
      - uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
          
      - run: npm ci
      
      - run: eas build --platform all --non-interactive
```

## 📈 Performance Optimization

### Build Optimization
- Use `--clear-cache` sparingly
- Enable build caching in eas.json
- Use resource classes appropriately

### App Size Optimization
- Remove unused dependencies
- Optimize images and assets
- Enable ProGuard for Android
- Use App Thinning for iOS

## 🔐 Security Best Practices

1. **Never commit credentials**
2. **Use EAS Secrets for sensitive data**
3. **Enable 2FA on Expo account**
4. **Rotate credentials regularly**
5. **Use separate keys for development/production**

## 📞 Support

- **EAS Documentation**: https://docs.expo.dev/eas/
- **Expo Forums**: https://forums.expo.dev/
- **Status Page**: https://status.expo.dev/

---

Last updated: December 2024