import { auth } from "@/lib/auth/auth-server";
import { logger } from '@/lib/core/debug/server-logger';

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
    const url = new URL(request.url);
    logger.auth.debug('Auth request received', {
      url: request.url,
      method: request.method,
      pathname: url.pathname
    });
    
    // Log sign-out attempts specifically
    if (url.pathname.includes('sign-out')) {
      logger.auth.warn('Sign-out request detected', {
        method: request.method,
        contentType: request.headers.get('content-type'),
        contentLength: request.headers.get('content-length'),
        origin: request.headers.get('origin'),
        referer: request.headers.get('referer')
      });
      
      // Try to safely log the body for sign-out
      if (request.method === 'POST' && request.headers.get('content-length') !== '0') {
        try {
          const clonedRequest = request.clone();
          const bodyText = await clonedRequest.text();
          logger.auth.warn('Sign-out request body', {
            bodyText,
            bodyLength: bodyText.length,
            bodyPreview: bodyText.substring(0, 100),
            isObjectString: bodyText === '[object Object]',
            startsWithBrace: bodyText.startsWith('{'),
            endsWithBrace: bodyText.endsWith('}')
          });
          
          // If the body is literally "[object Object]", this means something tried to stringify an object
          if (bodyText === '[object Object]') {
            logger.auth.error('CRITICAL: Sign-out request has invalid body "[object Object]"', {
              hint: 'An object was passed where a string was expected',
              userAgent: request.headers.get('user-agent'),
              referer: request.headers.get('referer')
            });
            
            // Return early with a proper error
            return new Response(
              JSON.stringify({ 
                error: 'Invalid request body',
                details: 'Request body contains invalid JSON'
              }), 
              {
                status: 400,
                headers: {
                  ...corsHeaders,
                  'Content-Type': 'application/json',
                },
              }
            );
          }
        } catch (bodyError) {
          logger.auth.error('Failed to read sign-out request body', {
            error: bodyError.message
          });
        }
      }
    }
    
    // Check if auth handler exists
    if (!auth || typeof auth.handler !== 'function') {
      logger.auth.error('auth.handler is not a function', {
        authExists: !!auth,
        handlerType: typeof auth?.handler
      });
      return new Response(
        JSON.stringify({ error: 'Auth handler not properly initialized' }), 
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
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
                  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
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
                  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
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
    logger.auth.debug('Calling auth.handler...', {
      method: request.method,
      pathname: url.pathname,
      hasHandler: !!auth.handler,
      authKeys: Object.keys(auth || {})
    });
    
    let response: Response;
    try {
      response = await auth.handler(request);
    } catch (handlerError: any) {
      logger.auth.error('Better Auth handler threw error', {
        error: handlerError.message || handlerError,
        stack: handlerError.stack,
        pathname: url.pathname
      });
      
      // If it's a JSON parse error, log more details
      if (handlerError.message?.includes('is not valid JSON')) {
        logger.auth.error('JSON parse error details', {
          errorString: handlerError.toString(),
          errorMessage: handlerError.message,
          method: request.method,
          contentType: request.headers.get('content-type')
        });
      }
      
      throw handlerError;
    }
    
    logger.auth.debug('Response from auth.handler', { 
      status: response.status,
      headers: Object.fromEntries(response.headers.entries())
    });
    
    // Log errors for debugging
    if (response.status >= 400) {
      const responseText = await response.clone().text();
      logger.auth.error('Auth handler returned error', {
        status: response.status,
        statusText: response.statusText,
        body: responseText
      });
    }
    
    // Add CORS headers to response
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    logger.auth.error('Auth API error', error);
    
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