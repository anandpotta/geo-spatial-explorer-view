
import React, { useRef, useEffect, useState } from 'react';
import { Location } from '@/utils/geo-utils';
import { useGlobeLifecycle } from './hooks/useGlobeLifecycle';
import { useGlobeNavigation } from './hooks/useGlobeNavigation';
import { GlobeToastNotification } from './GlobeToastNotification';
import { toast } from '@/components/ui/use-toast';

interface ThreeGlobeProps {
  selectedLocation?: Location;
  onMapReady?: (viewer?: any) => void;
  onFlyComplete?: () => void;
  onError?: (error: Error) => void;
}

const ThreeGlobe: React.FC<ThreeGlobeProps> = ({ 
  selectedLocation, 
  onMapReady, 
  onFlyComplete,
  onError
}) => {
  // Container reference for the Three.js canvas
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Track selected location for change detection
  const prevLocationRef = useRef<string | null>(null);
  const [initRetries, setInitRetries] = useState(0);
  const [waitingForInit, setWaitingForInit] = useState(true);
  
  // Log when selected location changes
  useEffect(() => {
    if (selectedLocation) {
      const locationId = selectedLocation.id;
      if (prevLocationRef.current !== locationId) {
        console.log(`ThreeGlobe: Location selection changed to ${selectedLocation.label} [${selectedLocation.y}, ${selectedLocation.x}]`);
        prevLocationRef.current = locationId;
      }
    }
  }, [selectedLocation]);
  
  // Handle globe initialization errors
  const handleGlobeError = (error: Error) => {
    console.error("ThreeGlobe initialization error:", error);
    
    if (initRetries < 2) {
      // Try to reinitialize the globe
      setInitRetries(prev => prev + 1);
      toast({
        title: "Globe Initialization",
        description: "Attempting to reinitialize globe...",
        duration: 3000
      });
    } else if (onError) {
      // After retries, report the error to parent
      onError(error);
    }
  };
  
  // Handle successful initialization
  const handleGlobeReady = (viewer?: any) => {
    console.log("ThreeGlobe: Globe initialized successfully", !!viewer);
    setWaitingForInit(false);
    
    if (onMapReady) {
      onMapReady(viewer);
    }
  };
  
  // Use custom hooks to handle globe lifecycle and navigation
  const { isInitialized, globeAPI } = useGlobeLifecycle(
    containerRef, 
    handleGlobeReady, 
    handleGlobeError
  );
  
  const { isFlying, selectedLocationLabel } = useGlobeNavigation(
    selectedLocation, 
    isInitialized && !!globeAPI, 
    onFlyComplete
  );

  // Only attempt to fly when globe is properly initialized
  useEffect(() => {
    if (!globeAPI || !isInitialized || !selectedLocation) return;
    
    // Add a small delay to ensure the scene is fully rendered
    const timer = setTimeout(() => {
      if (globeAPI && isInitialized && selectedLocation) {
        console.log(`ThreeGlobe: Flying to location ${selectedLocation.label} [${selectedLocation.y}, ${selectedLocation.x}]`);
        globeAPI.flyToLocation(selectedLocation.x, selectedLocation.y, onFlyComplete);
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [globeAPI, isInitialized, selectedLocation, onFlyComplete]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full"
      style={{ 
        position: 'relative', 
        overflow: 'hidden',
        backgroundColor: 'black'
      }}
      key={`globe-container-${initRetries}`}
    >
      {/* Canvas will be added here by Three.js */}
      {isFlying && <GlobeToastNotification locationLabel={selectedLocationLabel} />}
      
      {/* Show loading indicator while waiting for initialization */}
      {waitingForInit && (
        <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <h3 className="text-xl font-bold text-white">Initializing Globe</h3>
            <p className="text-gray-300 text-sm">Please wait...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThreeGlobe;
