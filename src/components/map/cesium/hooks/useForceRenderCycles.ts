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
    
    console.log("ForceRenderCycles: Starting render cycles for globe visibility");
    
    // Clear any previous render interval
    if (renderIntervalRef.current) {
      clearInterval(renderIntervalRef.current);
    }
    
    // Force globe visibility immediately
    forceGlobeVisibility(viewer);
    
    // Force resize
    viewer.resize();
    
    // Set up a short interval to keep forcing visibility
    let renderCount = 0;
    renderIntervalRef.current = setInterval(() => {
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        // Force globe visibility
        forceGlobeVisibility(viewerRef.current);
        
        // Also resize viewer
        viewerRef.current.resize();
        
        // Request multiple renders
        for (let i = 0; i < 5; i++) {
          viewerRef.current.scene.requestRender();
        }
        
        renderCount++;
        
        // Log progress
        if (renderCount % 10 === 0) {
          console.log(`ForceRenderCycles: Executed ${renderCount} render cycles`);
        }
        
        // Run for a full minute to ensure visibility
        if (renderCount >= 120) {
          console.log("ForceRenderCycles: Completed all render cycles");
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
    }, 500); // Every half second
    
    return () => {
      console.log("ForceRenderCycles: Cleaning up render interval");
      if (renderIntervalRef.current) {
        clearInterval(renderIntervalRef.current);
        renderIntervalRef.current = null;
      }
    };
  }, [isInitialized, viewerRef]);

  return renderIntervalRef;
};
