# Google OAuth Setup for Development

## Required Redirect URIs in Google Console

Add ALL of these redirect URIs to your Google OAuth client:

### For Development:
```
http://localhost:8081/api/auth/callback/google
http://192.168.1.104:8081/api/auth/callback/google
```

### Authorized JavaScript Origins:
```
http://localhost:8081
http://192.168.1.104:8081
```

## Important Notes:

1. Make sure you've added BOTH localhost and your IP address redirect URIs
2. The callback URL must match exactly what Better Auth sends to Google
3. For mobile testing, the IP address redirect URI is essential

## Testing:
- Web: Uses `http://localhost:8081/api/auth/callback/google`
- Mobile: Uses `http://192.168.1.104:8081/api/auth/callback/google`

Make sure both are configured in your Google OAuth client settings!