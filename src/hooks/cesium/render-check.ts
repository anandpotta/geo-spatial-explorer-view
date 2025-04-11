
import * as Cesium from 'cesium';
import { forceGlobeVisibility } from '@/utils/cesium-viewer';

interface RenderCheckOptions {
  viewer: Cesium.Viewer;
  viewerRef: React.MutableRefObject<Cesium.Viewer | null>;
  checkRenderIntervalRef: React.MutableRefObject<NodeJS.Timeout | null>;
  renderTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>;
  setIsInitialized: (value: boolean) => void;
  setIsLoadingMap: (value: boolean) => void;
  onMapReady?: () => void;
}

/**
 * Sets up render checking to ensure the globe is visible
 */
export function setupRenderChecks({
  viewer,
  viewerRef,
  checkRenderIntervalRef,
  renderTimeoutRef,
  setIsInitialized,
  setIsLoadingMap,
  onMapReady
}: RenderCheckOptions): void {
  // Force multiple renders right away
  if (viewer) {
    // Make sure the canvas is properly set up
    if (viewer.canvas) {
      viewer.canvas.style.visibility = 'visible';
      viewer.canvas.style.display = 'block';
    }
    
    // Force globe visibility
    forceGlobeVisibility(viewer);
    
    // Request multiple renders immediately
    for (let i = 0; i < 20; i++) {
      viewer.scene.requestRender();
    }
    
    // Force resize to ensure proper dimensions
    viewer.resize();
    console.log("Forced multiple renders and resize for globe visibility");
  }

  // Start checking if the canvas is properly rendered
  if (checkRenderIntervalRef.current) {
    clearInterval(checkRenderIntervalRef.current);
  }
  
  checkRenderIntervalRef.current = setInterval(() => {
    if (viewer && !viewer.isDestroyed()) {
      const canvas = viewer.canvas;
      if (canvas && canvas.width > 0 && canvas.height > 0) {
        console.log(`Canvas rendering confirmed: ${canvas.width}x${canvas.height}`);
        
        // Clear the interval once we've confirmed rendering
        if (checkRenderIntervalRef.current) {
          clearInterval(checkRenderIntervalRef.current);
        }
        
        // Force resize to ensure dimensions are correct
        viewer.resize();
        
        // Force globe visibility again
        forceGlobeVisibility(viewer);
        
        // Set initialized state after a delay
        setTimeout(() => {
          setIsInitialized(true);
          setIsLoadingMap(false);
          
          // Force one more visibility check
          forceGlobeVisibility(viewer);
          
          if (onMapReady) {
            onMapReady();
          }
        }, 300);
      }
    } else {
      if (checkRenderIntervalRef.current) {
        clearInterval(checkRenderIntervalRef.current);
      }
    }
  }, 100);
  
  // Schedule additional visibility checks at strategic intervals
  const checkTimes = [500, 1000, 2000, 3000];
  checkTimes.forEach(time => {
    setTimeout(() => {
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        forceGlobeVisibility(viewerRef.current);
      }
    }, time);
  });
  
  // Ensure globe is rendered before signaling ready with a fallback timeout
  if (renderTimeoutRef.current) {
    clearTimeout(renderTimeoutRef.current);
  }
  
  renderTimeoutRef.current = setTimeout(() => {
    // Force additional renders after a delay
    if (viewerRef.current && !viewerRef.current.isDestroyed()) {
      viewer.resize(); // Force resize again
      
      // Force globe visibility one more time
      forceGlobeVisibility(viewerRef.current);
      
      // Even if we didn't detect canvas rendering, proceed after timeout
      setIsInitialized(true);
      setIsLoadingMap(false);
      
      if (onMapReady) {
        onMapReady();
      }
    }
  }, 1500); // Longer timeout as fallback
}
