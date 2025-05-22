
import React, { useRef, useEffect } from 'react';
import { Location } from '@/utils/geo-utils';
import { useGlobeLifecycle } from './hooks/useGlobeLifecycle';
import { useGlobeNavigation } from './hooks/useGlobeNavigation';
import { GlobeToastNotification } from './GlobeToastNotification';

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
  
  // Use custom hooks to handle globe lifecycle and navigation
  const { isInitialized } = useGlobeLifecycle(containerRef, onMapReady, onError);
  const { isFlying, selectedLocationLabel } = useGlobeNavigation(
    selectedLocation, 
    isInitialized, 
    onFlyComplete
  );

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full"
      style={{ 
        position: 'relative', 
        overflow: 'hidden',
        backgroundColor: 'black'
      }}
    >
      {/* Canvas will be added here by Three.js */}
      {isFlying && <GlobeToastNotification locationLabel={selectedLocationLabel} />}
    </div>
  );
};

export default ThreeGlobe;
