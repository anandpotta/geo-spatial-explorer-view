
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
    controlsRef,
    cleanup: sceneCleanup
  } = useThreeScene(containerRef);

  // State management
  const isSetupCompleteRef = useRef(false);
  const isFlyingRef = useRef<boolean>(false);
  const initializationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initCallbackFiredRef = useRef<boolean>(false);
  const forceInitTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const texturesLoadedRef = useRef<boolean>(false);
  const mountedRef = useRef<boolean>(true);
  
  // Get auto-rotation functionality
  const { autoRotationEnabledRef, setAutoRotation } = useAutoRotation(controlsRef);
  
  // Get markers functionality with explicit cleanup
  const markers = useMarkers(scene);
  const { addMarker } = markers;
  const markersCleanup = markers.cleanup || (() => {}); // Provide a default if cleanup is undefined
  
  // Handle textures loaded callback with delay to ensure smooth appearance
  const handleTexturesLoaded = useCallback(() => {
    // Don't re-fire if textures were already loaded or component unmounted
    if (texturesLoadedRef.current || !mountedRef.current) return;
    texturesLoadedRef.current = true;
    
    if (onInitialized && isInitialized && !initCallbackFiredRef.current && mountedRef.current) {
      console.log("Textures loaded, preparing to call onInitialized callback");
      
      // Mark that we've fired the callback to prevent double initialization
      initCallbackFiredRef.current = true;
      
      // Small delay to ensure textures are applied before showing
      setTimeout(() => {
        if (mountedRef.current) {
          console.log("Calling onInitialized callback - textures loaded and applied");
          onInitialized();
        }
      }, 150);
    }
  }, [onInitialized, isInitialized]);
  
  // Use globe setup hook with texture callback
  const { globe, cleanup: globeCleanup } = useGlobeSetup(
    scene,
    camera,
    controlsRef,
    containerRef,
    handleTexturesLoaded
  );
  
  // Set up animation loop
  const { cleanup: animationCleanup } = useGlobeAnimation(
    scene,
    camera,
    renderer,
    controlsRef,
    autoRotationEnabledRef,
    isFlyingRef
  );
  
  // Get enhanced fly to location functionality
  const { enhancedFlyToLocation, cleanup: flyCleanup } = useEnhancedFlyToLocation(
    camera,
    controlsRef,
    EARTH_RADIUS,
    isFlyingRef
  );
  
  // Master cleanup function
  const cleanupAll = useCallback(() => {
    // Clear all timeouts
    if (initializationTimeoutRef.current) {
      clearTimeout(initializationTimeoutRef.current);
      initializationTimeoutRef.current = null;
    }
    
    if (forceInitTimeoutRef.current) {
      clearTimeout(forceInitTimeoutRef.current);
      forceInitTimeoutRef.current = null;
    }
    
    // Call all cleanup functions
    flyCleanup();
    animationCleanup();
    globeCleanup();
    markersCleanup();
    sceneCleanup();
  }, [flyCleanup, animationCleanup, globeCleanup, markersCleanup, sceneCleanup]);
  
  // Force initialization after a delay if not already initialized
  useEffect(() => {
    if (initCallbackFiredRef.current || !containerRef.current) return;
    
    // Set a forced initialization timeout as a safety measure
    forceInitTimeoutRef.current = setTimeout(() => {
      if (!isInitialized && containerRef.current && mountedRef.current) {
        console.log("Forcing initialization after timeout");
        setIsInitialized(true);
        
        // If onInitialized callback hasn't fired yet, fire it
        if (!initCallbackFiredRef.current && onInitialized && mountedRef.current) {
          console.log("Calling onInitialized callback from force init timeout");
          initCallbackFiredRef.current = true;
          onInitialized();
        }
      }
    }, 2000); // Reduced timeout for better responsiveness
    
    return () => {
      if (forceInitTimeoutRef.current) {
        clearTimeout(forceInitTimeoutRef.current);
        forceInitTimeoutRef.current = null;
      }
    };
  }, [isInitialized, setIsInitialized, onInitialized, containerRef]);
  
  // Initialize effect - improved initialization with better fallbacks
  useEffect(() => {
    if (isSetupCompleteRef.current || !containerRef.current) return;
    
    // Clear any existing timeout
    if (initializationTimeoutRef.current) {
      clearTimeout(initializationTimeoutRef.current);
    }
    
    // Mark as initialized after a reasonable timeout to ensure everything is ready
    initializationTimeoutRef.current = setTimeout(() => {
      if (!isInitialized && containerRef.current && !initCallbackFiredRef.current && mountedRef.current) {
        console.log("Setting isInitialized to true after timeout");
        setIsInitialized(true);
        isSetupCompleteRef.current = true;
        
        // Even if textures are still loading, we'll consider the globe ready
        // to avoid getting stuck at the loading screen
        if (onInitialized && !initCallbackFiredRef.current && mountedRef.current) {
          console.log("Calling onInitialized as fallback to prevent stuck loading");
          initCallbackFiredRef.current = true;
          onInitialized();
        }
      }
    }, 1800); // Slightly reduced timeout for better responsiveness
    
    return () => {
      if (initializationTimeoutRef.current) {
        clearTimeout(initializationTimeoutRef.current);
        initializationTimeoutRef.current = null;
      }
    };
  }, [isInitialized, setIsInitialized, onInitialized, containerRef]);
  
  // Handle additional renderer setup when it's available
  useEffect(() => {
    if (renderer && !isSetupCompleteRef.current && mountedRef.current) {
      // Set pixel ratio for better quality on high-DPI displays
      renderer.setPixelRatio(Math.min(2, window.devicePixelRatio)); // Limit to 2x for performance
      
      // Enable shadow mapping for more realistic rendering
      renderer.shadowMap.enabled = true;
      
      // Force a render to ensure the scene appears
      if (scene && camera) {
        renderer.render(scene, camera);
      }
    }
  }, [renderer, scene, camera]);
  
  // Unmount cleanup
  useEffect(() => {
    return () => {
      console.log("useThreeGlobe hook unmounting, cleaning up all resources");
      mountedRef.current = false;
      cleanupAll();
    };
  }, [cleanupAll]);
  
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
