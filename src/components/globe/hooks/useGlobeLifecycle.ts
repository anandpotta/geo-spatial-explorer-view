
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
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const globeAPIRef = useRef<any>(null);

  // Handle initialization completion
  const handleInitialized = useCallback(() => {
    if (initCallbackFiredRef.current) return;
    
    console.log('Globe initialization complete');
    setIsInitialized(true);
    initCallbackFiredRef.current = true;
    
    // Clear any timeout to prevent error from being thrown
    if (initTimeoutRef.current !== null) {
      clearTimeout(initTimeoutRef.current);
      initTimeoutRef.current = null;
    }
    
    // Call onMapReady with the globe API instance if provided
    if (onMapReady && globeAPIRef.current) {
      onMapReady(globeAPIRef.current);
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
  
  // Store the reference to globeAPI for use in callbacks
  useEffect(() => {
    if (globeAPI) {
      globeAPIRef.current = globeAPI;
    }
  }, [globeAPI]);
  
  // Effect to detect errors during initialization
  useEffect(() => {
    // Check if there was a critical error in the globe
    initTimeoutRef.current = setTimeout(() => {
      if (!isInitialized && !initCallbackFiredRef.current && !errorRef.current) {
        const error = new Error('Globe initialization timed out');
        console.error(error);
        
        if (onError) {
          onError(error);
        }
      }
    }, 15000); // Increase timeout to 15 seconds for slower devices
    
    return () => {
      if (initTimeoutRef.current !== null) {
        clearTimeout(initTimeoutRef.current);
        initTimeoutRef.current = null;
      }
    };
  }, [isInitialized, onError]);

  return {
    isInitialized,
    globeAPI
  };
}
