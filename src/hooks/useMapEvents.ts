
import { useEffect } from 'react';
import L from 'leaflet';

export const useMapEvents = (map: L.Map | null, selectedLocation?: { x: number; y: number }) => {
  useEffect(() => {
    if (selectedLocation && map) {
      console.log('Selected location in Leaflet map:', selectedLocation);
      const newPosition: [number, number] = [selectedLocation.y, selectedLocation.x];
      
      // Check if map is valid before attempting to fly to location
      if (map && typeof map.flyTo === 'function' && map.getContainer() && map._loaded) {
        try {
          // First invalidate size to ensure proper rendering
          map.invalidateSize(true);
          
          // Small timeout to ensure map is ready
          setTimeout(() => {
            try {
              // Double-check map is still valid
              if (map && map.getContainer() && !map._isDestroyed) {
                map.flyTo(newPosition, 18, {
                  animate: true,
                  duration: 1.5
                });
              }
            } catch (innerError) {
              console.error('Error in delayed flyTo:', innerError);
              
              // Fallback to setView which is more reliable
              try {
                map.setView(newPosition, 18);
              } catch (setViewError) {
                console.error('Error in setView fallback:', setViewError);
              }
            }
          }, 100);
        } catch (error) {
          console.error('Error flying to position:', error);
          
          // Fallback to setView which is more reliable
          try {
            map.setView(newPosition, 18);
          } catch (setViewError) {
            console.error('Error in setView fallback:', setViewError);
          }
        }
      }
    }
  }, [selectedLocation, map]);
};
