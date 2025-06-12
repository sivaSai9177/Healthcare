/**
 * API Layer Exports
 */

export { api } from './trpc';
export { getApiUrl } from './api-resolver';

// Re-export tRPC types
export type { AppRouter } from '@/src/server/routers';