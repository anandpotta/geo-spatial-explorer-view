
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
  const map = useMap() as LeafletMapInternal;
  const hasCalledOnReady = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // Only call onMapReady once per instance
    if (map && onMapReady && !hasCalledOnReady.current) {
      console.log('Map is ready, will call onMapReady after initialization');
      
      // Wait until the map is fully initialized before calling onMapReady
      timerRef.current = setTimeout(() => {
        try {
          // Check if map container still exists and is attached to DOM
          if (map && map.getContainer() && document.body.contains(map.getContainer())) {
            hasCalledOnReady.current = true;
            
            // Check if map is valid before trying to invalidate size
            try {
              // Only invalidate size if the map contains valid panes
              // Use safe optional chaining to prevent errors
              if (map._panes?.mapPane?._leaflet_pos) {
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
      }, 300); // Increase timeout to ensure map is initialized
      
      return () => {
        // Clear timeout on unmount to prevent memory leaks
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      };
    }
    
    // Cleanup function for the effect
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [map, onMapReady]);
  
  return null;
};

export default MapReference;
