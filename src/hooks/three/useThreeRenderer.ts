
import { useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { createThreeViewerOptions } from '@/utils/threejs-viewer/viewer-options';

/**
 * Hook to initialize and manage the Three.js renderer
 */
export function useThreeRenderer(
  containerRef: React.RefObject<HTMLDivElement>
) {
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const canvasElementRef = useRef<HTMLCanvasElement | null>(null);
  
  // Create renderer
  const createRenderer = useCallback(() => {
    if (!containerRef.current) {
      console.warn("Container ref not available for Three.js renderer");
      return null;
    }
    
    const options = createThreeViewerOptions();
    
    try {
      // Create renderer with enhanced settings for better quality
      const renderer = new THREE.WebGLRenderer({
        antialias: options.rendering.antialias,
        alpha: options.rendering.alpha,
        preserveDrawingBuffer: options.rendering.preserveDrawingBuffer,
        powerPreference: options.rendering.powerPreference as WebGLPowerPreference,
      });
      
      // Get the dimensions from the container
      const { clientWidth, clientHeight } = containerRef.current;
      
      // Ensure valid dimensions - use minimum values if we get zeros
      const width = clientWidth || 800; 
      const height = clientHeight || 600;
      
      // Set size with valid dimensions
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance
      renderer.outputEncoding = THREE.sRGBEncoding; // Use outputEncoding in THREE.js v0.133.0
      renderer.physicallyCorrectLights = true; // More natural lighting
      
      console.log("High-quality renderer created");
      
      // Append renderer to container
      const canvas = renderer.domElement;
      containerRef.current.appendChild(canvas);
      canvasElementRef.current = canvas;
      rendererRef.current = renderer;
      
      console.log("Renderer added to container");
      return renderer;
    } catch (error) {
      console.error("Failed to initialize WebGL renderer:", error);
      return null;
    }
  }, [containerRef]);
  
  // Dispose renderer
  const disposeRenderer = useCallback(() => {
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
      console.log("Renderer disposed");
    }
  }, []);
  
  // Resize renderer
  const resizeRenderer = useCallback(() => {
    if (!containerRef.current || !rendererRef.current) return;
    
    // Get new dimensions
    const { clientWidth, clientHeight } = containerRef.current;
    
    // Ensure valid dimensions
    const width = clientWidth || 800;
    const height = clientHeight || 600;
    
    // Update renderer size
    rendererRef.current.setSize(width, height);
    console.log(`Resized renderer to ${width}x${height}`);
  }, [containerRef, rendererRef]);
  
  return {
    rendererRef,
    canvasElementRef,
    createRenderer,
    disposeRenderer,
    resizeRenderer
  };
}
