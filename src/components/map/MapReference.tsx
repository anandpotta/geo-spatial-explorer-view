
import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

// Extend the Map type to include our custom property
declare module 'leaflet' {
  interface Map {
    hasMapClickHandler?: boolean;
    isMapFullyInitialized?: boolean;
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
    
    // Make sure the DOM is fully loaded before attempting to initialize map
    const safeInit = () => {
      try {
        // Ensure map is properly sized and has valid container
        if (map && map.getContainer()) {
          // Force multiple invalidateSize calls to ensure the map is properly rendered
          map.invalidateSize(true);
          
          setTimeout(() => {
            try {
              if (map && map.getContainer()) {
                map.invalidateSize(true);
                
                // Wait a bit longer to ensure all map internals are initialized
                setTimeout(() => {
                  try {
                    if (map && map.getContainer()) {
                      // One final invalidation to be safe
                      map.invalidateSize(true);
                      
                      // Set flag on map instance to indicate it's fully initialized
                      map.isMapFullyInitialized = true;
                      
                      // Mark as called to prevent duplicate calls
                      hasCalledOnReady.current = true;
                      
                      // Add the click handler if it doesn't exist
                      if (!map.hasMapClickHandler) {
                        map.on('click', (e) => {
                          console.log('Map was clicked at:', e.latlng);
                        });
                        map.hasMapClickHandler = true;
                      }
                      
                      // Call the callback
                      onMapReady(map);
                    }
                  } catch (finalErr) {
                    console.error('Error in final map initialization:', finalErr);
                  }
                }, 300);
              }
            } catch (secondErr) {
              console.error('Error in second map initialization step:', secondErr);
            }
          }, 200);
        } else {
          console.warn('Map container not ready, retrying...');
          // If the map isn't ready yet, try again in a moment
          initTimeoutRef.current = window.setTimeout(safeInit, 200);
        }
      } catch (err) {
        console.error('Error in map initialization:', err);
        // Try once more after an error
        initTimeoutRef.current = window.setTimeout(safeInit, 300);
      }
    };
    
    // Start the initialization process after a short delay
    initTimeoutRef.current = window.setTimeout(safeInit, 100);
    
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
            delete map.isMapFullyInitialized;
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
