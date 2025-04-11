
import * as Cesium from 'cesium';

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
        
        // Force additional renders
        for (let i = 0; i < 10; i++) {
          viewer.scene.requestRender();
        }
        
        // Set initialized state after a delay
        setTimeout(() => {
          setIsInitialized(true);
          setIsLoadingMap(false);
          
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
  
  // Ensure globe is rendered before signaling ready with a fallback timeout
  if (renderTimeoutRef.current) {
    clearTimeout(renderTimeoutRef.current);
  }
  
  renderTimeoutRef.current = setTimeout(() => {
    // Force additional renders after a delay
    if (viewerRef.current && !viewerRef.current.isDestroyed()) {
      for (let i = 0; i < 10; i++) {
        viewerRef.current.scene.requestRender();
      }
      
      // Even if we didn't detect canvas rendering, proceed after timeout
      setIsInitialized(true);
      setIsLoadingMap(false);
      
      if (onMapReady) {
        onMapReady();
      }
    }
  }, 1500); // Longer timeout as fallback
}
