
import { useEffect } from 'react';
import L from 'leaflet';
import { Location } from '@/utils/geo-utils';

export function useLocationEffect(
  selectedLocation: Location | undefined,
  mapRef: React.MutableRefObject<L.Map | null>,
  cleanupMap: (mapRef: React.MutableRefObject<L.Map | null>) => void,
  setMapInstanceKey: (key: number) => void
) {
  useEffect(() => {
    if (selectedLocation && mapRef.current) {
      try {
        if (mapRef.current.getContainer()) {
          console.log('Flying to selected location:', selectedLocation);
          setTimeout(() => {
            if (mapRef.current) {
              mapRef.current.flyTo([selectedLocation.y, selectedLocation.x], 18);
            }
          }, 100);
        }
      } catch (err) {
        console.error('Error flying to location:', err);
        cleanupMap(mapRef);
        setMapInstanceKey(Date.now());
      }
    }
  }, [selectedLocation, cleanupMap, setMapInstanceKey]);
}
