/**
 * API Layer Exports
 */

export { api } from './trpc';
export { getCurrentApiUrl as getApiUrl, resolveApiUrl, setApiUrl } from './api-resolver';

// Re-export tRPC types
export type { AppRouter } from '@/src/server/routers';