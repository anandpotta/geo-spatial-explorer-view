
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
  const initializationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initCallbackFiredRef = useRef<boolean>(false);
  
  // Get auto-rotation functionality
  const { autoRotationEnabledRef, setAutoRotation } = useAutoRotation(controlsRef);
  
  // Get markers functionality
  const { addMarker } = useMarkers(scene);
  
  // Handle textures loaded callback with delay to ensure smooth appearance
  const handleTexturesLoaded = useCallback(() => {
    if (onInitialized && isInitialized && !initCallbackFiredRef.current) {
      console.log("Textures loaded, preparing to call onInitialized callback");
      
      // Mark that we've fired the callback to prevent double initialization
      initCallbackFiredRef.current = true;
      
      // Small delay to ensure textures are applied before showing
      setTimeout(() => {
        console.log("Calling onInitialized callback - textures loaded and applied");
        onInitialized();
      }, 150);
    }
  }, [onInitialized, isInitialized]);
  
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
  
  // Initialize effect - improved initialization with better fallbacks
  useEffect(() => {
    if (isSetupCompleteRef.current || !containerRef.current) return;
    
    // Clear any existing timeout
    if (initializationTimeoutRef.current) {
      clearTimeout(initializationTimeoutRef.current);
    }
    
    // Mark as initialized after a reasonable timeout to ensure everything is ready
    initializationTimeoutRef.current = setTimeout(() => {
      if (!isInitialized && containerRef.current && !initCallbackFiredRef.current) {
        console.log("Setting isInitialized to true after timeout");
        setIsInitialized(true);
        isSetupCompleteRef.current = true;
        
        // Even if textures are still loading, we'll consider the globe ready
        // to avoid getting stuck at the loading screen
        if (onInitialized && !initCallbackFiredRef.current) {
          console.log("Calling onInitialized as fallback to prevent stuck loading");
          initCallbackFiredRef.current = true;
          onInitialized();
        }
      }
    }, 3500); // Give it more time to load properly, but not too much to get stuck
    
    return () => {
      if (initializationTimeoutRef.current) {
        clearTimeout(initializationTimeoutRef.current);
        initializationTimeoutRef.current = null;
      }
      initCallbackFiredRef.current = false;
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
