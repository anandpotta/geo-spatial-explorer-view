
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
  
  // Use custom hooks to handle globe lifecycle and navigation
  const { isInitialized, globeAPI } = useGlobeLifecycle(
    containerRef, 
    onMapReady, 
    handleGlobeError
  );
  
  const { isFlying, selectedLocationLabel } = useGlobeNavigation(
    selectedLocation, 
    isInitialized && !!globeAPI, 
    onFlyComplete
  );

  // Instead of trying to set a new method on globeAPI, use the existing flyToLocation method
  // This resolves the TypeScript error where flyToSelectedLocation doesn't exist on the type
  useEffect(() => {
    if (globeAPI && isInitialized && selectedLocation) {
      console.log(`Manual flyToLocation called for ${selectedLocation.label} [${selectedLocation.y}, ${selectedLocation.x}]`);
      globeAPI.flyToLocation(selectedLocation.x, selectedLocation.y, onFlyComplete);
    }
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
    </div>
  );
};

export default ThreeGlobe;
