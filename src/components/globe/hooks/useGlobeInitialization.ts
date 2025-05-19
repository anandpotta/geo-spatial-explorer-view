
import { useEffect } from 'react';
import { Location } from '@/utils/geo-utils';

/**
 * Hook to handle globe initialization and readiness
 */
export function useGlobeInitialization(
  globeAPI: any,
  isInitialized: boolean,
  setIsInitialized: (value: boolean) => void,
  setLoadingStatus: (status: 'loading' | 'partial' | 'complete') => void,
  onMapReady?: (viewer?: any) => void,
  mountedRef: React.RefObject<boolean>,
  initializationAttemptedRef: React.RefObject<boolean>,
  readyCallbackFiredRef: React.RefObject<boolean>,
  globeInitializedRef: React.RefObject<boolean>,
  failsafeTimerRef: React.RefObject<NodeJS.Timeout | null>
) {
  // Initialize globe with improved reliability via a staggered loading approach
  const handleInitialization = () => {
    if (!isInitialized && !initializationAttemptedRef.current && mountedRef.current) {
      console.log("ThreeGlobe: Globe initialization callback triggered");
      initializationAttemptedRef.current = true;
      setIsInitialized(true);
      setLoadingStatus('partial');
      
      // Force a quick re-render to ensure state consistency
      setTimeout(() => {
        if (!readyCallbackFiredRef.current && mountedRef.current) {
          readyCallbackFiredRef.current = true;
          console.log("ThreeGlobe: Setting initialized state and preparing callback");
          
          // To avoid multiple initializations
          if (!globeInitializedRef.current && mountedRef.current) {
            globeInitializedRef.current = true;
            console.log("ThreeGlobe: Globe initialized for the first time");
            
            // Ensure the callback is called with a more generous timeout
            setTimeout(() => {
              if (onMapReady && mountedRef.current) {
                console.log("ThreeGlobe: Calling onMapReady callback");
                setLoadingStatus('complete');
                onMapReady(globeAPI);
              }
            }, 100);
          }
        }
      }, 50);
    }
  };
  
  // Critical failsafe - ensure the globe loads even if something goes wrong
  useEffect(() => {
    // Super short failsafe timer to ensure we don't block initialization
    failsafeTimerRef.current = setTimeout(() => {
      if (!isInitialized && mountedRef.current) {
        console.log("ThreeGlobe: Emergency failsafe initialization triggered");
        setIsInitialized(true);
        setLoadingStatus('partial');
        
        // Force the ready callback with a slight delay
        setTimeout(() => {
          if (!readyCallbackFiredRef.current && mountedRef.current && onMapReady) {
            console.log("ThreeGlobe: Emergency readiness notification");
            readyCallbackFiredRef.current = true;
            globeInitializedRef.current = true;
            setLoadingStatus('complete');
            onMapReady(globeAPI);
          }
        }, 200);
      }
    }, 1500); // Very short emergency timer - only 1.5 seconds
    
    return () => {
      if (failsafeTimerRef.current) {
        clearTimeout(failsafeTimerRef.current);
        failsafeTimerRef.current = null;
      }
    };
  }, [globeAPI, isInitialized, onMapReady, setIsInitialized, setLoadingStatus, mountedRef, readyCallbackFiredRef, globeInitializedRef, failsafeTimerRef]);
  
  // Added backup initialization trigger to prevent getting stuck on loading
  useEffect(() => {
    if (!isInitialized && globeAPI.isInitialized && !readyCallbackFiredRef.current && mountedRef.current) {
      console.log("ThreeGlobe: Backup initialization triggered");
      setIsInitialized(true);
      setLoadingStatus('partial');
      readyCallbackFiredRef.current = true;
      
      if (onMapReady && !globeInitializedRef.current && mountedRef.current) {
        globeInitializedRef.current = true;
        console.log("ThreeGlobe: Calling onMapReady from backup trigger");
        setLoadingStatus('complete');
        onMapReady(globeAPI);
      }
    }
  }, [globeAPI, isInitialized, onMapReady, setIsInitialized, setLoadingStatus, mountedRef, readyCallbackFiredRef, globeInitializedRef]);
  
  return { handleInitialization };
}
