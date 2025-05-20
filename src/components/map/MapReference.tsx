
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

interface MapReferenceProps {
  onMapReady: (map: L.Map) => void;
}

const MapReference = ({ onMapReady }: MapReferenceProps) => {
  const map = useMap();
  
  useEffect(() => {
    if (map) {
      // Ensure the map is properly sized right away
      setTimeout(() => map.invalidateSize(true), 100);
      
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
      map.on('resize', () => {
        console.log('Map resized, invalidating size');
        map.invalidateSize(true);
        createMapMoveEvent();
      });
      
      // Call the parent's onMapReady callback with a slight delay
      // to ensure the map is fully initialized
      setTimeout(() => {
        onMapReady(map);
        console.log('Map reference provided to parent component');
      }, 100);
      
      return () => {
        map.off('move', createMapMoveEvent);
        map.off('zoom', createMapMoveEvent);
        map.off('viewreset', createMapMoveEvent);
        map.off('resize', createMapMoveEvent);
      };
    }
  }, [map, onMapReady]);
  
  return null;
};

export default MapReference;
