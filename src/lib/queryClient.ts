import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { GitHubApiError } from "./github/errors";
import { clearAuth } from "./storage/auth";

export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (failureCount >= 2) {
    return false;
  }

  if (error instanceof GitHubApiError) {
    // Never retry client errors or rate limits
    if (
      error.status === 401 ||
      error.status === 404 ||
      error.status === 422 ||
      error.isRateLimit ||
      error.status === 403 ||
      error.status === 429
    ) {
      return false;
    }

    // Retry 5xx server errors
    if (error.status >= 500) {
      return true;
    }

    return false;
  }

  // Network errors can be retried
  return true;
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      if (error instanceof GitHubApiError && error.status === 401) {
        clearAuth();
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      if (error instanceof GitHubApiError && error.status === 401) {
        clearAuth();
      }
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes default
      refetchOnWindowFocus: false, // Prevents popup refetch storms
      retry: (failureCount, error) => shouldRetryQuery(failureCount, error),
    },
    mutations: {
      retry: false, // Never automatically retry mutations
    },
  },
});
