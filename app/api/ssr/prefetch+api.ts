import { prefetchHelpers, combineDehydratedStates } from '@/lib/api/ssr-utils';
import { log } from '@/lib/core/debug/logger';

// This API route handles SSR prefetching for different pages
export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const path = url.searchParams.get('path');
    const params = url.searchParams.get('params');
    
    log.debug('SSR prefetch request', 'SSR', { path, params });
    
    let dehydratedState;
    
    switch (path) {
      case '/':
      case '/index':
        // Prefetch user session for homepage
        dehydratedState = await prefetchHelpers.user();
        break;
        
      case '/dashboard':
      case '/operator-dashboard':
        // Prefetch user and organization data
        const userState = await prefetchHelpers.user();
        // If we have an org ID in params, prefetch that too
        if (params) {
          const { organizationId } = JSON.parse(params);
          if (organizationId) {
            const orgState = await prefetchHelpers.organization(organizationId);
            dehydratedState = combineDehydratedStates(userState, orgState);
          } else {
            dehydratedState = userState;
          }
        } else {
          dehydratedState = userState;
        }
        break;
        
      case '/healthcare':
      case '/healthcare/alerts':
        // Prefetch healthcare data
        if (params) {
          const { hospitalId } = JSON.parse(params);
          if (hospitalId) {
            dehydratedState = await prefetchHelpers.healthcare(hospitalId);
          }
        }
        break;
        
      default:
        // For unknown paths, just prefetch user
        dehydratedState = await prefetchHelpers.user();
    }
    
    return new Response(JSON.stringify({
      success: true,
      dehydratedState,
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    log.error('SSR prefetch error', 'SSR', error);
    return new Response(JSON.stringify({ 
        success: false, 
        error: 'Failed to prefetch data',
        details: error instanceof Error ? error.message : 'Unknown error'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
  }
}

// POST endpoint for custom prefetch queries
export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const { queries } = body;
    
    if (!Array.isArray(queries)) {
      return new Response(JSON.stringify(
        { success: false, error: 'Invalid queries format' }
      ), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // TODO: Implement custom query prefetching based on the queries array
    // This would require a more dynamic approach to handle arbitrary queries
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Custom prefetch not yet implemented',
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    log.error('SSR custom prefetch error', 'SSR', error);
    return new Response(JSON.stringify({ 
        success: false, 
        error: 'Failed to process custom prefetch'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
  }
}