
import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { Location } from '@/utils/geo-utils';
import { useThreeGlobe } from '@/hooks/useThreeGlobe';

interface ThreeGlobeProps {
  selectedLocation?: Location;
  onMapReady?: () => void;
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
  } = useThreeGlobe(containerRef, () => {
    setIsGlobeReady(true);
    if (onMapReady) onMapReady();
  });
  
  // Handle flying to a location when selectedLocation changes
  useEffect(() => {
    if (!isGlobeReady || !selectedLocation || isFlying) return;
    
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
  }, [selectedLocation, isGlobeReady, isFlying, flyToLocation, onFlyComplete]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full"
      style={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: '#000',
        overflow: 'hidden',
      }}
    >
      {!isGlobeReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 text-white">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <h3 className="text-xl font-bold">Loading 3D Globe</h3>
            <p className="text-sm text-gray-300">Please wait...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThreeGlobe;
