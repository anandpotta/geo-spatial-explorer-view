
import { useRef, useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';
import { FlightControlRefs } from './types';

/**
 * Hook providing retry strategy for flight initialization
 */
export function useRetryStrategy(refs: FlightControlRefs) {
  const retryAttemptsRef = useRef<number>(0);
  
  const maybeRetry = useCallback((
    longitude: number, 
    latitude: number, 
    flyToFn: (lon: number, lat: number) => void,
    onComplete?: () => void
  ) => {
    console.warn("Camera or controls not ready yet, will retry in a moment");
    
    // Retry a few times before giving up
    if (retryAttemptsRef.current < 3) {
      retryAttemptsRef.current++;
      
      setTimeout(() => {
        flyToFn(longitude, latitude);
      }, 500);
      return true;
    } else {
      console.error("Camera still not initialized after delay, cannot navigate");
      toast({
        title: "Navigation Error",
        description: "Couldn't initialize camera for navigation",
        variant: "destructive"
      });
      if (onComplete) onComplete();
      return false;
    }
  }, []);
  
  const resetRetryCount = useCallback(() => {
    retryAttemptsRef.current = 0;
  }, []);
  
  return { maybeRetry, resetRetryCount, retryAttemptsRef };
}
