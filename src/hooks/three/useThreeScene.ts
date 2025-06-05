
import { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { createThreeViewerOptions } from '@/utils/threejs-viewer/viewer-options';

/**
 * Hook to initialize and manage the basic Three.js scene, camera, and renderer
 */
export function useThreeScene(
  containerRef: React.RefObject<HTMLDivElement>,
  onSceneReady?: () => void
) {
  // Core Three.js objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const canvasElementRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // State
  const [isInitialized, setIsInitialized] = useState(false);
  const initializationAttemptedRef = useRef(false);
  
  // Clean up resources
  const cleanup = useCallback(() => {
    console.log("Three.js scene cleanup starting");
    
    // Cancel any animation frames
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Dispose of controls
    if (controlsRef.current) {
      controlsRef.current.dispose();
      controlsRef.current = null;
    }
    
    // Dispose of all scene objects
    if (sceneRef.current) {
      sceneRef.current.clear();
      sceneRef.current = null;
    }
    
    // Clean up renderer
    if (rendererRef.current) {
      rendererRef.current.dispose();
      
      // Only try to remove the canvas if it exists and has a parent
      if (canvasElementRef.current && canvasElementRef.current.parentNode) {
        try {
          canvasElementRef.current.parentNode.removeChild(canvasElementRef.current);
        } catch (e) {
          console.warn("Could not remove canvas from parent:", e);
        }
      }
      
      rendererRef.current = null;
      canvasElementRef.current = null;
    }
    
    cameraRef.current = null;
    initializationAttemptedRef.current = false;
    console.log("Three.js scene cleanup complete");
  }, []);
  
  // Initialize scene
  useEffect(() => {
    // Don't initialize multiple times
    if (initializationAttemptedRef.current) {
      console.log("Three.js scene initialization already attempted");
      return;
    }

    if (!containerRef.current) {
      console.log("Container ref not available for Three.js scene, retrying...");
      // Retry after a short delay if container is not ready
      const retryTimeout = setTimeout(() => {
        if (containerRef.current && !initializationAttemptedRef.current) {
          console.log("Container now available, retrying initialization");
          // Force re-run of this effect
          setIsInitialized(false);
        }
      }, 100);
      
      return () => clearTimeout(retryTimeout);
    }
    
    console.log("Initializing Three.js scene");
    initializationAttemptedRef.current = true;
    
    // Clean up any previous instance
    cleanup();
    
    try {
      const options = createThreeViewerOptions();
      
      // Create scene with natural background color
      const scene = new THREE.Scene();
      scene.background = options.backgroundColor;
      sceneRef.current = scene;
      console.log("Three.js scene created");
      
      // Create camera
      const { clientWidth, clientHeight } = containerRef.current;
      
      // Ensure valid dimensions - use minimum values if we get zeros
      const width = Math.max(clientWidth || 800, 100); 
      const height = Math.max(clientHeight || 600, 100);
      
      console.log(`Creating camera with dimensions: ${width}x${height}`);
      
      const camera = new THREE.PerspectiveCamera(
        options.cameraOptions.fov,
        width / height,
        options.cameraOptions.near,
        options.cameraOptions.far
      );
      camera.position.copy(options.cameraOptions.position);
      cameraRef.current = camera;
      console.log("Three.js camera created");
      
      // Create renderer with enhanced settings for better quality
      const renderer = new THREE.WebGLRenderer({
        antialias: options.rendering.antialias,
        alpha: options.rendering.alpha,
        preserveDrawingBuffer: options.rendering.preserveDrawingBuffer,
        powerPreference: options.rendering.powerPreference as WebGLPowerPreference,
      });
      
      // Set size with valid dimensions
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance
      renderer.outputEncoding = THREE.sRGBEncoding; // Use outputEncoding in THREE.js v0.133.0
      renderer.physicallyCorrectLights = true; // More natural lighting
      rendererRef.current = renderer;
      console.log("Three.js renderer created");
      
      // Append renderer to container
      const canvas = renderer.domElement;
      containerRef.current.appendChild(canvas);
      canvasElementRef.current = canvas;
      console.log("Three.js canvas added to container");
      
      // Create orbit controls
      const controls = new OrbitControls(camera, canvas);
      controlsRef.current = controls;
      console.log("Three.js controls created");
      
      // Initial render to make sure something is visible
      renderer.render(scene, camera);
      console.log("Three.js initial render complete");
      
      console.log("Three.js scene initialized successfully");
      
      // Mark as initialized
      setIsInitialized(true);
      
      // Call the onSceneReady callback if provided
      if (onSceneReady) {
        console.log("Calling onSceneReady callback");
        onSceneReady();
      }
      
    } catch (error) {
      console.error("Failed to initialize Three.js scene:", error);
      initializationAttemptedRef.current = false; // Allow retry on error
    }
    
    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      
      // Get new dimensions
      const { clientWidth, clientHeight } = containerRef.current;
      
      // Ensure valid dimensions
      const width = Math.max(clientWidth || 800, 100);
      const height = Math.max(clientHeight || 600, 100);
      
      // Update camera aspect ratio
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      
      // Update renderer size
      rendererRef.current.setSize(width, height);
      
      console.log(`Resized renderer to ${width}x${height}`);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Initial call to handleResize to ensure everything is set up correctly
    const resizeTimeout = setTimeout(handleResize, 100);
    
    // Clean up on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
      cleanup();
    };
  }, [containerRef, cleanup, onSceneReady]);
  
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
