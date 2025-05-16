
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
  const lastFlyLocationRef = useRef<string | null>(null);
  const initializationAttemptedRef = useRef(false);
  const readyCallbackFiredRef = useRef(false);
  const globeInitializedRef = useRef(false);
  
  // Initialize globe with improved loading state handling
  const globeAPI = useThreeGlobe(containerRef, () => {
    if (!isInitialized && !initializationAttemptedRef.current && !readyCallbackFiredRef.current) {
      console.log("ThreeGlobe: Globe initialization callback triggered");
      initializationAttemptedRef.current = true;
      setIsInitialized(true);
      readyCallbackFiredRef.current = true;
      
      // To avoid multiple initializations
      if (!globeInitializedRef.current) {
        globeInitializedRef.current = true;
        console.log("ThreeGlobe: Globe initialized for the first time");
        
        // Short delay to ensure complete initialization before notifying parent
        setTimeout(() => {
          if (onMapReady) {
            console.log("ThreeGlobe: Calling onMapReady callback");
            onMapReady(globeAPI);
          }
        }, 100);
      }
    }
  });
  
  // Handle location changes with better flight state management
  useEffect(() => {
    if (!globeAPI.isInitialized || !selectedLocation) return;
    
    // Prevent duplicate fly operations for the same location
    const locationId = selectedLocation.id;
    if (isFlying) {
      console.log("ThreeGlobe: Already flying, skipping new flight request");
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
      globeAPI.flyToLocation(selectedLocation.y, selectedLocation.x, () => {
        setIsFlying(false);
        if (onFlyComplete) {
          console.log("ThreeGlobe: Fly complete");
          onFlyComplete();
        }
      });
      
      // Add marker at the location with null check
      if (globeAPI.addMarker) {
        globeAPI.addMarker(selectedLocation.id, markerPosition, selectedLocation.label);
      }
    } else {
      console.error("Invalid coordinates:", selectedLocation);
      setIsFlying(false);
      if (onFlyComplete) onFlyComplete();
    }
  }, [selectedLocation, globeAPI, onFlyComplete, isFlying, globeAPI.isInitialized]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      console.log("ThreeGlobe unmounting, cleaning up");
      lastFlyLocationRef.current = null;
      initializationAttemptedRef.current = false;
      readyCallbackFiredRef.current = false;
      globeInitializedRef.current = false;
    };
  }, []);
  
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
    </div>
  );
};

export default ThreeGlobe;
