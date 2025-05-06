
import React, { useState } from 'react';
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
  
  // Handle map ready state
  const handleMapReady = (viewer?: any) => {
    console.log("ThreeGlobeMap: Globe is ready");
    setIsLoading(false);
    if (onMapReady) onMapReady(viewer);
  };
  
  // Clean up resources on unmount
  React.useEffect(() => {
    return () => {
      console.log("ThreeGlobeMap unmounted, cleaning up resources");
    };
  }, []);
  
  return (
    <div className="w-full h-full relative">
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
