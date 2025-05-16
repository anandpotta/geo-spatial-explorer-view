
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
  const [fadeOutLoading, setFadeOutLoading] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const viewerInitializedRef = useRef(false);
  const lastLocationRef = useRef<string | null>(null);
  const globeInstanceRef = useRef<any>(null);
  const flyCompleteTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Improved loading state management
  useEffect(() => {
    if (fadeOutLoading) {
      // Fade out the loading screen smoothly
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 600); // Match the fade duration
      
      return () => clearTimeout(timer);
    }
  }, [fadeOutLoading]);
  
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
  
  // Handle map ready state with improved transitions
  const handleMapReady = (viewer?: any) => {
    if (viewerInitializedRef.current) {
      console.log('Globe is already initialized, skipping duplicate ready event');
      return;
    }
    
    console.log("ThreeGlobeMap: Globe is ready");
    viewerInitializedRef.current = true;
    
    // Start fade out transition for loader
    setFadeOutLoading(true);
    
    if (viewer) {
      globeInstanceRef.current = viewer;
    }
    
    // Notify parent that map is ready after ensuring the globe is fully rendered
    setTimeout(() => {
      if (onMapReady) onMapReady(globeInstanceRef.current);
    }, 300); // Slightly longer delay for visual completeness
  };
  
  // Handle fly complete with debouncing to prevent rapid transitions
  const handleFlyComplete = () => {
    // Clear any existing timeout to avoid multiple calls
    if (flyCompleteTimeoutRef.current) {
      clearTimeout(flyCompleteTimeoutRef.current);
    }
    
    // Set a short timeout to ensure stable transition
    flyCompleteTimeoutRef.current = setTimeout(() => {
      if (onFlyComplete) {
        console.log("ThreeGlobeMap: Notifying fly completion");
        onFlyComplete();
      }
      flyCompleteTimeoutRef.current = null;
    }, 200);
  };
  
  // Clean up resources on unmount
  React.useEffect(() => {
    return () => {
      console.log("ThreeGlobeMap unmounted, cleaning up resources");
      viewerInitializedRef.current = false;
      lastLocationRef.current = null;
      globeInstanceRef.current = null;
      
      if (flyCompleteTimeoutRef.current) {
        clearTimeout(flyCompleteTimeoutRef.current);
      }
    };
  }, []);
  
  // Handle errors that might occur
  const handleError = (error: Error) => {
    console.error("Globe error:", error);
    setMapError(error.message || "Failed to initialize 3D globe");
  };
  
  return (
    <div className="w-full h-full relative" style={{ backgroundColor: 'black' }}>
      {/* Loading overlay - with smooth transition */}
      {isLoading && (
        <div 
          className={`absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 transition-opacity duration-600 ${fadeOutLoading ? 'opacity-0' : 'opacity-100'}`}
        >
          <div className="text-center p-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <h3 className="text-lg font-bold text-white">Loading 3D Globe</h3>
            <p className="text-gray-300 text-sm mt-2">Preparing Earth view...</p>
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
      
      {/* ThreeJS Globe with optimized transitions */}
      <ThreeGlobe 
        selectedLocation={selectedLocation}
        onMapReady={handleMapReady}
        onFlyComplete={handleFlyComplete}
      />
    </div>
  );
};

export default ThreeGlobeMap;
