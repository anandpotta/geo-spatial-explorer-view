
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
  const mountedRef = useRef<boolean>(true);
  
  // State
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Use sub-hooks
  const { rendererRef, canvasElementRef, createRenderer, disposeRenderer, resizeRenderer } = useThreeRenderer(containerRef);
  const { cameraRef, createCamera, updateCameraAspect } = useThreeCamera(containerRef);
  const { controlsRef, createControls, disposeControls } = useThreeControls();
  
  // Initialize scene
  const createScene = useCallback(() => {
    if (!mountedRef.current) return null;
    
    const options = createThreeViewerOptions();
    
    // Create scene with natural background color
    const scene = new THREE.Scene();
    scene.background = options.backgroundColor;
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
      sceneRef.current.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          if (obj.geometry) {
            obj.geometry.dispose();
          }
          
          if (obj.material) {
            if (Array.isArray(obj.material)) {
              obj.material.forEach(material => material.dispose());
            } else {
              obj.material.dispose();
            }
          }
        }
      });
      
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
    if (!mountedRef.current) return;
    
    updateCameraAspect();
    resizeRenderer();
  }, [updateCameraAspect, resizeRenderer]);
  
  // Check if container is in DOM
  const isContainerInDOM = useCallback(() => {
    if (!containerRef.current) {
      return false;
    }
    
    // Check if the container is actually in the DOM
    let element = containerRef.current;
    while (element.parentNode) {
      element = element.parentNode as HTMLElement;
      if (element === document.body) {
        return true;
      }
    }
    
    console.log("Container not in DOM, skipping initialization");
    return false;
  }, [containerRef]);
  
  // Initialize scene
  useEffect(() => {
    if (!containerRef.current || !mountedRef.current || !isContainerInDOM()) {
      return;
    }
    
    console.log("Initializing Three.js scene");
    
    // Clean up any previous instance
    cleanup();
    
    // Create scene
    const scene = createScene();
    if (!scene) {
      console.error("Failed to create scene");
      return;
    }
    
    // Create camera
    const camera = createCamera();
    if (!camera) {
      console.error("Failed to create camera");
      return;
    }
    
    // Create renderer
    const renderer = createRenderer();
    if (!renderer || !canvasElementRef.current) {
      console.error("Failed to create renderer or canvas element");
      return;
    }
    
    // Create controls
    const controls = createControls(camera, canvasElementRef.current);
    if (!controls) {
      console.error("Failed to create controls");
      return;
    }
    
    // Initial render to make sure something is visible
    renderer.render(scene, camera);
    
    console.log("Three.js scene initialized with natural colors settings");
    
    // Call the onSceneReady callback if provided
    if (onSceneReady && mountedRef.current) {
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
    };
  }, [containerRef, cleanup, onSceneReady, createScene, createCamera, createRenderer, createControls, canvasElementRef, handleResize, isContainerInDOM]);
  
  // Handle unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [cleanup]);
  
  return {
    scene: sceneRef.current,
    camera: cameraRef.current,
    renderer: rendererRef.current,
    controls: controlsRef.current,
    isInitialized,
    setIsInitialized,
    animationFrameRef,
    canvasElementRef,
    controlsRef,
    cleanup
  };
}
