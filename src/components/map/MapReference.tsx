
import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

interface MapReferenceProps {
  onMapReady: (map: L.Map) => void;
}

const MapReference = ({ onMapReady }: MapReferenceProps) => {
  const map = useMap();
  const hasCalledOnReady = useRef(false);
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // Only call onMapReady once per instance and only if not already called
    if (map && onMapReady && !hasCalledOnReady.current) {
      console.log('Map is ready, will call onMapReady after initialization');
      
      // Clear any existing timeout to prevent multiple calls
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
      
      // Wait until the map is fully initialized before calling onMapReady
      initTimeoutRef.current = setTimeout(() => {
        try {
          if (map && typeof map.getContainer === 'function') {
            // Check if the map has a valid container and is properly initialized
            const container = map.getContainer();
            if (container && document.body.contains(container)) {
              hasCalledOnReady.current = true;
              map.invalidateSize();
              console.log('Map container verified, calling onMapReady');
              onMapReady(map);
            } else {
              console.warn('Map container not properly attached to DOM, delaying onMapReady');
              initTimeoutRef.current = setTimeout(() => {
                // Check if map is valid without accessing internal properties
                if (map && !map.getContainer()) {
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
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
      hasCalledOnReady.current = false;
    };
  }, [map, onMapReady]);
  
  return null;
};

export default MapReference;
