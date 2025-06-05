# Preview Build Guide for Expo

## Overview
This guide explains how to create and run preview builds for testing your Expo app on iOS and Android devices.

## Preview Build vs Development Build

### Development Build
- Includes developer menu
- Hot reloading enabled
- Debug logging visible
- Used for active development

### Preview Build
- Production-like experience
- No developer menu
- Optimized performance
- Used for testing before release

## Creating Preview Builds

### Prerequisites
1. EAS CLI installed: `npm install -g eas-cli`
2. Expo account: `eas login`
3. EAS configured: `eas build:configure`

### iOS Preview Build

#### 1. Create Preview Build Profile
Add to `eas.json`:

```json
{
  "build": {
    "preview": {
      "ios": {
        "buildConfiguration": "Release",
        "distribution": "internal",
        "resourceClass": "ios-medium",
        "env": {
          "EXPO_PUBLIC_DEBUG_MODE": "false"
        }
      }
    },
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "resourceClass": "m-medium"
      }
    },
    "production": {
      "ios": {
        "resourceClass": "m-medium"
      }
    }
  }
}
```

#### 2. Build for iOS Preview
```bash
# Create preview build
eas build --profile preview --platform ios

# Or use local credentials
eas build --profile preview --platform ios --local
```

#### 3. Install on Simulator
```bash
# After build completes, download and install
eas build:run -p ios --profile preview

# Or manually install
xcrun simctl install booted path/to/your.app
```

### Android Preview Build

#### 1. Build for Android Preview
```bash
# Create preview build
eas build --profile preview --platform android

# Or create APK
eas build --profile preview --platform android --output=./preview.apk
```

#### 2. Install on Device/Emulator
```bash
# Install using EAS
eas build:run -p android --profile preview

# Or manually with ADB
adb install preview.apk
```

## Quick Scripts

Add these to your `package.json`:

```json
{
  "scripts": {
    "ios:preview": "eas build --profile preview --platform ios --local && eas build:run -p ios --latest",
    "android:preview": "eas build --profile preview --platform android --local && eas build:run -p android --latest",
    "preview:list": "eas build:list --platform all --status completed --limit 5",
    "preview:download": "eas build:download --platform ios --id"
  }
}
```

## Testing Changes in Preview

### 1. Build Locally (Faster)
```bash
# iOS local preview build
eas build --profile preview --platform ios --local

# Android local preview build  
eas build --profile preview --platform android --local
```

### 2. Using Expo Orbit (Recommended for iOS)
1. Install Expo Orbit from [expo.dev/orbit](https://expo.dev/orbit)
2. Open Orbit and sign in
3. Your preview builds will appear automatically
4. Click to install on simulator

### 3. Manual Installation

#### iOS Simulator
```bash
# Get list of simulators
xcrun simctl list devices

# Boot specific simulator
xcrun simctl boot "iPhone 15"

# Install app
xcrun simctl install booted path/to/app.tar.gz
```

#### Android Emulator
```bash
# List devices
adb devices

# Install APK
adb install -r preview.apk
```

## Environment Variables for Preview

Create `.env.preview`:
```env
EXPO_PUBLIC_API_URL=https://staging.yourapi.com
EXPO_PUBLIC_DEBUG_MODE=false
EXPO_PUBLIC_ENVIRONMENT=preview
```

## Differences from Production

| Feature | Development | Preview | Production |
|---------|-------------|---------|------------|
| Debug Menu | ✅ | ❌ | ❌ |
| Console Logs | ✅ | ✅ | ❌ |
| Performance | Slower | Fast | Fastest |
| Error Boundaries | Shows details | Shows details | User friendly |
| API Endpoint | Local | Staging | Production |

## Common Commands

```bash
# Check build status
eas build:list --status=in_queue

# Cancel build
eas build:cancel [BUILD_ID]

# Download specific build
eas build:download --id=[BUILD_ID]

# Submit to TestFlight (iOS)
eas submit --platform ios --profile preview

# View build logs
eas build:view [BUILD_ID]
```

## Troubleshooting

### Build Fails
```bash
# Clear cache
eas build --clear-cache --profile preview --platform ios

# Check credentials
eas credentials
```

### App Crashes on Launch
1. Check environment variables
2. Verify API endpoints
3. Check native dependencies

### Can't Install on Device
1. Ensure device is registered (iOS)
2. Enable developer mode (Android)
3. Check provisioning profile (iOS)

## Best Practices

1. **Test on Real Devices**: Preview builds should be tested on actual devices
2. **Use Staging API**: Point to staging environment, not production
3. **Version Your Builds**: Use semantic versioning for preview builds
4. **Automate Distribution**: Use CI/CD for automatic preview builds

## Next Steps

- Set up CI/CD for automatic preview builds
- Configure crash reporting for preview builds
- Set up beta testing with TestFlight/Play Console