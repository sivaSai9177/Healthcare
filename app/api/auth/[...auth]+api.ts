import { auth } from "@/lib/auth";

// Simple Better Auth handler with proper CORS
async function handler(request: Request) {
  const origin = request.headers.get('origin');
  
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cookie, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
  };

  // Handle preflight OPTIONS request
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Log incoming request
    console.log('[AUTH API] Request:', request.method, request.url);
    console.log('[AUTH API] Origin:', origin);
    
    // Parse URL to check the path
    const url = new URL(request.url);
    console.log('[AUTH API] Path:', url.pathname);
    console.log('[AUTH API] Search params:', url.searchParams.toString());
    
    // Log auth configuration
    console.log('[AUTH API] Social providers configured:', Object.keys(auth.options?.socialProviders || {}));
    
    // Call Better Auth handler
    const response = await auth.handler(request);
    
    // Log response details
    console.log('[AUTH API] Response status:', response.status);
    console.log('[AUTH API] Response headers:', Object.fromEntries(response.headers.entries()));
    
    // If it's an error response, log the body
    if (response.status >= 400) {
      const responseClone = response.clone();
      try {
        const errorBody = await responseClone.text();
        console.log('[AUTH API] Error response body:', errorBody);
      } catch (e) {
        console.log('[AUTH API] Could not read error body');
      }
    }
    
    // Add CORS headers to response
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    console.error('[AUTH API] Error:', error);
    console.error('[AUTH API] Error stack:', error.stack);
    console.error('[AUTH API] Request URL:', request.url);
    console.error('[AUTH API] Request method:', request.method);
    
    // Return more detailed error in development
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? error.message || 'Internal Server Error'
      : 'Internal Server Error';
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }), 
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

export { handler as GET, handler as POST, handler as PUT, handler as DELETE, handler as OPTIONS };