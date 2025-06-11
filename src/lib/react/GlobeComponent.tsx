
import React, { useRef, useEffect, useState } from 'react';
import { ThreeGlobeCore } from '../geospatial-core/globe';
import { GlobeOptions } from '../geospatial-core/types';
import type { GeoLocation, GlobeEventHandlers } from '../geospatial-core/types';

interface GlobeComponentProps {
  options?: Partial<GlobeOptions>;
  selectedLocation?: GeoLocation;
  onReady?: (api: any) => void;
  onFlyComplete?: () => void;
  onError?: (error: Error) => void;
}

/**
 * React component wrapper for ThreeGlobeCore
 */
export const GlobeComponent: React.FC<GlobeComponentProps> = ({
  options,
  selectedLocation,
  onReady,
  onFlyComplete,
  onError
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<ThreeGlobeCore | null>(null);
  const [isReady, setIsReady] = useState(false);
  
  // Initialize globe when component mounts
  useEffect(() => {
    if (!containerRef.current) return;
    
    const globe = new ThreeGlobeCore(containerRef.current, options);
    globeRef.current = globe;
    
    const eventHandlers: GlobeEventHandlers = {
      onReady: (api) => {
        setIsReady(true);
        if (onReady) onReady(api);
      },
      onFlyComplete,
      onError
    };
    
    globe.init({
      getElement: () => containerRef.current,
      getDimensions: () => ({
        width: containerRef.current?.clientWidth || 300,
        height: containerRef.current?.clientHeight || 300
      }),
      onResize: (callback) => {
        const handleResize = () => {
          if (containerRef.current) callback();
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
      },
      onCleanup: (callback) => {}
    }, eventHandlers);
    
    return () => {
      if (globeRef.current) {
        globeRef.current.dispose();
        globeRef.current = null;
      }
    };
  }, []); // Empty dependency array means initialize once
  
  // Handle location changes
  useEffect(() => {
    if (globeRef.current && isReady && selectedLocation) {
      globeRef.current.setLocation(selectedLocation);
    }
  }, [selectedLocation, isReady]);
  
  return (
    <div 
      ref={containerRef} 
      className="w-full h-full" 
      style={{ 
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: 'black'
      }}
    >
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-black text-white">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <h3 className="text-xl font-bold">Loading Globe</h3>
          </div>
        </div>
      )}
    </div>
  );
};
