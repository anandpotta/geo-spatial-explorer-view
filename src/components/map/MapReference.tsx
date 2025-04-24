
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
      console.log('Map is ready in MapReference');
      
      // Small timeout to ensure DOM is fully rendered
      setTimeout(() => {
        try {
          // Make sure map is fully initialized and has a valid container
          if (map && map.getContainer()) {
            // Ensure the map is properly sized
            map.invalidateSize(true);
            
            // Ensure proper event handlers are set up
            if (!map._hasMapClickHandler) {
              map.on('click', (e) => {
                console.log('Map was clicked at:', e.latlng);
              });
              map._hasMapClickHandler = true;
            }
            
            // Mark as called to prevent duplicate calls
            hasCalledOnReady.current = true;
            
            // Call the callback
            onMapReady(map);
          }
        } catch (err) {
          console.error('Error in map initialization:', err);
        }
      }, 100);
    }
    
    // Clean up function
    return () => {
      if (map) {
        // Remove click event listener to prevent memory leaks
        map.off('click');
        delete map._hasMapClickHandler;
      }
    };
  }, [map, onMapReady]);
  
  return null;
};

export default MapReference;
