
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
          if (map && map.getContainer() && document.body.contains(map.getContainer())) {
            hasCalledOnReady.current = true;
            
            // Check if map is valid before trying to invalidate size
            try {
              if (map._panes && map._panes.mapPane && map._panes.mapPane._leaflet_pos) {
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
