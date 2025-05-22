
import { useRef, useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';

/**
 * Hook for managing retry attempts during flight initialization
 */
export function useFlightRetry() {
  const retryCount = useRef<number>(0);
  const maxRetries = 5;
  const retryTimeoutRef = useRef<number | null>(null);

  const resetRetryCount = useCallback(() => {
    retryCount.current = 0;
  }, []);

  const clearRetryTimeout = useCallback(() => {
    if (retryTimeoutRef.current !== null) {
      window.clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  const handleRetry = useCallback((
    callback: () => void,
    errorMessage: string = "Navigation initialization failed"
  ) => {
    // Retry logic with exponential backoff
    if (retryCount.current < maxRetries) {
      retryCount.current++;
      const delay = 500 * Math.pow(1.5, retryCount.current - 1); // Exponential backoff
      
      toast({
        title: "Initializing navigation",
        description: `Preparing flight (attempt ${retryCount.current})...`,
        duration: 2000
      });
      
      // Set a retry timer
      retryTimeoutRef.current = window.setTimeout(() => {
        retryTimeoutRef.current = null;
        callback();
      }, delay);
      
      return true;
    } else {
      console.error("Camera still not initialized after multiple retries, cannot navigate");
      toast({
        title: "Navigation Error",
        description: errorMessage,
        variant: "destructive"
      });
      return false;
    }
  }, []);

  return {
    retryCount,
    maxRetries,
    retryTimeoutRef,
    resetRetryCount,
    clearRetryTimeout,
    handleRetry
  };
}
