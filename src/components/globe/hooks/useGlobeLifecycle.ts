
import { useRef, useState, useEffect } from 'react';
import { useThreeGlobe } from '@/hooks/useThreeGlobe';

export function useGlobeLifecycle(
  containerRef: React.RefObject<HTMLDivElement>,
  onMapReady?: (viewer?: any) => void
) {
  const [isInitialized, setIsInitialized] = useState(false);
  const readyCallbackFiredRef = useRef(false);
  const isUnmountedRef = useRef(false);
  const initializationAttemptedRef = useRef(false);
  
  // Initialize globe only once
  const globeAPI = useThreeGlobe(containerRef, () => {
    if (!isUnmountedRef.current && !readyCallbackFiredRef.current) {
      readyCallbackFiredRef.current = true;
      setIsInitialized(true);
      console.log("ThreeGlobe: Globe initialized and ready");
      if (onMapReady) {
        console.log("ThreeGlobe: Calling onMapReady callback");
        onMapReady(globeAPI);
      }
    }
  });

  // Ensure we call onMapReady even if initialization is delayed
  useEffect(() => {
    if (globeAPI.isInitialized && !readyCallbackFiredRef.current && !isUnmountedRef.current) {
      console.log("ThreeGlobe: Globe detected as initialized via effect");
      readyCallbackFiredRef.current = true;
      setIsInitialized(true);
      if (onMapReady) {
        console.log("ThreeGlobe: Calling onMapReady callback (from effect)");
        onMapReady(globeAPI);
      }
    }
    
    // Force ready state after a timeout as a fallback
    const timerId = setTimeout(() => {
      if (!readyCallbackFiredRef.current && !isUnmountedRef.current) {
        console.log("ThreeGlobe: Forcing ready state after timeout");
        readyCallbackFiredRef.current = true;
        setIsInitialized(true);
        if (onMapReady) {
          console.log("ThreeGlobe: Calling onMapReady callback (from timeout)");
          onMapReady(globeAPI);
        }
      }
    }, 2000);
    
    return () => {
      clearTimeout(timerId);
      isUnmountedRef.current = true;
    };
  }, [globeAPI, onMapReady, globeAPI.isInitialized]);

  return {
    isInitialized,
    globeAPI
  };
}
