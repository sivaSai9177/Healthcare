import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@/src/server/routers';
import { createContext } from '@/src/server/trpc';
import { initializeBackgroundServices } from '@/src/server/services/server-startup';
import { log } from '@/lib/core/debug/logger';

// Initialize background services on first load with proper singleton check
// Use global to persist across hot reloads in development
const globalForServices = global as unknown as {
  servicesInitialized: boolean;
};

if (!globalForServices.servicesInitialized) {
  initializeBackgroundServices();
  globalForServices.servicesInitialized = true;
  log.info('Background services initialized', 'API');
}

// Handle all tRPC requests with proper CORS
const handler = async (request: Request) => {
  const origin = request.headers.get('origin') || '*';
  
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cookie',
    'Access-Control-Allow-Credentials': 'true',
  };

  // Handle preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  const response = await fetchRequestHandler({
    endpoint: '/api/trpc',
    req: request,
    router: appRouter,
    createContext: () => createContext(request),
    onError: ({ error, path }) => {
      // Error logging handled by tRPC logger middleware
    },
  });

  // Add CORS headers to response
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
};

export { handler as GET, handler as POST, handler as OPTIONS };