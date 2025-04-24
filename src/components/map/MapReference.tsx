
import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

interface MapReferenceProps {
  onMapReady: (map: L.Map) => void;
}

interface LeafletMapWithInternals extends L.Map {
  _mapPane?: {
    _leaflet_pos?: { x: number; y: number };
  };
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
            // Start by invalidating the map size
            try {
              map.invalidateSize(true);
            } catch (err) {
              console.warn('Initial invalidateSize failed, but continuing:', err);
            }
            
            // Wait a bit more to ensure map is fully rendered
            setTimeout(() => {
              try {
                if (map && map.getContainer()) {
                  hasCalledOnReady.current = true;
                  console.log('Map container verified, calling onMapReady');
                  onMapReady(map);
                }
              } catch (error) {
                console.error('Map initialization failed after delay:', error);
              }
            }, 300);
          }
        } catch (err) {
          console.error('Error in map initialization:', err);
        }
      }, 200);
    }
    
    // Clean up function
    return () => {
      hasCalledOnReady.current = false;
    };
  }, [map, onMapReady]);
  
  return null;
};

export default MapReference;
