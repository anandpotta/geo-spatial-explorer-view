
import React, { useRef, useEffect } from 'react';
import { Location } from '@/utils/geo-utils';
import { useThreeGlobe } from '@/hooks/useThreeGlobe';
import { useGlobeState } from './hooks/useGlobeState';
import { useGlobeInitialization } from './hooks/useGlobeInitialization';
import { useGlobeFlightControl } from './hooks/useGlobeFlightControl';
import GlobeLoadingIndicator from './GlobeLoadingIndicator';

interface ThreeGlobeProps {
  selectedLocation?: Location;
  onMapReady?: (viewer?: any) => void;
  onFlyComplete?: () => void;
}

const ThreeGlobe: React.FC<ThreeGlobeProps> = ({ 
  selectedLocation, 
  onMapReady, 
  onFlyComplete 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Load all state from the hook
  const {
    isInitialized,
    setIsInitialized,
    isFlying,
    setIsFlying,
    loadingStatus,
    setLoadingStatus,
    lastFlyLocationRef,
    initializationAttemptedRef,
    readyCallbackFiredRef,
    globeInitializedRef,
    flyCompletedCallbackRef,
    mountedRef,
    failsafeTimerRef,
  } = useGlobeState();
  
  // Initialize globe with callbacks
  const globeAPI = useThreeGlobe(containerRef, () => {
    handleInitialization();
  });
  
  // Globe initialization hook
  const { handleInitialization } = useGlobeInitialization(
    globeAPI,
    isInitialized,
    setIsInitialized,
    setLoadingStatus,
    onMapReady,
    mountedRef,
    initializationAttemptedRef,
    readyCallbackFiredRef,
    globeInitializedRef,
    failsafeTimerRef
  );
  
  // Flight control hook
  useGlobeFlightControl(
    selectedLocation,
    globeAPI,
    isFlying,
    setIsFlying,
    onFlyComplete,
    lastFlyLocationRef,
    flyCompletedCallbackRef,
    mountedRef
  );
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      console.log("ThreeGlobe unmounting, cleaning up");
      mountedRef.current = false;
      
      if (failsafeTimerRef.current) {
        clearTimeout(failsafeTimerRef.current);
        failsafeTimerRef.current = null;
      }
      
      // Execute cleanup
      if (globeAPI && globeAPI.cleanup) {
        try {
          globeAPI.cleanup();
        } catch (e) {
          console.error("Error during globe cleanup:", e);
        }
      }
      
      // Clear state references
      lastFlyLocationRef.current = null;
      initializationAttemptedRef.current = false;
      readyCallbackFiredRef.current = false;
      globeInitializedRef.current = false;
      flyCompletedCallbackRef.current = null;
    };
  }, [globeAPI, lastFlyLocationRef, initializationAttemptedRef, readyCallbackFiredRef, 
      globeInitializedRef, flyCompletedCallbackRef, mountedRef, failsafeTimerRef]);
  
  return (
    <div 
      ref={containerRef} 
      className="w-full h-full"
      style={{ 
        position: 'relative', 
        overflow: 'hidden',
        backgroundColor: 'black'
      }}
    >
      {/* Loading indicator component */}
      <GlobeLoadingIndicator status={loadingStatus} />
    </div>
  );
};

export default ThreeGlobe;
