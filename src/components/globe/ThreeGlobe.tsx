
import React, { useRef, useEffect, useState } from 'react';
import { Location } from '@/utils/geo-utils';
import { useThreeGlobe } from '@/hooks/useThreeGlobe';
import { createMarkerPosition } from '@/utils/globe-utils';

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
  const [isInitialized, setIsInitialized] = useState(false);
  const [isFlying, setIsFlying] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState<'loading' | 'partial' | 'complete'>('loading');
  const lastFlyLocationRef = useRef<string | null>(null);
  const initializationAttemptedRef = useRef(false);
  const readyCallbackFiredRef = useRef(false);
  const globeInitializedRef = useRef(false);
  const flyCompletedCallbackRef = useRef<(() => void) | null>(null);
  const mountedRef = useRef<boolean>(true);
  const failsafeTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Initialize globe with improved reliability via a staggered loading approach
  const globeAPI = useThreeGlobe(containerRef, () => {
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
  });
  
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
  }, [globeAPI, isInitialized, onMapReady]);
  
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
  }, [globeAPI, isInitialized, onMapReady]);
  
  // Handle fly completion with debouncing
  const handleFlyComplete = () => {
    if (!mountedRef.current) return;
    setIsFlying(false);
    
    // Execute the stored callback if exists
    if (flyCompletedCallbackRef.current && mountedRef.current) {
      const callback = flyCompletedCallbackRef.current;
      flyCompletedCallbackRef.current = null;
      
      // Small delay for smoother transition experience
      setTimeout(() => {
        if (mountedRef.current) {
          callback();
        }
      }, 100);
    }
  };
  
  // Handle location changes with better flight state management
  useEffect(() => {
    if (!globeAPI.isInitialized || !selectedLocation || !mountedRef.current) return;
    
    // Prevent duplicate fly operations for the same location
    const locationId = selectedLocation.id;
    if (isFlying) {
      console.log("ThreeGlobe: Already flying, queueing new flight request");
      
      // Store the callback to execute when current flight completes
      flyCompletedCallbackRef.current = () => {
        if (onFlyComplete && mountedRef.current) {
          console.log("ThreeGlobe: Executing queued fly complete callback");
          onFlyComplete();
        }
      };
      
      return;
    }
    
    if (locationId === lastFlyLocationRef.current) {
      console.log("ThreeGlobe: Skipping duplicate location selection:", locationId);
      return;
    }
    
    console.log("ThreeGlobe: Flying to location:", selectedLocation.label);
    setIsFlying(true);
    lastFlyLocationRef.current = locationId;
    
    // Calculate marker position
    const markerPosition = createMarkerPosition(selectedLocation, 1.01); // Slightly above globe surface
    
    // Fly to the location - ensure coordinates are valid numbers
    if (typeof selectedLocation.x === 'number' && typeof selectedLocation.y === 'number') {
      try {
        globeAPI.flyToLocation(selectedLocation.y, selectedLocation.x, () => {
          if (mountedRef.current) {
            handleFlyComplete();
            if (onFlyComplete && mountedRef.current) {
              console.log("ThreeGlobe: Fly complete");
              onFlyComplete();
            }
          }
        });
        
        // Add marker at the location with null check
        if (globeAPI.addMarker && mountedRef.current) {
          globeAPI.addMarker(selectedLocation.id, markerPosition, selectedLocation.label);
        }
      } catch (error) {
        console.error("Error during fly operation:", error);
        // Handle error gracefully
        setIsFlying(false);
        if (onFlyComplete && mountedRef.current) onFlyComplete();
      }
    } else {
      console.error("Invalid coordinates:", selectedLocation);
      setIsFlying(false);
      if (onFlyComplete && mountedRef.current) onFlyComplete();
    }
  }, [selectedLocation, globeAPI, onFlyComplete, isFlying, globeAPI.isInitialized]);
  
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
  }, [globeAPI]);
  
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
      {/* Canvas will be added here by Three.js */}
      {loadingStatus !== 'complete' && (
        <div className={`absolute inset-0 flex items-center justify-center bg-black bg-opacity-80 z-10 transition-opacity duration-500 ${loadingStatus === 'partial' ? 'opacity-70' : 'opacity-100'}`}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <div className="text-white text-lg">
              {loadingStatus === 'loading' ? 'Initializing Globe...' : 'Loading Earth Textures...'}
            </div>
            <div className="text-gray-400 text-xs mt-2">
              {loadingStatus === 'partial' ? 'Almost ready...' : 'Please wait...'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThreeGlobe;
