# Better Auth Security Best Practices Implementation

This guide documents the security enhancements implemented for Better Auth in this project.

## Overview

We've implemented comprehensive security measures following Better Auth best practices, including:

- Enhanced session management
- Secure cookie configuration
- Rate limiting
- Advanced security headers
- Two-factor authentication support
- Session monitoring and validation
- HIPAA and GDPR compliance features

## Key Security Features

### 1. Session Management

```typescript
// Session configuration with security best practices
session: {
  expiresIn: 60 * 60 * 24 * 7, // 7 days
  updateAge: 60 * 60 * 24, // Refresh if older than 1 day
  cookieCache: {
    enabled: true,
    maxAge: 60 * 5, // 5 minutes cache
  },
  storeSessionInDatabase: true, // Better control
  enableSessionFingerprinting: true, // Production only
}
```

Features:
- Automatic session refresh
- Session fingerprinting for additional security
- Idle timeout detection
- Session anomaly detection

### 2. Cookie Security

```typescript
cookies: {
  sessionToken: {
    name: '__Secure-better-auth.session_token', // Secure prefix in production
    httpOnly: true, // Production
    sameSite: 'strict', // Production
    secure: true, // HTTPS only in production
    partitioned: true, // CHIPS support
  }
}
```

Security measures:
- `__Secure-` prefix for HTTPS-only cookies
- `__Host-` prefix for same-origin cookies
- Strict SameSite in production
- Cookie partitioning (CHIPS) for privacy

### 3. Rate Limiting

```typescript
rateLimit: {
  enabled: true,
  // Custom limits per endpoint
  customRules: [
    {
      path: '/sign-in',
      window: 5 * 60 * 1000, // 5 minutes
      max: 5, // 5 attempts
    },
    {
      path: '/sign-up',
      window: 60 * 60 * 1000, // 1 hour
      max: 3, // 3 signups per hour
    }
  ]
}
```

Protection against:
- Brute force attacks
- Account enumeration
- Resource exhaustion

### 4. Security Headers

```typescript
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'Content-Security-Policy': "default-src 'self'..."
}
```

### 5. Two-Factor Authentication

```typescript
// Enable 2FA for enhanced security
twoFactor({
  issuer: 'Hospital Alert System',
  forceTwoFactor: (user) => {
    // Force 2FA for admin and manager roles
    return ['admin', 'manager'].includes(user.role);
  }
})
```

### 6. Password Security

```typescript
password: {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  blocklist: ['password123', 'admin123', ...],
  history: {
    enabled: true,
    count: 5, // Remember last 5 passwords
  }
}
```

## Usage Examples

### Using Secure Session Hook

```typescript
import { useSecureSession } from '@/lib/auth/hooks';

function MyComponent() {
  const { session, user, isValidating, refreshSession } = useSecureSession();
  
  // Session is automatically validated and refreshed
  // Idle timeout is handled automatically
  
  return (
    <div>
      {user ? `Welcome ${user.name}` : 'Please sign in'}
    </div>
  );
}
```

### Protecting Routes

```typescript
import { useRequireAuth } from '@/lib/auth/hooks';

function AdminDashboard() {
  const { isAuthorized, isLoading } = useRequireAuth({
    allowedRoles: ['admin'],
    redirectTo: '/login'
  });
  
  if (isLoading) return <Loading />;
  if (!isAuthorized) return null;
  
  return <Dashboard />;
}
```

### Using Enhanced Auth Client

```typescript
import { authClientEnhanced } from '@/lib/auth';

// Check if session is expiring soon
const expiring = await authClientEnhanced.security.isSessionExpiringSoon(30);

// Force session refresh
await authClientEnhanced.security.forceRefresh();

// Enhanced sign out (clears all local data)
await authClientEnhanced.signOutEnhanced({ everywhere: true });
```

### Implementing Rate Limiting in API Routes

```typescript
// Rate limiting is automatically applied based on configuration
// Additional custom rate limiting in auth router:

const checkRateLimit = (identifier: string, maxRequests: number, windowMs: number) => {
  // Implementation in src/server/routers/auth.ts
};

// Usage
checkRateLimit(`signin:${clientIp}`, 5, 60000); // 5 attempts per minute
```

## Environment Variables

Required security-related environment variables:

```env
# Authentication
BETTER_AUTH_SECRET=your-secure-random-secret
BETTER_AUTH_BASE_URL=https://api.yourdomain.com

# Security
ENABLE_TWO_FACTOR=true
ENABLE_PASSKEYS=true
ENABLE_CROSS_SUBDOMAIN=true
COOKIE_DOMAIN=.yourdomain.com

# OAuth
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# Admin
ADMIN_USER_IDS=user1,user2

# Monitoring
SENTRY_DSN=your-sentry-dsn
```

## Mobile App Security

### Secure Storage

```typescript
// Automatic secure storage on mobile
storage: Platform.OS === 'web' ? webStorage : mobileStorage,
secureStorage: Platform.OS !== 'web',
```

### Session Monitoring

```typescript
// Automatic session validation when app comes to foreground
sessionValidation: {
  validateOnStartup: true,
  validateOnForeground: true,
  validationInterval: 5 * 60 * 1000, // 5 minutes
}
```

### Biometric Authentication

```typescript
mobile: {
  biometric: {
    enabled: true,
    fallbackToPasscode: true,
    requireRecentAuth: 5 * 60, // 5 minutes
  }
}
```

## Compliance Features

### HIPAA Compliance

- Encryption at rest (AES-256)
- Encryption in transit (TLS 1.3)
- Session timeout (30 minutes)
- Comprehensive audit logging
- Access control

### GDPR Compliance

- Data retention policies
- Right to erasure
- Data portability
- Consent management
- Privacy by design

## Security Monitoring

### Audit Logging

All authentication events are logged:
- Login attempts (success/failure)
- Password changes
- Role changes
- Session creation/destruction
- Suspicious activity

### Anomaly Detection

- IP address changes during session
- Impossible travel detection
- Unusual login patterns
- Multiple failed attempts

## Best Practices for Developers

1. **Always use the secure hooks**:
   ```typescript
   // Good
   import { useSecureSession } from '@/lib/auth/hooks';
   
   // Avoid
   import { useSession } from 'better-auth/react';
   ```

2. **Validate permissions properly**:
   ```typescript
   const { hasPermission } = usePermissions();
   
   if (!hasPermission('manage_users')) {
     return <Unauthorized />;
   }
   ```

3. **Handle session expiration gracefully**:
   ```typescript
   const { session, error } = useSecureSession();
   
   if (error?.message.includes('expired')) {
     // Show session expired message
   }
   ```

4. **Use rate limiting for sensitive operations**:
   ```typescript
   // In API routes
   checkRateLimit(identifier, maxAttempts, window);
   ```

5. **Implement proper error handling**:
   ```typescript
   try {
     await authClient.signIn.email({ email, password });
   } catch (error) {
     // Don't expose sensitive information
     showError('Invalid credentials');
   }
   ```

## Testing Security Features

### Manual Testing

1. **Test session timeout**:
   - Sign in and leave the app idle for 30 minutes
   - Verify automatic sign out

2. **Test rate limiting**:
   - Try signing in with wrong password 6 times
   - Verify rate limit error after 5 attempts

3. **Test session validation**:
   - Sign in on one device
   - Sign out on another device
   - Verify session is invalidated

### Automated Testing

```typescript
// Example test for rate limiting
it('should enforce rate limits on sign in', async () => {
  for (let i = 0; i < 6; i++) {
    const result = await authRouter.signIn({
      email: 'test@example.com',
      password: 'wrong',
    });
    
    if (i < 5) {
      expect(result.error).toBe('Invalid credentials');
    } else {
      expect(result.error).toContain('Rate limit exceeded');
    }
  }
});
```

## Troubleshooting

### Common Issues

1. **Cookies not being set**:
   - Check CORS configuration
   - Verify cookie domain settings
   - Ensure HTTPS in production

2. **Session not persisting**:
   - Check secure storage implementation
   - Verify session token is being stored
   - Check cookie settings

3. **Rate limiting too strict**:
   - Adjust limits in `security-config.ts`
   - Consider different limits for different endpoints

### Debug Mode

Enable debug logging:

```typescript
if (__DEV__) {
  console.log('Session debug:', await sessionManager.debugTokenStorage());
}
```

## Future Enhancements

1. **WebAuthn/Passkeys**: Already configured, needs UI implementation
2. **Risk-based authentication**: Adaptive security based on risk score
3. **Device trust**: Remember trusted devices
4. **Behavioral biometrics**: Typing patterns, mouse movements
5. **Zero-trust architecture**: Continuous verification

## Resources

- [Better Auth Documentation](https://better-auth.com)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [NIST Digital Identity Guidelines](https://pages.nist.gov/800-63-3/)