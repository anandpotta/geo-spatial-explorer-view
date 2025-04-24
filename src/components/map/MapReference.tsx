
import { useEffect, useRef, useState } from 'react';
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
  const [initAttempts, setInitAttempts] = useState(0);
  const maxAttempts = 20;
  
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
        // Check if we've tried too many times
        if (initAttempts >= maxAttempts) {
          console.warn('Maximum map initialization attempts reached. Proceeding with limited functionality.');
          map.isMapFullyInitialized = true;
          hasCalledOnReady.current = true;
          onMapReady(map);
          return;
        }

        // Ensure map is properly sized and has valid container
        if (!map || !map.getContainer() || !document.contains(map.getContainer())) {
          console.log('Map container not ready, retrying... (attempt ' + (initAttempts + 1) + ')');
          setInitAttempts(prev => prev + 1);
          // Try again in a moment
          initTimeoutRef.current = window.setTimeout(safeInit, 300);
          return;
        }
        
        // Check if tiles and map panes are loaded
        const mapPane = map.getContainer().querySelector('.leaflet-map-pane');
        if (!mapPane) {
          console.log('Map pane not found, retrying... (attempt ' + (initAttempts + 1) + ')');
          setInitAttempts(prev => prev + 1);
          initTimeoutRef.current = window.setTimeout(safeInit, 300);
          return;
        }

        // Force multiple invalidateSize calls to ensure the map is properly rendered
        map.invalidateSize(true);
        
        // Wait a bit to ensure map is ready
        initTimeoutRef.current = window.setTimeout(() => {
          try {
            if (map && map.getContainer() && document.contains(map.getContainer())) {
              map.invalidateSize(true);
              
              // One final invalidation to be safe
              initTimeoutRef.current = window.setTimeout(() => {
                try {
                  if (map && map.getContainer() && document.contains(map.getContainer())) {
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
                    console.log('Map fully initialized and ready');
                  } else {
                    // Try again if the container was removed or map invalid
                    console.warn('Map container disappeared during initialization, retrying...');
                    setInitAttempts(prev => prev + 1);
                    initTimeoutRef.current = window.setTimeout(safeInit, 300);
                  }
                } catch (finalErr) {
                  console.error('Error in final map initialization, retrying:', finalErr);
                  setInitAttempts(prev => prev + 1);
                  initTimeoutRef.current = window.setTimeout(safeInit, 300);
                }
              }, 300);
            } else {
              // Try again if the container was removed
              console.warn('Map container disappeared during initialization, retrying...');
              setInitAttempts(prev => prev + 1);
              initTimeoutRef.current = window.setTimeout(safeInit, 300);
            }
          } catch (secondErr) {
            console.error('Error in second map initialization step, retrying:', secondErr);
            setInitAttempts(prev => prev + 1);
            initTimeoutRef.current = window.setTimeout(safeInit, 300);
          }
        }, 300);
      } catch (err) {
        console.error('Error in map initialization, retrying:', err);
        setInitAttempts(prev => prev + 1);
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
  }, [map, onMapReady, initAttempts]);
  
  return null;
};

export default MapReference;
