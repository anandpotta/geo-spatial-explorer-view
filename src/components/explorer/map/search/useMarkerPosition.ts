
import { useState, useEffect, useRef } from 'react';
import { Location } from '@/utils/geo-utils';

interface MarkerPositionHookProps {
  selectedLocation: Location | null;
  mapContainerRef: React.RefObject<HTMLDivElement | null>;
  flyCompleted: boolean;
}

export const useMarkerPosition = ({ 
  selectedLocation, 
  mapContainerRef, 
  flyCompleted 
}: MarkerPositionHookProps) => {
  const [markerPos, setMarkerPos] = useState<{ x: number; y: number } | null>(null);
  const positionUpdateTimerRef = useRef<number | null>(null);
  const lastFlyCompleted = useRef<boolean>(flyCompleted);
  
  // Calculate the marker position based on the map type and selected location
  const calculateMarkerPosition = () => {
    const container = mapContainerRef.current;
    if (!container || !selectedLocation) return;
    
    // For 3D globe view (center of the screen for simplicity)
    const isCesium = container.getAttribute('data-map-type') === 'cesium';
    
    if (isCesium) {
      // Place in center for 3D view
      const rect = container.getBoundingClientRect();
      setMarkerPos({
        x: rect.width / 2,
        y: rect.height / 2,
      });
    } else {
      // For Leaflet maps we can compute projected coordinates
      try {
        // Try to get Leaflet map instance
        const leafletMapInstance = (window as any).leafletMapInstance;
        
        if (leafletMapInstance && selectedLocation) {
          // Project lat/lng to pixel coordinates
          const point = leafletMapInstance.latLngToContainerPoint([
            selectedLocation.y,
            selectedLocation.x
          ]);
          
          setMarkerPos({
            x: point.x,
            y: point.y,
          });
        } else {
          // Fallback to center if we can't get the map instance
          const rect = container.getBoundingClientRect();
          setMarkerPos({
            x: rect.width / 2,
            y: rect.height / 2,
          });
        }
      } catch (err) {
        console.error('Error calculating marker position:', err);
        // Fallback to center
        const rect = container.getBoundingClientRect();
        setMarkerPos({
          x: rect.width / 2,
          y: rect.height / 2,
        });
      }
    }
  };

  // Handle fly completion changes
  useEffect(() => {
    // When fly is completed, recalculate the marker position
    if (flyCompleted && !lastFlyCompleted.current && selectedLocation) {
      console.log("Fly completed, recalculating marker position");
      // Give the map a moment to settle before recalculating position
      setTimeout(() => calculateMarkerPosition(), 500);
    }
    
    lastFlyCompleted.current = flyCompleted;
  }, [flyCompleted, selectedLocation]);
  
  // Update position when the location changes or during map movements
  useEffect(() => {
    if (!selectedLocation || !mapContainerRef.current) return;
    
    // Calculate initial position
    calculateMarkerPosition();
    
    // Function to schedule position updates with debounce
    const schedulePositionUpdate = () => {
      if (positionUpdateTimerRef.current) {
        clearTimeout(positionUpdateTimerRef.current);
      }
      positionUpdateTimerRef.current = window.setTimeout(() => {
        calculateMarkerPosition();
        positionUpdateTimerRef.current = null;
      }, 200);
    };
    
    // Save the function so we can reference it in the useEffect cleanup
    const handleMapMove = schedulePositionUpdate;
    
    // Add event listeners for map movements and resizing
    window.addEventListener('mapMove', handleMapMove);
    window.addEventListener('resize', handleMapMove);
    
    // Recalculate position periodically while showing tag (for transitions)
    const intervalId = setInterval(() => {
      if (!flyCompleted) {
        calculateMarkerPosition();
      }
    }, 500);
    
    return () => {
      window.removeEventListener('mapMove', handleMapMove);
      window.removeEventListener('resize', handleMapMove);
      clearInterval(intervalId);
      if (positionUpdateTimerRef.current) {
        clearTimeout(positionUpdateTimerRef.current);
        positionUpdateTimerRef.current = null;
      }
    };
  }, [selectedLocation, flyCompleted]);
  
  return { markerPos, calculateMarkerPosition };
};
