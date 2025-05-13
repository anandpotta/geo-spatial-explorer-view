
import React, { useRef, useEffect, useState } from 'react';
import { Location } from '@/utils/geo-utils';
import { useThreeGlobe } from '@/hooks/useThreeGlobe';
import { createMarkerPosition } from '@/utils/globe-utils';

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
  const globeAPI = useThreeGlobe(containerRef, onMapReady);
  const [isFlying, setIsFlying] = useState(false);
  
  // Handle location changes
  useEffect(() => {
    if (globeAPI && selectedLocation) {
      console.log("ThreeGlobe: Flying to location:", selectedLocation);
      setIsFlying(true);
      
      // Calculate marker position
      const markerPosition = createMarkerPosition(selectedLocation, 1.01); // Slightly above globe surface
      
      // Fly to the location
      globeAPI.flyToLocation(selectedLocation.y, selectedLocation.x, () => {
        setIsFlying(false);
        if (onFlyComplete) {
          console.log("ThreeGlobe: Fly complete");
          onFlyComplete();
        }
      });
      
      // Add marker at the location
      globeAPI.addMarker(selectedLocation.id, markerPosition, selectedLocation.label);
    }
  }, [selectedLocation, globeAPI, onFlyComplete]);
  
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
    </div>
  );
};

export default ThreeGlobe;
