
import { useEffect, useRef } from 'react';
import * as Cesium from 'cesium';

/**
 * Hook to handle periodic rendering and globe visibility checks
 */
export const useCesiumGlobeVisibility = (
  viewerRef: React.MutableRefObject<Cesium.Viewer | null>,
  viewerReady: boolean
) => {
  const forceRenderRef = useRef<NodeJS.Timeout | null>(null);

  // Force renders periodically to ensure globe visibility
  useEffect(() => {
    if (viewerRef.current && !viewerRef.current.isDestroyed()) {
      // Force initial immediate renders
      for (let i = 0; i < 30; i++) {
        viewerRef.current.scene.requestRender();
        
        // Ensure the globe is visible with bright color
        if (viewerRef.current.scene && viewerRef.current.scene.globe) {
          viewerRef.current.scene.globe.show = true;
          viewerRef.current.scene.globe.baseColor = new Cesium.Color(0.3, 0.6, 1.0, 1.0);
        }
      }
      
      // Force strategic renders at various intervals for better loading
      const renderTimes = [10, 20, 50, 100, 200, 300, 500, 750, 1000, 2000, 3000, 5000];
      renderTimes.forEach(time => {
        setTimeout(() => {
          if (viewerRef.current && !viewerRef.current.isDestroyed()) {
            // Request render
            viewerRef.current.scene.requestRender();
            
            // Ensure the globe is visible with bright color
            if (viewerRef.current.scene && viewerRef.current.scene.globe) {
              viewerRef.current.scene.globe.show = true;
              viewerRef.current.scene.globe.baseColor = new Cesium.Color(0.3, 0.6, 1.0, 1.0);
            }
            
            // Ensure canvas is visible
            if (viewerRef.current.canvas) {
              viewerRef.current.canvas.style.visibility = 'visible';
              viewerRef.current.canvas.style.display = 'block';
              viewerRef.current.canvas.style.opacity = '1';
            }
            
            // Add a console log to indicate rendering is happening
            console.log(`Forcing globe visibility at ${time}ms`);
          }
        }, time);
      });
    }
    
    // Set a continuous render cycle to ensure globe visibility
    if (forceRenderRef.current) {
      clearInterval(forceRenderRef.current);
    }
    
    forceRenderRef.current = setInterval(() => {
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        viewerRef.current.scene.requestRender();
        
        // Ensure globe is visible with distinct color
        if (viewerRef.current.scene && viewerRef.current.scene.globe) {
          viewerRef.current.scene.globe.show = true;
          viewerRef.current.scene.globe.baseColor = new Cesium.Color(0.3, 0.6, 1.0, 1.0);
          
          // Add sun lighting effect if available
          if (viewerRef.current.scene.sun) {
            viewerRef.current.scene.sun.show = true;
          }
        }
        
        // Ensure canvas visibility
        if (viewerRef.current.canvas) {
          viewerRef.current.canvas.style.visibility = 'visible';
          viewerRef.current.canvas.style.display = 'block';
          viewerRef.current.canvas.style.opacity = '1';
        }
      } else {
        if (forceRenderRef.current) {
          clearInterval(forceRenderRef.current);
        }
      }
    }, 100); // More frequent checks for better visibility
    
    return () => {
      if (forceRenderRef.current) {
        clearInterval(forceRenderRef.current);
      }
    };
  }, [viewerReady, viewerRef]);
};
