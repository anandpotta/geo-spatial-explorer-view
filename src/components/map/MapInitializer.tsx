
import { useEffect } from 'react';
import L from 'leaflet';
import { Location } from '@/utils/geo-utils';

interface MapInitializerProps {
  map: L.Map | null;
  selectedLocation?: Location;
  onMapReady?: (map: L.Map) => void;
}

export const MapInitializer = ({ map, selectedLocation, onMapReady }: MapInitializerProps) => {
  useEffect(() => {
    if (map && selectedLocation) {
      map.flyTo([selectedLocation.y, selectedLocation.x], 18);
    }
  }, [map, selectedLocation]);

  useEffect(() => {
    if (map && onMapReady) {
      onMapReady(map);
    }
  }, [map, onMapReady]);

  return null;
};
