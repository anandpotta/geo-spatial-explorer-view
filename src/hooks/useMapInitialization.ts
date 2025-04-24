
import { useRef, useEffect, useState } from 'react';
import L from 'leaflet';
import { Location } from '@/utils/geo-utils';

export function useMapInitialization(selectedLocation?: Location, onMapReady?: (map: L.Map) => void) {
  const mapRef = useRef<L.Map | null>(null);
  const loadedMarkersRef = useRef(false);
  const [mapInstanceKey, setMapInstanceKey] = useState<number>(Date.now());
  const [mapInitialized, setMapInitialized] = useState(false);

  useEffect(() => {
    if (selectedLocation && mapRef.current && mapInitialized) {
      try {
        if (mapRef.current.getContainer() && document.body.contains(mapRef.current.getContainer())) {
          console.log('Flying to location:', [selectedLocation.y, selectedLocation.x]);
          mapRef.current.flyTo([selectedLocation.y, selectedLocation.x], 18, {
            animate: true,
            duration: 1
          });
        }
      } catch (err) {
        console.error('Error flying to location:', err);
      }
    }
  }, [selectedLocation, mapInitialized]);

  const handleSetMapRef = (map: L.Map) => {
    if (mapRef.current) {
      console.log('Map reference already exists, skipping assignment');
      return;
    }
    
    console.log('Setting map reference');
    mapRef.current = map;
    setMapInitialized(true);
    
    if (onMapReady) {
      onMapReady(map);
    }
    
    setTimeout(() => {
      try {
        if (!mapRef.current) return;
        mapRef.current.invalidateSize(true);
        
        if (selectedLocation && mapRef.current.getContainer() && 
            document.body.contains(mapRef.current.getContainer())) {
          console.log('Flying to initial location after initialization');
          mapRef.current.flyTo([selectedLocation.y, selectedLocation.x], 18, {
            animate: true,
            duration: 1.5
          });
        }
      } catch (err) {
        console.error('Error flying to location after map ready:', err);
      }
    }, 1000);
  };

  return {
    mapRef,
    mapInstanceKey,
    setMapInstanceKey,
    mapInitialized,
    handleSetMapRef
  };
}
