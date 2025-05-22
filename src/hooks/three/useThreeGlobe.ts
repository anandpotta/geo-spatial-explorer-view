
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
  const isDisposedRef = useRef<boolean>(false);
  const initCallbackFiredRef = useRef<boolean>(false);
  
  // Get auto-rotation functionality
  const { autoRotationEnabledRef, setAutoRotation } = useAutoRotation(controlsRef);
  
  // Get markers functionality
  const { addMarker } = useMarkers(scene);
  
  // Handle textures loaded callback
  const handleTexturesLoaded = useCallback(() => {
    if (onInitialized && isInitialized && !isDisposedRef.current && !initCallbackFiredRef.current) {
      console.log("Calling onInitialized callback - textures loaded");
      initCallbackFiredRef.current = true;
      onInitialized();
    }
  }, [onInitialized, isInitialized]);
  
  // Use globe setup hook with texture callback
  const { globe, texturesLoaded } = useGlobeSetup(
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
  const { enhancedFlyToLocation, cancelFlight } = useEnhancedFlyToLocation(
    camera,
    controlsRef,
    EARTH_RADIUS,
    isFlyingRef
  );
  
  // Initialize effect - mark as initialized after scene is ready
  useEffect(() => {
    if (!containerRef.current || isDisposedRef.current || initCallbackFiredRef.current) return;
    
    // Check if scene is really ready
    if (scene && camera && renderer && controlsRef.current) {
      console.log("ThreeGlobe initialization check: scene ready");
      
      // If scene is ready but not marked initialized yet
      if (!isInitialized) {
        console.log("Setting isInitialized to true");
        setIsInitialized(true);
      }
      
      // If we've loaded textures or waited long enough, fire the callback
      if ((texturesLoaded || isSetupCompleteRef.current) && !initCallbackFiredRef.current) {
        console.log("ThreeGlobe: All conditions met for initialization");
        isSetupCompleteRef.current = true;
        initCallbackFiredRef.current = true;
        
        if (onInitialized) {
          console.log("Calling onInitialized callback from main effect");
          onInitialized();
        }
      }
    }
  }, [scene, camera, renderer, controlsRef, isInitialized, setIsInitialized, onInitialized, 
      containerRef, texturesLoaded, isSetupCompleteRef]);
  
  // Backup timer to ensure callback is fired even if textures fail
  useEffect(() => {
    if (!containerRef.current || isDisposedRef.current || initCallbackFiredRef.current) return;
    
    const timer = setTimeout(() => {
      if (!initCallbackFiredRef.current && !isDisposedRef.current) {
        console.log("ThreeGlobe: Firing initialization callback after timeout");
        isSetupCompleteRef.current = true;
        initCallbackFiredRef.current = true;
        
        if (onInitialized) {
          onInitialized();
        }
      }
    }, 4000);
    
    return () => {
      clearTimeout(timer);
      isDisposedRef.current = true;
    };
  }, [onInitialized, containerRef]);
  
  return {
    scene,
    camera,
    renderer,
    controls: controlsRef.current,
    globe,
    isInitialized,
    flyToLocation: enhancedFlyToLocation,
    cancelFlight,
    setAutoRotation,
    addMarker
  };
}
