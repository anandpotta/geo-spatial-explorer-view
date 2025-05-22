
import { useState, useEffect, useRef } from 'react';
import { useThreeGlobe } from '@/hooks/three/useThreeGlobe';

export function useGlobeLifecycle(
  containerRef: React.RefObject<HTMLDivElement>,
  onMapReady?: (viewer?: any) => void,
  onError?: (error: Error) => void
) {
  const [isInitialized, setIsInitialized] = useState(false);
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initAttemptRef = useRef(0);
  const readyFiredRef = useRef(false);
  
  // Use the globe hook
  const globeAPI = useThreeGlobe(containerRef, () => {
    console.log("GlobeLifecycle: Three.js globe initialized event received");
    setIsInitialized(true);
    
    // Clear any pending timeout
    if (initTimeoutRef.current) {
      clearTimeout(initTimeoutRef.current);
      initTimeoutRef.current = null;
    }
    
    // Call the ready callback only once
    if (!readyFiredRef.current && onMapReady) {
      readyFiredRef.current = true;
      console.log("GlobeLifecycle: Firing onMapReady callback with globeAPI");
      onMapReady(globeAPI);
    }
  });
  
  // Setup initialization timeout with progressive backoff
  useEffect(() => {
    // Reset the initialization flag when retrying
    if (initAttemptRef.current > 0) {
      setIsInitialized(false);
      readyFiredRef.current = false;
    }
    
    initAttemptRef.current += 1;
    console.log(`GlobeLifecycle: Setting up initialization check (attempt ${initAttemptRef.current})`);
    
    // Calculate timeout with exponential backoff (but cap at 20 seconds)
    const timeoutDuration = Math.min(5000 + (initAttemptRef.current * 3000), 20000);
    
    // Set a timeout to check if the globe initializes
    initTimeoutRef.current = setTimeout(() => {
      if (!isInitialized) {
        console.error("Globe initialization timed out");
        
        if (onError) {
          onError(new Error("Globe initialization timed out"));
        }
      }
    }, timeoutDuration); // Increased timeout with progressive backoff
    
    return () => {
      // Clean up the timeout if the component unmounts
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
        initTimeoutRef.current = null;
      }
    };
  }, [containerRef.current, isInitialized, onError]);
  
  // Check if globe is ready on textures loaded
  useEffect(() => {
    if (globeAPI && globeAPI.globe && !isInitialized) {
      console.log("GlobeLifecycle: Globe object detected, setting initialized flag");
      setIsInitialized(true);
      
      // Call onMapReady if not called yet
      if (!readyFiredRef.current && onMapReady) {
        readyFiredRef.current = true;
        console.log("GlobeLifecycle: Firing onMapReady callback after globe detection");
        onMapReady(globeAPI);
      }
    }
  }, [globeAPI, isInitialized, onMapReady]);
  
  // Manual check if globe is ready but callback wasn't fired
  useEffect(() => {
    if (isInitialized && globeAPI && !readyFiredRef.current && onMapReady) {
      console.log("GlobeLifecycle: Globe is initialized but callback wasn't fired, firing now");
      readyFiredRef.current = true;
      onMapReady(globeAPI);
    }
  }, [isInitialized, globeAPI, onMapReady]);
  
  // Return the state and API
  return { isInitialized, globeAPI };
}
