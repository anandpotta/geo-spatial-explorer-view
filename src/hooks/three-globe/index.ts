
import { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { ThreeGlobeResult, FlyingState } from './types';
import { isWebGLAvailable, disposeObject, disposeScene } from './utils';
import { setupControls } from './controls-setup';
import { updateFlyingAnimation, setupFlyToLocation } from './flight-controller';
import { initializeScene, setupResizeHandler } from './scene-setup';

/**
 * Primary hook for handling Three.js globe functionality
 */
export const useThreeGlobe = (
  containerRef: React.RefObject<HTMLDivElement>,
  onGlobeReady?: () => void
): ThreeGlobeResult => {
  // Refs for Three.js objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const globeRef = useRef<THREE.Mesh | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isInitializedRef = useRef<boolean>(false);
  const rendererDomElementRef = useRef<HTMLCanvasElement | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // State for tracking flying animations
  const flyingStateRef = useRef<FlyingState>({
    isFlying: false,
    startPosition: new THREE.Vector3(),
    targetPosition: new THREE.Vector3(),
    startTime: 0,
    duration: 0,
    onComplete: null,
  });

  // Clean up function to properly dispose resources
  const cleanup = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Safely remove the renderer's DOM element
    try {
      if (rendererDomElementRef.current && containerRef.current) {
        // Check if the element is actually a child before attempting removal
        if (containerRef.current.contains(rendererDomElementRef.current)) {
          containerRef.current.removeChild(rendererDomElementRef.current);
        }
      }
    } catch (e) {
      console.warn('Could not remove renderer DOM element', e);
    }
    
    // Dispose of Three.js resources
    if (globeRef.current) {
      disposeObject(globeRef.current);
      globeRef.current = null;
    }
    
    if (sceneRef.current) {
      disposeScene(sceneRef.current);
      sceneRef.current = null;
    }
    
    if (rendererRef.current) {
      rendererRef.current.dispose();
      rendererRef.current = null;
    }
    
    // Clear other references
    rendererDomElementRef.current = null;
    cameraRef.current = null;
    isInitializedRef.current = false;
    setIsInitialized(false);
  }, [containerRef]);

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current || isInitializedRef.current) return;
    
    const container = containerRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    
    try {
      // Check for WebGL support
      if (!isWebGLAvailable()) {
        console.error('WebGL is not supported in this browser');
        return;
      }
      
      // Clear any existing canvas elements to prevent duplicates
      const existingCanvases = Array.from(container.children).filter(
        child => child instanceof HTMLCanvasElement
      );
      
      existingCanvases.forEach(canvas => {
        container.removeChild(canvas);
      });
      
      // Initialize scene, camera, renderer, and globe
      const { scene, camera, renderer, globe } = initializeScene(width, height);
      
      // Store a reference to the canvas element
      rendererDomElementRef.current = renderer.domElement;
      
      // Append the renderer's canvas to the container
      container.appendChild(renderer.domElement);
      
      // Store refs
      sceneRef.current = scene;
      cameraRef.current = camera;
      rendererRef.current = renderer;
      globeRef.current = globe;
      isInitializedRef.current = true;
      setIsInitialized(true);
      
      // Set up animation loop
      const animate = () => {
        if (!rendererRef.current || !sceneRef.current || !cameraRef.current) {
          return; // Early return if essential components are missing
        }
        
        if (globeRef.current && !flyingStateRef.current.isFlying) {
          // Auto-rotate when not flying
          globeRef.current.rotation.y += 0.001;
        }
        
        // Handle flying animation if active
        if (flyingStateRef.current.isFlying) {
          updateFlyingAnimation(flyingStateRef, cameraRef);
        }
        
        rendererRef.current.render(sceneRef.current, cameraRef.current);
        animationFrameRef.current = requestAnimationFrame(animate);
      };
      
      animationFrameRef.current = requestAnimationFrame(animate);
      
      // Add event listeners for resize
      const removeResizeHandler = setupResizeHandler(containerRef, cameraRef, rendererRef);
      
      // Add basic controls
      setupControls(container, globeRef, cameraRef, flyingStateRef);
      
      // Signal that the globe is ready
      if (onGlobeReady) {
        setTimeout(onGlobeReady, 500);
      }
      
      // Cleanup function
      return () => {
        // Remove resize handler
        removeResizeHandler();
        cleanup();
      };
    } catch (error) {
      console.error('Error initializing Three.js globe:', error);
      cleanup();
    }
  }, [containerRef, onGlobeReady, cleanup]);
  
  // Initialize flyToLocation function
  const flyToLocation = useCallback(setupFlyToLocation(cameraRef, globeRef, flyingStateRef), []);
  
  return {
    scene: sceneRef.current,
    camera: cameraRef.current,
    renderer: rendererRef.current,
    globe: globeRef.current,
    flyToLocation,
    isInitialized,
  };
};
