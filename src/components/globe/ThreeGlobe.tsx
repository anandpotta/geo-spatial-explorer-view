import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { toast } from 'sonner';
import { useToast } from '@/hooks/use-toast';

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
  
  // Use our custom hook to handle Three.js setup and animation
  const { 
    scene, 
    camera, 
    renderer, 
    controls,
    globe,
    flyToLocation,
    isInitialized
  } = useThreeGlobe(containerRef, () => {
    console.log("ThreeGlobe: Scene initialized successfully");
    setIsGlobeReady(true);
    if (onMapReady) onMapReady({ scene, camera, renderer, globe, controls });
  });
  
  // Show loading progress animation
  useEffect(() => {
    // Only start progress animation if not ready yet
    if (!isGlobeReady) {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 1;
        if (progress >= 95) {
          // If we reach 95% and still not ready, stay there
          setLoadingProgress(95);
          clearInterval(interval);
        } else {
          setLoadingProgress(progress);
        }
      }, 50);
      
      return () => clearInterval(interval);
    } else {
      // When ready, set to 100% immediately
      setLoadingProgress(100);
    }
  }, [isGlobeReady]);
  
  // Handle flying to a location when selectedLocation changes
  useEffect(() => {
    if (!isInitialized || !selectedLocation) return;
    
    // Create a unique ID for the location to detect changes
    const locationId = `${selectedLocation.id}-${selectedLocation.x}-${selectedLocation.y}`;
    
    // Skip if we're already flying or it's the same location
    if (isFlying || locationId === previousLocationRef.current) return;
    
    // Validate coordinates before flying
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
        background: '#000011', // Very dark blue background
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
            <p className="text-sm text-green-200">Loading high-resolution terrain...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThreeGlobe;
