import React, { useRef, useEffect, useState } from 'react';
import { MapCore } from '../geospatial-core/map/index';
import { useToast } from '@/hooks/use-toast';
import type { GeoLocation, MapViewOptions } from '../geospatial-core/types';

interface StandaloneMapComponentProps {
  options?: Partial<MapViewOptions>;
  initialLocation?: GeoLocation;
  onReady?: (api: any) => void;
  onError?: (error: Error) => void;
}

/**
 * React component wrapper for MapCore, designed for standalone usage with initial location support.
 */
export const StandaloneMapComponent: React.FC<StandaloneMapComponentProps> = ({
  options,
  initialLocation,
  onReady,
  onError
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapCore | null>(null);
  const [isReady, setIsReady] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new MapCore(options);
    mapRef.current = map;

    try {
      map.init({
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
        onCleanup: (callback) => { }
      });

      setIsReady(true);
      if (onReady) onReady(map);

      // Center map on initial location after map is ready
      if (initialLocation) {
        map.centerMap(initialLocation.y, initialLocation.x);
        map.addMarker(initialLocation);
      }
    } catch (error) {
      console.error('Failed to initialize map:', error);
      toast({
        title: "Error",
        description: `Map initialization failed: ${error.message}`,
        variant: "destructive",
      });
      if (onError) onError(error as Error);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.dispose();
        mapRef.current = null;
      }
    };
  }, []);

  // Update map when initialLocation changes
  useEffect(() => {
    if (mapRef.current && isReady && initialLocation) {
      mapRef.current.centerMap(initialLocation.y, initialLocation.x);
      mapRef.current.addMarker(initialLocation);
    }
  }, [initialLocation, isReady]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative overflow-hidden"
    >
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-700">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <h3 className="text-xl font-bold">Loading Map</h3>
          </div>
        </div>
      )}
    </div>
  );
};
