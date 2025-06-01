export async function GET(request: Request) {
  const url = new URL(request.url);
  const platform = url.searchParams.get('platform') || 'unknown';
  
  // This helps us see what redirect URI should be configured
  const response = {
    platform,
    expectedRedirectUris: [
      'expostarter://auth/google',  // For Expo Go
      'com.anonymous.expostarter://auth/google', // For standalone builds
      'exp://192.168.1.104:8081/--/auth/google', // Development server
      'http://localhost:8081/api/auth/callback/google', // Web
    ],
    instructions: {
      step1: 'Go to Google Cloud Console: https://console.cloud.google.com/',
      step2: 'Navigate to APIs & Services → Credentials',
      step3: 'Click your OAuth 2.0 Client ID',
      step4: 'Add ALL of the above redirect URIs to "Authorized redirect URIs"',
      step5: 'Save changes and wait 5-10 minutes for propagation',
    },
    currentClientId: process.env.GOOGLE_CLIENT_ID,
  };

  return Response.json(response, { status: 200 });
}