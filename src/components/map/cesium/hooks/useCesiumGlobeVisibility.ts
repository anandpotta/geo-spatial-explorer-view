
import { useEffect } from 'react';
import * as Cesium from 'cesium';

/**
 * Hook to ensure the Cesium globe is visible with enhanced error handling
 */
export function useCesiumGlobeVisibility(
  viewerRef: React.MutableRefObject<Cesium.Viewer | null>,
  viewerReady: boolean
): void {
  useEffect(() => {
    if (!viewerReady || !viewerRef.current || viewerRef.current.isDestroyed()) {
      return;
    }

    const viewer = viewerRef.current;
    
    try {
      // Make sure the globe is visible
      if (viewer.scene && viewer.scene.globe) {
        viewer.scene.globe.show = true;
        
        // Set a bright blue color to ensure visibility
        viewer.scene.globe.baseColor = new Cesium.Color(0.0, 0.5, 1.0, 1.0);
      }
      
      // Force immediate multiple renders
      for (let i = 0; i < 30; i++) {
        viewer.scene.requestRender();
      }
      
      // Safe initial default position (if none is set)
      if (!isCameraPositionValid(viewer.camera)) {
        console.log('Setting default camera position to avoid normalization errors');
        const defaultPosition = new Cesium.Cartesian3(0, 0, 25000000); // Far enough to avoid normalization issues
        
        viewer.camera.setView({
          destination: defaultPosition,
          orientation: {
            heading: 0.0,
            pitch: -0.4, // Look down slightly
            roll: 0.0
          }
        });
        
        // Force render after position change
        viewer.scene.requestRender();
      }
    } catch (e) {
      console.error('Error in useCesiumGlobeVisibility hook:', e);
    }
    
    // Schedule additional renders to ensure visibility
    const renderIntervals = [500, 1000, 2000];
    const timeouts: number[] = [];
    
    renderIntervals.forEach(interval => {
      // Fix: Convert setTimeout return value to number using unary plus 
      // or store as NodeJS.Timeout and use correct type for timeouts array
      const timeoutId = setTimeout(() => {
        if (viewer && !viewer.isDestroyed()) {
          // Force multiple renders
          for (let i = 0; i < 5; i++) {
            viewer.scene.requestRender();
          }
        }
      }, interval);
      
      // Fix: Store the timeout ID as a number
      timeouts.push(Number(timeoutId));
    });

    return () => {
      // Clean up timeouts
      timeouts.forEach(clearTimeout);
    };
  }, [viewerRef, viewerReady]);
}

/**
 * Check if the camera position is valid to avoid normalization errors
 */
function isCameraPositionValid(camera: Cesium.Camera): boolean {
  if (!camera) return false;
  
  try {
    const position = camera.position;
    if (!position) return false;
    
    // Check if position has valid coordinates
    if (isNaN(position.x) || isNaN(position.y) || isNaN(position.z)) return false;
    if (!isFinite(position.x) || !isFinite(position.y) || !isFinite(position.z)) return false;
    
    // Check magnitude is not zero or too small (which could cause normalization errors)
    const magnitude = Cesium.Cartesian3.magnitude(position);
    if (isNaN(magnitude) || magnitude < 1) return false;
    
    return true;
  } catch (e) {
    console.warn('Error checking camera position:', e);
    return false;
  }
}
