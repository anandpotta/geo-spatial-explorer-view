
import { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { createThreeViewerOptions } from '@/utils/threejs-viewer/viewer-options';
import { useThreeRenderer } from './useThreeRenderer';
import { useThreeCamera } from './useThreeCamera';
import { useThreeControls } from './useThreeControls';

/**
 * Hook to initialize and manage the basic Three.js scene, camera, and renderer
 */
export function useThreeScene(
  containerRef: React.RefObject<HTMLDivElement>,
  onSceneReady?: () => void
) {
  // Core Three.js objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // State
  const [isInitialized, setIsInitialized] = useState(false);
  const initializationAttemptedRef = useRef(false);
  
  // Use sub-hooks
  const { rendererRef, canvasElementRef, createRenderer, disposeRenderer, resizeRenderer } = useThreeRenderer(containerRef);
  const { cameraRef, createCamera, updateCameraAspect } = useThreeCamera(containerRef);
  const { controlsRef, createControls, disposeControls } = useThreeControls();
  
  // Initialize scene
  const createScene = useCallback(() => {
    const options = createThreeViewerOptions();
    
    // Create scene with natural background color
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000011); // Ensure we have a visible background
    sceneRef.current = scene;
    
    console.log("Three.js scene created");
    return scene;
  }, []);
  
  // Clean up resources
  const cleanup = useCallback(() => {
    console.log("Three.js scene cleanup starting");
    
    // Cancel any animation frames
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Dispose controls
    disposeControls();
    
    // Dispose scene
    if (sceneRef.current) {
      sceneRef.current.clear();
      sceneRef.current = null;
    }
    
    // Dispose renderer
    disposeRenderer();
    
    // Clear camera reference
    cameraRef.current = null;
    console.log("Three.js scene cleanup complete");
  }, [disposeControls, disposeRenderer]);
  
  // Handle window resize
  const handleResize = useCallback(() => {
    updateCameraAspect();
    resizeRenderer();
  }, [updateCameraAspect, resizeRenderer]);
  
  // Initialize scene
  useEffect(() => {
    if (!containerRef.current || initializationAttemptedRef.current) {
      return;
    }
    
    initializationAttemptedRef.current = true;
    console.log("Initializing Three.js scene");
    
    // Clean up any previous instance
    cleanup();
    
    // Create scene
    const scene = createScene();
    
    // Create camera
    const camera = createCamera();
    if (!camera) {
      console.error("Failed to create camera");
      return;
    }
    
    // Create renderer
    const renderer = createRenderer();
    if (!renderer) {
      console.error("Failed to create renderer");
      return;
    }
    
    // Make sure the canvas element is added to the container
    if (canvasElementRef.current && !containerRef.current.contains(canvasElementRef.current)) {
      try {
        containerRef.current.appendChild(canvasElementRef.current);
        console.log("Canvas element added to container");
      } catch (err) {
        console.error("Error appending canvas to container:", err);
      }
    }
    
    // Create controls only if we have both camera and canvas
    if (camera && canvasElementRef.current) {
      const controls = createControls(camera, canvasElementRef.current);
      if (!controls) {
        console.error("Failed to create controls");
      }
    } else {
      console.error("Cannot create controls: missing camera or canvas element");
    }
    
    // Initial render to make sure something is visible
    if (renderer && camera && scene) {
      renderer.render(scene, camera);
      console.log("Initial render completed");
    }
    
    console.log("Three.js scene initialized with natural colors settings");
    
    // Call the onSceneReady callback if provided
    if (onSceneReady) {
      onSceneReady();
    }
    
    setIsInitialized(true);
    
    // Handle window resize
    window.addEventListener('resize', handleResize);
    
    // Initial call to handleResize to ensure everything is set up correctly
    setTimeout(handleResize, 100);
    
    // Clean up on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      cleanup();
      initializationAttemptedRef.current = false;
    };
  }, [containerRef, cleanup, onSceneReady, createScene, createCamera, createRenderer, createControls, canvasElementRef, handleResize]);
  
  return {
    scene: sceneRef.current,
    camera: cameraRef.current,
    renderer: rendererRef.current,
    controls: controlsRef.current,
    isInitialized,
    setIsInitialized,
    animationFrameRef,
    canvasElementRef,
    controlsRef
  };
}
