# Mobile Testing Guide

## Google OAuth on Mobile

Google OAuth doesn't work with private IP addresses (192.168.x.x) for security reasons.

### Option 1: Use ngrok (Recommended)
1. Sign up at https://dashboard.ngrok.com/signup
2. Get authtoken: https://dashboard.ngrok.com/get-started/your-authtoken
3. Configure: `ngrok config add-authtoken YOUR_TOKEN`
4. Run: `ngrok http 8081`
5. Update your `.env` files with the ngrok URL
6. Add the ngrok URL to Google OAuth settings

### Option 2: Use Email/Password for Mobile
During development, use email/password authentication on mobile devices since it works with private IPs.

### Option 3: Test OAuth on Web Only
Test Google OAuth on web browser at http://localhost:8081

## Current Setup
- Web: http://localhost:8081 ✅ (Google OAuth works)
- Mobile: http://192.168.1.104:8081 ❌ (Google OAuth blocked)

## Production
In production with a real domain, Google OAuth will work on all platforms.