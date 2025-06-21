import { describe, it, expect } from '@jest/globals';
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@/src/server/routers';

describe('API Connection Test', () => {
  it('should connect to the API server', async () => {
    const client = createTRPCClient<AppRouter>({
      links: [
        httpBatchLink({
          url: 'http://localhost:8081/api/trpc',
        }),
      ],
    });

    // Try to call a public endpoint
    try {
      // This will fail with auth error but confirms the server is running
      await client.auth.getSession.query();
    } catch (error: any) {
      expect(error.message).toContain('UNAUTHORIZED');
      console.log('Server is running and responding with expected auth error');
    }
  });

  it('should check API health endpoint', async () => {
    const response = await fetch('http://localhost:8081/api/health');
    const data = await response.json();

    expect(response.ok).toBe(true);
    expect(data.status).toBe('ok');
    expect(data.environment).toBeDefined();
    console.log('API Health:', data);
  });
});