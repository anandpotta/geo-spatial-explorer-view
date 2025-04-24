
import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

interface MapReferenceProps {
  onMapReady: (map: L.Map) => void;
}

const MapReference = ({ onMapReady }: MapReferenceProps) => {
  const map = useMap();
  const hasCalledOnReady = useRef(false);
  
  useEffect(() => {
    // Only call onMapReady once per instance
    if (map && onMapReady && !hasCalledOnReady.current) {
      // Make sure the map is fully initialized before proceeding
      if (!map.getContainer()) {
        console.log('Map container not ready yet, waiting...');
        return;
      }
      
      console.log('Map is ready, calling onMapReady');
      hasCalledOnReady.current = true;
      
      // Add a longer delay to ensure the map is fully initialized
      setTimeout(() => {
        try {
          // Double-check the map is still valid before proceeding
          if (map && map.getContainer()) {
            onMapReady(map);
          } else {
            console.log('Map became invalid during initialization');
          }
        } catch (error) {
          console.error('Error when calling onMapReady:', error);
        }
      }, 300); // Increased from 50ms to 300ms
    }
    
    // Clean up function
    return () => {
      hasCalledOnReady.current = false;
    };
  }, [map, onMapReady]);
  
  return null;
};

export default MapReference;
