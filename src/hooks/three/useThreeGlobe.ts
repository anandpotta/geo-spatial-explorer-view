
import { useRef, useState, useCallback } from 'react';
import { useThreeScene } from './useThreeScene';
import { useAutoRotation } from './useAutoRotation';
import { useEnhancedFlyToLocation } from './useEnhancedFlyToLocation';
import { useMarkers } from './useMarkers';
import { EARTH_RADIUS } from '@/utils/three/globe-factory';
import { useGlobeInit } from './useGlobeInit';
import { useGlobeCallbacks } from './useGlobeCallbacks';
import { useGlobeCleanup } from './useGlobeCleanup';

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
    controlsRef,
    cleanup: sceneCleanup
  } = useThreeScene(containerRef);

  // State and refs
  const isFlyingRef = useRef<boolean>(false);
  
  // Get auto-rotation functionality
  const { autoRotationEnabledRef, setAutoRotation } = useAutoRotation(controlsRef);
  
  // Manage callbacks and initialization
  const { handleTexturesLoaded } = useGlobeCallbacks(
    isInitialized,
    setIsInitialized,
    containerRef,
    onInitialized
  );
  
  // Initialize the globe components
  const { globe, setupRenderer, cleanup: initCleanup } = useGlobeInit(
    scene,
    camera,
    renderer,
    controlsRef,
    containerRef,
    autoRotationEnabledRef,
    isFlyingRef,
    handleTexturesLoaded
  );
  
  // Get markers functionality
  const { addMarker, cleanup: markersCleanup } = useMarkers(scene);
  
  // Get enhanced fly to location functionality
  const { enhancedFlyToLocation, cleanup: flyCleanup } = useEnhancedFlyToLocation(
    camera,
    controlsRef,
    EARTH_RADIUS,
    isFlyingRef
  );
  
  // Set up renderer when it's available
  if (renderer && !initCleanup) {
    setupRenderer();
  }
  
  // Create master cleanup function
  const cleanupAll = useGlobeCleanup([
    flyCleanup,
    initCleanup,
    markersCleanup,
    sceneCleanup
  ]);
  
  return {
    scene,
    camera,
    renderer,
    controls: controlsRef.current,
    globe,
    isInitialized,
    flyToLocation: enhancedFlyToLocation,
    setAutoRotation,
    addMarker,
    cleanup: cleanupAll
  };
}
