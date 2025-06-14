/**
 * Debug endpoint to check OAuth callback
 */

export async function GET(request: Request) {
  const url = new URL(request.url);
  const params = Object.fromEntries(url.searchParams);
  const cookies = request.headers.get('cookie') || '';
  
  return new Response(JSON.stringify({
    message: 'OAuth callback debug',
    url: request.url,
    params,
    cookies: cookies.split(';').map(c => c.trim()),
    hasAuthCookie: cookies.includes('better-auth.session_token'),
    headers: {
      'user-agent': request.headers.get('user-agent'),
      'referer': request.headers.get('referer'),
      'origin': request.headers.get('origin'),
    },
    timestamp: new Date().toISOString(),
  }, null, 2), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}