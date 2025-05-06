
import React, { useState, useEffect } from 'react';
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
  const [key, setKey] = useState<number>(Date.now()); // Add a key to force remount when needed
  
  // Handle map ready state
  const handleMapReady = (viewer?: any) => {
    console.log("ThreeGlobeMap: Globe is ready");
    setIsLoading(false);
    if (onMapReady) onMapReady(viewer);
  };
  
  // Clean up resources on unmount
  useEffect(() => {
    return () => {
      console.log("ThreeGlobeMap unmounted, cleaning up resources");
    };
  }, []);

  // Handle errors
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      // Only handle WebGL errors for our component
      if (event.message && event.message.includes('WebGL')) {
        setMapError("WebGL error: " + event.message);
      }
    };

    window.addEventListener('error', handleError);
    
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);
  
  // Function to remount the component if needed
  const handleRetry = () => {
    setMapError(null);
    setKey(Date.now());
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
        onFlyComplete={onFlyComplete}
      />
    </div>
  );
};

export default ThreeGlobeMap;
