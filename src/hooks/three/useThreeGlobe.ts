
import { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { useThreeScene } from './useThreeScene';
import { useAutoRotation } from './useAutoRotation';
import { useEnhancedFlyToLocation } from './useEnhancedFlyToLocation';
import { useMarkers } from './useMarkers';
import { useGlobeSetup } from './useGlobeSetup';
import { useGlobeAnimation } from './useGlobeAnimation';
import { EARTH_RADIUS } from '@/utils/three/globe-factory';

export function useThreeGlobe(
  containerRef: React.RefObject<HTMLDivElement>,
  onInitialized?: () => void
) {
  // Use the scene hook
  const {
    scene,
    camera,
    renderer,
    isInitialized,
    setIsInitialized,
    canvasElementRef,
    controlsRef
  } = useThreeScene(containerRef);

  // Refs for tracking state
  const isSetupCompleteRef = useRef(false);
  const isFlyingRef = useRef<boolean>(false);
  const initCallbackFiredRef = useRef<boolean>(false);
  
  // Get auto-rotation functionality
  const { autoRotationEnabledRef, setAutoRotation } = useAutoRotation(controlsRef);
  
  // Get markers functionality
  const { addMarker } = useMarkers(scene);
  
  // Handle textures loaded callback with debounce to prevent multiple calls
  const handleTexturesLoaded = useCallback(() => {
    if (onInitialized && !initCallbackFiredRef.current) {
      console.log("Calling onInitialized callback - textures loaded");
      onInitialized();
      initCallbackFiredRef.current = true;
    }
  }, [onInitialized]);
  
  // Use globe setup hook with texture callback
  const { globe } = useGlobeSetup(
    scene,
    camera,
    controlsRef,
    containerRef,
    handleTexturesLoaded
  );
  
  // Set up animation loop
  useGlobeAnimation(
    scene,
    camera,
    renderer,
    controlsRef,
    autoRotationEnabledRef,
    isFlyingRef
  );
  
  // Get enhanced fly to location functionality
  const { enhancedFlyToLocation } = useEnhancedFlyToLocation(
    camera,
    controlsRef,
    EARTH_RADIUS,
    isFlyingRef
  );
  
  // Initialize effect - mark as initialized after a small timeout
  useEffect(() => {
    if (isSetupCompleteRef.current || !containerRef.current) return;
    
    // Mark as initialized after a small timeout to ensure everything is ready
    const timer = setTimeout(() => {
      if (!isInitialized && containerRef.current) {
        console.log("Setting isInitialized to true");
        setIsInitialized(true);
        isSetupCompleteRef.current = true;
        
        // Call initialization callback if textures aren't loaded within reasonable time
        if (onInitialized && !initCallbackFiredRef.current) {
          console.log("Calling onInitialized even though textures may not be fully loaded");
          onInitialized();
          initCallbackFiredRef.current = true;
        }
      }
    }, 1000); // Give it 1 second to load, then move on regardless
    
    return () => {
      clearTimeout(timer);
      isSetupCompleteRef.current = false;
    };
  }, [isInitialized, setIsInitialized, onInitialized, containerRef]);
  
  return {
    scene,
    camera,
    renderer,
    controls: controlsRef.current,
    globe,
    isInitialized,
    flyToLocation: enhancedFlyToLocation,
    setAutoRotation,
    addMarker
  };
}
