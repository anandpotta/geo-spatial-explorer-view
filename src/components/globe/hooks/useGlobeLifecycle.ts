
import { useState, useRef, useEffect, useCallback } from 'react';
import { useThreeGlobe } from '@/hooks/useThreeGlobe';

export function useGlobeLifecycle(
  containerRef: React.RefObject<HTMLDivElement>,
  onMapReady?: (viewer?: any) => void,
  onError?: (error: Error) => void
) {
  const [isInitialized, setIsInitialized] = useState(false);
  const initCallbackFiredRef = useRef(false);
  const errorRef = useRef<Error | null>(null);

  // Handle initialization completion
  const handleInitialized = useCallback(() => {
    if (initCallbackFiredRef.current) return;
    
    console.log('Globe initialization complete');
    setIsInitialized(true);
    initCallbackFiredRef.current = true;
    
    // Call onMapReady with the globe API instance if provided
    if (onMapReady) {
      onMapReady(globeAPI);
    }
  }, [onMapReady]);
  
  // Handle errors that occur during initialization
  const handleError = useCallback((error: Error) => {
    console.error('Globe initialization error:', error);
    errorRef.current = error;
    
    if (onError) {
      onError(error);
    }
  }, [onError]);

  // Get globe API with initialization callback
  const globeAPI = useThreeGlobe(containerRef, handleInitialized);
  
  // Effect to detect errors during initialization
  useEffect(() => {
    // Check if there was a critical error in the globe
    const initTimeoutId = setTimeout(() => {
      if (!isInitialized && !initCallbackFiredRef.current && !errorRef.current) {
        const error = new Error('Globe initialization timed out');
        console.error(error);
        
        if (onError) {
          onError(error);
        }
      }
    }, 10000); // 10 second timeout
    
    return () => {
      clearTimeout(initTimeoutId);
    };
  }, [isInitialized, onError]);

  return {
    isInitialized,
    globeAPI
  };
}
