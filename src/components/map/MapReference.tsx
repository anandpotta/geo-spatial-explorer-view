
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
      
      // Make sure map is properly initialized
      setTimeout(() => {
        try {
          if (map && map.getContainer()) {
            hasCalledOnReady.current = true;
            map.invalidateSize();
            console.log('Map container verified, calling onMapReady');
            
            // Ensure proper event handlers are set up
            map.on('click', (e) => {
              console.log('Map was clicked at:', e.latlng);
            });
            
            onMapReady(map);
          }
        } catch (err) {
          console.error('Error in map initialization:', err);
        }
      }, 100);
    }
    
    // Clean up function
    return () => {
      hasCalledOnReady.current = false;
    };
  }, [map, onMapReady]);
  
  return null;
};

export default MapReference;
