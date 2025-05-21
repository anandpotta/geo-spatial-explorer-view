
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

interface MapReferenceProps {
  onMapReady: (map: L.Map) => void;
}

const MapReference = ({ onMapReady }: MapReferenceProps) => {
  const map = useMap();
  
  useEffect(() => {
    if (map) {
      // Store map instance globally for marker positioning
      (window as any).leafletMapInstance = map;
      
      // Create a custom event for map movement
      const createMapMoveEvent = () => {
        window.dispatchEvent(new CustomEvent('mapMove'));
      };
      
      // Listen to map events
      map.on('move', createMapMoveEvent);
      map.on('zoom', createMapMoveEvent);
      map.on('viewreset', createMapMoveEvent);
      
      // Call the parent's onMapReady callback
      onMapReady(map);
      
      return () => {
        map.off('move', createMapMoveEvent);
        map.off('zoom', createMapMoveEvent);
        map.off('viewreset', createMapMoveEvent);
      };
    }
  }, [map, onMapReady]);
  
  return null;
};

export default MapReference;
