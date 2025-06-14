// Test endpoint to debug OAuth callback
import { auth } from "@/lib/auth/auth-server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  
  console.log('[TEST_CALLBACK] OAuth callback test triggered', {
    url: request.url,
    searchParams: Object.fromEntries(url.searchParams),
    cookies: request.headers.get('cookie'),
    userAgent: request.headers.get('user-agent'),
    referer: request.headers.get('referer'),
    timestamp: new Date().toISOString()
  });
  
  // Try to process this as an OAuth callback
  try {
    const response = await auth.handler(request);
    console.log('[TEST_CALLBACK] Auth handler response:', {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
    });
    
    // Check if session was created
    const session = await auth.api.getSession({
      headers: request.headers
    });
    
    console.log('[TEST_CALLBACK] Session after auth handler:', {
      hasSession: !!session,
      sessionId: session?.session?.id,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
    });
    
    return new Response(JSON.stringify({
      message: 'OAuth callback test',
      authHandlerStatus: response.status,
      sessionCreated: !!session,
      session: session ? {
        userId: session.user?.id,
        userEmail: session.user?.email,
        sessionId: session.session?.id,
      } : null,
    }, null, 2), {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('[TEST_CALLBACK] Error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to process callback',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, null, 2), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}