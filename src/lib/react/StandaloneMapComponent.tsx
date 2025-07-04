
import React, { useRef, useEffect, useState } from 'react';
import { MapCore } from '../geospatial-core/map/index';
import type { GeoLocation, MapViewOptions } from '../geospatial-core/types';

export interface StandaloneMapComponentProps {
  options?: Partial<MapViewOptions>;
  selectedLocation?: GeoLocation;
  externalLocation?: {
    latitude: number;
    longitude: number;
    searchString?: string;
  };
  width?: string;
  height?: string;
  enableDrawing?: boolean;
  showInternalSearch?: boolean;
  theme?: string;
  className?: string;
  onReady?: (api: any) => void;
  onLocationSelect?: (location: GeoLocation) => void;
  onLocationChange?: (location: {
    latitude: number;
    longitude: number;
    searchString?: string;
  }) => void;
  onError?: (error: Error) => void;
  onAnnotationsChange?: (annotations: any[]) => void;
  onDrawingCreated?: (drawing: any) => void;
  onRegionClick?: (region: any) => void;
}

// Export props type for external usage
export type StandaloneMapProps = StandaloneMapComponentProps;

/**
 * Standalone React Map component that can be used independently
 */
export const StandaloneMapComponent: React.FC<StandaloneMapComponentProps> = ({
  options,
  selectedLocation,
  externalLocation,
  width = '100%',
  height = '400px',
  enableDrawing = false,
  showInternalSearch = true,
  theme = 'light',
  className = '',
  onReady,
  onLocationSelect,
  onLocationChange,
  onError,
  onAnnotationsChange,
  onDrawingCreated,
  onRegionClick
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapCore | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [annotations, setAnnotations] = useState<any[]>([]);
  
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
  
  // Handle external location changes
  useEffect(() => {
    if (mapRef.current && isReady && externalLocation) {
      const geoLocation: GeoLocation = {
        id: `external-${Date.now()}`,
        label: externalLocation.searchString || `Location at ${externalLocation.latitude}, ${externalLocation.longitude}`,
        x: externalLocation.longitude,
        y: externalLocation.latitude,
      };
      
      mapRef.current.centerMap(externalLocation.latitude, externalLocation.longitude);
      mapRef.current.addMarker(geoLocation);
      
      if (onLocationChange) {
        onLocationChange(externalLocation);
      }
    }
  }, [externalLocation, isReady, onLocationChange]);
  
  // Handle selected location changes
  useEffect(() => {
    if (mapRef.current && isReady && selectedLocation) {
      mapRef.current.centerMap(selectedLocation.y, selectedLocation.x);
      mapRef.current.addMarker(selectedLocation);
    }
  }, [selectedLocation, isReady]);
  
  // Handle location selection
  const handleMapClick = (event: React.MouseEvent) => {
    if (onLocationSelect && mapRef.current) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        // Convert screen coordinates to geo coordinates (simplified)
        const x = ((event.clientX - rect.left) / rect.width) * 360 - 180;
        const y = 90 - ((event.clientY - rect.top) / rect.height) * 180;
        
        const mockLocation: GeoLocation = {
          id: `loc-${Date.now()}`,
          label: `Location at ${y.toFixed(4)}, ${x.toFixed(4)}`,
          x: x,
          y: y,
        };
        
        onLocationSelect(mockLocation);
        
        if (onLocationChange) {
          onLocationChange({
            latitude: y,
            longitude: x,
            searchString: mockLocation.label
          });
        }
      }
    }
  };
  
  // Handle drawing creation
  const handleDrawingCreate = (drawing: any) => {
    const newAnnotations = [...annotations, drawing];
    setAnnotations(newAnnotations);
    
    if (onAnnotationsChange) onAnnotationsChange(newAnnotations);
    if (onDrawingCreated) onDrawingCreated(drawing);
  };
  
  const containerClasses = `relative overflow-hidden border border-gray-300 rounded-lg ${className}`;
  const backgroundTheme = theme === 'dark' ? 'bg-gray-900' : 'bg-blue-50';
  
  return (
    <div 
      style={{ width, height }}
      className={containerClasses}
    >
      <div 
        ref={containerRef} 
        className={`w-full h-full relative overflow-hidden ${backgroundTheme}`}
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
        
        {isReady && showInternalSearch && (
          <div className="absolute top-2 right-2 bg-white rounded shadow-md p-2 z-10">
            <div className="text-xs text-gray-600">
              Internal Search: {showInternalSearch ? 'Enabled' : 'Disabled'}
            </div>
          </div>
        )}
        
        {isReady && enableDrawing && (
          <div className="absolute top-2 left-2 bg-white rounded shadow-md p-2 z-10">
            <button
              onClick={() => handleDrawingCreate({ 
                id: `drawing-${Date.now()}`, 
                type: 'polygon',
                data: { coordinates: [[0, 0], [1, 0], [1, 1], [0, 1]] }
              })}
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
            >
              Add Drawing
            </button>
          </div>
        )}
        
        {annotations.length > 0 && (
          <div className="absolute bottom-2 left-2 bg-white rounded shadow-md p-2 z-10 max-w-xs">
            <h4 className="font-semibold text-sm mb-1">Annotations ({annotations.length})</h4>
            <div className="text-xs text-gray-600 max-h-20 overflow-y-auto">
              {annotations.map((annotation, index) => (
                <div key={annotation.id || index} className="mb-1">
                  {annotation.type}: {annotation.id}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
