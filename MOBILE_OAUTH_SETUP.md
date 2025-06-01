# Mobile OAuth Setup

## The Problem
Google OAuth doesn't allow private IP addresses (192.168.x.x) as redirect URIs for security reasons.

## Solution: Use ngrok

1. **Start ngrok** (in a new terminal):
   ```bash
   ngrok http 8081
   ```

2. **You'll get a public URL** like:
   ```
   https://abc123.ngrok-free.app
   ```

3. **Update your .env files** with the ngrok URL:
   ```
   EXPO_PUBLIC_API_URL=https://abc123.ngrok-free.app
   BETTER_AUTH_URL=https://abc123.ngrok-free.app
   ```

4. **Add to Google OAuth Console**:
   - Authorized JavaScript origins: `https://abc123.ngrok-free.app`
   - Authorized redirect URIs: `https://abc123.ngrok-free.app/api/auth/callback/google`

5. **Restart your Expo server**

## Alternative: Test on Web Only
For quick testing, use `http://localhost:8081` in your web browser instead of mobile.

## Important Notes
- The ngrok URL changes each time you restart ngrok
- You'll need to update Google OAuth settings each time
- For production, use a real domain name