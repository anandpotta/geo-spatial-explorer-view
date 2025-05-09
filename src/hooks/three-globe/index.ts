
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
      
      // Initialize scene, camera, renderer, and globe
      const { scene, camera, renderer, globe } = initializeScene(width, height);
      
      // Store a reference to the canvas element
      rendererDomElementRef.current = renderer.domElement;
      
      // Clear any existing canvas elements to prevent duplicates
      Array.from(container.children).forEach(child => {
        if (child instanceof HTMLCanvasElement) {
          container.removeChild(child);
        }
      });
      
      // Append the renderer's canvas to the container
      container.appendChild(renderer.domElement);
      
      // Store refs
      sceneRef.current = scene;
      cameraRef.current = camera;
      rendererRef.current = renderer;
      globeRef.current = globe;
      isInitializedRef.current = true;
      setIsInitialized(true);
      
      // Initial camera position - start from farther out for dramatic effect
      camera.position.z = EARTH_RADIUS * 4;
      camera.lookAt(new THREE.Vector3(0, 0, 0));
      
      // Add a subtle initial animation
      setTimeout(() => {
        if (cameraRef.current) {
          const startPos = cameraRef.current.position.clone();
          const endPos = new THREE.Vector3(0, 0, EARTH_RADIUS * 2.8);
          
          let startTime = Date.now();
          const animateCameraIn = () => {
            const now = Date.now();
            const progress = Math.min((now - startTime) / 3000, 1.0);
            
            if (cameraRef.current) {
              cameraRef.current.position.lerpVectors(startPos, endPos, progress);
              cameraRef.current.lookAt(new THREE.Vector3(0, 0, 0));
            }
            
            if (progress < 1.0) {
              requestAnimationFrame(animateCameraIn);
            }
          };
          
          animateCameraIn();
        }
      }, 500);
      
      // Set up animation loop
      const animate = () => {
        if (globeRef.current && !flyingStateRef.current.isFlying) {
          // Auto-rotate when not flying
          globeRef.current.rotation.y += 0.0005;
        }
        
        // Handle flying animation if active
        if (flyingStateRef.current.isFlying) {
          updateFlyingAnimation(flyingStateRef, cameraRef);
        }
        
        if (rendererRef.current && sceneRef.current && cameraRef.current) {
          rendererRef.current.render(sceneRef.current, cameraRef.current);
        }
        
        animationFrameRef.current = requestAnimationFrame(animate);
      };
      
      animate();
      
      // Add event listeners for resize
      const removeResizeHandler = setupResizeHandler(containerRef, cameraRef, rendererRef);
      
      // Add basic controls
      setupControls(container, globeRef, cameraRef, flyingStateRef);
      
      // Signal that the globe is ready
      if (onGlobeReady) {
        setTimeout(onGlobeReady, 2500); // Give time for initial animation
      }
      
      // Cleanup function
      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        
        // Remove resize handler
        removeResizeHandler();
        
        // Important: Safely check if the canvas is still a child of the container
        if (rendererDomElementRef.current && containerRef.current) {
          const canvasIsChild = Array.from(containerRef.current.children).includes(rendererDomElementRef.current);
          if (canvasIsChild) {
            try {
              containerRef.current.removeChild(rendererDomElementRef.current);
            } catch (e) {
              console.warn('Could not remove renderer DOM element', e);
            }
          }
        }
        
        // Dispose of Three.js resources
        if (globeRef.current) {
          disposeObject(globeRef.current);
        }
        
        if (sceneRef.current) {
          disposeScene(sceneRef.current);
        }
        
        if (rendererRef.current) {
          rendererRef.current.dispose();
        }
        
        // Clear references
        rendererDomElementRef.current = null;
        sceneRef.current = null;
        cameraRef.current = null;
        rendererRef.current = null;
        globeRef.current = null;
        isInitializedRef.current = false;
      };
    } catch (error) {
      console.error('Error initializing Three.js globe:', error);
    }
  }, [containerRef, onGlobeReady]);
  
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
