/**
 * Simple auth test endpoint for debugging
 */

export function GET() {
  return Response.json({
    status: 'ok',
    message: 'Auth API is accessible',
    endpoints: [
      '/api/auth/sign-up/email',
      '/api/auth/sign-in/email',
      '/api/auth/sign-out',
      '/api/auth/session',
      '/api/auth/forgot-password',
      '/api/auth/reset-password',
      '/api/auth/verify-email',
    ],
    timestamp: new Date().toISOString(),
  });
}