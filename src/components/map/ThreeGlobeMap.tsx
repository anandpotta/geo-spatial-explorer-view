
import React, { useState, useRef, useEffect } from 'react';
import { Location } from '@/utils/geo-utils';
import ThreeGlobe from '@/components/globe/ThreeGlobe';

interface ThreeGlobeMapProps {
  selectedLocation?: Location;
  onMapReady?: (viewer?: any) => void;
  onFlyComplete?: () => void;
}

const ThreeGlobeMap: React.FC<ThreeGlobeMapProps> = ({ 
  selectedLocation, 
  onMapReady, 
  onFlyComplete 
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const viewerInitializedRef = useRef(false);
  const lastLocationRef = useRef<string | null>(null);
  const globeInstanceRef = useRef<any>(null);
  const loadingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Track location changes to prevent duplicate processing
  useEffect(() => {
    if (selectedLocation) {
      const locationId = selectedLocation.id;
      if (locationId === lastLocationRef.current) {
        console.log('Skipping duplicate location selection:', locationId);
        return;
      }
      lastLocationRef.current = locationId;
    }
  }, [selectedLocation]);
  
  // Force loading state to end after timeout (fallback)
  useEffect(() => {
    // Set a timeout to end loading state after a reasonable time
    loadingTimeoutRef.current = setTimeout(() => {
      if (isLoading) {
        console.log("Forcing loading state to end after timeout");
        setIsLoading(false);
      }
    }, 5000); // 5 seconds timeout
    
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [isLoading]);
  
  // Handle map ready state
  const handleMapReady = (viewer?: any) => {
    if (viewerInitializedRef.current) {
      console.log('Globe is already initialized, skipping duplicate ready event');
      return;
    }
    
    console.log("ThreeGlobeMap: Globe is ready");
    viewerInitializedRef.current = true;
    setIsLoading(false);
    
    if (viewer) {
      globeInstanceRef.current = viewer;
    }
    
    if (onMapReady) onMapReady(globeInstanceRef.current);
  };
  
  // Clean up resources on unmount
  React.useEffect(() => {
    return () => {
      console.log("ThreeGlobeMap unmounted, cleaning up resources");
      viewerInitializedRef.current = false;
      lastLocationRef.current = null;
      globeInstanceRef.current = null;
    };
  }, []);
  
  // Handle errors that might occur
  const handleError = (error: Error) => {
    console.error("Globe error:", error);
    setMapError(error.message || "Failed to initialize 3D globe");
    setIsLoading(false); // End loading state on error
  };
  
  return (
    <div className="w-full h-full relative" style={{ backgroundColor: 'black' }}>
      {/* Loading overlay - only show while loading */}
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="text-center p-6">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <h3 className="text-xl font-bold text-white">Loading 3D Globe</h3>
            <p className="text-sm text-gray-300">Please wait...</p>
          </div>
        </div>
      )}
      
      {/* Error message */}
      {mapError && (
        <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="text-center max-w-md mx-auto p-6 bg-red-900 bg-opacity-50 rounded-lg">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h3 className="text-xl font-bold text-white mb-2">Globe Error</h3>
            <p className="text-white mb-4">{mapError}</p>
          </div>
        </div>
      )}
      
      {/* ThreeJS Globe */}
      <ThreeGlobe 
        selectedLocation={selectedLocation}
        onMapReady={handleMapReady}
        onFlyComplete={onFlyComplete}
      />
    </div>
  );
};

export default ThreeGlobeMap;
