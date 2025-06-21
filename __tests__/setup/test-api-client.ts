import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { createAuthClient } from 'better-auth/client';
import superjson from 'superjson';
import type { AppRouter } from '@/src/server/routers';
import { testConfig } from './test-env';
import WebSocket from 'ws';

// Create test auth client
export const testAuthClient = createAuthClient({
  baseURL: testConfig.api.baseUrl,
  // Disable secure cookies for testing
  fetchOptions: {
    credentials: 'include',
    headers: {
      'X-Test-Mode': 'true',
    },
  },
});

// Store for test sessions
export const testSessions = new Map<string, { token: string; userId: string }>();

// Create test tRPC client
export function createTestTRPCClient(authToken?: string) {
  return createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `${testConfig.api.baseUrl}/api/trpc`,
        headers: () => ({
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          'X-Test-Mode': 'true',
        }),
        transformer: superjson,
      }),
    ],
  });
}

// Helper to create authenticated client
export async function createAuthenticatedClient(credentials: {
  email: string;
  password: string;
}) {
  // Sign in first
  const signInResponse = await testAuthClient.signIn.email({
    email: credentials.email,
    password: credentials.password,
  });

  if (!signInResponse.data?.session?.token) {
    throw new Error('Failed to authenticate test user');
  }

  const token = signInResponse.data.session.token;
  const userId = signInResponse.data.user.id;

  // Store session
  testSessions.set(credentials.email, { token, userId });

  // Return authenticated client
  return {
    client: createTestTRPCClient(token),
    session: signInResponse.data.session,
    user: signInResponse.data.user,
    token,
  };
}

// Helper to sign out test user
export async function signOutTestUser(email: string) {
  const session = testSessions.get(email);
  if (!session) return;

  try {
    await testAuthClient.signOut({
      fetchOptions: {
        headers: {
          Authorization: `Bearer ${session.token}`,
        },
      },
    });
  } catch (error) {
    // Ignore errors during cleanup
  }

  testSessions.delete(email);
}

// Helper to clean up all test sessions
export async function cleanupTestSessions() {
  for (const [email] of testSessions) {
    await signOutTestUser(email);
  }
}

// WebSocket test client
export function createTestWebSocketClient(authToken: string) {
  const ws = new WebSocket(`${process.env.WEBSOCKET_URL || 'ws://localhost:3002'}`);
  
  return new Promise<{
    ws: WebSocket;
    send: (data: any) => void;
    close: () => void;
    waitForMessage: (predicate?: (msg: any) => boolean) => Promise<any>;
  }>((resolve, reject) => {
    const messageQueue: any[] = [];
    const waiters: {
      predicate?: (msg: any) => boolean;
      resolve: (msg: any) => void;
    }[] = [];

    ws.onopen = () => {
      // Authenticate WebSocket
      ws.send(JSON.stringify({
        type: 'auth',
        token: authToken,
      }));

      resolve({
        ws,
        send: (data: any) => {
          ws.send(JSON.stringify(data));
        },
        close: () => {
          ws.close();
        },
        waitForMessage: (predicate?: (msg: any) => boolean) => {
          return new Promise((resolve) => {
            // Check existing messages
            const existing = messageQueue.find(msg => !predicate || predicate(msg));
            if (existing) {
              resolve(existing);
              return;
            }

            // Wait for new message
            waiters.push({ predicate, resolve });
          });
        },
      });
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        messageQueue.push(message);

        // Check waiters
        const waiterIndex = waiters.findIndex(w => !w.predicate || w.predicate(message));
        if (waiterIndex !== -1) {
          const waiter = waiters[waiterIndex];
          waiters.splice(waiterIndex, 1);
          waiter.resolve(message);
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      reject(error);
    };

    ws.onclose = () => {
      // Clean up waiters
      waiters.forEach(w => w.resolve(null));
      waiters.length = 0;
    };
  });
}

// Rate limit bypass for tests
export function bypassRateLimit(request: Request) {
  request.headers.set('X-Test-Mode', 'true');
  request.headers.set('X-Bypass-Rate-Limit', 'true');
  return request;
}

// Mock email service for tests
export const mockEmailService = {
  sentEmails: [] as {
    to: string;
    subject: string;
    html: string;
    text?: string;
  }[],
  
  clear() {
    this.sentEmails = [];
  },
  
  getLastEmail(to?: string) {
    if (to) {
      return this.sentEmails.filter(e => e.to === to).pop();
    }
    return this.sentEmails[this.sentEmails.length - 1];
  },
  
  getVerificationLink(email: string) {
    const lastEmail = this.getLastEmail(email);
    if (!lastEmail) return null;
    
    const match = lastEmail.html.match(/href="([^"]*verify[^"]*)"/);
    return match ? match[1] : null;
  },
  
  getResetLink(email: string) {
    const lastEmail = this.getLastEmail(email);
    if (!lastEmail) return null;
    
    const match = lastEmail.html.match(/href="([^"]*reset[^"]*)"/);
    return match ? match[1] : null;
  },
};