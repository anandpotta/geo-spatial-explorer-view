
import { useEffect } from 'react';
import { Location } from '@/utils/geo-utils';
import L from 'leaflet';

export const useLocationSelection = (
  selectedLocation: Location | undefined,
  mapRef: React.MutableRefObject<L.Map | null>, // Changed from RefObject to MutableRefObject
  onMapInstanceReset: () => void
) => {
  useEffect(() => {
    if (selectedLocation && mapRef.current) {
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
  }, [selectedLocation, mapRef, onMapInstanceReset]);
};
