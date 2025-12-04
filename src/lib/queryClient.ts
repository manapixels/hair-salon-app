import { QueryClient, QueryClientConfig } from '@tanstack/react-query';

/**
 * Tiered cache configuration based on data volatility
 */
export const CACHE_CONFIG = {
  // Static data: rarely changes, persist to IndexedDB
  STATIC: {
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days
    retry: 3,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  },

  // Dynamic data: changes frequently, short TTL
  DYNAMIC: {
    staleTime: 0, // Always revalidate
    gcTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  },

  // User-specific: moderate cache, explicit invalidation
  USER: {
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  },
} as const;

/**
 * Default query client configuration
 */
const queryClientConfig: QueryClientConfig = {
  defaultOptions: {
    queries: {
      // Default to user-tier caching (most queries)
      staleTime: CACHE_CONFIG.USER.staleTime,
      gcTime: CACHE_CONFIG.USER.gcTime,
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false, // Prevent aggressive refetching
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
      // Global error handler for mutations
      onError: (error: any) => {
        console.error('[Mutation Error]:', error);
      },
    },
  },
};

let browserQueryClient: QueryClient | undefined;

/**
 * Get or create QueryClient for browser
 * Singleton pattern to prevent multiple instances
 */
export function getQueryClient(): QueryClient {
  if (typeof window === 'undefined') {
    // Server: always create new client
    return new QueryClient(queryClientConfig);
  }

  // Browser: reuse existing client
  if (!browserQueryClient) {
    browserQueryClient = new QueryClient(queryClientConfig);
  }

  return browserQueryClient;
}
