
import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

// Extend the Map type to include our custom property
declare module 'leaflet' {
  interface Map {
    hasMapClickHandler?: boolean;
  }
}

interface MapReferenceProps {
  onMapReady: (map: L.Map) => void;
}

const MapReference = ({ onMapReady }: MapReferenceProps) => {
  const map = useMap();
  const hasCalledOnReady = useRef(false);
  const initTimeoutRef = useRef<number | null>(null);
  
  // Clear any pending timeouts on unmount
  useEffect(() => {
    return () => {
      if (initTimeoutRef.current !== null) {
        clearTimeout(initTimeoutRef.current);
      }
    };
  }, []);
  
  useEffect(() => {
    // Only call onMapReady once per instance
    if (!map || hasCalledOnReady.current) return;
    
    console.log('Map is ready in MapReference');
    
    // Small timeout to ensure DOM is fully rendered
    initTimeoutRef.current = window.setTimeout(() => {
      initTimeoutRef.current = null;
      
      try {
        // Make sure map is fully initialized and has a valid container
        if (map && map.getContainer()) {
          // Ensure the map is properly sized
          map.invalidateSize(true);
          
          // Ensure we don't add duplicate click handlers
          if (!map.hasMapClickHandler) {
            map.on('click', (e) => {
              console.log('Map was clicked at:', e.latlng);
            });
            map.hasMapClickHandler = true;
          }
          
          // Mark as called to prevent duplicate calls
          hasCalledOnReady.current = true;
          
          // Call the callback
          onMapReady(map);
        } else {
          // If map isn't ready, try again in a bit
          console.log('Map not fully initialized, retrying...');
          
          initTimeoutRef.current = window.setTimeout(() => {
            initTimeoutRef.current = null;
            
            if (map && map.getContainer()) {
              map.invalidateSize(true);
              hasCalledOnReady.current = true;
              onMapReady(map);
            }
          }, 300);
        }
      } catch (err) {
        console.error('Error in map initialization:', err);
      }
    }, 200);
    
    // Clean up function
    return () => {
      if (initTimeoutRef.current !== null) {
        clearTimeout(initTimeoutRef.current);
      }
      
      // Only remove event listeners if map exists and has container
      if (map) {
        try {
          // Check if container exists before removing listeners
          if (map.getContainer()) {
            // Remove click event listener to prevent memory leaks
            map.off('click');
            delete map.hasMapClickHandler;
          }
        } catch (error) {
          console.error('Error cleaning up map reference:', error);
        }
      }
    };
  }, [map, onMapReady]);
  
  return null;
};

export default MapReference;
