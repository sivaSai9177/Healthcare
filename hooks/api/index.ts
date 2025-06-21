// Central export for all API hooks
export * from './useApiQuery';
export * from './useApiMutation';
export * from './useApiSubscription';

// Re-export commonly used hooks with shorter names
export { useApiQuery as useQuery } from './useApiQuery';
export { useApiMutation as useMutation } from './useApiMutation';
export { useApiSubscription as useSubscription } from './useApiSubscription';