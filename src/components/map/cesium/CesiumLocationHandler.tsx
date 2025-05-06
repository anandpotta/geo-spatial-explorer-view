
import { useEffect, useRef, useState } from 'react';
import * as Cesium from 'cesium';
import { Location } from '@/utils/geo-utils';
import { flyToLocation, isValidCoordinate } from '@/utils/cesium-utils';

interface CesiumLocationHandlerProps {
  viewer: Cesium.Viewer | null;
  selectedLocation?: Location;
  entityRef: React.MutableRefObject<Cesium.Entity | null>;
  isInitialized: boolean;
  onFlyComplete?: () => void;
  cinematicFlight?: boolean;
}

const CesiumLocationHandler = ({
  viewer,
  selectedLocation,
  entityRef,
  isInitialized,
  onFlyComplete,
  cinematicFlight = true
}: CesiumLocationHandlerProps) => {
  const [isFlying, setIsFlying] = useState(false);
  const pendingLocationRef = useRef<Location | undefined>(selectedLocation);
  
  // Store the latest selectedLocation in a ref to avoid race conditions
  useEffect(() => {
    pendingLocationRef.current = selectedLocation;
  }, [selectedLocation]);

  // Handle location changes - only initiate flights when the viewer is ready
  useEffect(() => {
    if (!isInitialized || !viewer || viewer.isDestroyed() || !pendingLocationRef.current || isFlying) {
      return;
    }

    const location = pendingLocationRef.current;
    
    // Validate location coordinates first
    if (!isValidCoordinate(location.x) || !isValidCoordinate(location.y)) {
      console.warn(`Cannot fly to invalid location: x=${location.x}, y=${location.y}`);
      if (onFlyComplete) {
        // Even with invalid coords, we should call the completion handler
        setTimeout(onFlyComplete, 100);
      }
      return;
    }
    
    setIsFlying(true);
    console.log("Starting cinematic flight to location:", location.label);
    
    // Use the enhanced flight animation function
    flyToLocation(viewer, location, entityRef, {
      cinematic: cinematicFlight,
      onComplete: () => {
        console.log("Flight complete, transitioning to map view");
        setIsFlying(false);
        // Clear the pending location after flying to it
        pendingLocationRef.current = undefined;
        if (onFlyComplete) {
          onFlyComplete();
        }
      }
    });
  }, [isInitialized, isFlying, entityRef, viewer, cinematicFlight, onFlyComplete]);
  
  return null; // This is a logic-only component
};

export default CesiumLocationHandler;
