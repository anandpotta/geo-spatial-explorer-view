
import React, { useRef, useEffect, useState } from 'react';
import { Location } from '@/utils/geo-utils';
import { useThreeGlobe } from '@/hooks/three-globe';

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [isGlobeReady, setIsGlobeReady] = useState(false);
  const [isFlying, setIsFlying] = useState(false);
  
  // Use our custom hook to handle Three.js setup and animation
  const { 
    scene, 
    camera, 
    renderer, 
    globe,
    flyToLocation,
    isInitialized
  } = useThreeGlobe(containerRef, () => {
    console.log("ThreeGlobe: Scene initialized successfully");
    setIsGlobeReady(true);
    if (onMapReady) onMapReady({ scene, camera, renderer, globe });
  });
  
  // Handle flying to a location when selectedLocation changes
  useEffect(() => {
    if (!isInitialized || !selectedLocation || isFlying) return;
    
    console.log('Flying to location:', selectedLocation);
    setIsFlying(true);
    
    flyToLocation(
      selectedLocation.x,
      selectedLocation.y,
      () => {
        setIsFlying(false);
        if (onFlyComplete) onFlyComplete();
      }
    );
  }, [selectedLocation, isInitialized, isFlying, flyToLocation, onFlyComplete]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full"
      style={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        background: '#000',
        overflow: 'hidden',
        zIndex: 0
      }}
      data-globe-container="true"
    >
      {!isGlobeReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 text-white">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <h3 className="text-xl font-bold">Initializing 3D Globe</h3>
            <p className="text-sm text-gray-300">Loading universe...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThreeGlobe;
