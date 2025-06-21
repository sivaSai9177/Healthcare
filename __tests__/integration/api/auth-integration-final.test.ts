import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@/src/server/routers';
import type { AuthResponse, SessionResponse } from '@/lib/validations/server';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/src/db/schema';
import { sql } from 'drizzle-orm';

describe('Auth Integration Test - Real API', () => {
  const API_URL = 'http://localhost:8081';
  const testEmail = `test.user.${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!@#';
  
  let authToken: string | undefined;
  let userId: string | undefined;
  
  // Direct database connection for cleanup - using local environment settings
  const dbUrl = 'postgresql://myexpo:myexpo123@localhost:5432/myexpo_dev';
  const pgClient = postgres(dbUrl, { max: 1 });
  const db = drizzle(pgClient, { schema });

  afterAll(async () => {
    // Clean up test user from database
    if (userId) {
      console.log('Cleaning up test user:', userId);
      await db.delete(schema.user).where(sql`${schema.user.id} = ${userId}`);
    }
    await pgClient.end();
  });

  it('should register a new user via tRPC', async () => {
    const client = createTRPCClient<AppRouter>({
      links: [
        httpBatchLink({
          url: `${API_URL}/api/trpc`,
        }),
      ],
    });

    console.log('Testing registration for:', testEmail);
    
    try {
      const registerResult: AuthResponse = await client.auth.signUp.mutate({
        email: testEmail,
        password: testPassword,
        name: 'Integration Test User',
        role: 'user', // Default role
        acceptTerms: true,
        acceptPrivacy: true,
      });
      
      console.log('Registration successful:', {
        success: registerResult.success,
        userId: registerResult.user?.id,
        userEmail: registerResult.user?.email,
        userRole: registerResult.user?.role,
        hasToken: !!registerResult.token,
      });
      
      expect(registerResult.success).toBe(true);
      expect(registerResult.user).toBeDefined();
      expect(registerResult.user.email).toBe(testEmail);
      expect(registerResult.user.role).toBe('user');
      expect(registerResult.token).toBeDefined();
      
      userId = registerResult.user.id;
      authToken = registerResult.token;
    } catch (error: any) {
      console.error('Registration failed:', {
        message: error.message,
        data: error.data,
      });
      throw error;
    }
  });

  it('should sign in with the registered user', async () => {
    const client = createTRPCClient<AppRouter>({
      links: [
        httpBatchLink({
          url: `${API_URL}/api/trpc`,
        }),
      ],
    });

    console.log('Testing sign in for:', testEmail);
    
    try {
      const signInResult: AuthResponse = await client.auth.signIn.mutate({
        email: testEmail,
        password: testPassword,
      });
      
      console.log('Sign in successful:', {
        success: signInResult.success,
        userId: signInResult.user?.id,
        userEmail: signInResult.user?.email,
        hasToken: !!signInResult.token,
      });
      
      expect(signInResult.success).toBe(true);
      expect(signInResult.user).toBeDefined();
      expect(signInResult.user.email).toBe(testEmail);
      expect(signInResult.token).toBeDefined();
      
      authToken = signInResult.token;
    } catch (error: any) {
      console.error('Sign in failed:', {
        message: error.message,
        data: error.data,
      });
      throw error;
    }
  });

  it('should access protected endpoint with auth token', async () => {
    expect(authToken).toBeDefined();
    
    const authenticatedClient = createTRPCClient<AppRouter>({
      links: [
        httpBatchLink({
          url: `${API_URL}/api/trpc`,
          headers: () => ({
            Authorization: `Bearer ${authToken}`,
          }),
        }),
      ],
    });

    console.log('Testing protected endpoint access');
    
    try {
      const session: SessionResponse | null = await authenticatedClient.auth.getSession.query();
      
      console.log('Session retrieved successfully:', {
        hasSession: !!session,
        userId: session?.user?.id,
        userEmail: session?.user?.email,
        sessionId: session?.session?.id,
      });
      
      expect(session).toBeDefined();
      expect(session?.user).toBeDefined();
      expect(session?.user.email).toBe(testEmail);
      expect(session?.session).toBeDefined();
    } catch (error: any) {
      console.error('Protected endpoint access failed:', {
        message: error.message,
        data: error.data,
      });
      throw error;
    }
  });

  it('should reject invalid credentials', async () => {
    const client = createTRPCClient<AppRouter>({
      links: [
        httpBatchLink({
          url: `${API_URL}/api/trpc`,
        }),
      ],
    });

    console.log('Testing invalid credentials');
    
    try {
      await client.auth.signIn.mutate({
        email: testEmail,
        password: 'WrongPassword123!@#',
      });
      
      // Should not reach here
      expect(true).toBe(false);
    } catch (error: any) {
      console.log('Invalid credentials correctly rejected');
      expect(error.message).toContain('Invalid email or password');
    }
  });

  it('should reject registration with existing email', async () => {
    const client = createTRPCClient<AppRouter>({
      links: [
        httpBatchLink({
          url: `${API_URL}/api/trpc`,
        }),
      ],
    });

    console.log('Testing duplicate email registration');
    
    try {
      await client.auth.signUp.mutate({
        email: testEmail,
        password: testPassword,
        name: 'Duplicate User',
        role: 'user',
        acceptTerms: true,
        acceptPrivacy: true,
      });
      
      // Should not reach here
      expect(true).toBe(false);
    } catch (error: any) {
      console.log('Duplicate email correctly rejected');
      expect(error.message).toBeDefined();
    }
  });
});