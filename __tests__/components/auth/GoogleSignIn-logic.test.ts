import { describe, it, expect } from '@jest/globals';

describe('GoogleSignIn Component Logic', () => {
  describe('OAuth Flow States', () => {
    type OAuthState = 
      | 'idle' 
      | 'redirecting' 
      | 'authenticating' 
      | 'exchanging' 
      | 'fetching-profile'
      | 'creating-account'
      | 'success' 
      | 'error'
      | 'cancelled';

    interface OAuthContext {
      state: OAuthState;
      error?: string;
      code?: string;
      accessToken?: string;
      profile?: {
        email: string;
        name: string;
        picture: string;
      };
    }

    const getNextOAuthState = (
      currentState: OAuthState,
      event: { type: string; payload?: any }
    ): OAuthContext => {
      switch (currentState) {
        case 'idle':
          if (event.type === 'START_AUTH') {
            return { state: 'redirecting' };
          }
          break;
        
        case 'redirecting':
          if (event.type === 'REDIRECT_COMPLETE') {
            return { state: 'authenticating', code: event.payload.code };
          }
          if (event.type === 'USER_CANCELLED') {
            return { state: 'cancelled' };
          }
          break;
        
        case 'authenticating':
          if (event.type === 'CODE_RECEIVED') {
            return { state: 'exchanging', code: event.payload.code };
          }
          if (event.type === 'AUTH_ERROR') {
            return { state: 'error', error: event.payload.error };
          }
          break;
        
        case 'exchanging':
          if (event.type === 'TOKEN_RECEIVED') {
            return { state: 'fetching-profile', accessToken: event.payload.token };
          }
          if (event.type === 'EXCHANGE_ERROR') {
            return { state: 'error', error: 'Failed to exchange authorization code' };
          }
          break;
        
        case 'fetching-profile':
          if (event.type === 'PROFILE_RECEIVED') {
            return { 
              state: 'creating-account', 
              profile: event.payload.profile,
              accessToken: event.payload.token,
            };
          }
          break;
        
        case 'creating-account':
          if (event.type === 'ACCOUNT_CREATED') {
            return { state: 'success' };
          }
          if (event.type === 'ACCOUNT_EXISTS') {
            return { state: 'success' };
          }
          break;
      }

      return { state: currentState };
    };

    it('follows successful authentication flow', () => {
      let context: OAuthContext = { state: 'idle' };
      
      context = getNextOAuthState(context.state, { type: 'START_AUTH' });
      expect(context.state).toBe('redirecting');
      
      context = getNextOAuthState(context.state, { 
        type: 'REDIRECT_COMPLETE', 
        payload: { code: 'auth-code-123' },
      });
      expect(context.state).toBe('authenticating');
      expect(context.code).toBe('auth-code-123');
    });

    it('handles user cancellation', () => {
      const context = getNextOAuthState('redirecting', { type: 'USER_CANCELLED' });
      expect(context.state).toBe('cancelled');
    });

    it('handles authentication errors', () => {
      const context = getNextOAuthState('authenticating', { 
        type: 'AUTH_ERROR',
        payload: { error: 'Invalid client' },
      });
      expect(context.state).toBe('error');
      expect(context.error).toBe('Invalid client');
    });
  });

  describe('OAuth URL Generation', () => {
    interface OAuthConfig {
      clientId: string;
      redirectUri: string;
      scope: string[];
      state?: string;
      prompt?: 'none' | 'consent' | 'select_account';
    }

    const generateOAuthUrl = (config: OAuthConfig): string => {
      const baseUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
      const params = new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: config.redirectUri,
        response_type: 'code',
        scope: config.scope.join(' '),
        access_type: 'offline',
        prompt: config.prompt || 'select_account',
      });

      if (config.state) {
        params.append('state', config.state);
      }

      return `${baseUrl}?${params.toString()}`;
    };

    const parseCallbackUrl = (url: string): { code?: string; error?: string; state?: string } => {
      const urlObj = new URL(url);
      const params = urlObj.searchParams;

      return {
        code: params.get('code') || undefined,
        error: params.get('error') || undefined,
        state: params.get('state') || undefined,
      };
    };

    it('generates correct OAuth URL', () => {
      const config: OAuthConfig = {
        clientId: 'test-client-id',
        redirectUri: 'https://app.example.com/auth/callback',
        scope: ['email', 'profile'],
      };

      const url = generateOAuthUrl(config);
      expect(url).toContain('client_id=test-client-id');
      expect(url).toContain('response_type=code');
      expect(url).toContain('scope=email+profile');
      expect(url).toContain('access_type=offline');
    });

    it('includes optional parameters', () => {
      const config: OAuthConfig = {
        clientId: 'test-client-id',
        redirectUri: 'https://app.example.com/auth/callback',
        scope: ['email'],
        state: 'random-state-123',
        prompt: 'consent',
      };

      const url = generateOAuthUrl(config);
      expect(url).toContain('state=random-state-123');
      expect(url).toContain('prompt=consent');
    });

    it('parses callback URL correctly', () => {
      const successUrl = 'https://app.example.com/auth/callback?code=4/abc123&state=xyz';
      const success = parseCallbackUrl(successUrl);
      expect(success.code).toBe('4/abc123');
      expect(success.state).toBe('xyz');

      const errorUrl = 'https://app.example.com/auth/callback?error=access_denied';
      const error = parseCallbackUrl(errorUrl);
      expect(error.error).toBe('access_denied');
    });
  });

  describe('Error Handling', () => {
    interface OAuthError {
      code: string;
      message: string;
      recoverable: boolean;
      action?: string;
    }

    const handleOAuthError = (error: string): OAuthError => {
      const errorMap: Record<string, OAuthError> = {
        'access_denied': {
          code: 'access_denied',
          message: 'You denied access to your Google account',
          recoverable: true,
          action: 'Try again',
        },
        'invalid_request': {
          code: 'invalid_request',
          message: 'Invalid authentication request',
          recoverable: false,
        },
        'unauthorized_client': {
          code: 'unauthorized_client',
          message: 'This app is not authorized to use Google Sign-In',
          recoverable: false,
        },
        'unsupported_response_type': {
          code: 'unsupported_response_type',
          message: 'Authentication configuration error',
          recoverable: false,
        },
        'server_error': {
          code: 'server_error',
          message: 'Google servers are temporarily unavailable',
          recoverable: true,
          action: 'Try again later',
        },
        'temporarily_unavailable': {
          code: 'temporarily_unavailable',
          message: 'Service temporarily unavailable',
          recoverable: true,
          action: 'Try again in a few moments',
        },
      };

      return errorMap[error] || {
        code: 'unknown_error',
        message: 'An unexpected error occurred',
        recoverable: true,
        action: 'Try again',
      };
    };

    it('handles known OAuth errors', () => {
      const accessDenied = handleOAuthError('access_denied');
      expect(accessDenied.message).toBe('You denied access to your Google account');
      expect(accessDenied.recoverable).toBe(true);
      expect(accessDenied.action).toBe('Try again');

      const serverError = handleOAuthError('server_error');
      expect(serverError.recoverable).toBe(true);
      expect(serverError.action).toBe('Try again later');
    });

    it('handles unknown errors', () => {
      const unknown = handleOAuthError('some_unknown_error');
      expect(unknown.code).toBe('unknown_error');
      expect(unknown.recoverable).toBe(true);
    });
  });

  describe('Account Linking', () => {
    interface AccountLinkingState {
      googleEmail: string;
      existingEmail?: string;
      canLink: boolean;
      requiresConfirmation: boolean;
      conflictType?: 'email-mismatch' | 'already-linked' | 'different-provider';
    }

    const checkAccountLinking = (
      googleProfile: { email: string },
      existingAccount?: { email: string; providers: string[] }
    ): AccountLinkingState => {
      if (!existingAccount) {
        return {
          googleEmail: googleProfile.email,
          canLink: true,
          requiresConfirmation: false,
        };
      }

      // Check if already linked to Google
      if (existingAccount.providers.includes('google')) {
        return {
          googleEmail: googleProfile.email,
          existingEmail: existingAccount.email,
          canLink: false,
          requiresConfirmation: false,
          conflictType: 'already-linked',
        };
      }

      // Check email match
      if (existingAccount.email !== googleProfile.email) {
        return {
          googleEmail: googleProfile.email,
          existingEmail: existingAccount.email,
          canLink: true,
          requiresConfirmation: true,
          conflictType: 'email-mismatch',
        };
      }

      // Can link to existing account
      return {
        googleEmail: googleProfile.email,
        existingEmail: existingAccount.email,
        canLink: true,
        requiresConfirmation: true,
      };
    };

    it('allows new account creation', () => {
      const result = checkAccountLinking({ email: 'user@gmail.com' });
      expect(result.canLink).toBe(true);
      expect(result.requiresConfirmation).toBe(false);
    });

    it('prevents duplicate Google linking', () => {
      const result = checkAccountLinking(
        { email: 'user@gmail.com' },
        { email: 'user@gmail.com', providers: ['google', 'password'] }
      );
      expect(result.canLink).toBe(false);
      expect(result.conflictType).toBe('already-linked');
    });

    it('requires confirmation for email mismatch', () => {
      const result = checkAccountLinking(
        { email: 'user@gmail.com' },
        { email: 'user@company.com', providers: ['password'] }
      );
      expect(result.canLink).toBe(true);
      expect(result.requiresConfirmation).toBe(true);
      expect(result.conflictType).toBe('email-mismatch');
    });
  });

  describe('Session Creation', () => {
    interface GoogleSession {
      accessToken: string;
      refreshToken?: string;
      expiresIn: number;
      scope: string[];
      profile: {
        id: string;
        email: string;
        name: string;
        picture: string;
        verified: boolean;
      };
    }

    const createSessionFromGoogle = (
      tokenResponse: any,
      profileResponse: any
    ): GoogleSession => {
      return {
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        expiresIn: tokenResponse.expires_in || 3600,
        scope: tokenResponse.scope ? tokenResponse.scope.split(' ') : [],
        profile: {
          id: profileResponse.id,
          email: profileResponse.email,
          name: profileResponse.name || `${profileResponse.given_name} ${profileResponse.family_name}`,
          picture: profileResponse.picture,
          verified: profileResponse.verified_email || false,
        },
      };
    };

    const calculateSessionExpiry = (expiresIn: number): Date => {
      const expiry = new Date();
      expiry.setSeconds(expiry.getSeconds() + expiresIn);
      return expiry;
    };

    it('creates session from Google response', () => {
      const tokenResponse = {
        access_token: 'ya29.abc123',
        refresh_token: 'rt.xyz789',
        expires_in: 3600,
        scope: 'email profile',
      };

      const profileResponse = {
        id: '123456789',
        email: 'user@gmail.com',
        given_name: 'John',
        family_name: 'Doe',
        picture: 'https://example.com/photo.jpg',
        verified_email: true,
      };

      const session = createSessionFromGoogle(tokenResponse, profileResponse);
      expect(session.accessToken).toBe('ya29.abc123');
      expect(session.profile.name).toBe('John Doe');
      expect(session.profile.verified).toBe(true);
      expect(session.scope).toEqual(['email', 'profile']);
    });

    it('calculates session expiry correctly', () => {
      const now = new Date();
      const expiry = calculateSessionExpiry(3600); // 1 hour
      const diffMs = expiry.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      expect(diffHours).toBeCloseTo(1, 1);
    });
  });

  describe('UI States', () => {
    const getButtonState = (oauthState: string, isOnline: boolean) => {
      if (!isOnline) {
        return {
          text: 'No Internet Connection',
          disabled: true,
          icon: 'wifi-off',
          variant: 'disabled',
        };
      }

      const states = {
        idle: {
          text: 'Sign in with Google',
          disabled: false,
          icon: 'google',
          variant: 'google',
        },
        redirecting: {
          text: 'Redirecting to Google...',
          disabled: true,
          icon: 'loader',
          variant: 'loading',
        },
        authenticating: {
          text: 'Authenticating...',
          disabled: true,
          icon: 'loader',
          variant: 'loading',
        },
        success: {
          text: 'Success!',
          disabled: true,
          icon: 'check',
          variant: 'success',
        },
        error: {
          text: 'Try Again',
          disabled: false,
          icon: 'refresh',
          variant: 'error',
        },
        cancelled: {
          text: 'Sign in with Google',
          disabled: false,
          icon: 'google',
          variant: 'google',
        },
      };

      return states[oauthState as keyof typeof states] || states.idle;
    };

    it('shows correct button state', () => {
      expect(getButtonState('idle', true).text).toBe('Sign in with Google');
      expect(getButtonState('redirecting', true).text).toBe('Redirecting to Google...');
      expect(getButtonState('success', true).icon).toBe('check');
    });

    it('disables button when offline', () => {
      const offline = getButtonState('idle', false);
      expect(offline.text).toBe('No Internet Connection');
      expect(offline.disabled).toBe(true);
      expect(offline.icon).toBe('wifi-off');
    });
  });
});