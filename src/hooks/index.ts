import { ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
export { useProducts } from './useProducts';

/**
 * Custom hook for managing API queries
 * Provides centralized access to React Query client
 */
export function useApi() {
  const queryClient = useQueryClient();

  return {
    queryClient,
    invalidateQueries: (queryKey: string[]) => {
      queryClient.invalidateQueries({ queryKey });
    },
    prefetchQuery: async (queryKey: string[]) => {
      // This will be implemented when we have actual queries
    },
  };
}

/**
 * Custom hook for common document meta tags
 */
export function useDocumentTitle(title: string) {
  React.useEffect(() => {
    document.title = title;
  }, [title]);
}

// Import React for useEffect
import React from 'react';

export interface UseAsyncState<T> {
  status: 'idle' | 'pending' | 'success' | 'error';
  data: T | null;
  error: Error | null;
}

/**
 * Custom hook for async operations with loading and error states
 */
export function useAsync<T>(
  fn: () => Promise<T>,
  deps: React.DependencyList = [],
): UseAsyncState<T> {
  const [state, setState] = React.useState<UseAsyncState<T>>({
    status: 'idle',
    data: null,
    error: null,
  });

  React.useEffect(() => {
    let isMounted = true;

    const run = async () => {
      setState({ status: 'pending', data: null, error: null });
      try {
        const result = await fn();
        if (isMounted) {
          setState({ status: 'success', data: result, error: null });
        }
      } catch (error) {
        if (isMounted) {
          setState({
            status: 'error',
            data: null,
            error: error instanceof Error ? error : new Error('Unknown error'),
          });
        }
      }
    };

    run();

    return () => {
      isMounted = false;
    };
  }, deps);

  return state;
}
