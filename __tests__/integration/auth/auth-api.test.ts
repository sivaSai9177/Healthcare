import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { 
  setupTestDatabase, 
  cleanupTestDatabase, 
  closeTestDatabase,
  seedTestDatabase,
  createTestUser,
} from '../../setup/test-db';
import { 
  testAuthClient, 
  createTestTRPCClient,
  createAuthenticatedClient,
  cleanupTestSessions,
  mockEmailService,
} from '../../setup/test-api-client';
import { testConfig } from '../../setup/test-env';

describe('Auth API Integration Tests', () => {
  let testOrgData: any;
  let trpcClient: ReturnType<typeof createTestTRPCClient>;

  beforeAll(async () => {
    // Setup test database
    await setupTestDatabase();
    testOrgData = await seedTestDatabase();
    trpcClient = createTestTRPCClient();
  });

  afterAll(async () => {
    await cleanupTestSessions();
    await closeTestDatabase();
  });

  beforeEach(async () => {
    // Clear email mock
    mockEmailService.clear();
  });

  afterEach(async () => {
    // Clean up test data
    await cleanupTestDatabase();
    // Reseed for next test
    testOrgData = await seedTestDatabase();
  });

  describe('User Registration Flow', () => {
    it('should register new user with email/password', async () => {
      const testUser = {
        email: 'newuser@test.com',
        password: 'SecurePass123!',
        name: 'New Test User',
      };

      // Register user
      const response = await testAuthClient.signUp.email({
        email: testUser.email,
        password: testUser.password,
        name: testUser.name,
      });

      expect(response.data).toBeDefined();
      expect(response.data?.user).toMatchObject({
        email: testUser.email,
        name: testUser.name,
        emailVerified: false,
      });

      // Check verification email was sent
      const verificationEmail = mockEmailService.getLastEmail(testUser.email);
      expect(verificationEmail).toBeDefined();
      expect(verificationEmail?.subject).toContain('Verify');
    });

    it('should validate registration input', async () => {
      // Test invalid email
      await expect(
        testAuthClient.signUp.email({
          email: 'invalid-email',
          password: 'SecurePass123!',
          name: 'Test User',
        })
      ).rejects.toThrow();

      // Test weak password
      await expect(
        testAuthClient.signUp.email({
          email: 'test@example.com',
          password: '123',
          name: 'Test User',
        })
      ).rejects.toThrow();

      // Test missing name
      await expect(
        testAuthClient.signUp.email({
          email: 'test@example.com',
          password: 'SecurePass123!',
          name: '',
        })
      ).rejects.toThrow();
    });

    it('should prevent duplicate email registration', async () => {
      const testUser = {
        email: 'duplicate@test.com',
        password: 'SecurePass123!',
        name: 'Test User',
      };

      // First registration should succeed
      await testAuthClient.signUp.email(testUser);

      // Second registration should fail
      await expect(
        testAuthClient.signUp.email(testUser)
      ).rejects.toThrow();
    });
  });

  describe('Email Verification Flow', () => {
    it('should verify email with valid token', async () => {
      // Register user
      const testUser = {
        email: 'verify@test.com',
        password: 'SecurePass123!',
        name: 'Verify Test',
      };

      await testAuthClient.signUp.email(testUser);

      // Get verification link from email
      const verificationLink = mockEmailService.getVerificationLink(testUser.email);
      expect(verificationLink).toBeDefined();

      // Extract token from link
      const token = new URL(verificationLink!).searchParams.get('token');
      expect(token).toBeDefined();

      // Verify email
      const verifyResponse = await testAuthClient.verifyEmail({
        token: token!,
      });

      expect(verifyResponse.data).toBeDefined();
      expect(verifyResponse.data?.user.emailVerified).toBe(true);
    });

    it('should reject invalid verification token', async () => {
      await expect(
        testAuthClient.verifyEmail({
          token: 'invalid-token',
        })
      ).rejects.toThrow();
    });
  });

  describe('Login Flow', () => {
    let testUser: any;

    beforeEach(async () => {
      // Create verified test user
      testUser = await createTestUser({
        email: 'login@test.com',
        name: 'Login Test',
        role: 'operator',
        organizationId: testOrgData.organization.id,
        hospitalId: testOrgData.hospital.id,
      });
    });

    it('should login with valid credentials', async () => {
      const response = await testAuthClient.signIn.email({
        email: testUser.user.email,
        password: 'Test123!@#', // Default test password
      });

      expect(response.data).toBeDefined();
      expect(response.data?.session).toBeDefined();
      expect(response.data?.session.token).toBeDefined();
      expect(response.data?.user).toMatchObject({
        id: testUser.user.id,
        email: testUser.user.email,
      });
    });

    it('should reject invalid password', async () => {
      await expect(
        testAuthClient.signIn.email({
          email: testUser.user.email,
          password: 'WrongPassword123!',
        })
      ).rejects.toThrow();
    });

    it('should reject non-existent user', async () => {
      await expect(
        testAuthClient.signIn.email({
          email: 'nonexistent@test.com',
          password: 'Test123!@#',
        })
      ).rejects.toThrow();
    });

    it('should handle rate limiting', async () => {
      // Make multiple failed login attempts
      const attempts = Array(6).fill(null).map(() => 
        testAuthClient.signIn.email({
          email: testUser.user.email,
          password: 'WrongPassword',
        }).catch(() => {})
      );

      await Promise.all(attempts);

      // Next attempt should be rate limited
      await expect(
        testAuthClient.signIn.email({
          email: testUser.user.email,
          password: 'Test123!@#',
        })
      ).rejects.toThrow(/rate limit|too many/i);
    });
  });

  describe('Password Reset Flow', () => {
    let testUser: any;

    beforeEach(async () => {
      testUser = await createTestUser({
        email: 'reset@test.com',
        name: 'Reset Test',
        role: 'viewer',
        organizationId: testOrgData.organization.id,
      });
    });

    it('should send password reset email', async () => {
      const response = await testAuthClient.forgetPassword({
        email: testUser.user.email,
      });

      expect(response.data).toBeDefined();

      // Check reset email was sent
      const resetEmail = mockEmailService.getLastEmail(testUser.user.email);
      expect(resetEmail).toBeDefined();
      expect(resetEmail?.subject).toContain('Reset');
    });

    it('should reset password with valid token', async () => {
      // Request reset
      await testAuthClient.forgetPassword({
        email: testUser.user.email,
      });

      // Get reset link
      const resetLink = mockEmailService.getResetLink(testUser.user.email);
      const token = new URL(resetLink!).searchParams.get('token');

      // Reset password
      const newPassword = 'NewSecurePass123!';
      const resetResponse = await testAuthClient.resetPassword({
        token: token!,
        newPassword,
      });

      expect(resetResponse.data).toBeDefined();

      // Login with new password
      const loginResponse = await testAuthClient.signIn.email({
        email: testUser.user.email,
        password: newPassword,
      });

      expect(loginResponse.data?.session).toBeDefined();
    });

    it('should reject invalid reset token', async () => {
      await expect(
        testAuthClient.resetPassword({
          token: 'invalid-token',
          newPassword: 'NewPassword123!',
        })
      ).rejects.toThrow();
    });
  });

  describe('Session Management', () => {
    let authData: any;

    beforeEach(async () => {
      authData = await createAuthenticatedClient({
        email: 'session@test.com',
        password: 'Test123!@#',
      });
    });

    it('should get current session', async () => {
      const session = await authData.client.auth.getSession.query();
      
      expect(session).toBeDefined();
      expect(session.id).toBe(authData.session.id);
      expect(session.userId).toBe(authData.user.id);
    });

    it('should list user sessions', async () => {
      // Create another session
      const secondAuth = await createAuthenticatedClient({
        email: authData.user.email,
        password: 'Test123!@#',
      });

      const sessions = await authData.client.auth.listSessions.query();
      
      expect(sessions).toHaveLength(2);
      expect(sessions.map((s: any) => s.id)).toContain(authData.session.id);
      expect(sessions.map((s: any) => s.id)).toContain(secondAuth.session.id);
    });

    it('should revoke specific session', async () => {
      // Create another session
      const secondAuth = await createAuthenticatedClient({
        email: authData.user.email,
        password: 'Test123!@#',
      });

      // Revoke second session
      await authData.client.auth.revokeSession.mutate({
        sessionId: secondAuth.session.id,
      });

      // Second session should no longer work
      await expect(
        secondAuth.client.auth.getSession.query()
      ).rejects.toThrow();

      // First session should still work
      const session = await authData.client.auth.getSession.query();
      expect(session).toBeDefined();
    });

    it('should sign out current session', async () => {
      await testAuthClient.signOut({
        fetchOptions: {
          headers: {
            Authorization: `Bearer ${authData.token}`,
          },
        },
      });

      // Session should no longer work
      await expect(
        authData.client.auth.getSession.query()
      ).rejects.toThrow();
    });
  });

  describe('OAuth Flow', () => {
    it('should initiate Google OAuth', async () => {
      const response = await testAuthClient.signIn.social({
        provider: 'google',
      });

      expect(response.data).toBeDefined();
      expect(response.data?.url).toContain('accounts.google.com');
      expect(response.data?.url).toContain('client_id');
    });

    it('should handle OAuth callback', async () => {
      // This would require mocking OAuth provider response
      // For now, we just test the error case
      await expect(
        testAuthClient.signIn.social({
          provider: 'google',
          callbackURL: '/auth/callback?error=access_denied',
        })
      ).rejects.toThrow();
    });
  });

  describe('Profile Management', () => {
    let authData: any;

    beforeEach(async () => {
      authData = await createAuthenticatedClient({
        email: 'profile@test.com',
        password: 'Test123!@#',
      });
    });

    it('should update user profile', async () => {
      const updates = {
        name: 'Updated Name',
        metadata: {
          bio: 'Test bio',
          avatar: 'https://example.com/avatar.jpg',
        },
      };

      const response = await authData.client.auth.updateProfile.mutate(updates);
      
      expect(response).toMatchObject({
        name: updates.name,
        metadata: expect.objectContaining(updates.metadata),
      });
    });

    it('should update email', async () => {
      const newEmail = 'newemail@test.com';
      
      const response = await authData.client.auth.updateEmail.mutate({
        newEmail,
        password: 'Test123!@#',
      });

      expect(response.user.email).toBe(newEmail);
      expect(response.user.emailVerified).toBe(false);

      // Check verification email was sent
      const verificationEmail = mockEmailService.getLastEmail(newEmail);
      expect(verificationEmail).toBeDefined();
    });

    it('should change password', async () => {
      const newPassword = 'NewSecurePass456!';
      
      await authData.client.auth.changePassword.mutate({
        currentPassword: 'Test123!@#',
        newPassword,
      });

      // Should be able to login with new password
      const loginResponse = await testAuthClient.signIn.email({
        email: authData.user.email,
        password: newPassword,
      });

      expect(loginResponse.data?.session).toBeDefined();
    });
  });

  describe('Security Features', () => {
    it('should enforce password complexity', async () => {
      const weakPasswords = [
        '123456',           // Too simple
        'password',         // No numbers
        'PASSWORD123',      // No lowercase
        'password123',      // No uppercase
        'Pass123',          // Too short
        'Password 123',     // Has space
      ];

      for (const password of weakPasswords) {
        await expect(
          testAuthClient.signUp.email({
            email: 'security@test.com',
            password,
            name: 'Security Test',
          })
        ).rejects.toThrow();
      }
    });

    it('should detect suspicious login attempts', async () => {
      const testUser = await createTestUser({
        email: 'suspicious@test.com',
        name: 'Suspicious Test',
        role: 'viewer',
        organizationId: testOrgData.organization.id,
      });

      // Normal login
      await testAuthClient.signIn.email({
        email: testUser.user.email,
        password: 'Test123!@#',
      });

      // Suspicious login (different IP/UA would trigger in production)
      // For tests, we simulate by checking security logs
      const securityLogs = await trpcClient.auth.getSecurityLogs.query({
        userId: testUser.user.id,
      });

      expect(securityLogs).toBeDefined();
      expect(securityLogs.some((log: any) => log.event === 'login')).toBe(true);
    });
  });
});