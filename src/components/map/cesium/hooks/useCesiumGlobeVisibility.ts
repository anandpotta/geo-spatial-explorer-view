
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
      const renderTimes = [100, 300, 500, 1000, 2000, 3000, 5000];
      renderTimes.forEach(time => {
        setTimeout(() => {
          if (viewerRef.current && !viewerRef.current.isDestroyed()) {
            viewerRef.current.scene.requestRender();
            
            // Ensure the globe is visible with bright color
            if (viewerRef.current.scene && viewerRef.current.scene.globe) {
              viewerRef.current.scene.globe.show = true;
              viewerRef.current.scene.globe.baseColor = new Cesium.Color(0.0, 0.5, 1.0, 1.0);
            }
            
            // Ensure canvas is visible
            if (viewerRef.current.canvas) {
              viewerRef.current.canvas.style.visibility = 'visible';
              viewerRef.current.canvas.style.display = 'block';
              viewerRef.current.canvas.style.opacity = '1';
            }
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
        
        // Ensure globe is visible
        if (viewerRef.current.scene && viewerRef.current.scene.globe) {
          viewerRef.current.scene.globe.show = true;
          viewerRef.current.scene.globe.baseColor = new Cesium.Color(0.0, 0.5, 1.0, 1.0);
        }
      } else {
        if (forceRenderRef.current) {
          clearInterval(forceRenderRef.current);
        }
      }
    }, 100);
    
    return () => {
      if (forceRenderRef.current) {
        clearInterval(forceRenderRef.current);
      }
    };
  }, [viewerReady, viewerRef]);
};
