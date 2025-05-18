
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
  const initialReadyCalledRef = useRef<boolean>(false);
  const mapReadyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initializationAttemptsRef = useRef(0);
  
  // Added progressive initialization attempts with console logs
  useEffect(() => {
    // Make another attempt to initialize if still loading after 6 seconds
    const loadingTimeoutId = setTimeout(() => {
      if (isLoading && !fadeOutLoading) {
        initializationAttemptsRef.current++;
        console.log(`Globe still loading after 6s, attempt ${initializationAttemptsRef.current}`);
        
        // Force reload the globe component if multiple attempts fail
        if (initializationAttemptsRef.current >= 2) {
          console.log("Forcing globe component reload");
          // This will trigger a fresh mount of the ThreeGlobe component
          const reloadTimerId = setTimeout(() => {
            setIsLoading(false);
            setIsLoading(true);
          }, 100);
          return () => clearTimeout(reloadTimerId);
        }
      }
    }, 6000);
    
    return () => clearTimeout(loadingTimeoutId);
  }, [isLoading, fadeOutLoading]);
  
  // Improved loading state management with a single initialization
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
    // Clear any previous timeout
    if (mapReadyTimeoutRef.current) {
      clearTimeout(mapReadyTimeoutRef.current);
      mapReadyTimeoutRef.current = null;
    }
    
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
    
    // Ensure we only call onMapReady once with a slight delay
    if (!initialReadyCalledRef.current && onMapReady) {
      initialReadyCalledRef.current = true;
      
      // Use timeout to allow the globe to stabilize before notifying parent
      mapReadyTimeoutRef.current = setTimeout(() => {
        console.log("ThreeGlobeMap: Calling onMapReady callback");
        onMapReady(globeInstanceRef.current);
        mapReadyTimeoutRef.current = null;
      }, 300);
    }
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
    }, 250);
  };
  
  // Clean up resources on unmount
  React.useEffect(() => {
    return () => {
      console.log("ThreeGlobeMap unmounted, cleaning up resources");
      viewerInitializedRef.current = false;
      initialReadyCalledRef.current = false;
      lastLocationRef.current = null;
      globeInstanceRef.current = null;
      
      if (flyCompleteTimeoutRef.current) {
        clearTimeout(flyCompleteTimeoutRef.current);
      }
      
      if (mapReadyTimeoutRef.current) {
        clearTimeout(mapReadyTimeoutRef.current);
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
      {/* Loading overlay with improved transition */}
      {isLoading && (
        <div 
          className={`absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 transition-opacity duration-600 ${fadeOutLoading ? 'opacity-0' : 'opacity-100'}`}
        >
          <div className="text-center p-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <h3 className="text-lg font-bold text-white">Loading 3D Globe</h3>
            <p className="text-gray-300 text-sm mt-2">Please wait...</p>
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
      
      {/* ThreeJS Globe with optimized loading */}
      <ThreeGlobe 
        selectedLocation={selectedLocation}
        onMapReady={handleMapReady}
        onFlyComplete={handleFlyComplete}
        key={`globe-${Date.now()}`} // Force new instance to avoid stale references
      />
    </div>
  );
};

export default ThreeGlobeMap;
