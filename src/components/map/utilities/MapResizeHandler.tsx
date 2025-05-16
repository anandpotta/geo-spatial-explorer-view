
import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { isMapValid } from '@/utils/leaflet-type-utils';

interface MapResizeHandlerProps {
  map: L.Map | null;
  containerRef: React.RefObject<HTMLDivElement>;
}

const MapResizeHandler: React.FC<MapResizeHandlerProps> = ({ map, containerRef }) => {
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const resizeAttemptRef = useRef(0);
  
  useEffect(() => {
    if (!map || !containerRef.current) return;
    
    // Wait a moment before setting up the resize observer
    // This gives the map more time to initialize
    const initTimeout = setTimeout(() => {
      const handleResize = () => {
        if (!map || !containerRef.current) return;
        
        try {
          // Only proceed if both container and map panes exist
          if (!isMapValid(map)) {
            resizeAttemptRef.current++;
            if (resizeAttemptRef.current < 5) {
              console.log("Map not valid, skipping resize");
            }
            return;
          }
          
          // Check for map panes before proceeding
          const mapPanes = map.getPanes();
          if (!mapPanes || !mapPanes.mapPane) {
            resizeAttemptRef.current++;
            if (resizeAttemptRef.current < 5) {
              console.log("Map panes not ready, skipping resize");
            }
            return;
          }
          
          // Reset counter when successful
          resizeAttemptRef.current = 0;
          
          // Make sure container is visible and has dimensions
          if (containerRef.current.clientWidth === 0 || containerRef.current.clientHeight === 0) {
            return;
          }
          
          // Successfully resize the map
          map.invalidateSize(true);
          console.log("Map resized successfully");
        } catch (err) {
          if (resizeAttemptRef.current < 3) {
            console.error("Error resizing map:", err);
          }
          resizeAttemptRef.current++;
        }
      };
      
      // Create resize observer with enhanced error handling
      if (containerRef.current) {
        resizeObserverRef.current = new ResizeObserver(() => {
          // Add a small delay before resizing to ensure map is ready
          setTimeout(handleResize, 100);
        });
        resizeObserverRef.current.observe(containerRef.current);
      }
    }, 300); // Delay observer creation
    
    return () => {
      clearTimeout(initTimeout);
      if (resizeObserverRef.current && containerRef.current) {
        try {
          resizeObserverRef.current.unobserve(containerRef.current);
        } catch (e) {
          console.log('Error unobserving container:', e);
        }
        resizeObserverRef.current = null;
      }
    };
  }, [map, containerRef]);
  
  return null;
};

export default MapResizeHandler;
