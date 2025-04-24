
import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

interface MapReferenceProps {
  onMapReady: (map: L.Map) => void;
}

// Define interface for internal map properties not exposed in TypeScript definitions
interface LeafletMapInternal extends L.Map {
  _panes?: {
    mapPane?: {
      _leaflet_pos?: any;
    };
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
          // Check if map container still exists and is attached to DOM
          if (map && map.getContainer() && document.body.contains(map.getContainer())) {
            hasCalledOnReady.current = true;
            
            // Check if map is valid before trying to invalidate size
            try {
              // Cast to internal map type to access private properties
              const internalMap = map as LeafletMapInternal;
              
              // Only invalidate size if map is properly initialized
              if (internalMap && 
                  internalMap._panes && 
                  internalMap._panes.mapPane) {
                console.log('Map panes initialized, calling invalidateSize');
                map.invalidateSize();
              } else {
                console.log('Map panes not fully initialized yet, skipping invalidateSize');
              }
            } catch (err) {
              console.log('Skipping invalidateSize due to initialization state');
            }
            
            console.log('Map container verified, calling onMapReady');
            onMapReady(map);
          } else {
            console.log('Map container not ready or not attached to DOM');
          }
        } catch (err) {
          console.error('Error in map initialization:', err);
        }
      }, 250); // Increase timeout to ensure map is initialized
    }
    
    // Clean up function
    return () => {
      hasCalledOnReady.current = false;
    };
  }, [map, onMapReady]);
  
  return null;
};

export default MapReference;
