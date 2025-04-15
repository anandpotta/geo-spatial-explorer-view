
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
  const renderCountRef = useRef(0);

  // Force renders periodically to ensure globe visibility
  useEffect(() => {
    if (viewerRef.current && !viewerRef.current.isDestroyed()) {
      // Force initial immediate renders
      for (let i = 0; i < 25; i++) { // Reduced render cycles
        viewerRef.current.scene.requestRender();
        
        // Ensure the globe is visible with bright color
        if (viewerRef.current.scene && viewerRef.current.scene.globe) {
          viewerRef.current.scene.globe.show = true;
          viewerRef.current.scene.globe.baseColor = new Cesium.Color(0.0, 0.3, 0.8, 1.0); // Slightly darker blue
        }
      }
      
      // Request strategic renders at key intervals
      const renderTimes = [100, 250, 500, 1000, 2000, 3000];
      renderTimes.forEach(time => {
        setTimeout(() => {
          if (viewerRef.current && !viewerRef.current.isDestroyed()) {
            // Request render
            viewerRef.current.scene.requestRender();
            
            // Ensure the globe is visible with good color
            if (viewerRef.current.scene && viewerRef.current.scene.globe) {
              viewerRef.current.scene.globe.show = true;
              viewerRef.current.scene.globe.baseColor = new Cesium.Color(0.0, 0.3, 0.8, 1.0);
            }
            
            // Ensure canvas is visible
            if (viewerRef.current.canvas) {
              viewerRef.current.canvas.style.visibility = 'visible';
              viewerRef.current.canvas.style.display = 'block';
              viewerRef.current.canvas.style.opacity = '1';
              
              // Force correct dimensions
              viewerRef.current.resize();
            }
          }
        }, time);
      });
    }
    
    // Set a render cycle to ensure globe visibility
    if (forceRenderRef.current) {
      clearInterval(forceRenderRef.current);
    }
    
    forceRenderRef.current = setInterval(() => {
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        renderCountRef.current++;
        
        viewerRef.current.scene.requestRender();
        
        // Ensure globe is visible
        if (viewerRef.current.scene && viewerRef.current.scene.globe) {
          viewerRef.current.scene.globe.show = true;
          viewerRef.current.scene.globe.baseColor = new Cesium.Color(0.0, 0.3, 0.8, 1.0);
        }
        
        // Stop interval after sufficient renders
        if (renderCountRef.current > 60) {
          if (forceRenderRef.current) {
            clearInterval(forceRenderRef.current);
          }
        }
      } else {
        if (forceRenderRef.current) {
          clearInterval(forceRenderRef.current);
        }
      }
    }, 50);
    
    return () => {
      if (forceRenderRef.current) {
        clearInterval(forceRenderRef.current);
      }
    };
  }, [viewerReady, viewerRef]);
};
