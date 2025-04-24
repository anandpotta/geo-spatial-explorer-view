
import { useEffect, useRef } from 'react';
import { Location } from '@/utils/geo-utils';
import L from 'leaflet';

export const useLocationSelection = (
  selectedLocation: Location | undefined,
  mapRef: React.MutableRefObject<L.Map | null>,
  onMapInstanceReset: () => void
) => {
  const previousLocationRef = useRef<string | null>(null);
  const currentLocationId = selectedLocation?.id || null;
  
  useEffect(() => {
    // Skip if we're trying to fly to the same location or if no location is selected
    if (!selectedLocation || currentLocationId === previousLocationRef.current) {
      return;
    }
    
    // Update the previous location reference
    previousLocationRef.current = currentLocationId;
    
    if (mapRef.current) {
      try {
        // Only try to fly if the map is properly initialized
        if (mapRef.current.getContainer()) {
          console.log('Flying to selected location:', selectedLocation);
          // Use flyTo with animation for smooth transition
          mapRef.current.flyTo([selectedLocation.y, selectedLocation.x], 18, {
            animate: true,
            duration: 1.5
          });
        }
      } catch (err) {
        console.error('Error flying to location:', err);
        onMapInstanceReset();
      }
    }
  }, [selectedLocation, mapRef, onMapInstanceReset, currentLocationId]);
};
