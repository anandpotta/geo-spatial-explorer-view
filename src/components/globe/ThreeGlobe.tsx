
import React, { useRef, useEffect, useState, useCallback } from 'react';
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
  const isUnmountedRef = useRef(false);
  const readyCallbackFiredRef = useRef(false);
  
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
  
  // Ensure we call onMapReady even if the initialization callback doesn't fire
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
    }, 3000);
    
    return () => clearTimeout(timerId);
  }, [globeAPI, onMapReady, globeAPI.isInitialized]);
  
  // Safe fly completion handler that checks component mount state
  const handleFlyComplete = useCallback(() => {
    if (isUnmountedRef.current) return;
    
    setIsFlying(false);
    if (onFlyComplete) {
      console.log("ThreeGlobe: Fly complete");
      onFlyComplete();
    }
  }, [onFlyComplete]);
  
  // Handle location changes
  useEffect(() => {
    if (!selectedLocation) return;
    
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
      globeAPI.flyToLocation(selectedLocation.y, selectedLocation.x, handleFlyComplete);
      
      // Add marker at the location with null check
      if (globeAPI.addMarker) {
        globeAPI.addMarker(selectedLocation.id, markerPosition, selectedLocation.label);
      }
    } else {
      console.error("Invalid coordinates:", selectedLocation);
      setIsFlying(false);
      if (onFlyComplete) onFlyComplete();
    }
    
    // Cleanup function - cancel flights if component unmounts during flight
    return () => {
      if (isFlying && globeAPI.cancelFlight) {
        globeAPI.cancelFlight();
      }
    };
  }, [selectedLocation, globeAPI, handleFlyComplete, isFlying, globeAPI.isInitialized]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      isUnmountedRef.current = true;
      lastFlyLocationRef.current = null;
      initializationAttemptedRef.current = false;
      
      // Ensure any ongoing flights are canceled
      if (globeAPI.cancelFlight) {
        globeAPI.cancelFlight();
      }
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
    </div>
  );
};

export default ThreeGlobe;
