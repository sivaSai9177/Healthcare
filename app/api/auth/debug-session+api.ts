import { auth } from "@/lib/auth/auth-server";

export async function GET(request: Request) {
  try {
    // Get session using Better Auth
    const session = await auth.api.getSession({
      headers: request.headers
    });
    
    // Get cookies for debugging
    const cookieHeader = request.headers.get('cookie') || '';
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      if (key) acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
    
    // Get auth-related cookies
    const authCookies = Object.keys(cookies)
      .filter(key => key.includes('auth'))
      .reduce((acc, key) => {
        acc[key] = cookies[key];
        return acc;
      }, {} as Record<string, string>);
    
    return new Response(JSON.stringify({
      hasSession: !!session,
      session: session ? {
        userId: session.user?.id,
        userEmail: session.user?.email,
        userRole: (session.user as any)?.role,
        needsProfileCompletion: (session.user as any)?.needsProfileCompletion,
        sessionId: session.session?.id,
        expiresAt: session.session?.expiresAt,
      } : null,
      cookies: {
        all: Object.keys(cookies),
        authRelated: authCookies,
        hasSessionToken: !!cookies['better-auth.session_token'],
        hasRefreshToken: !!cookies['better-auth.refresh_token'],
      },
      timestamp: new Date().toISOString(),
    }, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Failed to get session',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, null, 2), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

export const OPTIONS = GET;