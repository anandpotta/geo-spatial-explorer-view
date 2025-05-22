
import React, { useRef } from 'react';
import { Location } from '@/utils/geo-utils';
import { useGlobeLifecycle } from './hooks/useGlobeLifecycle';
import { useGlobeNavigation } from './hooks/useGlobeNavigation';
import { GlobeToastNotification } from './GlobeToastNotification';

interface ThreeGlobeProps {
  selectedLocation?: Location;
  onMapReady?: (viewer?: any) => void;
  onFlyComplete?: () => void;
}

const ThreeGlobe: React.FC<ThreeGlobeProps> = ({ 
  selectedLocation, 
  onMapReady, 
  onFlyComplete 
}) => {
  // Container reference for the Three.js canvas
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Use custom hooks to handle globe lifecycle and navigation
  const { isInitialized } = useGlobeLifecycle(containerRef, onMapReady);
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
