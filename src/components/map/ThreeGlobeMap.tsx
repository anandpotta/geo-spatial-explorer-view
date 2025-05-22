
import React, { useState, useRef, useEffect } from 'react';
import { Location } from '@/utils/geo-utils';
import ThreeGlobe from '@/components/globe/ThreeGlobe';
import { toast } from '@/components/ui/use-toast';

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
  const [initKey, setInitKey] = useState<number>(0); // Key for force re-initialization
  const viewerInitializedRef = useRef(false);
  const lastLocationRef = useRef<string | null>(null);
  const globeInstanceRef = useRef<any>(null);
  const readyCallbackFiredRef = useRef<boolean>(false);
  const errorRecoveryAttemptsRef = useRef<number>(0);
  
  // Track location changes to prevent duplicate processing
  useEffect(() => {
    if (selectedLocation) {
      const locationId = selectedLocation.id;
      if (locationId === lastLocationRef.current) {
        console.log('ThreeGlobeMap: Skipping duplicate location selection:', locationId);
        return;
      }
      lastLocationRef.current = locationId;
      
      // Add a small delay to ensure the globe is fully initialized
      if (globeInstanceRef.current && viewerInitializedRef.current) {
        console.log("ThreeGlobeMap: Globe is ready, can navigate to:", selectedLocation.label);
      } else {
        console.log("ThreeGlobeMap: Globe not ready yet, waiting for initialization");
      }
    }
  }, [selectedLocation]);
  
  // Handle map ready state
  const handleMapReady = (viewer?: any) => {
    if (readyCallbackFiredRef.current) {
      console.log('ThreeGlobeMap: Ready callback already fired, ignoring duplicate event');
      return;
    }
    
    console.log("ThreeGlobeMap: Globe is ready, hiding loading indicator");
    readyCallbackFiredRef.current = true;
    viewerInitializedRef.current = true;
    setIsLoading(false);
    
    // Clear any previous error state
    if (mapError) {
      setMapError(null);
    }
    
    if (viewer) {
      globeInstanceRef.current = viewer;
      
      // Ensure the viewer has all required methods
      if (!viewer.flyToLocation) {
        console.error("Globe viewer is missing flyToLocation method");
        setMapError("Globe initialization incomplete");
        return;
      }
    }
    
    if (onMapReady && globeInstanceRef.current) {
      console.log("ThreeGlobeMap: Calling parent onMapReady");
      // Add a short delay to ensure everything is fully initialized
      setTimeout(() => {
        if (onMapReady) onMapReady(globeInstanceRef.current);
      }, 500);
    }
  };
  
  // Handle successful flight completion
  const handleFlyComplete = () => {
    console.log("ThreeGlobeMap: Flight complete, notifying parent");
    
    if (onFlyComplete) {
      onFlyComplete();
    }
  };
  
  // Clean up resources on unmount
  React.useEffect(() => {
    return () => {
      console.log("ThreeGlobeMap unmounted, cleaning up resources");
      viewerInitializedRef.current = false;
      lastLocationRef.current = null;
      globeInstanceRef.current = null;
      readyCallbackFiredRef.current = false;
    };
  }, []);
  
  // Handle errors that might occur
  const handleError = (error: Error) => {
    console.error("ThreeGlobeMap: Globe error:", error);
    
    // Try to recover by reinitializing the globe
    if (errorRecoveryAttemptsRef.current < 2) {
      errorRecoveryAttemptsRef.current++;
      console.log(`ThreeGlobeMap: Attempting to recover from globe error (attempt ${errorRecoveryAttemptsRef.current})`);
      
      // Reset state
      viewerInitializedRef.current = false;
      globeInstanceRef.current = null;
      readyCallbackFiredRef.current = false;
      
      // Force re-initialization
      setInitKey(prev => prev + 1);
      
      toast({
        title: "Globe Recovery",
        description: "Trying to reinitialize the 3D globe...",
        duration: 3000
      });
    } else {
      // After multiple attempts, show error to user
      setMapError(error.message || "Failed to initialize 3D globe");
      
      toast({
        title: "Globe Error",
        description: "Could not initialize the 3D globe view",
        variant: "destructive"
      });
      
      // Still notify parent that the map is ready so the app can proceed
      if (onMapReady && !readyCallbackFiredRef.current) {
        readyCallbackFiredRef.current = true;
        onMapReady(null);
      }
    }
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
            <button 
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              onClick={() => {
                setMapError(null);
                errorRecoveryAttemptsRef.current = 0;
                readyCallbackFiredRef.current = false;
                setInitKey(prev => prev + 1);
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      )}
      
      {/* ThreeJS Globe with key for forced re-initialization */}
      <ThreeGlobe 
        key={`globe-${initKey}`}
        selectedLocation={selectedLocation}
        onMapReady={handleMapReady}
        onFlyComplete={handleFlyComplete}
        onError={handleError}
      />
    </div>
  );
};

export default ThreeGlobeMap;
