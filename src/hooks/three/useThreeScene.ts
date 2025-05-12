
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
    
    console.log("Three.js scene cleanup complete");
  }, []);
  
  // Initialize scene
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Clean up any previous instance
    cleanup();
    
    const options = createThreeViewerOptions();
    
    // Create scene
    const scene = new THREE.Scene();
    scene.background = options.backgroundColor;
    
    // Create camera
    const { clientWidth, clientHeight } = containerRef.current;
    const camera = new THREE.PerspectiveCamera(
      options.cameraOptions.fov,
      clientWidth / clientHeight,
      options.cameraOptions.near,
      options.cameraOptions.far
    );
    camera.position.copy(options.cameraOptions.position);
    
    // Create renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: options.rendering.antialias,
      alpha: options.rendering.alpha,
      preserveDrawingBuffer: options.rendering.preserveDrawingBuffer,
      powerPreference: options.rendering.powerPreference as WebGLPowerPreference,
    });
    renderer.setSize(clientWidth, clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    
    // Append renderer to container
    containerRef.current.appendChild(renderer.domElement);
    canvasElementRef.current = renderer.domElement;
    
    // Store references
    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;
    
    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      
      const { clientWidth, clientHeight } = containerRef.current;
      cameraRef.current.aspect = clientWidth / clientHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(clientWidth, clientHeight);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Clean up on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      cleanup();
    };
  }, [containerRef, cleanup]);
  
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
