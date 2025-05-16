
import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { isMapValid } from '@/utils/leaflet-type-utils';

interface MapResizeHandlerProps {
  map: L.Map | null;
  containerRef: React.RefObject<HTMLDivElement>;
}

const MapResizeHandler: React.FC<MapResizeHandlerProps> = ({ map, containerRef }) => {
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  
  useEffect(() => {
    if (!map || !containerRef.current) return;
    
    const handleResize = () => {
      if (map && isMapValid(map)) {
        try {
          map.invalidateSize(true);
          console.log("Map resized due to container change");
        } catch (err) {
          console.error("Error resizing map:", err);
        }
      }
    };
    
    // Create resize observer
    resizeObserverRef.current = new ResizeObserver(handleResize);
    resizeObserverRef.current.observe(containerRef.current);
    
    return () => {
      if (resizeObserverRef.current && containerRef.current) {
        resizeObserverRef.current.unobserve(containerRef.current);
        resizeObserverRef.current = null;
      }
    };
  }, [map, containerRef]);
  
  return null;
};

export default MapResizeHandler;
