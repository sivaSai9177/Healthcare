// Load environment variables for API routes
import 'dotenv/config';
import { auth } from "@/lib/auth/auth-server";
import { logger } from '@/lib/core/debug/unified-logger';

// Validate critical environment variables
if (!process.env.BETTER_AUTH_SECRET) {
  logger.error('BETTER_AUTH_SECRET is not set', 'AUTH');
}
if (!process.env.DATABASE_URL) {
  logger.error('DATABASE_URL is not set', 'AUTH');
}

// Simple Better Auth handler with proper CORS
async function handler(request: Request) {
  const origin = request.headers.get('origin') || '*';
  
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': origin,
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
    // Debug logging
    logger.api.request(request.method, new URL(request.url).pathname, {
      headers: Object.fromEntries(request.headers.entries()),
    });
    
    // Don't read request body - let Better Auth handle it
    // Reading the body consumes it and causes issues with Better Auth
    
    // Check if auth handler exists
    if (!auth || typeof auth.handler !== 'function') {
      logger.api.error('GET', '/api/auth', new Error('auth.handler is not a function'), undefined);
      logger.api.error('Auth initialization issue', {
        hasAuth: !!auth,
        authKeys: auth ? Object.keys(auth) : [],
        envVarsSet: {
          BETTER_AUTH_SECRET: !!process.env.BETTER_AUTH_SECRET,
          DATABASE_URL: !!process.env.DATABASE_URL,
          BETTER_AUTH_BASE_URL: !!process.env.BETTER_AUTH_BASE_URL,
        }
      });
      return new Response(
        JSON.stringify({ 
          error: 'Auth handler not properly initialized',
          details: process.env.NODE_ENV === 'development' ? {
            hasAuth: !!auth,
            envVarsSet: {
              BETTER_AUTH_SECRET: !!process.env.BETTER_AUTH_SECRET,
              DATABASE_URL: !!process.env.DATABASE_URL,
            }
          } : undefined
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
    
    // Parse URL to check the path
    const url = new URL(request.url);
    
    // Special handling for sign-out endpoint with OAuth sessions
    if (url.pathname.includes('/sign-out') && request.method === 'POST') {
      logger.auth.debug('Sign-out request detected');
      
      try {
        // For OAuth sessions, Better Auth v1.2.8 has a known issue with JSON parsing
        // We'll handle this gracefully
        const response = await auth.handler(request);
        
        // If we get a response, return it
        if (response) {
          logger.auth.debug('Sign-out response', {
            status: response.status,
            statusText: response.statusText
          });
          
          // Add CORS headers
          Object.entries(corsHeaders).forEach(([key, value]) => {
            response.headers.set(key, value);
          });
          
          return response;
        }
      } catch (error: any) {
        // Check if this is the known JSON parsing error with OAuth sessions
        if (error?.message?.includes('[object Object]') || 
            error?.message?.includes('is not valid JSON')) {
          logger.auth.debug('Known OAuth sign-out issue detected, returning success');
          
          // Return a successful response since the sign-out actually worked
          return new Response(
            JSON.stringify({ success: true }),
            {
              status: 200,
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json',
              },
            }
          );
        }
        
        // Re-throw other errors
        throw error;
      }
    }
    
    // Check if this is a mobile OAuth callback for Google
    const userAgent = request.headers.get('user-agent') || '';
    const referer = request.headers.get('referer') || '';
    const isMobileOAuth = url.pathname.includes('/callback/google') && 
                          (userAgent.includes('Expo') || userAgent.includes('okhttp') || 
                           userAgent.includes('Android') || userAgent.includes('iPhone') ||
                           referer.includes('auth.expo.io'));
    
    if (isMobileOAuth && request.method === 'GET') {
      // Handle mobile OAuth callback specially
      
      // Call Better Auth handler first to process the OAuth
      const authResponse = await auth.handler(request);
      
      if (authResponse.status >= 200 && authResponse.status < 400) {
        // OAuth was successful, return mobile-friendly response
        
        return new Response(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Login Successful</title>
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                  text-align: center;
                  padding: 40px 20px;
                  background: #f8f9fa;
                  margin: 0;
                }
                .container {
                  background: white;
                  border-radius: 12px;
                  padding: 40px 20px;
                  box-shadow: 0 4px 20px theme.mutedForeground + "10";
                  max-width: 400px;
                  margin: 0 auto;
                }
                h1 { color: #28a745; margin-bottom: 20px; font-size: 24px; }
                p { color: #666; margin-bottom: 20px; line-height: 1.5; }
                .success-icon { font-size: 48px; margin-bottom: 20px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="success-icon">✅</div>
                <h1>Login Successful!</h1>
                <p>You have been successfully signed in with Google.</p>
                <p>You can now close this browser and return to the app.</p>
              </div>
              <script>
                // Auto-close after 3 seconds
                setTimeout(() => {
                  window.close();
                  // Try to redirect to the app
                  window.location.href = 'my-expo://home';
                }, 3000);
              </script>
            </body>
          </html>
        `, {
          headers: { 
            ...corsHeaders,
            'Content-Type': 'text/html' 
          },
        });
      } else {
        // OAuth failed
        return new Response(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Login Failed</title>
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                  text-align: center;
                  padding: 40px 20px;
                  background: #f8f9fa;
                  margin: 0;
                }
                .container {
                  background: white;
                  border-radius: 12px;
                  padding: 40px 20px;
                  box-shadow: 0 4px 20px theme.mutedForeground + "10";
                  max-width: 400px;
                  margin: 0 auto;
                }
                h1 { color: #dc3545; margin-bottom: 20px; font-size: 24px; }
                p { color: #666; margin-bottom: 20px; line-height: 1.5; }
                .error-icon { font-size: 48px; margin-bottom: 20px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="error-icon">❌</div>
                <h1>Login Failed</h1>
                <p>There was an error during the sign-in process.</p>
                <p>Please try again.</p>
              </div>
              <script>
                setTimeout(() => {
                  window.close();
                }, 5000);
              </script>
            </body>
          </html>
        `, {
          headers: { 
            ...corsHeaders,
            'Content-Type': 'text/html' 
          },
          status: authResponse.status,
        });
      }
    }
    
    // Call Better Auth handler for normal requests
    logger.auth.debug('Request details', {
      method: request.method,
      pathname: url.pathname,
      isSignOut: url.pathname.includes('sign-out'),
      isOAuth: url.pathname.includes('callback') || url.pathname.includes('oauth'),
      headers: {
        cookie: request.headers.get('cookie'),
        authorization: request.headers.get('authorization'),
        origin: request.headers.get('origin'),
        referer: request.headers.get('referer'),
      }
    });
    
    const response = await auth.handler(request);
    logger.api.response(request.method, url.pathname, response.status);
    
    // Log response body for errors
    if (response.status >= 400) {
      const clonedResponse = response.clone();
      try {
        const responseBody = await clonedResponse.text();
        logger.api.error(request.method, url.pathname, responseBody);
        
        // Try to parse as JSON for better error details
        try {
          const errorJson = JSON.parse(responseBody);
          logger.api.error(request.method, url.pathname, errorJson);
        } catch {
          // Not JSON, that's ok
        }
      } catch (e) {
        logger.debug('Could not read error response body', 'API');
      }
    }
    
    // Response handled by Better Auth
    
    // Add CORS headers to response
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    logger.api.error(request.method, new URL(request.url).pathname, error);
    
    // Return more detailed error in development
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? (error as Error).message || 'Internal Server Error'
      : 'Internal Server Error';
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
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