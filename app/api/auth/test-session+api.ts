import { auth } from "@/lib/auth";

async function handler(request: Request) {
  const origin = request.headers.get('origin');
  
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cookie, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
  };

  try {
    // Try to get session from Better Auth
    const session = await auth.api.getSession({ headers: request.headers });
    
    console.log("[TEST SESSION API] Session found:", session);
    
    return new Response(
      JSON.stringify({ 
        session: session,
        cookies: request.headers.get('cookie'),
        authorization: request.headers.get('authorization'),
      }), 
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('[TEST SESSION API] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to get session' }), 
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

export { handler as GET };