
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Location } from '@/utils/geo-utils';
import { useThreeGlobe } from '@/hooks/useThreeGlobe';
import { toast } from '@/hooks/use-toast';

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
  const [loadingProgress, setLoadingProgress] = useState(0);
  const previousLocationRef = useRef<string | null>(null);
  
  const handleMapReady = useCallback(() => {
    console.log("ThreeGlobe: Scene initialized successfully");
    setIsGlobeReady(true);
    if (onMapReady) onMapReady();
  }, [onMapReady]);
  
  const { 
    scene, 
    camera, 
    renderer, 
    controls,
    globe,
    flyToLocation,
    isInitialized
  } = useThreeGlobe(containerRef, handleMapReady);
  
  useEffect(() => {
    if (!isGlobeReady) {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 2;
        if (progress >= 95) {
          setLoadingProgress(95);
          clearInterval(interval);
        } else {
          setLoadingProgress(progress);
        }
      }, 100);
      
      return () => clearInterval(interval);
    } else {
      setLoadingProgress(100);
    }
  }, [isGlobeReady]);
  
  useEffect(() => {
    if (!isInitialized || !selectedLocation || !flyToLocation) return;
    
    const locationId = `${selectedLocation.id}-${selectedLocation.x}-${selectedLocation.y}`;
    
    if (isFlying || locationId === previousLocationRef.current) return;
    
    if (typeof selectedLocation.x !== 'number' || typeof selectedLocation.y !== 'number' ||
        isNaN(selectedLocation.x) || isNaN(selectedLocation.y)) {
      console.error('Invalid coordinates:', selectedLocation);
      toast({
        title: "Navigation Error",
        description: "Cannot navigate to location due to invalid coordinates",
        variant: "destructive"
      });
      return;
    }
    
    console.log('Flying to location:', selectedLocation);
    setIsFlying(true);
    previousLocationRef.current = locationId;
    
    flyToLocation(
      selectedLocation.x,
      selectedLocation.y,
      () => {
        setIsFlying(false);
        if (onFlyComplete) {
          console.log("Flight complete, calling onFlyComplete callback");
          onFlyComplete();
        }
      }
    );
  }, [selectedLocation, isInitialized, isFlying, flyToLocation, onFlyComplete, toast]);

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
        background: '#000011',
        overflow: 'hidden',
        zIndex: 0
      }}
      data-testid="three-globe-container"
    >
      {!isGlobeReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80 text-white z-10">
          <div className="text-center p-8">
            <div className="relative mx-auto mb-6">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-400"></div>
              <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                <svg className="h-8 w-8 text-blue-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M2 12h20" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-bold mb-2 text-blue-100">Loading Natural Earth View</h3>
            <div className="w-64 h-3 bg-gray-800 rounded-full overflow-hidden mb-2 mx-auto">
              <div 
                className="h-full bg-green-500 transition-all duration-300 ease-out"
                style={{ width: `${loadingProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-green-200">Initializing 3D globe...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThreeGlobe;
