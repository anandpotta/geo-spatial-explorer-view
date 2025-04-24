
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
          // Make sure the map and its container still exist
          if (map && map.getContainer && map.getContainer()) {
            // Check if the map is properly initialized with all required properties
            if (map._mapPane && map._mapPane._leaflet_pos) {
              hasCalledOnReady.current = true;
              console.log('Map container verified, calling onMapReady');
              
              // Safely invalidate size with a try-catch
              try {
                map.invalidateSize(true);
              } catch (err) {
                console.warn('Error invalidating map size, but continuing:', err);
              }
              
              onMapReady(map);
            } else {
              console.log('Map not fully initialized yet, delaying onMapReady call');
              
              // Wait a bit longer for full initialization
              setTimeout(() => {
                try {
                  if (map && map.getContainer()) {
                    hasCalledOnReady.current = true;
                    console.log('Map container verified after delay, calling onMapReady');
                    onMapReady(map);
                  }
                } catch (error) {
                  console.error('Map initialization failed after delay:', error);
                }
              }, 500);
            }
          }
        } catch (err) {
          console.error('Error in map initialization:', err);
        }
      }, 200); // Increased delay for better initialization
    }
    
    // Clean up function
    return () => {
      hasCalledOnReady.current = false;
    };
  }, [map, onMapReady]);
  
  return null;
};

export default MapReference;
