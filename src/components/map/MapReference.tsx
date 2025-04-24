
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
      console.log('Map is ready, will call onMapReady after initialization');
      
      // Wait until the map is fully initialized before calling onMapReady
      setTimeout(() => {
        try {
          if (map && map.getContainer && typeof map.getContainer === 'function') {
            // Check if the map has a valid container and is properly initialized
            const container = map.getContainer();
            if (container && document.body.contains(container)) {
              hasCalledOnReady.current = true;
              map.invalidateSize();
              console.log('Map container verified, calling onMapReady');
              onMapReady(map);
            } else {
              console.warn('Map container not properly attached to DOM, delaying onMapReady');
              setTimeout(() => {
                if (map && !map._leaflet_id) {
                  console.warn('Map initialization incomplete, skipping onMapReady');
                  return;
                }
                hasCalledOnReady.current = true;
                map.invalidateSize();
                onMapReady(map);
              }, 300);
            }
          }
        } catch (err) {
          console.error('Error in map initialization:', err);
        }
      }, 200); // Increased timeout for better initialization
    }
    
    // Clean up function
    return () => {
      hasCalledOnReady.current = false;
    };
  }, [map, onMapReady]);
  
  return null;
};

export default MapReference;
