import { auth } from "@/lib/auth";

export async function GET() {
  // Get all available routes from Better Auth
  const routes = Object.keys(auth.api || {}).map(key => ({
    method: key,
    path: (auth.api as any)[key]?.path || "no path",
    endpoints: Object.keys((auth.api as any)[key] || {})
  }));

  return new Response(JSON.stringify({
    message: "Better Auth Debug Info",
    baseURL: auth.options?.baseURL || "not set",
    socialProviders: Object.keys(auth.options?.socialProviders || {}),
    routes: routes,
    signInSocialPath: auth.api?.signInSocial?.path,
    callbackOAuthPath: auth.api?.callbackOAuth?.path,
    authObject: Object.keys(auth),
    authApi: auth.api ? Object.keys(auth.api) : []
  }, null, 2), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}