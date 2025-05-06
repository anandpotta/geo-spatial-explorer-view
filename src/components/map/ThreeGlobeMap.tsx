
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Location } from '@/utils/geo-utils';
import ThreeGlobe from '@/components/globe/ThreeGlobe';
import { toast } from 'sonner';

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
  const [key, setKey] = useState<number>(Date.now());
  const mountStateRef = useRef({ isMounted: true });
  const flyCompletedRef = useRef(false);
  
  // Cleanup function for component unmount
  useEffect(() => {
    return () => {
      mountStateRef.current.isMounted = false;
      console.log("ThreeGlobeMap unmounted, cleaning up resources");
    };
  }, []);
  
  // Reset state when the component is remounted with a new key
  useEffect(() => {
    flyCompletedRef.current = false;
  }, [key]);

  // Handle map ready state
  const handleMapReady = useCallback((viewer?: any) => {
    if (!mountStateRef.current.isMounted) return;
    
    console.log("ThreeGlobeMap: Globe is ready");
    setIsLoading(false);
    
    if (onMapReady && viewer) {
      try {
        onMapReady(viewer);
      } catch (error) {
        console.error('Error in onMapReady callback:', error);
      }
    }
  }, [onMapReady]);
  
  // Handle fly complete
  const handleFlyComplete = useCallback(() => {
    if (!mountStateRef.current.isMounted || flyCompletedRef.current) return;
    
    flyCompletedRef.current = true;
    
    if (onFlyComplete) {
      try {
        onFlyComplete();
      } catch (error) {
        console.error('Error in onFlyComplete callback:', error);
      }
    }
  }, [onFlyComplete]);

  // Handle errors
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      // Only handle WebGL errors for our component
      if (event.message && 
         (event.message.includes('WebGL') || 
          event.message.includes('THREE') || 
          event.message.includes('removeChild'))) {
        if (!mountStateRef.current.isMounted) return;
        
        setMapError("Rendering error: " + event.message);
        toast.error("3D Globe encountered an error. Retrying...");
        
        // Auto-retry once
        setTimeout(() => {
          if (mountStateRef.current.isMounted) {
            setMapError(null);
            setKey(Date.now());
          }
        }, 1500);
      }
    };

    window.addEventListener('error', handleGlobalError);
    
    return () => {
      window.removeEventListener('error', handleGlobalError);
    };
  }, []);
  
  // Function to manually remount the component if needed
  const handleRetry = useCallback(() => {
    if (!mountStateRef.current.isMounted) return;
    
    setMapError(null);
    setKey(Date.now());
    setIsLoading(true);
  }, []);
  
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
              onClick={handleRetry}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )}
      
      {/* ThreeJS Globe */}
      <ThreeGlobe 
        key={key}
        selectedLocation={selectedLocation}
        onMapReady={handleMapReady}
        onFlyComplete={handleFlyComplete}
      />
    </div>
  );
};

export default ThreeGlobeMap;
