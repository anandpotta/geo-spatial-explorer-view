import React, { useRef, useEffect, useState } from 'react';
import { MapCore } from '../geospatial-core/map';
import type { GeoLocation, MapViewOptions } from '../geospatial-core/types';

interface MapComponentProps {
  options?: Partial<MapViewOptions>;
  selectedLocation?: GeoLocation;
  onReady?: (api: any) => void;
  onLocationSelect?: (location: GeoLocation) => void;
  onError?: (error: Error) => void;
}

/**
 * React component wrapper for MapCore
 */
export const MapComponent: React.FC<MapComponentProps> = ({
  options,
  selectedLocation,
  onReady,
  onLocationSelect,
  onError
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapCore | null>(null);
  const [isReady, setIsReady] = useState(false);
  
  // Initialize map when component mounts
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
        onCleanup: (callback) => {}
      });
      
      setIsReady(true);
      if (onReady) onReady(map);
    } catch (error) {
      console.error('Failed to initialize map:', error);
      if (onError) onError(error as Error);
    }
    
    return () => {
      if (mapRef.current) {
        mapRef.current.dispose();
        mapRef.current = null;
      }
    };
  }, []); // Empty dependency array means initialize once
  
  // Handle location changes
  useEffect(() => {
    if (mapRef.current && isReady && selectedLocation) {
      mapRef.current.centerMap(selectedLocation.y, selectedLocation.x);
      mapRef.current.addMarker(selectedLocation);
    }
  }, [selectedLocation, isReady]);
  
  // Handle location selection
  const handleMapClick = (event: React.MouseEvent) => {
    // In a real implementation, this would translate screen coordinates to geo coordinates
    // For now we're just providing a placeholder
    if (onLocationSelect && mapRef.current) {
      const mockLocation: GeoLocation = {
        id: `loc-${Date.now()}`,
        label: 'Selected Location',
        x: Math.random() * 180 - 90, // mock longitude
        y: Math.random() * 90 - 45,  // mock latitude
      };
      onLocationSelect(mockLocation);
    }
  };
  
  return (
    <div 
      ref={containerRef} 
      className="w-full h-full relative overflow-hidden"
      onClick={handleMapClick}
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
