import { useEffect, useRef } from 'react';
import * as Cesium from 'cesium';
import { forceGlobeVisibility } from '@/utils/cesium-viewer';

/**
 * Hook to force additional rendering cycles for better globe visibility
 */
export const useForceRenderCycles = (
  isInitialized: boolean,
  viewerRef: React.MutableRefObject<Cesium.Viewer | null>
) => {
  const renderIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Additional rendering cycle to ensure visibility
  useEffect(() => {
    const viewer = viewerRef.current;
    
    if (!isInitialized || !viewer || viewer.isDestroyed()) {
      return;
    }
    
    // Make absolutely sure the globe is visible
    
    // Clear any previous render interval
    if (renderIntervalRef.current) {
      clearInterval(renderIntervalRef.current);
    }
    
    // Force globe visibility
    forceGlobeVisibility(viewer);
    
    // Set up a short interval to keep forcing visibility for a few seconds
    let renderCount = 0;
    renderIntervalRef.current = setInterval(() => {
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        forceGlobeVisibility(viewerRef.current);
        renderCount++;
        
        // For the first several renders, also force resize
        if (renderCount < 20) {
          viewerRef.current.resize();
        }
        
        if (renderCount >= 60) { // Keep trying longer
          if (renderIntervalRef.current) {
            clearInterval(renderIntervalRef.current);
            renderIntervalRef.current = null;
          }
        }
      } else {
        // Stop if viewer is destroyed
        if (renderIntervalRef.current) {
          clearInterval(renderIntervalRef.current);
          renderIntervalRef.current = null;
        }
      }
    }, 100); // More frequent checks
    
    return () => {
      if (renderIntervalRef.current) {
        clearInterval(renderIntervalRef.current);
        renderIntervalRef.current = null;
      }
    };
  }, [isInitialized, viewerRef]);

  return renderIntervalRef;
};
