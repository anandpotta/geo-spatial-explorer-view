
import React, { useRef, useEffect, useState } from 'react';
import { Location } from '@/utils/geo-utils';
import { useThreeGlobe } from '@/hooks/useThreeGlobe';
import { createMarkerPosition } from '@/utils/globe-utils';
import { toast } from '@/components/ui/use-toast';

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
  const [hasError, setHasError] = useState(false);
  const lastFlyLocationRef = useRef<string | null>(null);
  const initializationAttemptedRef = useRef(false);
  const onReadyCalledRef = useRef(false);
  
  // Initialize globe with proper error handling
  const globeAPI = useThreeGlobe(containerRef, () => {
    if (!isInitialized && !initializationAttemptedRef.current && !onReadyCalledRef.current) {
      initializationAttemptedRef.current = true;
      onReadyCalledRef.current = true;
      setIsInitialized(true);
      console.log("ThreeGlobe: Globe initialized successfully");
      
      if (onMapReady) {
        console.log("ThreeGlobe: Calling onMapReady callback");
        try {
          onMapReady(globeAPI);
        } catch (err) {
          console.error("Error in onMapReady callback:", err);
        }
      }
    }
  });
  
  // Notify on initialization failure
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!isInitialized && containerRef.current && !onReadyCalledRef.current) {
        console.warn("ThreeGlobe: Globe initialization timed out, forcing ready state");
        setIsInitialized(true);
        onReadyCalledRef.current = true;
        
        if (onMapReady) {
          onMapReady(globeAPI);
        }
      }
    }, 3000); // 3 second timeout
    
    return () => clearTimeout(timeout);
  }, [isInitialized, onMapReady, globeAPI]);
  
  // Handle location changes with better error handling
  useEffect(() => {
    if (!globeAPI || !selectedLocation) return;
    
    // Force initialization if needed when location is selected
    if (!isInitialized && selectedLocation && !initializationAttemptedRef.current && !onReadyCalledRef.current) {
      console.log("ThreeGlobe: Forcing initialization for location selection");
      setIsInitialized(true);
      initializationAttemptedRef.current = true;
      onReadyCalledRef.current = true;
      
      if (onMapReady) {
        onMapReady(globeAPI);
      }
    }
    
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
    
    // Fly to the location with better error handling
    try {
      if (typeof selectedLocation.x === 'number' && typeof selectedLocation.y === 'number') {
        if (globeAPI.flyToLocation) {
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
          console.error("flyToLocation function not available in globeAPI");
          setIsFlying(false);
          if (onFlyComplete) onFlyComplete();
        }
      } else {
        console.error("Invalid coordinates:", selectedLocation);
        setIsFlying(false);
        if (onFlyComplete) onFlyComplete();
      }
    } catch (error) {
      console.error("Error during fly operation:", error);
      setIsFlying(false);
      setHasError(true);
      if (onFlyComplete) onFlyComplete();
    }
  }, [selectedLocation, globeAPI, onFlyComplete, isInitialized, isFlying, onMapReady]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      lastFlyLocationRef.current = null;
      initializationAttemptedRef.current = false;
      onReadyCalledRef.current = false;
    };
  }, []);
  
  // Force rerender if WebGL context is lost
  useEffect(() => {
    const handleContextLost = () => {
      console.error("WebGL context lost, attempting recovery");
      setHasError(true);
      
      // Try to recover after a short delay
      setTimeout(() => {
        if (containerRef.current) {
          console.log("Attempting WebGL context recovery");
          setHasError(false);
        }
      }, 2000);
    };
    
    const canvas = containerRef.current?.querySelector('canvas');
    if (canvas) {
      canvas.addEventListener('webglcontextlost', handleContextLost);
      return () => {
        canvas.removeEventListener('webglcontextlost', handleContextLost);
      };
    }
  }, []);
  
  return (
    <div 
      ref={containerRef} 
      className="w-full h-full"
      style={{ 
        position: 'relative', 
        overflow: 'hidden',
        backgroundColor: 'black',
        zIndex: 20 // Ensure high z-index to be on top
      }}
    >
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50">
          <div className="text-center p-6">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h3 className="text-xl font-bold text-white">Globe Error</h3>
            <p className="text-white mb-4">Failed to initialize 3D globe viewer</p>
            <button 
              className="px-4 py-2 bg-blue-600 text-white rounded"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThreeGlobe;
