
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
      // Check for WebGL support
      if (!window.WebGLRenderingContext) {
        throw new Error("WebGL is not supported in this browser");
      }
      
      // If we already have a renderer, dispose it first
      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current = null;
      }
      
      // If we already have a canvas in the container, remove it
      const existingCanvases = containerRef.current.querySelectorAll('canvas');
      existingCanvases.forEach(existingCanvas => {
        existingCanvas.parentNode?.removeChild(existingCanvas);
      });
      
      // Create renderer with enhanced settings for better quality
      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true,
        powerPreference: 'high-performance'
      });
      
      // Get the dimensions from the container
      const { clientWidth, clientHeight } = containerRef.current;
      
      // Ensure valid dimensions - use minimum values if we get zeros
      const width = clientWidth || 800; 
      const height = clientHeight || 600;
      
      // Set size with valid dimensions
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance
      
      console.log(`Renderer created with dimensions: ${width}x${height}`);
      
      // Get the canvas element from the renderer
      const canvas = renderer.domElement;
      canvasElementRef.current = canvas;
      
      // Append renderer to container
      try {
        containerRef.current.appendChild(canvas);
        console.log("Canvas element added to container");
      } catch (err) {
        console.error("Error appending canvas to container:", err);
      }
      
      rendererRef.current = renderer;
      return renderer;
    } catch (error) {
      console.error("Failed to initialize WebGL renderer:", error);
      
      // Handle WebGL initialization failure
      const errorDiv = document.createElement('div');
      errorDiv.style.position = 'absolute';
      errorDiv.style.top = '0';
      errorDiv.style.left = '0';
      errorDiv.style.width = '100%';
      errorDiv.style.height = '100%';
      errorDiv.style.display = 'flex';
      errorDiv.style.alignItems = 'center';
      errorDiv.style.justifyContent = 'center';
      errorDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
      errorDiv.style.color = 'white';
      errorDiv.style.textAlign = 'center';
      errorDiv.innerHTML = '<div><h3>3D rendering not available</h3><p>Your browser may not support WebGL or it is disabled.</p></div>';
      
      if (containerRef.current) {
        containerRef.current.appendChild(errorDiv);
      }
      
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
