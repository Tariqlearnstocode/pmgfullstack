import { useState, useCallback } from 'react';
import * as api from '../lib/api';

interface UseApiOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

/**
 * A custom hook for handling API calls with loading state and error handling
 */
export function useApi<T>(options: UseApiOptions<T> = {}) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(
    async <U>(apiCall: () => Promise<U>): Promise<U | null> => {
      setIsLoading(true);
      setError(null);
      
      try {
        const result = await apiCall();
        setData(result as unknown as T);
        options.onSuccess?.(result as unknown as T);
        setIsLoading(false);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        options.onError?.(error);
        setIsLoading(false);
        return null;
      }
    },
    [options]
  );

  return {
    data,
    isLoading,
    error,
    execute,
    setData,
    // Export all services for easy access
    ...api
  };
}
